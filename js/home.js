/**
 * Home (RailGaadi Journey Page Controller)
 * -----------------------------------------------------------------------
 * Drives home.html:
 * Class -> Subject -> Chapter -> Chapter Page
 *
 * Reads data/manifest.json to build the navigation journey.
 * -----------------------------------------------------------------------
 */
(function () {
  let manifest = null;
  let currentStep = "classes";   // classes | subjects | chapters
  let selectedClass = null;
  let selectedSubject = null;

  const root = document.getElementById("rjd-home-root");

  /* =========================================================
     LANGUAGE HELPER
  ========================================================= */

  function isHindi() {
    return LanguageManager.getCurrent() === "hi";
  }

  function text(hi, en) {
    return isHindi() ? hi : en;
  }

  function pickLabel(labelObj) {
    if (!labelObj) return "";
    return labelObj[LanguageManager.getCurrent()] || labelObj.hi || labelObj.en || "";
  }

  /* =========================================================
     RENDER CLASSES
  ========================================================= */

  function renderClasses() {
    currentStep = "classes";
    selectedClass = null;
    selectedSubject = null;

    const classes = manifest.classes || [];

    root.innerHTML = `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚂 ${text("RailGaadi", "RailGaadi")}
        </span>
        <h1 class="rjd-rail-hero__title">
          ${text(
            "अपनी पढ़ाई की यात्रा शुरू करें",
            "Start Your Learning Journey"
          )}
        </h1>
        <p class="rjd-rail-hero__subtitle">
          ${text(
            "अपनी कक्षा चुनें और सही direction में आगे बढ़ें।",
            "Select your class and move in the right direction."
          )}
        </p>
      </section>

      <div class="rjd-rail-breadcrumb">
        <span class="rjd-rail-crumb is-active">
          ${text("कक्षा", "Class")}
        </span>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb">
          ${text("विषय", "Subject")}
        </span>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb">
          ${text("अध्याय", "Chapter")}
        </span>
      </div>

      <div class="rjd-rail-grid">
        ${classes.map((cls) => `
          <button
            type="button"
            class="rjd-rail-card"
            data-class="${cls.class}"
          >
            <span class="rjd-rail-card__icon">📚</span>
            <span class="rjd-rail-card__label">
              ${pickLabel(cls.label)}
            </span>
            <span class="rjd-rail-card__meta">
              ${(cls.subjects || []).length}
              ${text("विषय", "Subjects")}
            </span>
          </button>
        `).join("")}
      </div>
    `;

    root.querySelectorAll("[data-class]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedClass = manifest.classes.find(
          (c) => String(c.class) === btn.dataset.class
        );
        renderSubjects();
      });
    });
  }

  /* =========================================================
     RENDER SUBJECTS
  ========================================================= */

  function renderSubjects() {
    if (!selectedClass) return renderClasses();
    currentStep = "subjects";

    const subjects = selectedClass.subjects || [];

    root.innerHTML = `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚂 ${text("RailGaadi", "RailGaadi")}
        </span>
        <h1 class="rjd-rail-hero__title">
          ${pickLabel(selectedClass.label)}
        </h1>
        <p class="rjd-rail-hero__subtitle">
          ${text(
            "अपना विषय चुनें और आगे बढ़ें।",
            "Select your subject and continue."
          )}
        </p>
      </section>

      <div class="rjd-rail-breadcrumb">
        <button type="button" class="rjd-rail-crumb is-done" data-back="classes">
          ${pickLabel(selectedClass.label)}
        </button>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb is-active">
          ${text("विषय", "Subject")}
        </span>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb">
          ${text("अध्याय", "Chapter")}
        </span>
      </div>

      <div class="rjd-rail-grid">
        ${subjects.map((subj) => {
          const hasChapters = (subj.chapters || []).length > 0;
          return `
            <button
              type="button"
              class="rjd-rail-card ${!hasChapters ? 'is-locked' : ''}"
              data-subject="${subj.subject}"
              ${!hasChapters ? 'disabled' : ''}
            >
              <span class="rjd-rail-card__icon">🔬</span>
              <span class="rjd-rail-card__label">
                ${pickLabel(subj.label)}
              </span>
              <span class="rjd-rail-card__meta">
                ${hasChapters
                  ? `${subj.chapters.length} ${text("अध्याय", "Chapters")}`
                  : text("जल्द आ रहा है", "Coming Soon")
                }
              </span>
            </button>
          `;
        }).join("")}
      </div>
    `;

    root.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => renderClasses());
    });

    root.querySelectorAll("[data-subject]").forEach((btn) => {
      if (btn.disabled) return;
      btn.addEventListener("click", () => {
        selectedSubject = selectedClass.subjects.find(
          (s) => s.subject === btn.dataset.subject
        );
        renderChapters();
      });
    });
  }

  /* =========================================================
     RENDER CHAPTERS
  ========================================================= */

  function renderChapters() {
    if (!selectedSubject) return renderSubjects();
    currentStep = "chapters";

    const chapters = selectedSubject.chapters || [];

    root.innerHTML = `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚂 ${text("RailGaadi", "RailGaadi")}
        </span>
        <h1 class="rjd-rail-hero__title">
          ${pickLabel(selectedSubject.label)}
        </h1>
        <p class="rjd-rail-hero__subtitle">
          ${text(
            "अपना अध्याय चुनें और पढ़ाई शुरू करें।",
            "Select your chapter and start learning."
          )}
        </p>
      </section>

      <div class="rjd-rail-breadcrumb">
        <button type="button" class="rjd-rail-crumb is-done" data-back="classes">
          ${pickLabel(selectedClass.label)}
        </button>
        <span class="rjd-rail-crumb__sep">→</span>
        <button type="button" class="rjd-rail-crumb is-done" data-back="subjects">
          ${pickLabel(selectedSubject.label)}
        </button>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb is-active">
          ${text("अध्याय", "Chapter")}
        </span>
      </div>

      <div class="rjd-rail-grid">
        ${chapters.map((ch) => `
          <a
            class="rjd-rail-card"
            href="index.html?class=${selectedClass.class}&subject=${selectedSubject.subject}&chapter=${ch.chapter}"
          >
            <span class="rjd-rail-card__icon">📖</span>
            <span class="rjd-rail-card__label">
              ${pickLabel(ch.name)}
            </span>
            <span class="rjd-rail-card__meta">
              ${text("पढ़ाई शुरू करें", "Start Learning")}
            </span>
          </a>
        `).join("")}
      </div>
    `;

    root.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.back === "classes") renderClasses();
        else renderSubjects();
      });
    });
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

  /* =========================================================
     BOOT
  ========================================================= */

  async function boot() {
    UIManager.showLoading(root, LanguageManager.get("loading"));

    try {
      const res = await fetch("data/manifest.json");
      if (!res.ok) throw new Error("Manifest not found");
      manifest = await res.json();

      if (!manifest || !manifest.classes || !manifest.classes.length) {
        root.innerHTML = `
          <div class="rjd-empty-state">
            <p>${text("कोई कक्षा उपलब्ध नहीं।", "No classes available.")}</p>
          </div>
        `;
        return;
      }

      renderClasses();
      renderLangToggle();

    } catch (err) {
      console.error(err);
      UIManager.showError(root, LanguageManager.get("loadError"), boot);
    }
  }

  /* =========================================================
     EVENT LISTENERS
  ========================================================= */

  document.getElementById("rjd-lang-toggle")
    ?.addEventListener("click", (e) => {
      const target = e.target.closest("[data-lang]");
      if (!target) return;
      LanguageManager.setLanguage(target.dataset.lang);
    });

  LanguageManager.onChange(() => {
    renderLangToggle();
    if (manifest) {
      if (currentStep === "classes") renderClasses();
      else if (currentStep === "subjects") renderSubjects();
      else if (currentStep === "chapters") renderChapters();
    }
  });

  /* =========================================================
     START
  ========================================================= */

  boot();

})();
