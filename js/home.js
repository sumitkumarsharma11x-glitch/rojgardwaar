/**
 * Home Page Controller — Landing + RailGaadi Journey
 * -----------------------------------------------------------------------
 * 1. LANDING: Hero, 3 Action Cards, RailGaadi, Exams, Stats, Final CTA
 * 2. JOURNEY: Class → Subject → Chapter (preserved from original)
 * -----------------------------------------------------------------------
 */
(function () {
  let manifest = null;
  let currentView = "landing";
  let selectedClass = null;
  let selectedSubject = null;

  const root = document.getElementById("rjd-home-root");

  /* =========================================================
     LANGUAGE HELPER (preserved exactly)
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
     LANDING PAGE
  ========================================================= */
  function renderLanding() {
    currentView = "landing";
    root.innerHTML = `
      <section class="rjd-home-hero">
        <div class="rjd-home-hero__inner">
          <div class="rjd-home-hero__text">
            <div class="rjd-home-hero__pill">SSC • RAILWAY • STATE EXAMS</div>
            <h1 class="rjd-home-hero__title">
              ${text("Science की तैयारी अब Exam-Focused तरीके से!", "Science preparation, now Exam-Focused!")}
            </h1>
            <p class="rjd-home-hero__subtitle">
              ${text("NCERT Class 6-10 के महत्वपूर्ण Concepts से अपनी तैयारी को दें नई गति।", "Give your preparation new momentum with important NCERT Class 6-10 Concepts.")}
            </p>
            <div class="rjd-home-hero__actions">
              <button type="button" class="rjd-home-hero__btn rjd-home-hero__btn--mock" data-action="mock">
                <span>📝</span>
                <span><b>MOCK TESTS</b><small>${text("Exam जैसा टेस्ट दो →", "Take exam-like tests →")}</small></span>
              </button>
              <button type="button" class="rjd-home-hero__btn rjd-home-hero__btn--practice" data-action="practice">
                <span>🎯</span>
                <span><b>PRACTICE</b><small>${text("Topic-wise questions solve करो →", "Solve topic-wise questions →")}</small></span>
              </button>
            </div>
            <div class="rjd-home-hero__features">
              <span>🎯 ${text("Exam-Oriented Content", "Exam-Oriented Content")}</span>
              <span>📋 ${text("Chapter-wise Tests", "Chapter-wise Tests")}</span>
              <span>📈 ${text("Better Results & Performance", "Better Results & Performance")}</span>
            </div>
          </div>
          <div class="rjd-home-hero__visual" aria-hidden="true">
            <div class="rjd-home-hero__scene">
              <div class="rjd-home-books">
                <div class="rjd-home-book rjd-home-book--bio"><span>🌿</span>BIOLOGY</div>
                <div class="rjd-home-book rjd-home-book--phy"><span>⚡</span>PHYSICS</div>
                <div class="rjd-home-book rjd-home-book--chem"><span>⚗️</span>CHEMISTRY</div>
              </div>
              <div class="rjd-home-hero__microscope">🔬</div>
              <div class="rjd-home-floaters">
                <span class="rjd-home-floater" style="--f-x:20%;--f-y:10%;--f-d:3s">🌿</span>
                <span class="rjd-home-floater" style="--f-x:75%;--f-y:15%;--f-d:4s">⚛️</span>
                <span class="rjd-home-floater" style="--f-x:85%;--f-y:60%;--f-d:3.5s">⚡</span>
                <span class="rjd-home-floater" style="--f-x:10%;--f-y:55%;--f-d:4.5s">🧬</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rjd-home-section">
        <div class="rjd-home-cards">
          <button type="button" class="rjd-home-card rjd-home-card--mock" data-action="mock">
            <div class="rjd-home-card__top"></div>
            <div class="rjd-home-card__body">
              <div class="rjd-home-card__icon">📝</div>
              <h3>MOCK TESTS</h3>
              <p>${text("Exam जैसा टेस्ट दो और अपनी तैयारी को परखें।", "Take exam-like tests and evaluate your preparation.")}</p>
              <span class="rjd-home-card__link">${text("Test शुरू करें →", "Start Test →")}</span>
            </div>
          </button>
          <button type="button" class="rjd-home-card rjd-home-card--practice" data-action="practice">
            <div class="rjd-home-card__top"></div>
            <div class="rjd-home-card__body">
              <div class="rjd-home-card__icon">🎯</div>
              <h3>PRACTICE</h3>
              <p>${text("Topic-wise questions solve करें और रोज बेहतर बनें।", "Solve topic-wise questions and improve daily.")}</p>
              <span class="rjd-home-card__link">${text("Practice शुरू करें →", "Start Practice →")}</span>
            </div>
          </button>
          <button type="button" class="rjd-home-card rjd-home-card--notes" data-action="notes">
            <div class="rjd-home-card__top"></div>
            <div class="rjd-home-card__body">
              <div class="rjd-home-card__icon">📚</div>
              <h3>NOTES</h3>
              <p>${text("Important concepts और short notes जल्दी revise करें।", "Quickly revise important concepts and short notes.")}</p>
              <span class="rjd-home-card__link">${text("Notes पढ़ें →", "Read Notes →")}</span>
            </div>
          </button>
        </div>
      </section>

      <section class="rjd-home-section rjd-home-rail">
        <div class="rjd-home-rail__card">
          <div class="rjd-home-rail__visual" aria-hidden="true">
            <div class="rjd-home-rail__train">🚂</div>
            <div class="rjd-home-rail__track">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
          <div class="rjd-home-rail__text">
            <h2>🚂 RailGaadi</h2>
            <p class="rjd-home-rail__lead">${text("अपनी Science तैयारी को सही direction में आगे बढ़ाएँ", "Move your Science preparation in the right direction")}</p>
            <p class="rjd-home-rail__sub">${text("छोटे-छोटे steps में Biology, Physics और Chemistry को समझें और मजबूत बनाएँ।", "Understand Biology, Physics and Chemistry in small steps and build strong foundations.")}</p>
            <button type="button" class="rjd-home-rail__btn" data-action="journey">${text("तैयारी शुरू करें →", "Start Preparation →")}</button>
          </div>
        </div>
      </section>

      <section class="rjd-home-section">
        <h2 class="rjd-home-section__title">🏆 ${text("किस परीक्षा के लिए तैयारी?", "Preparing for which exam?")}</h2>
        <div class="rjd-home-exams">
          <div class="rjd-home-exam">
            <div class="rjd-home-exam__badge">🏛️</div>
            <h4>${text("SSC Exams", "SSC Exams")}</h4>
            <p>${text("SSC CGL, CHSL, MTS, GD, Steno आदि", "SSC CGL, CHSL, MTS, GD, Steno etc.")}</p>
          </div>
          <div class="rjd-home-exam">
            <div class="rjd-home-exam__badge">🚆</div>
            <h4>${text("Railway Exams", "Railway Exams")}</h4>
            <p>${text("RRB NTPC, Group D, ALP, RPF, Technician आदि", "RRB NTPC, Group D, ALP, RPF, Technician etc.")}</p>
          </div>
          <div class="rjd-home-exam">
            <div class="rjd-home-exam__badge">🏫</div>
            <h4>${text("State Exams", "State Exams")}</h4>
            <p>${text("UPPSC, MPPSC, Bihar SI, REET, Patwari आदि", "UPPSC, MPPSC, Bihar SI, REET, Patwari etc.")}</p>
          </div>
        </div>
      </section>

      <section class="rjd-home-section rjd-home-stats-wrap">
        <div class="rjd-home-stats">
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">📖</div>
            <div class="rjd-home-stat__num">37+</div>
            <div class="rjd-home-stat__label">${text("Exam-Focused Chapters", "Exam-Focused Chapters")}</div>
          </div>
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">❓</div>
            <div class="rjd-home-stat__num">150+</div>
            <div class="rjd-home-stat__label">${text("Questions Per Chapter", "Questions Per Chapter")}</div>
          </div>
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">📋</div>
            <div class="rjd-home-stat__num">5</div>
            <div class="rjd-home-stat__label">${text("Mock Tests Per Chapter", "Mock Tests Per Chapter")}</div>
          </div>
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">🎯</div>
            <div class="rjd-home-stat__num">100%</div>
            <div class="rjd-home-stat__label">${text("Exam-Oriented Content", "Exam-Oriented Content")}</div>
          </div>
        </div>
        <div class="rjd-home-subjects">
          <span class="rjd-home-subject rjd-home-subject--bio">Biology</span>
          <span class="rjd-home-subject rjd-home-subject--phy">Physics</span>
          <span class="rjd-home-subject rjd-home-subject--chem">Chemistry</span>
        </div>
      </section>

      <section class="rjd-home-final">
        <div class="rjd-home-final__inner">
          <div class="rjd-home-final__rocket">🚀</div>
          <h2>${text("आज ही अपनी तैयारी शुरू करें!", "Start Your Preparation Today!")}</h2>
          <p>${text("Mock Test दें, Practice करें और अपने सपनों की नौकरी पाएँ।", "Take Mock Tests, Practice and get your dream job.")}</p>
          <button type="button" class="rjd-home-final__btn" data-action="mock">${text("Mock Test शुरू करें →", "Start Mock Test →")}</button>
        </div>
      </section>
    `;

    root.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        startJourney();
      });
    });
  }

  function startJourney() {
    if (!manifest || !manifest.classes || !manifest.classes.length) {
      UIManager.toast(text("कोई डेटा उपलब्ध नहीं। कृपया बाद में पुनः प्रयास करें।", "No data available. Please try again later."), "warn", 4000);
      return;
    }
    renderClasses();
  }

  /* =========================================================
     JOURNEY: Class → Subject → Chapter (PRESERVED EXACTLY)
  ========================================================= */
  function renderClasses() {
    currentView = "classes";
    selectedClass = null;
    selectedSubject = null;

    const classes = manifest.classes || [];

    root.innerHTML = `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚂 ${text("RailGaadi", "RailGaadi")}
        </span>
        <h1 class="rjd-rail-hero__title">
          ${text("अपनी पढ़ाई की यात्रा शुरू करें", "Start Your Learning Journey")}
        </h1>
        <p class="rjd-rail-hero__subtitle">
          ${text("अपनी कक्षा चुनें और सही direction में आगे बढ़ें।", "Select your class and move in the right direction.")}
        </p>
      </section>

      <div class="rjd-rail-breadcrumb">
        <span class="rjd-rail-crumb is-active">${text("कक्षा", "Class")}</span>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb">${text("विषय", "Subject")}</span>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb">${text("अध्याय", "Chapter")}</span>
      </div>

      <div class="rjd-rail-grid">
        ${classes.map((cls) => `
          <button type="button" class="rjd-rail-card" data-class="${cls.class}">
            <span class="rjd-rail-card__icon">📚</span>
            <span class="rjd-rail-card__label">${pickLabel(cls.label)}</span>
            <span class="rjd-rail-card__meta">${(cls.subjects || []).length} ${text("विषय", "Subjects")}</span>
          </button>
        `).join("")}
      </div>

      <div style="text-align:center; padding-bottom: 32px;">
        <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-back-landing">${text("← होम पर वापस जाएँ", "← Back to Home")}</button>
      </div>
    `;

    document.getElementById("rjd-back-landing").addEventListener("click", renderLanding);

    root.querySelectorAll("[data-class]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedClass = manifest.classes.find((c) => String(c.class) === btn.dataset.class);
        renderSubjects();
      });
    });
  }

  function renderSubjects() {
    if (!selectedClass) return renderClasses();
    currentView = "subjects";

    const subjects = selectedClass.subjects || [];

    root.innerHTML = `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚂 ${text("RailGaadi", "RailGaadi")}
        </span>
        <h1 class="rjd-rail-hero__title">${pickLabel(selectedClass.label)}</h1>
        <p class="rjd-rail-hero__subtitle">
          ${text("अपना विषय चुनें और आगे बढ़ें।", "Select your subject and continue.")}
        </p>
      </section>

      <div class="rjd-rail-breadcrumb">
        <button type="button" class="rjd-rail-crumb is-done" data-back="classes">${pickLabel(selectedClass.label)}</button>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb is-active">${text("विषय", "Subject")}</span>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb">${text("अध्याय", "Chapter")}</span>
      </div>

      <div class="rjd-rail-grid">
        ${subjects.map((subj) => {
          const hasChapters = (subj.chapters || []).length > 0;
          return `
            <button type="button" class="rjd-rail-card ${!hasChapters ? 'is-locked' : ''}" data-subject="${subj.subject}" ${!hasChapters ? 'disabled' : ''}>
              <span class="rjd-rail-card__icon">🔬</span>
              <span class="rjd-rail-card__label">${pickLabel(subj.label)}</span>
              <span class="rjd-rail-card__meta">${hasChapters ? `${subj.chapters.length} ${text("अध्याय", "Chapters")}` : text("जल्द आ रहा है", "Coming Soon")}</span>
            </button>
          `;
        }).join("")}
      </div>

      <div style="text-align:center; padding-bottom: 32px;">
        <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-back-landing">${text("← होम पर वापस जाएँ", "← Back to Home")}</button>
      </div>
    `;

    document.getElementById("rjd-back-landing").addEventListener("click", renderLanding);

    root.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => renderClasses());
    });

    root.querySelectorAll("[data-subject]").forEach((btn) => {
      if (btn.disabled) return;
      btn.addEventListener("click", () => {
        selectedSubject = selectedClass.subjects.find((s) => s.subject === btn.dataset.subject);
        renderChapters();
      });
    });
  }

  function renderChapters() {
    if (!selectedSubject) return renderSubjects();
    currentView = "chapters";

    const chapters = selectedSubject.chapters || [];

    root.innerHTML = `
      <section class="rjd-rail-hero">
        <span class="rjd-rail-hero__badge">
          🚂 ${text("RailGaadi", "RailGaadi")}
        </span>
        <h1 class="rjd-rail-hero__title">${pickLabel(selectedSubject.label)}</h1>
        <p class="rjd-rail-hero__subtitle">
          ${text("अपना अध्याय चुनें और पढ़ाई शुरू करें।", "Select your chapter and start learning.")}
        </p>
      </section>

      <div class="rjd-rail-breadcrumb">
        <button type="button" class="rjd-rail-crumb is-done" data-back="classes">${pickLabel(selectedClass.label)}</button>
        <span class="rjd-rail-crumb__sep">→</span>
        <button type="button" class="rjd-rail-crumb is-done" data-back="subjects">${pickLabel(selectedSubject.label)}</button>
        <span class="rjd-rail-crumb__sep">→</span>
        <span class="rjd-rail-crumb is-active">${text("अध्याय", "Chapter")}</span>
      </div>

      <div class="rjd-rail-grid">
        ${chapters.map((ch) => `
          <a class="rjd-rail-card" href="index.html?class=${selectedClass.class}&subject=${selectedSubject.subject}&chapter=${ch.chapter}">
            <span class="rjd-rail-card__icon">📖</span>
            <span class="rjd-rail-card__label">${pickLabel(ch.name)}</span>
            <span class="rjd-rail-card__meta">${text("पढ़ाई शुरू करें", "Start Learning")}</span>
          </a>
        `).join("")}
      </div>

      <div style="text-align:center; padding-bottom: 32px;">
        <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-back-landing">${text("← होम पर वापस जाएँ", "← Back to Home")}</button>
      </div>
    `;

    document.getElementById("rjd-back-landing").addEventListener("click", renderLanding);

    root.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.back === "classes") renderClasses();
        else renderSubjects();
      });
    });
  }

  /* =========================================================
     LANGUAGE TOGGLE (preserved)
  ========================================================= */
  function renderLangToggle() {
    const btn = document.getElementById("rjd-lang-toggle");
    if (!btn) return;
    btn.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.lang === LanguageManager.getCurrent());
    });
  }

  /* =========================================================
     BOOT (modified to show landing first)
  ========================================================= */
  async function boot() {
    try {
      const res = await fetch("data/manifest.json");
      if (res.ok) manifest = await res.json();
    } catch (err) {
      console.warn("Manifest load failed", err);
    }
    renderLanding();
    renderLangToggle();
  }

  document.getElementById("rjd-lang-toggle")?.addEventListener("click", (e) => {
    const target = e.target.closest("[data-lang]");
    if (!target) return;
    LanguageManager.setLanguage(target.dataset.lang);
  });

  LanguageManager.onChange(() => {
    renderLangToggle();
    if (currentView === "landing") renderLanding();
    else if (currentView === "classes") renderClasses();
    else if (currentView === "subjects") renderSubjects();
    else if (currentView === "chapters") renderChapters();
  });

  boot();
})();
