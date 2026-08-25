/**
 * App (Chapter Hub Page Controller)
 * -----------------------------------------------------------------------
 * Drives index.html: Notes (short) -> Practice (untimed) -> Mock Test Hub
 * (multiple tests from one bank) -> Topic Tests -> Revision Test.
 * This same controller is reused for every future chapter/class — only
 * the URL query params (class/subject/chapter) change.
 * -----------------------------------------------------------------------
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  const classNum = params.get("class") || "6";
  const subject = params.get("subject") || "science";
  const chapter = params.get("chapter") || "chapter-01";
  const openParam = params.get("open");

  let meta = null;
  let bank = [];
  let activeTab = openParam === "practice-wrong" ? "practice" : "notes";
  let practiceMode = openParam === "practice-wrong" ? "wrong" : "all";

  const root = document.getElementById("rjd-app-root");

  function tabButton(id, labelKey) {
    return `<button type="button" class="rjd-tab ${activeTab === id ? "is-active" : ""}" data-tab="${id}">${LanguageManager.get(labelKey)}</button>`;
  }

  function renderShell() {
    root.innerHTML = `
      <section class="rjd-chapter-hero">
        <span class="rjd-eyebrow">${LanguageManager.getCurrent() === "hi" ? "कक्षा" : "Class"} ${classNum} · ${LanguageManager.pick(meta.subjectName)}</span>
        <h1 class="rjd-chapter-hero__title">${LanguageManager.getCurrent() === "hi" ? "अध्याय" : "Chapter"} ${meta.chapterNumber}: ${LanguageManager.pick(meta.chapterName)}</h1>
        <p class="rjd-chapter-hero__stat">${bank.length}+ ${LanguageManager.get("questions")} · ${TestGenerator.getConfigs().length} ${LanguageManager.get("mockTests")}</p>
      </section>
      <nav class="rjd-tabs" id="rjd-tabs">
        ${tabButton("notes", "notes")}
        ${tabButton("practice", "practice")}
        ${tabButton("mocktests", "mockTests")}
      </nav>
      <div class="rjd-tab-panel" id="rjd-tab-panel"></div>
    `;

    root.querySelectorAll(".rjd-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        renderShell();
      });
    });

    renderActiveTab();
  }

  function renderActiveTab() {
    const panel = document.getElementById("rjd-tab-panel");
    if (activeTab === "notes") renderNotes(panel);
    else if (activeTab === "practice") renderPracticeTab(panel);
    else renderMockTestHub(panel);
  }

  function renderNotes(panel) {
    const notes = meta.notes[LanguageManager.getCurrent()] || meta.notes.hi;
    panel.innerHTML = `
      <div class="rjd-notes-card">
        <h3 class="rjd-section-title">${LanguageManager.getCurrent() === "hi" ? "अवधारणा" : "Concept"}</h3>
        <p>${notes.concept}</p>
        <h3 class="rjd-section-title">${LanguageManager.getCurrent() === "hi" ? "उदाहरण" : "Example"}</h3>
        <p>${notes.example}</p>
        <h3 class="rjd-section-title">${LanguageManager.getCurrent() === "hi" ? "मुख्य बिंदु" : "Key Points"}</h3>
        <ul class="rjd-key-points">
          ${notes.keyPoints.map((p) => `<li>${p}</li>`).join("")}
        </ul>
        <div class="rjd-quick-revision">
          <strong>${LanguageManager.getCurrent() === "hi" ? "त्वरित रिवीज़न" : "Quick Revision"}:</strong> ${notes.quickRevision}
        </div>
        <button type="button" class="rjd-btn rjd-btn--primary" id="rjd-goto-practice">${LanguageManager.get("startPractice")}</button>
      </div>
    `;
    panel.querySelector("#rjd-goto-practice").addEventListener("click", () => {
      activeTab = "practice";
      renderShell();
    });
  }

  function renderPracticeTab(panel) {
    panel.innerHTML = `
      <div class="rjd-practice-toolbar">
        <button type="button" class="rjd-chip ${practiceMode === "all" ? "is-active" : ""}" data-mode="all">${LanguageManager.getCurrent() === "hi" ? "सभी प्रश्न" : "All Questions"}</button>
        <button type="button" class="rjd-chip ${practiceMode === "wrong" ? "is-active" : ""}" data-mode="wrong">${LanguageManager.get("practiceWrong")}</button>
      </div>
      <div id="rjd-practice-container"></div>
    `;
    panel.querySelectorAll(".rjd-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        practiceMode = chip.dataset.mode;
        renderPracticeTab(panel);
      });
    });
    mountPractice(panel.querySelector("#rjd-practice-container"));
  }

  function mountPractice(container) {
    let questions;
    if (practiceMode === "wrong") {
      const wrongIds = new Set(WrongQuestionManager.getIds(classNum, subject, chapter));
      questions = bank.filter((q) => wrongIds.has(q.id));
      if (questions.length === 0) {
        container.innerHTML = `<div class="rjd-empty-state"><p>${LanguageManager.get("noWrongQuestions")}</p></div>`;
        return;
      }
    } else {
      questions = bank;
    }
    createPracticeSession(container, questions, {
      onComplete: (correct, total) => {
        UIManager.toast(
          LanguageManager.getCurrent() === "hi" ? `अभ्यास पूर्ण! ${correct}/${total} सही।` : `Practice complete! ${correct}/${total} correct.`,
          "success",
          4000
        );
        if (practiceMode === "wrong") {
          // Practicing wrong questions doesn't auto-clear them; the
          // student clears their weak list by scoring well in a real
          // mock test retake — practice is for learning, not scoring.
        }
      },
    });
  }

  function renderMockTestHub(panel) {
    const configs = TestGenerator.getConfigs();
    const wrongCount = WrongQuestionManager.getIds(classNum, subject, chapter).length;
    const attemptedCount = StorageManager.getAttemptedQuestionIds(classNum, subject, chapter).length;
    const history = StorageManager.getResultHistory(classNum, subject, chapter);

    panel.innerHTML = `
      <div class="rjd-testcard-grid">
        ${configs
          .map(
            (c, i) => `
          <a class="rjd-testcard" href="mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=mock&testId=${c.id}">
            <span class="rjd-testcard__index">${String(i + 1).padStart(2, "0")}</span>
            <span class="rjd-testcard__label">${LanguageManager.pick(c.label)}</span>
            <span class="rjd-testcard__meta">${c.questionCount} ${LanguageManager.get("questions")} · ${c.timeLimitMin} ${LanguageManager.get("minutes")}</span>
          </a>
        `
          )
          .join("")}

        <a class="rjd-testcard rjd-testcard--accent ${wrongCount === 0 ? "is-disabled" : ""}" href="${wrongCount > 0 ? WrongQuestionManager.timedTestUrl(classNum, subject, chapter) : "#"}">
          <span class="rjd-testcard__index">❌</span>
          <span class="rjd-testcard__label">${LanguageManager.get("wrongQuestionsTest")}</span>
          <span class="rjd-testcard__meta">${wrongCount} ${LanguageManager.get("questions")}</span>
        </a>

        <a class="rjd-testcard rjd-testcard--accent ${attemptedCount === 0 ? "is-disabled" : ""}" href="${attemptedCount > 0 ? `mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=revision` : "#"}">
          <span class="rjd-testcard__index">🔁</span>
          <span class="rjd-testcard__label">${LanguageManager.get("revisionTest")}</span>
          <span class="rjd-testcard__meta">${attemptedCount} ${LanguageManager.getCurrent() === "hi" ? "पूर्व-प्रयासित" : "previously seen"}</span>
        </a>
      </div>

      <h3 class="rjd-section-title">${LanguageManager.get("selectTopic")}</h3>
      <div class="rjd-topic-grid">
        ${meta.topics
          .map(
            (t) => `
          <a class="rjd-topic-chip" href="mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=topic&topic=${t.id}">
            ${LanguageManager.pick(t.name)}
          </a>
        `
          )
          .join("")}
      </div>

      ${
        history.length > 0
          ? `
        <h3 class="rjd-section-title">${LanguageManager.getCurrent() === "hi" ? "हाल के टेस्ट" : "Recent Tests"}</h3>
        <div class="rjd-history-list">
          ${history
            .slice(0, 5)
            .map(
              (h) => `
            <div class="rjd-history-item">
              <span>${h.testId}</span>
              <span>${h.summary.percentage}%</span>
              <span>${new Date(h.ts).toLocaleDateString()}</span>
            </div>
          `
            )
            .join("")}
        </div>`
          : ""
      }
    `;
  }

  function renderLangToggle() {
    const btn = document.getElementById("rjd-lang-toggle");
    if (!btn) return;
    btn.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.lang === LanguageManager.getCurrent());
    });
  }

  async function boot() {
    UIManager.showLoading(root, LanguageManager.get("loading"));
    try {
      const bundle = await DataLoader.loadChapter(classNum, subject, chapter);
      meta = bundle.meta;
      bank = bundle.questions;
      renderShell();
      renderLangToggle();
    } catch (err) {
      console.error(err);
      UIManager.showError(root, LanguageManager.get("loadError"), boot);
    }
  }

  document.getElementById("rjd-lang-toggle")?.addEventListener("click", (e) => {
    const target = e.target.closest("[data-lang]");
    if (!target) return;
    LanguageManager.setLanguage(target.dataset.lang);
  });

  LanguageManager.onChange(() => {
    renderLangToggle();
    if (meta) renderShell();
  });

  boot();
})();
