/**
 * Home Page Controller — Redesigned Landing + RailGaadi Journey
 * -----------------------------------------------------------------------
 * 1. LANDING: Premium homepage with Hero, Cards, RailGaadi, Exams, Stats, CTA
 * 2. JOURNEY: Class → Subject → Chapter selection (preserved from original)
 * -----------------------------------------------------------------------
 */
(function () {
  let manifest = null;
  let currentView = "landing";
  let selectedClass = null;
  let selectedSubject = null;
  let journeyIntent = "notes";

  const root = document.getElementById("rjd-home-root");

  /* =========================================================
     BILINGUAL STRINGS (Home-page only)
  ========================================================= */
  const S = {
    heroTitle:       { hi: "अपनी Science तैयारी की यात्रा शुरू करें", en: "Start Your Science Preparation Journey" },
    heroSubtitle:    { hi: "SSC • Railway • State Government Exams के लिए Biology • Physics • Chemistry की exam-focused तैयारी", en: "Exam-focused preparation for Biology • Physics • Chemistry for SSC • Railway • State Exams" },
    heroCtaMock:     { hi: "Exam जैसा टेस्ट दो →", en: "Take exam-like tests →" },
    heroCtaPractice: { hi: "Topic-wise questions solve करो →", en: "Solve topic-wise questions →" },
    feature1:        { hi: "Exam-Oriented Content", en: "Exam-Oriented Content" },
    feature2:        { hi: "Chapter-wise Tests", en: "Chapter-wise Tests" },
    feature3:        { hi: "Better Results & Performance", en: "Better Results & Performance" },
    mockTitle:       { hi: "MOCK TESTS", en: "MOCK TESTS" },
    mockDesc:        { hi: "Exam जैसा टेस्ट दो और अपनी तैयारी को परखें।", en: "Take exam-like tests and evaluate your preparation." },
    mockBtn:         { hi: "Test शुरू करें →", en: "Start Test →" },
    practiceTitle:   { hi: "PRACTICE", en: "PRACTICE" },
    practiceDesc:    { hi: "Topic-wise questions solve करें और रोज बेहतर बनें।", en: "Solve topic-wise questions and improve daily." },
    practiceBtn:     { hi: "Practice शुरू करें →", en: "Start Practice →" },
    notesTitle:      { hi: "NOTES", en: "NOTES" },
    notesDesc:       { hi: "Important concepts और short notes जल्दी revise करें।", en: "Quickly revise important concepts and short notes." },
    notesBtn:        { hi: "Notes पढ़ें →", en: "Read Notes →" },
    railTitle:       { hi: "RailGaadi", en: "RailGaadi" },
    railLead:        { hi: "अपनी Science तैयारी को सही direction में आगे बढ़ाएँ", en: "Move your Science preparation in the right direction" },
    railSub:         { hi: "छोटे-छोटे steps में Biology, Physics और Chemistry को समझें और मजबूत बनाएँ।", en: "Understand Biology, Physics and Chemistry in small steps and build strong foundations." },
    railBtn:         { hi: "तैयारी शुरू करें →", en: "Start Preparation →" },
    examTitle:       { hi: "किस परीक्षा के लिए तैयारी?", en: "Preparing for which exam?" },
    sscTitle:        { hi: "SSC Exams", en: "SSC Exams" },
    sscDesc:         { hi: "SSC CGL, CHSL, MTS, GD, Steno आदि", en: "SSC CGL, CHSL, MTS, GD, Steno etc." },
    railwayTitle:    { hi: "Railway Exams", en: "Railway Exams" },
    railwayDesc:     { hi: "RRB NTPC, Group D, ALP, RPF, Technician आदि", en: "RRB NTPC, Group D, ALP, RPF, Technician etc." },
    stateTitle:      { hi: "State Exams", en: "State Exams" },
    stateDesc:       { hi: "UPPSC, MPPSC, Bihar SI, REET, Patwari आदि", en: "UPPSC, MPPSC, Bihar SI, REET, Patwari etc." },
    statChapters:    { hi: "Exam-Focused Chapters", en: "Exam-Focused Chapters" },
    statQuestions:   { hi: "Questions Per Chapter", en: "Questions Per Chapter" },
    statMocks:       { hi: "Mock Tests Per Chapter", en: "Mock Tests Per Chapter" },
    statContent:     { hi: "Exam-Oriented Content", en: "Exam-Oriented Content" },
    finalTitle:      { hi: "आज ही अपनी तैयारी शुरू करें!", en: "Start Your Preparation Today!" },
    finalSub:        { hi: "Mock Test दें, Practice करें और अपने सपनों की नौकरी पाएँ।", en: "Take Mock Tests, Practice and get your dream job." },
    finalBtn:        { hi: "Mock Test शुरू करें →", en: "Start Mock Test →" },
    subjectsLabel:   { hi: "विषय", en: "Subjects" },
    chaptersLabel:   { hi: "अध्याय", en: "Chapters" },
    classLabel:      { hi: "कक्षा", en: "Class" },
    startLearning:   { hi: "पढ़ाई शुरू करें", en: "Start Learning" },
    backToHome:      { hi: "← होम पर वापस जाएँ", en: "← Back to Home" },
    noData:          { hi: "कोई डेटा उपलब्ध नहीं। कृपया बाद में पुनः प्रयास करें।", en: "No data available. Please try again later." },
  };

  function t(k) {
    const e = S[k];
    return e ? (e[LanguageManager.getCurrent()] || e.hi || k) : k;
  }
  function isHindi() { return LanguageManager.getCurrent() === "hi"; }
  function pickLabel(o) {
    if (!o) return "";
    return o[LanguageManager.getCurrent()] || o.hi || o.en || "";
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
            <h1 class="rjd-home-hero__title">${t("heroTitle")}</h1>
            <p class="rjd-home-hero__subtitle">${t("heroSubtitle")}</p>
            <div class="rjd-home-hero__actions">
              <button type="button" class="rjd-home-hero__btn rjd-home-hero__btn--mock" data-action="mock">
                <span>📝</span>
                <span><b>MOCK TESTS</b><small>${t("heroCtaMock")}</small></span>
              </button>
              <button type="button" class="rjd-home-hero__btn rjd-home-hero__btn--practice" data-action="practice">
                <span>🎯</span>
                <span><b>PRACTICE</b><small>${t("heroCtaPractice")}</small></span>
              </button>
            </div>
            <div class="rjd-home-hero__features">
              <span>🎯 ${t("feature1")}</span>
              <span>📋 ${t("feature2")}</span>
              <span>📈 ${t("feature3")}</span>
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
              <h3>${t("mockTitle")}</h3>
              <p>${t("mockDesc")}</p>
              <span class="rjd-home-card__link">${t("mockBtn")}</span>
            </div>
          </button>
          <button type="button" class="rjd-home-card rjd-home-card--practice" data-action="practice">
            <div class="rjd-home-card__top"></div>
            <div class="rjd-home-card__body">
              <div class="rjd-home-card__icon">🎯</div>
              <h3>${t("practiceTitle")}</h3>
              <p>${t("practiceDesc")}</p>
              <span class="rjd-home-card__link">${t("practiceBtn")}</span>
            </div>
          </button>
          <button type="button" class="rjd-home-card rjd-home-card--notes" data-action="notes">
            <div class="rjd-home-card__top"></div>
            <div class="rjd-home-card__body">
              <div class="rjd-home-card__icon">📚</div>
              <h3>${t("notesTitle")}</h3>
              <p>${t("notesDesc")}</p>
              <span class="rjd-home-card__link">${t("notesBtn")}</span>
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
            <h2>🚂 ${t("railTitle")}</h2>
            <p class="rjd-home-rail__lead">${t("railLead")}</p>
            <p class="rjd-home-rail__sub">${t("railSub")}</p>
            <button type="button" class="rjd-home-rail__btn" data-action="journey">${t("railBtn")}</button>
          </div>
        </div>
      </section>

      <section class="rjd-home-section">
        <h2 class="rjd-home-section__title">🏆 ${t("examTitle")}</h2>
        <div class="rjd-home-exams">
          <div class="rjd-home-exam">
            <div class="rjd-home-exam__badge">🏛️</div>
            <h4>${t("sscTitle")}</h4>
            <p>${t("sscDesc")}</p>
          </div>
          <div class="rjd-home-exam">
            <div class="rjd-home-exam__badge">🚆</div>
            <h4>${t("railwayTitle")}</h4>
            <p>${t("railwayDesc")}</p>
          </div>
          <div class="rjd-home-exam">
            <div class="rjd-home-exam__badge">🏫</div>
            <h4>${t("stateTitle")}</h4>
            <p>${t("stateDesc")}</p>
          </div>
        </div>
      </section>

      <section class="rjd-home-section rjd-home-stats-wrap">
        <div class="rjd-home-stats">
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">📖</div>
            <div class="rjd-home-stat__num">37+</div>
            <div class="rjd-home-stat__label">${t("statChapters")}</div>
          </div>
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">❓</div>
            <div class="rjd-home-stat__num">150+</div>
            <div class="rjd-home-stat__label">${t("statQuestions")}</div>
          </div>
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">📋</div>
            <div class="rjd-home-stat__num">5</div>
            <div class="rjd-home-stat__label">${t("statMocks")}</div>
          </div>
          <div class="rjd-home-stat">
            <div class="rjd-home-stat__icon">🎯</div>
            <div class="rjd-home-stat__num">100%</div>
            <div class="rjd-home-stat__label">${t("statContent")}</div>
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
          <h2>${t("finalTitle")}</h2>
          <p>${t("finalSub")}</p>
          <button type="button" class="rjd-home-final__btn" data-action="mock">${t("finalBtn")}</button>
        </div>
      </section>
    `;

    root.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = btn.dataset.action;
        journeyIntent = (a === "journey") ? "notes" : a;
        startJourney();
      });
    });
  }

  function startJourney() {
    if (!manifest || !manifest.classes || !manifest.classes.length) {
      UIManager.toast(isHindi() ? t("noData") : t("noData"), "warn", 4000);
      return;
    }
    renderClasses();
  }

  /* =========================================================
     JOURNEY: Class → Subject → Chapter (PRESERVED)
  ========================================================= */
  function renderClasses() {
    currentView = "classes";
    selectedClass = null;
    selectedSubject = null;
    const classes = manifest.classes || [];

    root.innerHTML = `
      <div class="rjd-home-journey">
        <button type="button" class="rjd-home-journey__back" id="rjd-back-home">${t("backToHome")}</button>
        <div class="rjd-rail-breadcrumb">
          <span class="rjd-rail-crumb is-active">${t("classLabel")}</span>
          <span class="rjd-rail-crumb__sep">→</span>
          <span class="rjd-rail-crumb">${t("subjectsLabel")}</span>
          <span class="rjd-rail-crumb__sep">→</span>
          <span class="rjd-rail-crumb">${t("chaptersLabel")}</span>
        </div>
        <h2 class="rjd-home-journey__title">${isHindi() ? "अपनी कक्षा चुनें" : "Select Your Class"}</h2>
        <div class="rjd-rail-grid">
          ${classes.map((cls) => `
            <button type="button" class="rjd-rail-card" data-class="${cls.class}">
              <span class="rjd-rail-card__icon">📚</span>
              <span class="rjd-rail-card__label">${pickLabel(cls.label)}</span>
              <span class="rjd-rail-card__meta">${(cls.subjects || []).length} ${t("subjectsLabel")}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("rjd-back-home").addEventListener("click", renderLanding);
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
      <div class="rjd-home-journey">
        <button type="button" class="rjd-home-journey__back" id="rjd-back-home">${t("backToHome")}</button>
        <div class="rjd-rail-breadcrumb">
          <button type="button" class="rjd-rail-crumb is-done" data-step="classes">${pickLabel(selectedClass.label)}</button>
          <span class="rjd-rail-crumb__sep">→</span>
          <span class="rjd-rail-crumb is-active">${t("subjectsLabel")}</span>
          <span class="rjd-rail-crumb__sep">→</span>
          <span class="rjd-rail-crumb">${t("chaptersLabel")}</span>
        </div>
        <h2 class="rjd-home-journey__title">${isHindi() ? "अपना विषय चुनें" : "Select Your Subject"}</h2>
        <div class="rjd-rail-grid">
          ${subjects.map((subj) => {
            const hasChapters = (subj.chapters || []).length > 0;
            return `
              <button type="button" class="rjd-rail-card ${!hasChapters ? 'is-locked' : ''}" data-subject="${subj.subject}" ${!hasChapters ? 'disabled' : ''}>
                <span class="rjd-rail-card__icon">🔬</span>
                <span class="rjd-rail-card__label">${pickLabel(subj.label)}</span>
                <span class="rjd-rail-card__meta">${hasChapters ? `${subj.chapters.length} ${t("chaptersLabel")}` : (isHindi() ? "जल्द आ रहा है" : "Coming Soon")}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;

    document.getElementById("rjd-back-home").addEventListener("click", renderLanding);
    root.querySelectorAll("[data-step]").forEach((btn) => {
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
      <div class="rjd-home-journey">
        <button type="button" class="rjd-home-journey__back" id="rjd-back-home">${t("backToHome")}</button>
        <div class="rjd-rail-breadcrumb">
          <button type="button" class="rjd-rail-crumb is-done" data-step="classes">${pickLabel(selectedClass.label)}</button>
          <span class="rjd-rail-crumb__sep">→</span>
          <button type="button" class="rjd-rail-crumb is-done" data-step="subjects">${pickLabel(selectedSubject.label)}</button>
          <span class="rjd-rail-crumb__sep">→</span>
          <span class="rjd-rail-crumb is-active">${t("chaptersLabel")}</span>
        </div>
        <h2 class="rjd-home-journey__title">${isHindi() ? "अपना अध्याय चुनें" : "Select Your Chapter"}</h2>
        <div class="rjd-rail-grid">
          ${chapters.map((ch) => `
            <a class="rjd-rail-card" href="index.html?class=${selectedClass.class}&subject=${selectedSubject.subject}&chapter=${ch.chapter}">
              <span class="rjd-rail-card__icon">📖</span>
              <span class="rjd-rail-card__label">${pickLabel(ch.name)}</span>
              <span class="rjd-rail-card__meta">${t("startLearning")}</span>
            </a>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("rjd-back-home").addEventListener("click", renderLanding);
    root.querySelectorAll("[data-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.step === "classes") renderClasses();
        else renderSubjects();
      });
    });
  }

  /* =========================================================
     LANGUAGE & BOOT
  ========================================================= */
  function renderLangToggle() {
    const btn = document.getElementById("rjd-lang-toggle");
    if (!btn) return;
    btn.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.lang === LanguageManager.getCurrent());
    });
  }

  async function boot() {
    try {
      const res = await fetch("data/manifest.json");
      if (res.ok) manifest = await res.json();
    } catch (e) {
      console.warn("Manifest load failed", e);
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
