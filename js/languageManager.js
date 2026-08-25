/**
 * LanguageManager
 * -----------------------------------------------------------------------
 * Holds the current display language (hi/en) as global reactive state.
 * IMPORTANT: switching language NEVER touches TestSession state (answers,
 * timer, current index, marked-for-review). It only triggers a re-render
 * of the currently visible content via subscribed listeners.
 * -----------------------------------------------------------------------
 */
const LanguageManager = (function () {
  let currentLang = StorageManager.getLanguage() || "hi";
  const listeners = [];

  // Static UI strings used across pages. Add languages here in future by
  // adding a third key (e.g. "mr") to every entry — nothing else changes.
  const STRINGS = {
    appName: { hi: "रोजगारद्वार", en: "RojgarDwaar" },
    home: { hi: "होम", en: "Home" },
    notes: { hi: "नोट्स", en: "Notes" },
    practice: { hi: "अभ्यास", en: "Practice" },
    mockTests: { hi: "मॉक टेस्ट", en: "Mock Tests" },
    startTest: { hi: "टेस्ट शुरू करें", en: "Start Test" },
    checkAnswer: { hi: "उत्तर जाँचें", en: "Check Answer" },
    next: { hi: "अगला", en: "Next" },
    previous: { hi: "पिछला", en: "Previous" },
    clearAnswer: { hi: "उत्तर हटाएँ", en: "Clear Answer" },
    markForReview: { hi: "समीक्षा हेतु चिह्नित करें", en: "Mark for Review" },
    unmark: { hi: "चिह्न हटाएँ", en: "Unmark" },
    submitTest: { hi: "टेस्ट जमा करें", en: "Submit Test" },
    confirmSubmit: { hi: "क्या आप टेस्ट जमा करना चाहते हैं?", en: "Are you sure you want to submit the test?" },
    yesSubmit: { hi: "हाँ, जमा करें", en: "Yes, Submit" },
    cancel: { hi: "रद्द करें", en: "Cancel" },
    correct: { hi: "सही", en: "Correct" },
    wrong: { hi: "गलत", en: "Wrong" },
    unattempted: { hi: "अनुत्तरित", en: "Unattempted" },
    attempted: { hi: "प्रयासित", en: "Attempted" },
    marked: { hi: "चिह्नित", en: "Marked" },
    totalQuestions: { hi: "कुल प्रश्न", en: "Total Questions" },
    score: { hi: "स्कोर", en: "Score" },
    accuracy: { hi: "सटीकता", en: "Accuracy" },
    percentage: { hi: "प्रतिशत", en: "Percentage" },
    timeTaken: { hi: "लिया गया समय", en: "Time Taken" },
    avgTimePerQ: { hi: "औसत समय/प्रश्न", en: "Avg Time / Question" },
    practiceWrong: { hi: "❌ गलत प्रश्नों का अभ्यास करें", en: "❌ Practice My Wrong Questions" },
    wrongQuestionsTest: { hi: "गलत प्रश्नों का टेस्ट", en: "Wrong Questions Test" },
    retakeTest: { hi: "🔄 टेस्ट दोबारा दें", en: "🔄 Retake Test" },
    newMockTest: { hi: "➡️ नया मॉक टेस्ट", en: "➡️ New Mock Test" },
    backToChapter: { hi: "अध्याय पर वापस जाएँ", en: "Back to Chapter" },
    questionPalette: { hi: "प्रश्न पैलेट", en: "Question Palette" },
    explanation: { hi: "व्याख्या", en: "Explanation" },
    yourAnswer: { hi: "आपका उत्तर", en: "Your Answer" },
    correctAnswer: { hi: "सही उत्तर", en: "Correct Answer" },
    loading: { hi: "लोड हो रहा है...", en: "Loading..." },
    loadError: { hi: "प्रश्न लोड नहीं हो पा रहे हैं। कृपया पुनः प्रयास करें।", en: "Questions could not be loaded. Please try again." },
    retry: { hi: "पुनः प्रयास करें", en: "Retry" },
    noWrongQuestions: { hi: "बधाई हो! आपके कोई गलत प्रश्न नहीं हैं।", en: "Congratulations! You have no wrong questions." },
    reviewAnswers: { hi: "उत्तर समीक्षा", en: "Answer Review" },
    performanceGreat: { hi: "शानदार प्रदर्शन! 🎉", en: "Great performance! 🎉" },
    performanceGood: { hi: "अच्छा प्रदर्शन! 👍", en: "Good performance! 👍" },
    performanceAverage: { hi: "ठीक-ठाक, और अभ्यास करें 💪", en: "Fair, practice more 💪" },
    performanceWeak: { hi: "और मेहनत की जरूरत है 📚", en: "Needs more practice 📚" },
    difficulty_easy: { hi: "आसान", en: "Easy" },
    difficulty_medium: { hi: "मध्यम", en: "Medium" },
    difficulty_hard: { hi: "कठिन", en: "Hard" },
    minutes: { hi: "मिनट", en: "min" },
    questions: { hi: "प्रश्न", en: "Questions" },
    selectTopic: { hi: "विषय चुनें", en: "Select Topic" },
    topicTest: { hi: "टॉपिक टेस्ट", en: "Topic Test" },
    revisionTest: { hi: "रिवीज़न टेस्ट", en: "Revision Test" },
    startPractice: { hi: "अभ्यास शुरू करें", en: "Start Practice" },
    insufficientQuestions: { hi: "पर्याप्त प्रश्न उपलब्ध नहीं — टेस्ट को उपलब्ध प्रश्नों के अनुसार समायोजित किया गया।", en: "Not enough questions available — test adjusted to available questions." },
  };

  function get(stringKey) {
    const entry = STRINGS[stringKey];
    if (!entry) return stringKey;
    return entry[currentLang] || entry.hi || stringKey;
  }

  function getCurrent() {
    return currentLang;
  }

  function setLanguage(lang) {
    if (lang !== "hi" && lang !== "en") return;
    currentLang = lang;
    StorageManager.setLanguage(lang);
    listeners.forEach((fn) => {
      try {
        fn(currentLang);
      } catch (e) {
        console.warn("LanguageManager listener failed", e);
      }
    });
  }

  function toggle() {
    setLanguage(currentLang === "hi" ? "en" : "hi");
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  /** Pull the right-language string out of a bilingual field object {hi, en} */
  function pick(field) {
    if (!field) return "";
    return field[currentLang] || field.hi || field.en || "";
  }

  return { get, getCurrent, setLanguage, toggle, onChange, pick };
})();
