/**
 * TestSession
 * -----------------------------------------------------------------------
 * Mock-test session controller.
 *
 * Features:
 * - Dynamic number of Mock Tests
 * - Permanent non-overlapping question sets
 * - 30 questions / 18 minutes
 * - 50 questions / 30 minutes
 * - Mock 1, 2, 3 ... N according to available question bank
 * - Abhyas Test
 * - Wrong Questions Test
 * - Revision Test
 * - Topic Test
 * - Active-session persistence
 * -----------------------------------------------------------------------
 */

function initTestSession(rootEl) {
  const params =
    new URLSearchParams(window.location.search);

  const classNum =
    params.get("class") || "6";

  const subject =
    params.get("subject") || "science";

  const chapter =
    params.get("chapter") || "chapter-01";

  // Standardized unique chapter storage key support
  const chapterId = `${classNum}_${subject}_${chapter}`;

  const mode =
    params.get("mode") || "mock";

  const testId =
    params.get("testId") || "mock-1";

  const topicId =
    params.get("topic") || null;

  const forceNew =
    params.get("fresh") === "1";

  const sessionKey =
    `${classNum}:${subject}:${chapter}:${mode}:${testId}:${topicId || ""}`;

  let state = null;
  let timer = null;
  let bank = [];
  let meta = null;
  let submitted = false;

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  function optionLetter(index) {
    return String.fromCharCode(
      65 + index
    );
  }

  function buildFreshState(generated) {
    return {
      questions: generated.questions,

      answers: {},

      marked: {},

      currentIndex: 0,

      timeLimitSeconds:
        generated.timeLimitSeconds,

      endTimeMs:
        Date.now() +
        generated.timeLimitSeconds * 1000,

      adjusted:
        generated.adjusted,

      label:
        generated.label,

      startedAt:
        Date.now(),
    };
  }

  function persist() {
    if (typeof StorageManager.saveActiveSession === 'function') {
      StorageManager.saveActiveSession(
        sessionKey,
        state
      );
    }
  }

  // ---------------------------------------------------------------------
  // Permanent Mock Assignment (Synchronized with TestGenerator)
  // ---------------------------------------------------------------------

  function ensureMockAssignments() {
    const questionCount =
      TestGenerator.getQuestionCount(
        meta,
        bank
      );

    const expectedMockCount =
      TestGenerator.getMockCount(
        bank.length,
        questionCount
      );

    if (
      expectedMockCount <= 0
    ) {
      return {};
    }

    // Safe retrieval supporting both storage patterns
    let existing = null;
    if (typeof StorageManager.getMockSets === 'function') {
      // Try fetching by chapterId or multi-param depending on storage implementation
      existing = StorageManager.getMockSets(chapterId) || 
                 StorageManager.getMockSets(classNum, subject, chapter);
    }

    /*
     * Reuse existing assignments only when
     * they exactly match the current bank size
     * and required question count.
     */
    if (existing) {
      // Handle array format from TestGenerator vs mapped object format
      if (Array.isArray(existing)) {
        const mappedArrayFormat = {};
        existing.forEach((set, idx) => {
          mappedArrayFormat[`mock-${set.mockId || idx + 1}`] = set.questionIds || set.questions.map(q => q.id);
        });
        existing = mappedArrayFormat;
      }

      const keys =
        Object.keys(existing);

      const valid =
        keys.length ===
          expectedMockCount &&
        keys.every((id) => {
          return (
            Array.isArray(existing[id]) &&
            existing[id].length ===
              questionCount
          );
        });

      if (valid) {
        return existing;
      }
    }

    /*
     * Build fresh non-overlapping sets.
     */
    const sets =
      TestGenerator.buildMockSets(
        bank,
        questionCount
      );

    const mapped = {};

    sets.forEach(
      (questions, index) => {
        mapped[
          `mock-${index + 1}`
        ] =
          questions.map(
            (q) => q.id
          );
      }
    );

    // Save using standard storage methods safely
    if (typeof StorageManager.saveMockSets === 'function') {
      try {
        StorageManager.saveMockSets(chapterId, sets);
      } catch (e) {
        StorageManager.saveMockSets(classNum, subject, chapter, mapped);
      }
    }

    return mapped;
  }

  // ---------------------------------------------------------------------
  // Dynamic Mock Configs
  // ---------------------------------------------------------------------

  function getMockConfigs() {
    const sets =
      ensureMockAssignments();

    const questionCount =
      TestGenerator.getQuestionCount(
        meta,
        bank
      );

    const timeLimitMin =
      TestGenerator.getTimeLimitMin(
        questionCount
      );

    return Object.keys(sets)
      .sort((a, b) => {
        const na =
          Number(
            a.replace(
              "mock-",
              ""
            )
          );

        const nb =
          Number(
            b.replace(
              "mock-",
              ""
            )
          );

        return na - nb;
      })
      .map((id) => {
        const number =
          Number(
            id.replace(
              "mock-",
              ""
            )
          );

        return {
          id,

          label: {
            hi:
              `मॉक टेस्ट ${number}`,

            en:
              `Mock Test ${number}`,
          },

          questionCount,

          timeLimitMin,
        };
      });
  }

  // ---------------------------------------------------------------------
  // Generate Current Test
  // ---------------------------------------------------------------------

  function generateQuestionSet() {

    // ---------------------------------------------------------------
    // Wrong Questions
    // ---------------------------------------------------------------

    if (mode === "wrong") {
      const ids =
        WrongQuestionManager.getIds(
          classNum,
          subject,
          chapter
        );

      return TestGenerator.generateFromIds(
        bank,
        ids
      );
    }

    // ---------------------------------------------------------------
    // Revision
    // ---------------------------------------------------------------

    if (mode === "revision") {
      const attempted =
        StorageManager.getAttemptedQuestionIds(
          classNum,
          subject,
          chapter
        );

      return TestGenerator.generateRevision(
        bank,
        attempted
      );
    }

    // ---------------------------------------------------------------
    // Topic
    // ---------------------------------------------------------------

    if (
      mode === "topic" &&
      topicId
    ) {
      return TestGenerator.generateByTopic(
        bank,
        topicId
      );
    }

    // ---------------------------------------------------------------
    // Abhyas Test
    // ---------------------------------------------------------------

    if (mode === "abhyas") {
      return generateAbhyasTest();
    }

    // ---------------------------------------------------------------
    // Normal Mock Test
    // ---------------------------------------------------------------

    const sets =
      ensureMockAssignments();

    const ids =
      sets[testId] || [];

    const configs =
      getMockConfigs();

    const config =
      configs.find(
        (c) =>
          c.id === testId
      );

    if (
      !config ||
      !ids.length
    ) {
      return {
        questions: [],

        adjusted: true,

        timeLimitSeconds: 0,

        configId: testId,

        label: {
          hi: "मॉक टेस्ट",
          en: "Mock Test",
        },
      };
    }

    return TestGenerator.generateMockFromIds(
      bank,
      ids,
      config
    );
  }

  // ---------------------------------------------------------------------
  // Abhyas Test
  // ---------------------------------------------------------------------

  function generateAbhyasTest() {
    const sets =
      ensureMockAssignments();

    const usedIds =
      new Set(
        Object.values(sets)
          .flat()
      );

    let pool =
      bank.filter(
        (q) =>
          !usedIds.has(q.id)
      );

    const questionCount =
      TestGenerator.getQuestionCount(
        meta,
        bank
      );

    if (
      pool.length <
      questionCount
    ) {
      pool = bank;
    }

    const count =
      Math.min(
        questionCount,
        pool.length
      );

    const chosen =
      Randomizer
        .sample(
          pool,
          count
        )
        .map(
          Randomizer.shuffleQuestionOptions
        );

    const timeLimitSeconds =
      questionCount === 50
        ? 30 * 60
        : 18 * 60;

    return {
      questions: chosen,

      adjusted:
        chosen.length <
        questionCount,

      timeLimitSeconds,

      configId:
        "abhyas",

      label: {
        hi: "अभ्यास टेस्ट",
        en: "Practice Test",
      },
    };
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------

  async function boot() {
    UIManager.showLoading(
      rootEl,
      LanguageManager.get(
        "loading"
      )
    );

    try {
      const bundle =
        await DataLoader.loadChapter(
          classNum,
          subject,
          chapter
        );

      meta =
        bundle.meta;

      bank =
        Array.isArray(
          bundle.questions
        )
          ? bundle.questions
          : [];

      if (
        mode === "mock" ||
        mode === "abhyas"
      ) {
        ensureMockAssignments();
      }

      const saved =
        !forceNew
          ? StorageManager.getActiveSession(
              sessionKey
            )
          : null;

      if (
        saved &&
        Array.isArray(
          saved.questions
        ) &&
        saved.questions.length > 0 &&
        Date.now() <
          saved.endTimeMs
      ) {
        state =
          saved;
      } else {
        const generated =
          generateQuestionSet();

        if (
          !generated.questions ||
          generated.questions.length === 0
        ) {
          renderNoQuestions();
          return;
        }

        state =
          buildFreshState(
            generated
          );

        persist();

        if (
          generated.adjusted
        ) {
          UIManager.toast(
            LanguageManager.get(
              "insufficientQuestions"
            ),
            "warn",
            4500
          );
        }
      }

      renderShell();

      startTimer();

      renderQuestion();

      LanguageManager.onChange(
        () => {
          renderPaletteLabels();
          renderQuestion();
        }
      );

    } catch (err) {
      console.error(err);

      UIManager.showError(
        rootEl,
        LanguageManager.get(
          "loadError"
        ),
        boot
      );
    }
  }

  // ---------------------------------------------------------------------
  // Empty
  // ---------------------------------------------------------------------

  function renderNoQuestions() {
    rootEl.innerHTML = `
      <div class="rjd-empty-state">

        <p>
          ${LanguageManager.get(
            "noWrongQuestions"
          )}
        </p>

        <a
          class="rjd-btn rjd-btn--primary"
          href="index.html?class=${classNum}&subject=${subject}&chapter=${chapter}"
        >
          ${LanguageManager.get(
            "backToChapter"
          )}
        </a>

      </div>
    `;
  }

  // ---------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------

  function startTimer() {
    const remainingNow =
      Math.max(
        0,
        Math.round(
          (
            state.endTimeMs -
            Date.now()
          ) / 1000
        )
      );

    timer =
      createTimer({
        totalSeconds:
          remainingNow,

        onTick:
          (remaining) => {
            const el =
              document.getElementById(
                "rjd-timer-value"
              );

            if (el) {
              el.textContent =
                timer.formatTime(
                  remaining
                );

              el.classList.toggle(
                "is-low",
                remaining <= 60
              );
            }
          },

        onExpire:
          () =>
            handleSubmit(
              true
            ),
      });

    timer.start();
  }

  // ---------------------------------------------------------------------
  // Main Shell
  // ---------------------------------------------------------------------

  function renderShell() {
    rootEl.innerHTML = `
      <div class="rjd-exam">

        <header
          class="rjd-exam__header"
        >

          <div
            class="rjd-exam__title"
          >

            <span
              class="rjd-eyebrow"
            >
              ${LanguageManager.pick(
                state.label
              )}
            </span>

            <span
              class="rjd-exam__admit-code"
            >
              ${sessionKey
                .split(":")
                .join(" · ")
                .toUpperCase()}
            </span>

          </div>

          <div
            class="rjd-exam__timer"
          >

            <span
              class="rjd-exam__timer-label"
            >
              ${
                LanguageManager.getCurrent() ===
                "hi"
                  ? "समय शेष"
                  : "Time Left"
              }
            </span>

            <span
              id="rjd-timer-value"
              class="rjd-exam__timer-value"
            >
              --:--
            </span>

          </div>

        </header>


        <div
          class="rjd-exam__body"
        >

          <div
            class="rjd-exam__question-area"
            id="rjd-question-area"
          ></div>


          <aside
            class="rjd-exam__palette-area"
          >

            <p
              class="rjd-eyebrow"
              id="rjd-palette-title"
            >
              ${LanguageManager.get(
                "questionPalette"
              )}
            </p>


            <div
              class="rjd-palette"
              id="rjd-palette"
            ></div>


            <div
              class="rjd-palette-legend"
            >

              <span>
                <i
                  class="rjd-dot rjd-dot--attempted"
                ></i>

                ${LanguageManager.get(
                  "attempted"
                )}
              </span>


              <span>
                <i
                  class="rjd-dot rjd-dot--marked"
                ></i>

                ${LanguageManager.get(
                  "marked"
                )}
              </span>


              <span>
                <i
                  class="rjd-dot rjd-dot--unattempted"
                ></i>

                ${LanguageManager.get(
                  "unattempted"
                )}
              </span>

            </div>


            <button
              type="button"
              class="rjd-btn rjd-btn--danger rjd-btn--block"
              id="rjd-submit"
            >
              ${LanguageManager.get(
                "submitTest"
              )}
            </button>

          </aside>

        </div>

      </div>
    `;

    document
      .getElementById(
        "rjd-submit"
      )
      .addEventListener(
        "click",
        () =>
          confirmSubmit(false)
      );

    renderPalette();
  }

  // ---------------------------------------------------------------------
  // Language
  // ---------------------------------------------------------------------

  function renderPaletteLabels() {
    const titleEl =
      document.getElementById(
        "rjd-palette-title"
      );

    if (titleEl) {
      titleEl.textContent =
        LanguageManager.get(
          "questionPalette"
        );
    }

    const submitBtn =
      document.getElementById(
        "rjd-submit"
      );

    if (submitBtn) {
      submitBtn.textContent =
        LanguageManager.get(
          "submitTest"
        );
    }
  }

  // ---------------------------------------------------------------------
  // Question Status
  // ---------------------------------------------------------------------

  function questionStatus(index) {
    const q =
      state.questions[index];

    const isAnswered =
      Object.prototype.hasOwnProperty.call(
        state.answers,
        q.id
      );

    const isMarked =
      !!state.marked[q.id];

    if (isMarked) {
      return "marked";
    }

    if (isAnswered) {
      return "attempted";
    }

    return "unattempted";
  }

  // ---------------------------------------------------------------------
  // Palette
  // ---------------------------------------------------------------------

  function renderPalette() {
    const paletteEl =
      document.getElementById(
        "rjd-palette"
      );

    if (!paletteEl) {
      return;
    }

    paletteEl.innerHTML =
      state.questions
        .map(
          (q, index) => {
            const status =
              questionStatus(
                index
              );

            const isCurrent =
              index ===
              state.currentIndex
                ? "is-current"
                : "";

            return `
              <button
                type="button"
                class="rjd-palette__cell rjd-palette__cell--${status} ${isCurrent}"
                data-index="${index}"
              >
                ${index + 1}
              </button>
            `;
          }
        )
        .join("");

    paletteEl
      .querySelectorAll(
        ".rjd-palette__cell"
      )
      .forEach(
        (btn) => {
          btn.addEventListener(
            "click",
            () => {
              state.currentIndex =
                parseInt(
                  btn.dataset.index,
                  10
                );

              persist();

              renderQuestion();

              renderPalette();
            }
          );
        }
      );
  }

  // ---------------------------------------------------------------------
  // Question
  // ---------------------------------------------------------------------

  function renderQuestion() {
    const area =
      document.getElementById(
        "rjd-question-area"
      );

    if (!area) {
      return;
    }

    const index =
      state.currentIndex;

    const q =
      state.questions[index];

    if (!q) {
      return;
    }

    const qText =
      LanguageManager.pick(
        q.question
      );

    const language =
      LanguageManager.getCurrent();

    const optList =
      q.options[language] ||
      q.options.hi;

    const selected =
      state.answers[q.id];

    const isMarked =
      !!state.marked[q.id];

    area.innerHTML = `
      <div
        class="rjd-exam-card"
      >

        <div
          class="rjd-exam-card__meta"
        >

          <span
            class="rjd-eyebrow"
          >
            ${
              language === "hi"
                ? "प्रश्न"
                : "Question"
            }

            ${index + 1}

            /

            ${state.questions.length}

          </span>

          ${UIManager.difficultyBadge(
            q.difficulty
          )}

        </div>


        <h3
          class="rjd-question-text"
        >
          ${qText}
        </h3>


        <div
          class="rjd-options"
          role="listbox"
        >

          ${optList
            .map(
              (opt, idx) => `
                <button
                  type="button"
                  class="rjd-option ${
                    selected === idx
                      ? "is-selected"
                      : ""
                  }"
                  data-index="${idx}"
                >

                  <span
                    class="rjd-option__letter"
                  >
                    ${optionLetter(
                      idx
                    )}
                  </span>

                  <span
                    class="rjd-option__text"
                  >
                    ${opt}
                  </span>

                </button>
              `
            )
            .join("")}

        </div>


        <div
          class="rjd-exam-card__actions"
        >

          <button
            type="button"
            class="rjd-btn rjd-btn--ghost"
            id="rjd-clear"
          >
            ${LanguageManager.get(
              "clearAnswer"
            )}
          </button>


          <button
            type="button"
            class="rjd-btn rjd-btn--secondary"
            id="rjd-mark"
          >
            ${
              isMarked
                ? LanguageManager.get(
                    "unmark"
                  )
                : LanguageManager.get(
                    "markForReview"
                  )
            }
          </button>

        </div>


        <div
          class="rjd-exam-card__nav"
        >

          <button
            type="button"
            class="rjd-btn rjd-btn--ghost"
            id="rjd-prev"
            ${
              index === 0
                ? "disabled"
                : ""
            }
          >
            ${LanguageManager.get(
              "previous"
            )}
          </button>


          <button
            type="button"
            class="rjd-btn rjd-btn--primary"
            id="rjd-next"
            ${
              index ===
              state.questions.length - 1
                ? "disabled"
                : ""
            }
          >
            ${LanguageManager.get(
              "next"
            )}
          </button>

        </div>

      </div>
    `;

    area
      .querySelectorAll(
        ".rjd-option"
      )
      .forEach(
        (btn) => {
          btn.addEventListener(
            "click",
            () => {
              state.answers[q.id] =
                parseInt(
                  btn.dataset.index,
                  10
                );

              persist();

              renderQuestion();

              renderPalette();
            }
          );
        }
      );

    area
      .querySelector(
        "#rjd-clear"
      )
      .addEventListener(
        "click",
        () => {
          delete state.answers[
            q.id
          ];

          persist();

          renderQuestion();

          renderPalette();
        }
      );

    area
      .querySelector(
        "#rjd-mark"
      )
      .addEventListener(
        "click",
        () => {
          state.marked[q.id] =
            !state.marked[q.id];

          persist();

          renderQuestion();

          renderPalette();
        }
      );

    area
      .querySelector(
        "#rjd-prev"
      )
      .addEventListener(
        "click",
        () => {
          if (
            state.currentIndex >
            0
          ) {
            state.currentIndex--;

            persist();

            renderQuestion();

            renderPalette();
          }
        }
      );

    area
      .querySelector(
        "#rjd-next"
      )
      .addEventListener(
        "click",
        () => {
          if (
            state.currentIndex <
            state.questions.length - 1
          ) {
            state.currentIndex++;

            persist();

            renderQuestion();

            renderPalette();
          }
        }
      );
  }

  // ---------------------------------------------------------------------
  // Submit Confirmation
  // ---------------------------------------------------------------------

  function confirmSubmit(
    isAutoSubmit
  ) {
    if (isAutoSubmit) {
      handleSubmit(true);
      return;
    }

    UIManager.confirmModal({
      title:
        LanguageManager.getCurrent() ===
        "hi"
          ? "टेस्ट जमा करें?"
          : "Submit Test?",

      message:
        LanguageManager.get(
          "confirmSubmit"
        ),

      confirmLabel:
        LanguageManager.get(
          "yesSubmit"
        ),

      cancelLabel:
        LanguageManager.get(
          "cancel"
        ),

      onConfirm:
        () =>
          handleSubmit(false),
    });
  }

  // ---------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------

  function handleSubmit(
    isAutoSubmit
  ) {
    if (submitted) {
      return;
    }

    submitted = true;

    if (timer) {
      timer.stop();
    }

    const timeTaken =
      Math.round(
        (
          Date.now() -
          state.startedAt
        ) / 1000
      );

    const result =
      ScoreEngine.calculate(
        state.questions,
        state.answers,
        timeTaken
      );

    const allIds =
      state.questions.map(
        (q) => q.id
      );

    StorageManager.addSeenQuestionIds(
      classNum,
      subject,
      chapter,
      allIds
    );

    StorageManager.addAttemptedQuestionIds(
      classNum,
      subject,
      chapter,
      allIds
    );

    WrongQuestionManager.record(
      classNum,
      subject,
      chapter,
      result.wrongQuestionIds
    );

    StorageManager.saveLastResult(
      classNum,
      subject,
      chapter,
      testId,
      result
    );

    StorageManager.clearActiveSession(
      sessionKey
    );

    if (isAutoSubmit) {
      UIManager.toast(
        LanguageManager.getCurrent() ===
          "hi"
          ? "समय समाप्त — टेस्ट स्वतः जमा हो गया।"
          : "Time's up — test auto-submitted.",
        "warn",
        4000
      );
    }

    renderResult(result);
  }

  // ---------------------------------------------------------------------
  // Result
  // ---------------------------------------------------------------------

  function renderResult(
    result
  ) {
    ResultRenderer.render(
      rootEl,
      result,
      {
        onPracticeWrong:
          () => {
            window.location.href =
              WrongQuestionManager.practiceUrl(
                classNum,
                subject,
                chapter
              );
          },

        onWrongTest:
          () => {
            window.location.href =
              WrongQuestionManager.timedTestUrl(
                classNum,
                subject,
                chapter
              );
          },

        onRetake:
          () => {
            window.location.href =
              `mock-test.html?class=${classNum}` +
              `&subject=${subject}` +
              `&chapter=${chapter}` +
              `&mode=${mode}` +
              `&testId=${testId}` +
              `${
                topicId
                  ? `&topic=${topicId}`
                  : ""
              }` +
              `&fresh=1`;
          },

        onNewTest:
          () => {
            const configs =
              mode === "mock"
                ? getMockConfigs()
                : TestGenerator.getConfigs(
                    meta,
                    bank
                  );

            if (
              !configs.length
            ) {
              return;
            }

            const currentIndex =
              configs.findIndex(
                (c) =>
                  c.id === testId
              );

            const next =
              configs[
                (
                  currentIndex + 1
                ) %
                configs.length
              ];

            window.location.href =
              `mock-test.html?class=${classNum}` +
              `&subject=${subject}` +
              `&chapter=${chapter}` +
              `&mode=mock` +
              `&testId=${next.id}` +
              `&fresh=1`;
          },
      }
    );
  }

  // ---------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------

  boot();
}
