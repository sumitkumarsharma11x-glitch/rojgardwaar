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
      questions: questionData.questions || [],
    };
    cache[cacheKey] = bundle;
    return bundle;
  }

  function clearCache() {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }

  return { loadChapter, clearCache };
})();
