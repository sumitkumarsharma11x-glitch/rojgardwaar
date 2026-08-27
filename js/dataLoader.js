/**
 * DataLoader
 * -----------------------------------------------------------------------
 * Fetches chapter metadata + question bank JSON from /data/.
 * Path convention (Firebase-migration-ready): everything is keyed by
 * class/subject/chapter, so swapping fetch() for a Firestore query later
 * only touches this file.
 *
 * Caches results in-memory per page load so multiple widgets on the same
 * chapter page (Notes / Practice / Mock Test hub) don't re-fetch.
 * -----------------------------------------------------------------------
 */
const DataLoader = (function () {
  const cache = {};

  function basePath(classNum, subject, chapter) {
    return `data/class${classNum}/${subject}/${chapter}`;
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    return res.json();
  }

  /**
   * questions.json has shown up in two shapes across chapters:
   *   - a raw array:      [ {...}, {...} ]
   *   - a wrapped object: { "questions": [ {...}, {...} ] }
   * Accept both so a chapter's file format never silently empties the bank.
   */
  function extractQuestionArray(questionData) {
    if (Array.isArray(questionData)) return questionData;
    if (questionData && Array.isArray(questionData.questions)) return questionData.questions;
    return [];
  }

  /**
   * Some question banks store the correct-option index as "correct"
   * instead of "correctAnswer" (which is what scoreEngine/randomizer/
   * practiceEngine all read). Normalize here — the single point where
   * raw data becomes the app's question shape — so nothing downstream
   * has to special-case field names.
   */
  function normalizeQuestion(q) {
    if (!q) return q;
    const correctAnswer =
      typeof q.correctAnswer === "number"
        ? q.correctAnswer
        : typeof q.correct === "number"
        ? q.correct
        : 0;
    return {
      ...q,
      correctAnswer,
      explanation: q.explanation || { hi: "", en: "" },
    };
  }

  async function loadChapter(classNum, subject, chapter) {
    const cacheKey = `${classNum}-${subject}-${chapter}`;
    if (cache[cacheKey]) return cache[cacheKey];

    const base = basePath(classNum, subject, chapter);
    const [meta, questionData] = await Promise.all([
      fetchJSON(`${base}/meta.json`),
      fetchJSON(`${base}/questions.json`),
    ]);

    const bundle = {
      meta,
      questions: extractQuestionArray(questionData).map(normalizeQuestion),
    };
    cache[cacheKey] = bundle;
    return bundle;
  }

  function clearCache() {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }

  return { loadChapter, clearCache };
})();
