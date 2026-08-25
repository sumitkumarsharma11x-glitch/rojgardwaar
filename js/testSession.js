/**
 * TestSession
 * -----------------------------------------------------------------------
 * Drives mock-test.html end-to-end: reads the URL, loads the question
 * bank, generates the question set for the requested mode, renders the
 * exam UI (timer / palette / navigation), and hands off to ScoreEngine +
 * ResultRenderer on submit.
 *
 * Session state (answers, markedForReview, currentIndex, endTime) is
 * stored in a plain object that ONLY changes on explicit user actions
 * (select answer, mark, navigate, submit). A language toggle triggers a
 * re-render of visible text only — this object is never touched by it.
 * -----------------------------------------------------------------------
 */
function initTestSession(rootEl) {
  const params = new URLSearchParams(window.location.search);
  const classNum = params.get("class") || "6";
  const subject = params.get("subject") || "science";
  const chapter = params.get("chapter") || "chapter-01";
  const mode = params.get("mode") || "mock"; // mock | wrong | revision | topic
  const testId = params.get("testId") || "mock-1";
  const topicId = params.get("topic") || null;
  const forceNew = params.get("fresh") === "1";

  const sessionKey = `${classNum}:${subject}:${chapter}:${mode}:${testId}:${topicId || ""}`;

  let state = null; // { questions, answers, marked, currentIndex, endTimeMs, timeLimitSeconds, adjusted, label }
  let timer = null;
  let bank = [];
  let submitted = false;

  function optionLetter(i) {
    return String.fromCharCode(65 + i);
  }

  function buildFreshState(generated) {
    return {
      questions: generated.questions,
      answers: {},
      marked: {},
      currentIndex: 0,
      timeLimitSeconds: generated.timeLimitSeconds,
      endTimeMs: Date.now() + generated.timeLimitSeconds * 1000,
      adjusted: generated.adjusted,
      label: generated.label,
      startedAt: Date.now(),
    };
  }

  function persist() {
    StorageManager.saveActiveSession(sessionKey, state);
  }

  function generateQuestionSet() {
    if (mode === "wrong") {
      const ids = WrongQuestionManager.getIds(classNum, subject, chapter);
      return TestGenerator.generateFromIds(bank, ids);
    }
    if (mode === "revision") {
      const attempted = StorageManager.getAttemptedQuestionIds(classNum, subject, chapter);
      return TestGenerator.generateRevision(bank, attempted);
    }
    if (mode === "topic" && topicId) {
      return TestGenerator.generateByTopic(bank, topicId);
    }
    const config = TestGenerator.getConfig(testId) || TestGenerator.getConfigs()[0];
    const seenIds = StorageManager.getSeenQuestionIds(classNum, subject, chapter);
    return TestGenerator.generateFromConfig(bank, config, seenIds);
  }

  async function boot() {
    UIManager.showLoading(rootEl, LanguageManager.get("loading"));
    try {
      const bundle = await DataLoader.loadChapter(classNum, subject, chapter);
      bank = bundle.questions;

      const saved = !forceNew ? StorageManager.getActiveSession(sessionKey) : null;
      if (saved && saved.questions && saved.questions.length > 0 && Date.now() < saved.endTimeMs) {
        state = saved;
      } else {
        const generated = generateQuestionSet();
        if (!generated.questions || generated.questions.length === 0) {
          renderNoQuestions();
          return;
        }
        state = buildFreshState(generated);
        persist();
        if (generated.adjusted) {
          UIManager.toast(LanguageManager.get("insufficientQuestions"), "warn", 4500);
        }
      }

      renderShell();
      startTimer();
      renderQuestion();
      LanguageManager.onChange(() => {
        renderPaletteLabels();
        renderQuestion();
      });
    } catch (err) {
      console.error(err);
      UIManager.showError(rootEl, LanguageManager.get("loadError"), boot);
    }
  }

  function renderNoQuestions() {
    rootEl.innerHTML = `
      <div class="rjd-empty-state">
        <p>${LanguageManager.get("noWrongQuestions")}</p>
        <a class="rjd-btn rjd-btn--primary" href="index.html?class=${classNum}&subject=${subject}&chapter=${chapter}">${LanguageManager.get("backToChapter")}</a>
      </div>
    `;
  }

  function startTimer() {
    const remainingNow = Math.max(0, Math.round((state.endTimeMs - Date.now()) / 1000));
    timer = createTimer({
      totalSeconds: remainingNow,
      onTick: (remaining) => {
        const el = document.getElementById("rjd-timer-value");
        if (el) {
          el.textContent = timer.formatTime(remaining);
          el.classList.toggle("is-low", remaining <= 60);
        }
      },
      onExpire: () => handleSubmit(true),
    });
    timer.start();
  }

  function renderShell() {
    rootEl.innerHTML = `
      <div class="rjd-exam">
        <header class="rjd-exam__header">
          <div class="rjd-exam__title">
            <span class="rjd-eyebrow">${LanguageManager.pick(state.label)}</span>
            <span class="rjd-exam__admit-code">${sessionKey.split(":").join(" · ").toUpperCase()}</span>
          </div>
          <div class="rjd-exam__timer">
            <span class="rjd-exam__timer-label">${LanguageManager.getCurrent() === "hi" ? "समय शेष" : "Time Left"}</span>
            <span id="rjd-timer-value" class="rjd-exam__timer-value">--:--</span>
          </div>
        </header>
        <div class="rjd-exam__body">
          <div class="rjd-exam__question-area" id="rjd-question-area"></div>
          <aside class="rjd-exam__palette-area">
            <p class="rjd-eyebrow" id="rjd-palette-title">${LanguageManager.get("questionPalette")}</p>
            <div class="rjd-palette" id="rjd-palette"></div>
            <div class="rjd-palette-legend">
              <span><i class="rjd-dot rjd-dot--attempted"></i>${LanguageManager.get("attempted")}</span>
              <span><i class="rjd-dot rjd-dot--marked"></i>${LanguageManager.get("marked")}</span>
              <span><i class="rjd-dot rjd-dot--unattempted"></i>${LanguageManager.get("unattempted")}</span>
            </div>
            <button type="button" class="rjd-btn rjd-btn--danger rjd-btn--block" id="rjd-submit">${LanguageManager.get("submitTest")}</button>
          </aside>
        </div>
      </div>
    `;
    document.getElementById("rjd-submit").addEventListener("click", () => confirmSubmit(false));
    renderPalette();
  }

  function renderPaletteLabels() {
    const titleEl = document.getElementById("rjd-palette-title");
    if (titleEl) titleEl.textContent = LanguageManager.get("questionPalette");
    const submitBtn = document.getElementById("rjd-submit");
    if (submitBtn) submitBtn.textContent = LanguageManager.get("submitTest");
  }

  function questionStatus(i) {
    const q = state.questions[i];
    const isAnswered = Object.prototype.hasOwnProperty.call(state.answers, q.id);
    const isMarked = !!state.marked[q.id];
    if (isMarked) return "marked";
    if (isAnswered) return "attempted";
    return "unattempted";
  }

  function renderPalette() {
    const paletteEl = document.getElementById("rjd-palette");
    paletteEl.innerHTML = state.questions
      .map((q, i) => {
        const status = questionStatus(i);
        const isCurrent = i === state.currentIndex ? "is-current" : "";
        return `<button type="button" class="rjd-palette__cell rjd-palette__cell--${status} ${isCurrent}" data-index="${i}">${i + 1}</button>`;
      })
      .join("");
    paletteEl.querySelectorAll(".rjd-palette__cell").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.currentIndex = parseInt(btn.dataset.index, 10);
        persist();
        renderQuestion();
      });
    });
  }

  function renderQuestion() {
    const area = document.getElementById("rjd-question-area");
    if (!area) return;
    const i = state.currentIndex;
    const q = state.questions[i];
    const qText = LanguageManager.pick(q.question);
    const optList = q.options[LanguageManager.getCurrent()] || q.options.hi;
    const selected = state.answers[q.id];
    const isMarked = !!state.marked[q.id];

    area.innerHTML = `
      <div class="rjd-exam-card">
        <div class="rjd-exam-card__meta">
          <span class="rjd-eyebrow">${LanguageManager.getCurrent() === "hi" ? "प्रश्न" : "Question"} ${i + 1} / ${state.questions.length}</span>
          ${UIManager.difficultyBadge(q.difficulty)}
        </div>
        <h3 class="rjd-question-text">${qText}</h3>
        <div class="rjd-options" role="listbox">
          ${optList
            .map(
              (opt, idx) => `
            <button type="button" class="rjd-option ${selected === idx ? "is-selected" : ""}" data-index="${idx}">
              <span class="rjd-option__letter">${optionLetter(idx)}</span>
              <span class="rjd-option__text">${opt}</span>
            </button>
          `
            )
            .join("")}
        </div>
        <div class="rjd-exam-card__actions">
          <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-clear">${LanguageManager.get("clearAnswer")}</button>
          <button type="button" class="rjd-btn rjd-btn--secondary" id="rjd-mark">${isMarked ? LanguageManager.get("unmark") : LanguageManager.get("markForReview")}</button>
        </div>
        <div class="rjd-exam-card__nav">
          <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-prev" ${i === 0 ? "disabled" : ""}>${LanguageManager.get("previous")}</button>
          <button type="button" class="rjd-btn rjd-btn--primary" id="rjd-next" ${i === state.questions.length - 1 ? "disabled" : ""}>${LanguageManager.get("next")}</button>
        </div>
      </div>
    `;

    area.querySelectorAll(".rjd-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.answers[q.id] = parseInt(btn.dataset.index, 10);
        persist();
        renderQuestion();
        renderPalette();
      });
    });

    area.querySelector("#rjd-clear").addEventListener("click", () => {
      delete state.answers[q.id];
      persist();
      renderQuestion();
      renderPalette();
    });

    area.querySelector("#rjd-mark").addEventListener("click", () => {
      state.marked[q.id] = !state.marked[q.id];
      persist();
      renderQuestion();
      renderPalette();
    });

    area.querySelector("#rjd-prev").addEventListener("click", () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        persist();
        renderQuestion();
        renderPalette();
      }
    });
    area.querySelector("#rjd-next").addEventListener("click", () => {
      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
        persist();
        renderQuestion();
        renderPalette();
      }
    });
  }

  function confirmSubmit(isAutoSubmit) {
    if (isAutoSubmit) {
      handleSubmit(true);
      return;
    }
    UIManager.confirmModal({
      title: LanguageManager.getCurrent() === "hi" ? "टेस्ट जमा करें?" : "Submit Test?",
      message: LanguageManager.get("confirmSubmit"),
      confirmLabel: LanguageManager.get("yesSubmit"),
      cancelLabel: LanguageManager.get("cancel"),
      onConfirm: () => handleSubmit(false),
    });
  }

  function handleSubmit(isAutoSubmit) {
    if (submitted) return;
    submitted = true;
    if (timer) timer.stop();

    const timeTaken = Math.round((Date.now() - state.startedAt) / 1000);
    const result = ScoreEngine.calculate(state.questions, state.answers, timeTaken);

    const allIds = state.questions.map((q) => q.id);
    StorageManager.addSeenQuestionIds(classNum, subject, chapter, allIds);
    StorageManager.addAttemptedQuestionIds(classNum, subject, chapter, allIds);
    WrongQuestionManager.record(classNum, subject, chapter, result.wrongQuestionIds);
    StorageManager.saveLastResult(classNum, subject, chapter, testId, result);
    StorageManager.clearActiveSession(sessionKey);

    if (isAutoSubmit) {
      UIManager.toast(LanguageManager.getCurrent() === "hi" ? "समय समाप्त — टेस्ट स्वतः जमा हो गया।" : "Time's up — test auto-submitted.", "warn", 4000);
    }

    renderResult(result);
  }

  function renderResult(result) {
    ResultRenderer.render(rootEl, result, {
      onPracticeWrong: () => {
        window.location.href = WrongQuestionManager.practiceUrl(classNum, subject, chapter);
      },
      onWrongTest: () => {
        window.location.href = WrongQuestionManager.timedTestUrl(classNum, subject, chapter);
      },
      onRetake: () => {
        window.location.href = `mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=${mode}&testId=${testId}${topicId ? `&topic=${topicId}` : ""}&fresh=1`;
      },
      onNewTest: () => {
        const configs = TestGenerator.getConfigs();
        const currentIdx = configs.findIndex((c) => c.id === testId);
        const next = configs[(currentIdx + 1) % configs.length];
        window.location.href = `mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=mock&testId=${next.id}&fresh=1`;
      },
    });
  }

  boot();
}
