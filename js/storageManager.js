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
 *
 * PERMANENT MOCK TEST ASSIGNMENTS:
 * Once a chapter's Mock Tests are generated (which question IDs belong
 * to Mock 1, Mock 2, ...), that membership is saved here and reused
 * forever — TestSession never re-picks which questions belong to a
 * Mock. Validating whether a saved assignment is still usable lives in
 * testSession.js (it needs TestGenerator + the current bank to decide
 * that); StorageManager just stores/retrieves, same as everything else
 * in this file.
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

  // ---- Permanent Mock Test assignments -----------------------------------
  //
  // Shape stored per chapter:
  // {
  //   mockQuestionCount: 30,
  //   mockCount: 1,
  //   savedAt: <timestamp>,
  //   sets: {
  //     "mock-1": ["SCI6-CH01-Q001", "SCI6-CH01-Q002", ... ],
  //     "mock-2": [...]
  //   }
  // }

  function getMockSets(classNum, subject, chapter) {
    return get(key("mocksets", chapterKey(classNum, subject, chapter)), null);
  }

  function saveMockSets(classNum, subject, chapter, mockSetsData) {
    set(key("mocksets", chapterKey(classNum, subject, chapter)), mockSetsData);
  }

  function clearMockSets(classNum, subject, chapter) {
    remove(key("mocksets", chapterKey(classNum, subject, chapter)));
  }

  /** IDs assigned to one specific Mock (e.g. "mock-1"), or null if not assigned yet. */
  function getMockQuestionIds(classNum, subject, chapter, testId) {
    const data = getMockSets(classNum, subject, chapter);
    if (!data || !data.sets || !Array.isArray(data.sets[testId])) return null;
    return data.sets[testId];
  }

  /** Updates just one Mock's ID list within the chapter's overall mock-sets record. */
  function saveMockQuestionIds(classNum, subject, chapter, testId, ids) {
    const existing = getMockSets(classNum, subject, chapter) || { sets: {} };
    const next = { ...existing, sets: { ...(existing.sets || {}), [testId]: ids } };
    saveMockSets(classNum, subject, chapter, next);
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
    getMockSets,
    saveMockSets,
    clearMockSets,
    getMockQuestionIds,
    saveMockQuestionIds,
  };
})();
