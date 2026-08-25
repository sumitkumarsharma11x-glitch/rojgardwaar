/**
 * App (Chapter Hub Page Controller)
 * -----------------------------------------------------------------------
 * Drives index.html:
 * Notes -> Practice -> Mock Test Hub
 * -> Topic Tests -> Revision Test.
 *
 * This controller is reused for every future chapter/class.
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

  let activeTab =
    openParam === "practice-wrong"
      ? "practice"
      : "notes";

  let practiceMode =
    openParam === "practice-wrong"
      ? "wrong"
      : "all";

  const root = document.getElementById("rjd-app-root");

  /* =========================================================
     LANGUAGE HELPER
  ========================================================= */

  function isHindi() {
    return LanguageManager.getCurrent() === "hi";
  }

  function text(hi, en) {
    return isHindi() ? hi : en;
  }

  /* =========================================================
     TAB BUTTON
  ========================================================= */

  function tabButton(id, labelKey) {
    return `
      <button
        type="button"
        class="rjd-tab ${activeTab === id ? "is-active" : ""}"
        data-tab="${id}"
      >
        ${LanguageManager.get(labelKey)}
      </button>
    `;
  }

  /* =========================================================
     MAIN SHELL
  ========================================================= */

  function renderShell() {
    root.innerHTML = `
      <section class="rjd-chapter-hero">

        <span class="rjd-eyebrow">
          ${
            isHindi()
              ? "कक्षा"
              : "Class"
          }
          ${classNum}
          ·
          ${LanguageManager.pick(meta.subjectName)}
        </span>

        <h1 class="rjd-chapter-hero__title">
          ${
            isHindi()
              ? "अध्याय"
              : "Chapter"
          }
          ${meta.chapterNumber}:
          ${LanguageManager.pick(meta.chapterName)}
        </h1>

        <p class="rjd-chapter-hero__stat">
          ${bank.length}+
          ${LanguageManager.get("questions")}
          ·
          ${TestGenerator.getConfigs().length}
          ${LanguageManager.get("mockTests")}
        </p>

      </section>

      <nav class="rjd-tabs" id="rjd-tabs">
        ${tabButton("notes", "notes")}
        ${tabButton("practice", "practice")}
        ${tabButton("mocktests", "mockTests")}
      </nav>

      <div
        class="rjd-tab-panel"
        id="rjd-tab-panel"
      ></div>
    `;

    root.querySelectorAll(".rjd-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        renderShell();
      });
    });

    renderActiveTab();
  }

  /* =========================================================
     ACTIVE TAB
  ========================================================= */

  function renderActiveTab() {
    const panel =
      document.getElementById("rjd-tab-panel");

    if (activeTab === "notes") {
      renderNotes(panel);
    } else if (activeTab === "practice") {
      renderPracticeTab(panel);
    } else {
      renderMockTestHub(panel);
    }
  }

  /* =========================================================
     NOTES
     ---------------------------------------------------------
     IMPORTANT:
     Reel Questions are intentionally NOT rendered here.
     They can remain in data for internal content use,
     but students will never see them.
  ========================================================= */

  function renderNotes(panel) {
    const notes =
      meta.notes[LanguageManager.getCurrent()] ||
      meta.notes.hi;

    const examFocus =
      Array.isArray(notes.examFocus)
        ? notes.examFocus
        : [];

    const examTraps =
      Array.isArray(notes.examTraps)
        ? notes.examTraps
        : [];

    const thinkBeforeAnswer =
      Array.isArray(notes.thinkBeforeAnswer)
        ? notes.thinkBeforeAnswer
        : [];

    const memoryTricks =
      Array.isArray(notes.memoryTricks)
        ? notes.memoryTricks
        : [];

    const pyqSignals =
      Array.isArray(notes.pyqSignals)
        ? notes.pyqSignals
        : [];

    const mustRemember =
      Array.isArray(notes.mustRemember)
        ? notes.mustRemember
        : [];

    const sections =
      Array.isArray(notes.sections)
        ? notes.sections
        : [];

    /* ---------------------------------------------------------
       Topic sections
    --------------------------------------------------------- */

    const topicSectionsHTML =
      sections.length
        ? `
          <section class="rjd-note-block rjd-topic-breakdown">

            <div class="rjd-note-heading">
              <span class="rjd-note-icon">📚</span>

              <div>
                <h3>
                  ${text(
                    "🧠 Topic को समझें",
                    "🧠 Understand the Topics"
                  )}
                </h3>

                <p>
                  ${text(
                    "Chapter को छोटे और आसान हिस्सों में समझें।",
                    "Understand the chapter through simple concepts."
                  )}
                </p>
              </div>
            </div>

            <div class="rjd-topic-notes-grid">

              ${sections
                .map(
                  (section, index) => `
                    <article class="rjd-topic-note-card">

                      <span class="rjd-topic-note-number">
                        ${String(index + 1).padStart(2, "0")}
                      </span>

                      <h4>
                        ${section.title || ""}
                      </h4>

                      ${
                        section.concept
                          ? `
                            <p>
                              ${section.concept}
                            </p>
                          `
                          : ""
                      }

                      ${
                        section.explanation
                          ? `
                            <p>
                              ${section.explanation}
                            </p>
                          `
                          : ""
                      }

                      ${
                        section.example
                          ? `
                            <div class="rjd-mini-example">
                              <strong>
                                💡 ${text(
                                  "उदाहरण",
                                  "Example"
                                )}
                              </strong>

                              <p>
                                ${section.example}
                              </p>
                            </div>
                          `
                          : ""
                      }

                      ${
                        Array.isArray(section.keyPoints) &&
                        section.keyPoints.length
                          ? `
                            <ul class="rjd-key-points">
                              ${section.keyPoints
                                .map(
                                  (point) => `
                                    <li>
                                      <span>✓</span>
                                      <span>${point}</span>
                                    </li>
                                  `
                                )
                                .join("")}
                            </ul>
                          `
                          : ""
                      }

                    </article>
                  `
                )
                .join("")}

            </div>
          </section>
        `
        : "";

    /* ---------------------------------------------------------
       Exam Focus
    --------------------------------------------------------- */

    const examFocusHTML =
      examFocus.length
        ? `
          <section class="rjd-note-block rjd-exam-focus">

            <div class="rjd-special-heading">
              🎯 EXAM FOCUS
            </div>

            <p class="rjd-special-description">
              ${text(
                "इस concept को exam में किस angle से पूछा जा सकता है?",
                "How can this concept be tested in an exam?"
              )}
            </p>

            <div class="rjd-exam-focus-list">

              ${examFocus
                .map(
                  (item, index) => `
                    <div class="rjd-exam-focus-item">

                      <span>
                        ${index + 1}
                      </span>

                      <p>
                        ${item}
                      </p>

                    </div>
                  `
                )
                .join("")}

            </div>

          </section>
        `
        : "";

    /* ---------------------------------------------------------
       Exam Trap
    --------------------------------------------------------- */

    const examTrapHTML =
      examTraps.length
        ? `
          <section class="rjd-note-block rjd-exam-trap">

            <div class="rjd-special-heading">
              ⚠️ EXAM TRAP
            </div>

            <p class="rjd-special-description">
              ${text(
                "इन points में options देखकर confusion हो सकता है।",
                "These are the points where exam options can create confusion."
              )}
            </p>

            <div class="rjd-exam-trap-list">

              ${examTraps
                .map(
                  (trap) => {

                    if (
                      typeof trap === "string"
                    ) {
                      return `
                        <div class="rjd-trap-item">
                          ${trap}
                        </div>
                      `;
                    }

                    return `
                      <div class="rjd-trap-item">

                        ${
                          trap.title
                            ? `
                              <h4>
                                ${trap.title}
                              </h4>
                            `
                            : ""
                        }

                        ${
                          trap.fact
                            ? `
                              <p>
                                ${trap.fact}
                              </p>
                            `
                            : ""
                        }

                        ${
                          trap.confusion
                            ? `
                              <div class="rjd-trap-confusion">

                                <strong>
                                  🧠 ${text(
                                    "ध्यान रखें",
                                    "Remember"
                                  )}
                                </strong>

                                <p>
                                  ${trap.confusion}
                                </p>

                              </div>
                            `
                            : ""
                        }

                      </div>
                    `;
                  }
                )
                .join("")}

            </div>

          </section>
        `
        : "";

    /* ---------------------------------------------------------
       Think Before Answer
    --------------------------------------------------------- */

    const thinkHTML =
      thinkBeforeAnswer.length
        ? `
          <section class="rjd-note-block rjd-think-box">

            <div class="rjd-special-heading">
              🧠 Think Before Answer
            </div>

            <p class="rjd-special-description">
              ${text(
                "Answer देखने से पहले खुद सोचें।",
                "Think before looking for the answer."
              )}
            </p>

            <div class="rjd-think-list">

              ${thinkBeforeAnswer
                .map(
                  (item, index) => {

                    if (
                      typeof item === "string"
                    ) {
                      return `
                        <div class="rjd-think-item">

                          <span>?</span>

                          <p>
                            ${item}
                          </p>

                        </div>
                      `;
                    }

                    return `
                      <div class="rjd-think-item">

                        <span>?</span>

                        <div>

                          ${
                            item.question
                              ? `
                                <strong>
                                  ${item.question}
                                </strong>
                              `
                              : ""
                          }

                          ${
                            item.hint
                              ? `
                                <p>
                                  💡 ${item.hint}
                                </p>
                              `
                              : ""
                          }

                          ${
                            item.answer
                              ? `
                                <details>
                                  <summary>
                                    ${text(
                                      "उत्तर देखें",
                                      "Reveal Answer"
                                    )}
                                  </summary>

                                  <p>
                                    ${item.answer}
                                  </p>
                                </details>
                              `
                              : ""
                          }

                        </div>

                      </div>
                    `;
                  }
                )
                .join("")}

            </div>

          </section>
        `
        : "";

    /* ---------------------------------------------------------
       Memory Tricks
    --------------------------------------------------------- */

    const memoryHTML =
      memoryTricks.length
        ? `
          <section class="rjd-note-block rjd-memory-box">

            <div class="rjd-special-heading">
              🧠 ${text(
                "Smart Memory",
                "Smart Memory"
              )}
            </div>

            <p class="rjd-special-description">
              ${text(
                "जरूरी facts को जल्दी याद रखने का तरीका।",
                "Simple ways to remember important facts."
              )}
            </p>

            <div class="rjd-memory-list">

              ${memoryTricks
                .map(
                  (item) => `
                    <div class="rjd-memory-item">
                      💡 ${item}
                    </div>
                  `
                )
                .join("")}

            </div>

          </section>
        `
        : "";

    /* ---------------------------------------------------------
       PYQ Signal
    --------------------------------------------------------- */

    const pyqHTML =
      pyqSignals.length
        ? `
          <section class="rjd-note-block rjd-pyq-box">

            <div class="rjd-special-heading">
              🏆 PYQ SIGNAL
            </div>

            <p class="rjd-special-description">
              ${text(
                "इन concepts से objective questions बनाए जा सकते हैं।",
                "These concepts are suitable for objective exam questions."
              )}
            </p>

            <ul class="rjd-key-points">

              ${pyqSignals
                .map(
                  (item) => `
                    <li>
                      <span>✓</span>
                      <span>${item}</span>
                    </li>
                  `
                )
                .join("")}

            </ul>

          </section>
        `
        : "";

    /* ---------------------------------------------------------
       Must Remember
    --------------------------------------------------------- */

    const mustRememberHTML =
      mustRemember.length
        ? `
          <section class="rjd-note-block rjd-must-remember">

            <div class="rjd-special-heading">
              🔥 MUST REMEMBER
            </div>

            <ul class="rjd-key-points">

              ${mustRemember
                .map(
                  (item) => `
                    <li>
                      <span>✓</span>
                      <span>${item}</span>
                    </li>
                  `
                )
                .join("")}

            </ul>

          </section>
        `
        : "";

    /* ---------------------------------------------------------
       Main Notes HTML
    --------------------------------------------------------- */

    panel.innerHTML = `

      <div class="rjd-notes-card rjd-notes-premium">

        <!-- Notes Introduction -->

        <div class="rjd-notes-intro">

          <span class="rjd-notes-badge">
            📖 ${text(
              "EXAM READY NOTES",
              "EXAM READY NOTES"
            )}
          </span>

          <h2>
            ${text(
              "पहले समझें, फिर याद करें",
              "Understand First. Remember Better."
            )}
          </h2>

          <p>
            ${text(
              "इन Notes का उद्देश्य सिर्फ जानकारी देना नहीं, बल्कि concept को exam में apply करना सिखाना है।",
              "These notes are designed to help you understand concepts and apply them in exams."
            )}
          </p>

        </div>


        <!-- Concept -->

        <section class="rjd-note-block rjd-note-concept">

          <div class="rjd-note-heading">

            <span class="rjd-note-icon">
              📖
            </span>

            <div>

              <h3>
                ${text(
                  "आसान भाषा में समझें",
                  "Understand Simply"
                )}
              </h3>

              <p>
                ${text(
                  "सबसे पहले basic concept clear करें।",
                  "Build the basic concept first."
                )}
              </p>

            </div>

          </div>

          <div class="rjd-note-reading">

            <p>
              ${notes.concept || ""}
            </p>

          </div>

        </section>


        <!-- Example -->

        ${
          notes.example
            ? `
              <section class="rjd-note-example">

                <span>
                  💡
                </span>

                <div>

                  <strong>
                    ${text(
                      "उदाहरण से समझें",
                      "Understand with an Example"
                    )}
                  </strong>

                  <p>
                    ${notes.example}
                  </p>

                </div>

              </section>
            `
            : ""
        }


        <!-- Topic Breakdown -->

        ${topicSectionsHTML}


        <!-- Key Points -->

        ${
          Array.isArray(notes.keyPoints) &&
          notes.keyPoints.length
            ? `
              <section class="rjd-note-block">

                <div class="rjd-note-heading">

                  <span class="rjd-note-icon">
                    ⭐
                  </span>

                  <div>

                    <h3>
                      ${text(
                        "मुख्य बातें",
                        "Key Points"
                      )}
                    </h3>

                    <p>
                      ${text(
                        "इन facts को जरूर याद रखें।",
                        "Make sure you remember these facts."
                      )}
                    </p>

                  </div>

                </div>

                <ul class="rjd-key-points rjd-key-points-premium">

                  ${notes.keyPoints
                    .map(
                      (point) => `
                        <li>

                          <span class="rjd-point-icon">
                            ✓
                          </span>

                          <span>
                            ${point}
                          </span>

                        </li>
                      `
                    )
                    .join("")}

                </ul>

              </section>
            `
            : ""
        }


        <!-- Exam Focus -->

        ${examFocusHTML}


        <!-- Exam Trap -->

        ${examTrapHTML}


        <!-- Think Before Answer -->

        ${thinkHTML}


        <!-- Memory Tricks -->

        ${memoryHTML}


        <!-- PYQ Signal -->

        ${pyqHTML}


        <!-- Must Remember -->

        ${mustRememberHTML}


        <!-- Quick Revision -->

        ${
          notes.quickRevision
            ? `
              <section class="rjd-quick-revision rjd-quick-revision-premium">

                <div class="rjd-quick-icon">
                  ⚡
                </div>

                <div>

                  <strong>
                    ${text(
                      "Quick Revision",
                      "Quick Revision"
                    )}
                  </strong>

                  <p>
                    ${notes.quickRevision}
                  </p>

                </div>

              </section>
            `
            : ""
        }


        <!-- Practice CTA -->

        <section class="rjd-notes-cta">

          <div>

            <span class="rjd-notes-cta__eyebrow">
              ${text(
                "अब अपनी तैयारी check करें",
                "Now test your preparation"
              )}
            </span>

            <h3>
              ${text(
                "Concept समझ लिया?",
                "Understood the concept?"
              )}
            </h3>

            <p>
              ${text(
                "अब Practice में अपनी understanding को test करें।",
                "Now test your understanding in Practice."
              )}
            </p>

          </div>

          <button
            type="button"
            class="rjd-btn rjd-btn--primary"
            id="rjd-goto-practice"
          >
            ${LanguageManager.get("startPractice")}
          </button>

        </section>

      </div>
    `;

    /* ---------------------------------------------------------
       Practice Button
    --------------------------------------------------------- */

    const practiceButton =
      panel.querySelector(
        "#rjd-goto-practice"
      );

    if (practiceButton) {
      practiceButton.addEventListener(
        "click",
        () => {
          activeTab = "practice";
          renderShell();
        }
      );
    }
  }

  /* =========================================================
     PRACTICE TAB
  ========================================================= */

  function renderPracticeTab(panel) {
    panel.innerHTML = `
      <div class="rjd-practice-toolbar">

        <button
          type="button"
          class="rjd-chip ${
            practiceMode === "all"
              ? "is-active"
              : ""
          }"
          data-mode="all"
        >
          ${
            isHindi()
              ? "सभी प्रश्न"
              : "All Questions"
          }
        </button>

        <button
          type="button"
          class="rjd-chip ${
            practiceMode === "wrong"
              ? "is-active"
              : ""
          }"
          data-mode="wrong"
        >
          ${LanguageManager.get("practiceWrong")}
        </button>

      </div>

      <div
        id="rjd-practice-container"
      ></div>
    `;

    panel
      .querySelectorAll(".rjd-chip")
      .forEach((chip) => {

        chip.addEventListener(
          "click",
          () => {

            practiceMode =
              chip.dataset.mode;

            renderPracticeTab(panel);
          }
        );

      });

    mountPractice(
      panel.querySelector(
        "#rjd-practice-container"
      )
    );
  }

  /* =========================================================
     PRACTICE ENGINE
  ========================================================= */

  function mountPractice(container) {
    let questions;

    if (practiceMode === "wrong") {

      const wrongIds =
        new Set(
          WrongQuestionManager.getIds(
            classNum,
            subject,
            chapter
          )
        );

      questions =
        bank.filter(
          (q) => wrongIds.has(q.id)
        );

      if (questions.length === 0) {

        container.innerHTML = `
          <div class="rjd-empty-state">

            <p>
              ${LanguageManager.get(
                "noWrongQuestions"
              )}
            </p>

          </div>
        `;

        return;
      }

    } else {

      questions = bank;

    }

    createPracticeSession(
      container,
      questions,
      {
        onComplete: (
          correct,
          total
        ) => {

          UIManager.toast(

            isHindi()
              ? `अभ्यास पूर्ण! ${correct}/${total} सही।`
              : `Practice complete! ${correct}/${total} correct.`,

            "success",

            4000
          );

          if (
            practiceMode === "wrong"
          ) {
            // Wrong questions remain
            // until properly cleared
            // through the existing system.
          }
        },
      }
    );
  }

  /* =========================================================
     MOCK TEST HUB
  ========================================================= */

  function renderMockTestHub(panel) {

    const configs =
      TestGenerator.getConfigs();

    const wrongCount =
      WrongQuestionManager.getIds(
        classNum,
        subject,
        chapter
      ).length;

    const attemptedCount =
      StorageManager.getAttemptedQuestionIds(
        classNum,
        subject,
        chapter
      ).length;

    const history =
      StorageManager.getResultHistory(
        classNum,
        subject,
        chapter
      );

    panel.innerHTML = `

      <div class="rjd-testcard-grid">

        ${configs
          .map(
            (c, i) => `

              <a
                class="rjd-testcard"
                href="mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=mock&testId=${c.id}"
              >

                <span class="rjd-testcard__index">
                  ${String(i + 1).padStart(2, "0")}
                </span>

                <span class="rjd-testcard__label">
                  ${LanguageManager.pick(c.label)}
                </span>

                <span class="rjd-testcard__meta">
                  ${c.questionCount}
                  ${LanguageManager.get("questions")}
                  ·
                  ${c.timeLimitMin}
                  ${LanguageManager.get("minutes")}
                </span>

              </a>
            `
          )
          .join("")}


        <a
          class="rjd-testcard rjd-testcard--accent ${
            wrongCount === 0
              ? "is-disabled"
              : ""
          }"
          href="${
            wrongCount > 0
              ? WrongQuestionManager.timedTestUrl(
                  classNum,
                  subject,
                  chapter
                )
              : "#"
          }"
        >

          <span class="rjd-testcard__index">
            ❌
          </span>

          <span class="rjd-testcard__label">
            ${LanguageManager.get(
              "wrongQuestionsTest"
            )}
          </span>

          <span class="rjd-testcard__meta">
            ${wrongCount}
            ${LanguageManager.get(
              "questions"
            )}
          </span>

        </a>


        <a
          class="rjd-testcard rjd-testcard--accent ${
            attemptedCount === 0
              ? "is-disabled"
              : ""
          }"
          href="${
            attemptedCount > 0
              ? `mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=revision`
              : "#"
          }"
        >

          <span class="rjd-testcard__index">
            🔁
          </span>

          <span class="rjd-testcard__label">
            ${LanguageManager.get(
              "revisionTest"
            )}
          </span>

          <span class="rjd-testcard__meta">
            ${attemptedCount}
            ${
              isHindi()
                ? "पूर्व-प्रयासित"
                : "previously seen"
            }
          </span>

        </a>

      </div>


      <h3 class="rjd-section-title">
        ${LanguageManager.get(
          "selectTopic"
        )}
      </h3>


      <div class="rjd-topic-grid">

        ${meta.topics
          .map(
            (topic) => `

              <a
                class="rjd-topic-chip"
                href="mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=topic&topic=${topic.id}"
              >
                ${LanguageManager.pick(
                  topic.name
                )}
              </a>
            `
          )
          .join("")}

      </div>


      ${
        history.length > 0
          ? `

            <h3 class="rjd-section-title">
              ${
                isHindi()
                  ? "हाल के टेस्ट"
                  : "Recent Tests"
              }
            </h3>

            <div class="rjd-history-list">

              ${history
                .slice(0, 5)
                .map(
                  (h) => `

                    <div class="rjd-history-item">

                      <span>
                        ${h.testId}
                      </span>

                      <span>
                        ${h.summary.percentage}%
                      </span>

                      <span>
                        ${new Date(
                          h.ts
                        ).toLocaleDateString()}
                      </span>

                    </div>
                  `
                )
                .join("")}

            </div>
          `
          : ""
      }

    `;
  }

  /* =========================================================
     LANGUAGE TOGGLE
  ========================================================= */

  function renderLangToggle() {

    const btn =
      document.getElementById(
        "rjd-lang-toggle"
      );

    if (!btn) return;

    btn
      .querySelectorAll(
        "[data-lang]"
      )
      .forEach((el) => {

        el.classList.toggle(
          "is-active",
          el.dataset.lang ===
            LanguageManager.getCurrent()
        );

      });
  }

  /* =========================================================
     BOOT
  ========================================================= */

  async function boot() {

    UIManager.showLoading(
      root,
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

      meta = bundle.meta;
      bank = bundle.questions;

      renderShell();
      renderLangToggle();

    } catch (err) {

      console.error(err);

      UIManager.showError(
        root,
        LanguageManager.get(
          "loadError"
        ),
        boot
      );
    }
  }

  /* =========================================================
     LANGUAGE BUTTON
  ========================================================= */

  document
    .getElementById(
      "rjd-lang-toggle"
    )
    ?.addEventListener(
      "click",
      (e) => {

        const target =
          e.target.closest(
            "[data-lang]"
          );

        if (!target) return;

        LanguageManager.setLanguage(
          target.dataset.lang
        );
      }
    );

  /* =========================================================
     LANGUAGE CHANGE
  ========================================================= */

  LanguageManager.onChange(
    () => {

      renderLangToggle();

      if (meta) {
        renderShell();
      }

    }
  );

  /* =========================================================
     START APP
  ========================================================= */

  boot();

})();
