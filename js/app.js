/**
 * Home (RailGaadi Homepage Controller)
 * -----------------------------------------------------------------------
 * Drives home.html: a manifest-driven "exam journey" entry point.
 *
 * Journey: Class (station) -> Subject (coach) -> Chapter (stop) -> board
 * the existing chapter-hub at index.html?class=..&subject=..&chapter=..
 *
 * IMPORTANT:
 * - This file never fetches question/meta data itself. It only reads
 *   data/manifest.json to know which class/subject/chapter combinations
 *   actually exist, then redirects to the existing index.html URL.
 * - It does not modify, wrap, or duplicate any logic from app.js or
 *   dataLoader.js.
 * -----------------------------------------------------------------------
 */
(function () {
  const root = document.getElementById("rjd-home-root");

  let manifest = null;
  let loadFailed = false;

  // Journey state
  let step = "class"; // "class" | "subject" | "chapter"
  let selectedClass = null; // number
  let selectedSubject = null; // string

  /* =========================================================
     LANGUAGE HELPER
  ========================================================= */

  function isHindi() {
    return LanguageManager.getCurrent() === "hi";
  }

  function text(hi, en) {
    return isHindi() ? hi : en;
  }

  function pick(field) {
    return LanguageManager.pick(field);
  }

  /* =========================================================
     DATA
  ========================================================= */

  async function loadManifest() {
    const res = await fetch("data/manifest.json", { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`Failed to fetch manifest: ${res.status}`);
    }
    return res.json();
  }

  function getClassEntry(classNum) {
    return manifest.classes.find((c) => c.class === classNum) || null;
  }

  function getSubjectEntry(classNum, subject) {
    const classEntry = getClassEntry(classNum);
    if (!classEntry) return null;
    return classEntry.subjects.find((s) => s.subject === subject) || null;
  }

  /* =========================================================
     RAILGAADI TRACK (progress breadcrumb)
  ========================================================= */

  function renderTrack() {
    const stations = [
      { id: "class", labelHi: "कक्षा", labelEn: "Class" },
      { id: "subject", labelHi: "विषय", labelEn: "Subject" },
      { id: "chapter", labelHi: "अध्याय", labelEn: "Chapter" },
    ];

    const order = ["class", "subject", "chapter"];
    const currentIndex = order.indexOf(step);

    return `
      <div class="rjd-rail-track">
        ${stations
          .map((s, i) => {
            const state =
              i < currentIndex
                ? "is-done"
                : i === currentIndex
                ? "is-current"
                : "is-upcoming";
            return `
              <div class="rjd-rail-station ${state}">
                <span class="rjd-rail-station__dot">🚉</span>
                <span class="rjd-rail-station__label">
                  ${text(s.labelHi, s.labelEn)}
                </span>
              </div>
              ${
                i < stations.length - 1
                  ? `<span class="rjd-rail-track__line"></span>`
                  : ""
              }
            `;
          })
          .join("")}
      </div>
    `;
  }

  /* =========================================================
     HERO
  ========================================================= */

  function renderHero() {
    return `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚆 ${text("RailGaadi", "RailGaadi")}
        </span>
        <h1 class="rjd-rail-hero__title">
          ${text(
            "आपकी Exam Success की RailGaadi",
            "Your Exam Success RailGaadi"
          )}
        </h1>
        <p class="rjd-rail-hero__subtitle">
          ${text(
            "कक्षा चुनिए, विषय चुनिए, अध्याय चुनिए — और अपनी तैयारी की यात्रा शुरू कीजिए।",
            "Pick your class, pick your subject, pick your chapter — and start your preparation journey."
          )}
        </p>
      </section>
    `;
  }

  /* =========================================================
     BREADCRUMB (selected so far, with back links)
  ========================================================= */

  function renderBreadcrumb() {
    const crumbs = [];

    crumbs.push(`
      <button type="button" class="rjd-rail-crumb" data-goto="class">
        🚉 ${text("कक्षा चुनें", "Select Class")}
      </button>
    `);

    if (selectedClass !== null) {
      const classEntry = getClassEntry(selectedClass);
      crumbs.push(`
        <span class="rjd-rail-crumb__sep">→</span>
        <button type="button" class="rjd-rail-crumb ${
          step === "subject" ? "is-active" : ""
        }" data-goto="subject">
          ${pick(classEntry.label)}
        </button>
      `);
    }

    if (selectedClass !== null && selectedSubject !== null) {
      const subjectEntry = getSubjectEntry(selectedClass, selectedSubject);
      crumbs.push(`
        <span class="rjd-rail-crumb__sep">→</span>
        <button type="button" class="rjd-rail-crumb is-active" data-goto="chapter">
          ${pick(subjectEntry.label)}
        </button>
      `);
    }

    return `<div class="rjd-rail-breadcrumb">${crumbs.join("")}</div>`;
  }

  /* =========================================================
     STEP 1: CLASS SELECTION (stations)
  ========================================================= */

  function renderClassStep(panel) {
    panel.innerHTML = `
      <h2 class="rjd-rail-step-title">
        🚉 ${text("अपना स्टेशन चुनें — अपनी कक्षा", "Choose your station — your class")}
      </h2>
      <div class="rjd-rail-grid">
        ${manifest.classes
          .map((c) => {
            const hasAnyChapter = c.subjects.some(
              (s) => s.chapters.length > 0
            );
            return `
              <button
                type="button"
                class="rjd-rail-card ${
                  hasAnyChapter ? "" : "is-locked"
                }"
                data-class="${c.class}"
              >
                <span class="rjd-rail-card__icon">🚉</span>
                <span class="rjd-rail-card__label">${pick(c.label)}</span>
                ${
                  hasAnyChapter
                    ? ""
                    : `<span class="rjd-rail-card__badge">
                        ${text("जल्द आ रहा है", "Coming Soon")}
                      </span>`
                }
              </button>
            `;
          })
          .join("")}
      </div>
    `;

    panel.querySelectorAll(".rjd-rail-card").forEach((btn) => {
      if (btn.classList.contains("is-locked")) return;
      btn.addEventListener("click", () => {
        selectedClass = Number(btn.dataset.class);
        selectedSubject = null;
        step = "subject";
        render();
      });
    });
  }

  /* =========================================================
     STEP 2: SUBJECT SELECTION (coaches)
  ========================================================= */

  function renderSubjectStep(panel) {
    const classEntry = getClassEntry(selectedClass);

    panel.innerHTML = `
      <h2 class="rjd-rail-step-title">
        🚃 ${text(
          "अपना डिब्बा चुनें — अपना विषय",
          "Choose your coach — your subject"
        )}
      </h2>
      <div class="rjd-rail-grid">
        ${classEntry.subjects
          .map((s) => {
            const hasChapters = s.chapters.length > 0;
            return `
              <button
                type="button"
                class="rjd-rail-card ${hasChapters ? "" : "is-locked"}"
                data-subject="${s.subject}"
              >
                <span class="rjd-rail-card__icon">🚃</span>
                <span class="rjd-rail-card__label">${pick(s.label)}</span>
                ${
                  hasChapters
                    ? `<span class="rjd-rail-card__meta">
                        ${s.chapters.length} ${text("अध्याय", "chapters")}
                      </span>`
                    : `<span class="rjd-rail-card__badge">
                        ${text("जल्द आ रहा है", "Coming Soon")}
                      </span>`
                }
              </button>
            `;
          })
          .join("")}
      </div>
    `;

    panel.querySelectorAll(".rjd-rail-card").forEach((btn) => {
      if (btn.classList.contains("is-locked")) return;
      btn.addEventListener("click", () => {
        selectedSubject = btn.dataset.subject;
        step = "chapter";
        render();
      });
    });
  }

  /* =========================================================
     STEP 3: CHAPTER SELECTION (stops) -> board the train
  ========================================================= */

  function renderChapterStep(panel) {
    const subjectEntry = getSubjectEntry(selectedClass, selectedSubject);

    panel.innerHTML = `
      <h2 class="rjd-rail-step-title">
        🛤️ ${text(
          "अपना पड़ाव चुनें — अपना अध्याय",
          "Choose your stop — your chapter"
        )}
      </h2>
      <div class="rjd-rail-grid">
        ${subjectEntry.chapters
          .map(
            (ch) => `
              <button
                type="button"
                class="rjd-rail-card"
                data-chapter="${ch.chapter}"
              >
                <span class="rjd-rail-card__icon">🛤️</span>
                <span class="rjd-rail-card__label">${pick(ch.name)}</span>
                <span class="rjd-rail-card__cta">
                  ${text("टिकट लें → बोर्ड करें", "Board this train →")}
                </span>
              </button>
            `
          )
          .join("")}
      </div>
    `;

    panel.querySelectorAll(".rjd-rail-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const chapter = btn.dataset.chapter;
        window.location.href = `index.html?class=${selectedClass}&subject=${selectedSubject}&chapter=${chapter}`;
      });
    });
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  function render() {
    if (loadFailed) {
      root.innerHTML = `
        <div class="rjd-empty-state">
          <p>
            ${text(
              "यात्रा जानकारी लोड नहीं हो पा रही। कृपया पुनः प्रयास करें।",
              "Could not load journey data. Please try again."
            )}
          </p>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      ${renderHero()}
      ${renderTrack()}
      ${renderBreadcrumb()}
      <div class="rjd-rail-panel" id="rjd-rail-panel"></div>
    `;

    root.querySelectorAll(".rjd-rail-crumb").forEach((btn) => {
      btn.addEventListener("click", () => {
        const goto = btn.dataset.goto;
        if (goto === "class") {
          selectedClass = null;
          selectedSubject = null;
          step = "class";
        } else if (goto === "subject" && selectedClass !== null) {
          selectedSubject = null;
          step = "subject";
        } else if (goto === "chapter" && selectedSubject !== null) {
          step = "chapter";
        }
        render();
      });
    });

    const panel = document.getElementById("rjd-rail-panel");

    if (step === "class") {
      renderClassStep(panel);
    } else if (step === "subject" && selectedClass !== null) {
      renderSubjectStep(panel);
    } else if (step === "chapter" && selectedClass !== null && selectedSubject !== null) {
      renderChapterStep(panel);
    } else {
      // Fallback: state got out of sync, restart the journey.
      step = "class";
      renderClassStep(panel);
    }
  }

  /* =========================================================
     LANGUAGE TOGGLE
  ========================================================= */

  function renderLangToggle() {
    const btn = document.getElementById("rjd-lang-toggle");
    if (!btn) return;
    btn.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle(
        "is-active",
        el.dataset.lang === LanguageManager.getCurrent()
      );
    });
  }

  document
    .getElementById("rjd-lang-toggle")
    ?.addEventListener("click", (e) => {
      const target = e.target.closest("[data-lang]");
      if (!target) return;
      LanguageManager.setLanguage(target.dataset.lang);
    });

  LanguageManager.onChange(() => {
    renderLangToggle();
    if (manifest) render();
  });

  /* =========================================================
     BOOT
  ========================================================= */

  async function boot() {
    root.innerHTML = `
      <div class="rjd-empty-state">
        <p>${text("लोड हो रहा है...", "Loading...")}</p>
      </div>
    `;

    try {
      manifest = await loadManifest();
      loadFailed = false;
    } catch (err) {
      console.error(err);
      loadFailed = true;
    }

    render();
    renderLangToggle();
  }

  boot();
})();
