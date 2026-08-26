/**
 * StorageManager
 * -----------------------------------------------------------------------
 * Single point of contact with localStorage.
 *
 * Includes:
 * - language
 * - seen questions
 * - attempted questions
 * - wrong questions
 * - results/history
 * - active sessions
 * - permanent Mock Test question assignments
 * - Abhyas question assignments
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

      if (raw === null) {
        return fallback;
      }

      return JSON.parse(raw);
    } catch (e) {
      console.warn(
        "StorageManager.get failed for",
        k,
        e
      );

      return fallback;
    }
  }

  function set(k, value) {
    try {
      localStorage.setItem(
        k,
        JSON.stringify(value)
      );

      return true;
    } catch (e) {
      console.warn(
        "StorageManager.set failed for",
        k,
        e
      );

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

  // -----------------------------------------------------------------------
  // Language
  // -----------------------------------------------------------------------

  function getLanguage() {
    return get(
      key("lang"),
      "hi"
    );
  }

  function setLanguage(lang) {
    return set(
      key("lang"),
      lang
    );
  }

  // -----------------------------------------------------------------------
  // Chapter key
  // -----------------------------------------------------------------------

  function chapterKey(
    classNum,
    subject,
    chapter
  ) {
    return `${classNum}-${subject}-${chapter}`;
  }

  // -----------------------------------------------------------------------
  // Seen Questions
  // -----------------------------------------------------------------------

  function getSeenQuestionIds(
    classNum,
    subject,
    chapter
  ) {
    return get(
      key(
        "seen",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      []
    );
  }

  function addSeenQuestionIds(
    classNum,
    subject,
    chapter,
    ids
  ) {
    const existing =
      new Set(
        getSeenQuestionIds(
          classNum,
          subject,
          chapter
        )
      );

    ids.forEach((id) => {
      existing.add(id);
    });

    set(
      key(
        "seen",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      Array.from(existing)
    );
  }

  // -----------------------------------------------------------------------
  // Permanent Mock Test Question Sets
  // -----------------------------------------------------------------------

  /**
   * Structure:
   *
   * {
   *   "mock-1": ["Q001", "Q002", ...],
   *   "mock-2": ["Q051", "Q052", ...],
   *   ...
   * }
   *
   * Once generated, these sets remain fixed for that chapter.
   */
  function getMockSets(
    classNum,
    subject,
    chapter
  ) {
    return get(
      key(
        "mockSets",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      null
    );
  }

  function saveMockSets(
    classNum,
    subject,
    chapter,
    sets
  ) {
    return set(
      key(
        "mockSets",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      sets
    );
  }

  function clearMockSets(
    classNum,
    subject,
    chapter
  ) {
    remove(
      key(
        "mockSets",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      )
    );
  }

  function getMockQuestionIds(
    classNum,
    subject,
    chapter,
    testId
  ) {
    const sets =
      getMockSets(
        classNum,
        subject,
        chapter
      );

    if (
      !sets ||
      !sets[testId]
    ) {
      return [];
    }

    return sets[testId];
  }

  function saveMockQuestionIds(
    classNum,
    subject,
    chapter,
    testId,
    ids
  ) {
    const sets =
      getMockSets(
        classNum,
        subject,
        chapter
      ) || {};

    sets[testId] = ids;

    return saveMockSets(
      classNum,
      subject,
      chapter,
      sets
    );
  }

  // -----------------------------------------------------------------------
  // Abhyas Test
  // -----------------------------------------------------------------------

  function getAbhyasQuestionIds(
    classNum,
    subject,
    chapter
  ) {
    return get(
      key(
        "abhyas",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      []
    );
  }

  function saveAbhyasQuestionIds(
    classNum,
    subject,
    chapter,
    ids
  ) {
    return set(
      key(
        "abhyas",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      ids
    );
  }

  // -----------------------------------------------------------------------
  // Wrong Questions
  // -----------------------------------------------------------------------

  function getWrongQuestionIds(
    classNum,
    subject,
    chapter
  ) {
    return get(
      key(
        "wrong",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      []
    );
  }

  function setWrongQuestionIds(
    classNum,
    subject,
    chapter,
    ids
  ) {
    return set(
      key(
        "wrong",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      ids
    );
  }

  function clearWrongQuestionIds(
    classNum,
    subject,
    chapter
  ) {
    remove(
      key(
        "wrong",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      )
    );
  }

  // -----------------------------------------------------------------------
  // Attempted Questions
  // -----------------------------------------------------------------------

  function getAttemptedQuestionIds(
    classNum,
    subject,
    chapter
  ) {
    return get(
      key(
        "attempted",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      []
    );
  }

  function addAttemptedQuestionIds(
    classNum,
    subject,
    chapter,
    ids
  ) {
    const existing =
      new Set(
        getAttemptedQuestionIds(
          classNum,
          subject,
          chapter
        )
      );

    ids.forEach((id) => {
      existing.add(id);
    });

    set(
      key(
        "attempted",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      Array.from(existing)
    );
  }

  // -----------------------------------------------------------------------
  // Results
  // -----------------------------------------------------------------------

  function saveLastResult(
    classNum,
    subject,
    chapter,
    testId,
    result
  ) {
    set(
      key(
        "result",
        chapterKey(
          classNum,
          subject,
          chapter
        ),
        testId
      ),
      result
    );

    const histKey =
      key(
        "history",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      );

    const hist =
      get(
        histKey,
        []
      );

    hist.unshift({
      testId,
      ts: Date.now(),
      summary:
        result.summary,
    });

    set(
      histKey,
      hist.slice(0, 10)
    );
  }

  function getResultHistory(
    classNum,
    subject,
    chapter
  ) {
    return get(
      key(
        "history",
        chapterKey(
          classNum,
          subject,
          chapter
        )
      ),
      []
    );
  }

  // -----------------------------------------------------------------------
  // Active Test Session
  // -----------------------------------------------------------------------

  function saveActiveSession(
    sessionId,
    sessionData
  ) {
    return set(
      key(
        "session",
        sessionId
      ),
      sessionData
    );
  }

  function getActiveSession(
    sessionId
  ) {
    return get(
      key(
        "session",
        sessionId
      ),
      null
    );
  }

  function clearActiveSession(
    sessionId
  ) {
    remove(
      key(
        "session",
        sessionId
      )
    );
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    get,
    set,
    remove,

    getLanguage,
    setLanguage,

    getSeenQuestionIds,
    addSeenQuestionIds,

    getMockSets,
    saveMockSets,
    clearMockSets,

    getMockQuestionIds,
    saveMockQuestionIds,

    getAbhyasQuestionIds,
    saveAbhyasQuestionIds,

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
