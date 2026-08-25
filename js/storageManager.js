/**
 * StorageManager
 * -----------------------------------------------------------------------
 * Single point of contact with localStorage. Every other module reads/
 * writes state through here — NEVER call localStorage directly elsewhere.
 * This is deliberate: when we migrate to Firebase later, only this file
 * needs to change (same method names, async-wrapped), nothing else in
 * the app has to be touched.
 *
 * Key namespace: "rjd:<scope>:<id>"  (rjd = RojgarDwaar)
 * -----------------------------------------------------------------------
 */
const StorageManager = (function () {
  const PREFIX = "rjd";

  function key(...parts) {
    return [PREFIX, ...parts].join(":");
  }

  function get(k, fallback = null) {
    try {
      const raw = localStorage.getItem(k);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("StorageManager.get failed for", k, e);
      return fallback;
    }
  }

  function set(k, value) {
    try {
      localStorage.setItem(k, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("StorageManager.set failed for", k, e);
      return false;
    }
  }

  function remove(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {
      /* ignore */
    }
  }

  // ---- Domain-specific convenience helpers -------------------------------

  function getLanguage() {
    return get(key("lang"), "hi");
  }

  function setLanguage(lang) {
    return set(key("lang"), lang);
  }

  function chapterKey(classNum, subject, chapter) {
    return `${classNum}-${subject}-${chapter}`;
  }

  function getSeenQuestionIds(classNum, subject, chapter) {
    return get(key("seen", chapterKey(classNum, subject, chapter)), []);
  }

  function addSeenQuestionIds(classNum, subject, chapter, ids) {
    const existing = new Set(getSeenQuestionIds(classNum, subject, chapter));
    ids.forEach((id) => existing.add(id));
    set(key("seen", chapterKey(classNum, subject, chapter)), Array.from(existing));
  }

  function getWrongQuestionIds(classNum, subject, chapter) {
    return get(key("wrong", chapterKey(classNum, subject, chapter)), []);
  }

  function setWrongQuestionIds(classNum, subject, chapter, ids) {
    set(key("wrong", chapterKey(classNum, subject, chapter)), ids);
  }

  function clearWrongQuestionIds(classNum, subject, chapter) {
    remove(key("wrong", chapterKey(classNum, subject, chapter)));
  }

  function getAttemptedQuestionIds(classNum, subject, chapter) {
    return get(key("attempted", chapterKey(classNum, subject, chapter)), []);
  }

  function addAttemptedQuestionIds(classNum, subject, chapter, ids) {
    const existing = new Set(getAttemptedQuestionIds(classNum, subject, chapter));
    ids.forEach((id) => existing.add(id));
    set(key("attempted", chapterKey(classNum, subject, chapter)), Array.from(existing));
  }

  function saveLastResult(classNum, subject, chapter, testId, result) {
    set(key("result", chapterKey(classNum, subject, chapter), testId), result);
    // also push into a small history list (last 10)
    const histKey = key("history", chapterKey(classNum, subject, chapter));
    const hist = get(histKey, []);
    hist.unshift({ testId, ts: Date.now(), summary: result.summary });
    set(histKey, hist.slice(0, 10));
  }

  function getResultHistory(classNum, subject, chapter) {
    return get(key("history", chapterKey(classNum, subject, chapter)), []);
  }

  // In-progress test session (so a refresh doesn't wipe an active attempt)
  function saveActiveSession(sessionId, sessionData) {
    set(key("session", sessionId), sessionData);
  }

  function getActiveSession(sessionId) {
    return get(key("session", sessionId), null);
  }

  function clearActiveSession(sessionId) {
    remove(key("session", sessionId));
  }

  return {
    get,
    set,
    remove,
    getLanguage,
    setLanguage,
    getSeenQuestionIds,
    addSeenQuestionIds,
    getWrongQuestionIds,
    setWrongQuestionIds,
    clearWrongQuestionIds,
    getAttemptedQuestionIds,
    addAttemptedQuestionIds,
    saveLastResult,
    getResultHistory,
    saveActiveSession,
    getActiveSession,
    clearActiveSession,
  };
})();
