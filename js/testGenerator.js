/**
 * TestGenerator
 * -----------------------------------------------------------------------
 * Turns a (large, growing) question bank into concrete test question
 * sets. "Multiple Mock Tests" = multiple TestConfig entries pointing at
 * the SAME bank — adding Mock Test 6 later means adding one config
 * object, not new data or new code.
 *
 * Designed for 100-200+ questions/chapter; today's smaller prototype
 * bank (48 Qs) just means the graceful-degrade path runs more often.
 * -----------------------------------------------------------------------
 */
const TestGenerator = (function () {
  /**
   * Pre-defined test configurations for a chapter. In a bigger bank
   * (100-200+ Qs) these ratios comfortably map to real, mostly-unique
   * 50-question tests. Nothing here is chapter-specific — the same
   * registry shape works for any chapter/class once wired to its bank.
   */
  const TEST_CONFIGS = [
    { id: "mock-1", label: { hi: "मॉक टेस्ट 1", en: "Mock Test 1" }, questionCount: 50, timeLimitMin: 40, difficultyMix: { easy: 0.3, medium: 0.5, hard: 0.2 } },
    { id: "mock-2", label: { hi: "मॉक टेस्ट 2", en: "Mock Test 2" }, questionCount: 50, timeLimitMin: 40, difficultyMix: { easy: 0.3, medium: 0.5, hard: 0.2 } },
    { id: "mock-3", label: { hi: "मॉक टेस्ट 3", en: "Mock Test 3" }, questionCount: 50, timeLimitMin: 40, difficultyMix: { easy: 0.2, medium: 0.5, hard: 0.3 } },
    { id: "mock-4", label: { hi: "मॉक टेस्ट 4", en: "Mock Test 4" }, questionCount: 50, timeLimitMin: 40, difficultyMix: { easy: 0.4, medium: 0.4, hard: 0.2 } },
    { id: "mock-5", label: { hi: "मॉक टेस्ट 5", en: "Mock Test 5" }, questionCount: 50, timeLimitMin: 40, difficultyMix: { easy: 0.2, medium: 0.4, hard: 0.4 } },
  ];

  function getConfigs() {
    return TEST_CONFIGS;
  }

  function getConfig(testId) {
    return TEST_CONFIGS.find((c) => c.id === testId) || null;
  }

  /** Minutes -> seconds helper used by Timer. */
  function timeLimitSeconds(config, actualQuestionCount) {
    // Scale timer proportionally if the pool forced fewer questions,
    // so a 20-question adjusted test doesn't get a 40-minute clock.
    const ratio = actualQuestionCount / config.questionCount;
    const minutes = Math.max(5, Math.round(config.timeLimitMin * ratio));
    return minutes * 60;
  }

  /**
   * Core selection pipeline:
   * 1. Filter by difficulty buckets per config ratio
   * 2. Prefer unseen questions within each bucket (soft-avoid repeats)
   * 3. Shuffle + slice each bucket, merge, shuffle again
   * 4. Shuffle each question's options
   * Gracefully shrinks question count if the bank is too small —
   * NEVER throws, NEVER shows a blank test.
   */
  function generateFromConfig(bank, config, seenIds = []) {
    const seenSet = new Set(seenIds);
    const byDifficulty = { easy: [], medium: [], hard: [] };
    bank.forEach((q) => {
      if (byDifficulty[q.difficulty]) byDifficulty[q.difficulty].push(q);
    });

    const targetTotal = Math.min(config.questionCount, bank.length);
    let adjusted = targetTotal < config.questionCount;

    const picked = [];
    const pickedIds = new Set();

    Object.keys(config.difficultyMix).forEach((level) => {
      const wantCount = Math.round(targetTotal * config.difficultyMix[level]);
      const pool = byDifficulty[level] || [];
      const unseen = pool.filter((q) => !seenSet.has(q.id));
      const seen = pool.filter((q) => seenSet.has(q.id));
      // Prefer unseen first, top up with seen if the pool is small
      const orderedPool = Randomizer.shuffle(unseen).concat(Randomizer.shuffle(seen));
      const chosen = orderedPool.slice(0, wantCount);
      chosen.forEach((q) => {
        if (!pickedIds.has(q.id)) {
          picked.push(q);
          pickedIds.add(q.id);
        }
      });
    });

    // If difficulty buckets under-filled (small bank), top up from
    // whatever remains in the whole bank so the test still reaches
    // as close to targetTotal as the bank allows.
    if (picked.length < targetTotal) {
      const remaining = bank.filter((q) => !pickedIds.has(q.id));
      const shuffledRemaining = Randomizer.shuffle(remaining);
      for (const q of shuffledRemaining) {
        if (picked.length >= targetTotal) break;
        picked.push(q);
        pickedIds.add(q.id);
      }
    }

    if (picked.length < config.questionCount) adjusted = true;

    const finalOrder = Randomizer.shuffle(picked);
    const withShuffledOptions = finalOrder.map(Randomizer.shuffleQuestionOptions);

    return {
      questions: withShuffledOptions,
      adjusted,
      timeLimitSeconds: timeLimitSeconds(config, withShuffledOptions.length),
      configId: config.id,
      label: config.label,
    };
  }

  /** Wrong-Questions Test: pull specific IDs from the bank, fully re-shuffled. */
  function generateFromIds(bank, ids, timeLimitMinutesPerQuestion = 1) {
    const idSet = new Set(ids);
    const pool = bank.filter((q) => idSet.has(q.id));
    const shuffled = Randomizer.shuffle(pool).map(Randomizer.shuffleQuestionOptions);
    return {
      questions: shuffled,
      adjusted: shuffled.length < ids.length,
      timeLimitSeconds: Math.max(300, Math.round(shuffled.length * timeLimitMinutesPerQuestion * 60)),
      configId: "wrong-questions",
      label: { hi: "गलत प्रश्नों का टेस्ट", en: "Wrong Questions Test" },
    };
  }

  /** Topic Test: filter bank by a topic id, then behave like a mini mock test. */
  function generateByTopic(bank, topicId, questionCount = 15, timeLimitMin = 15) {
    const pool = bank.filter((q) => q.topic === topicId);
    const count = Math.min(questionCount, pool.length);
    const chosen = Randomizer.sample(pool, count).map(Randomizer.shuffleQuestionOptions);
    return {
      questions: chosen,
      adjusted: chosen.length < questionCount,
      timeLimitSeconds: Math.max(180, count * 60),
      configId: `topic-${topicId}`,
      label: { hi: "टॉपिक टेस्ट", en: "Topic Test" },
    };
  }

  /** Revision Test: previously-attempted questions, re-shuffled, untimed-friendly length. */
  function generateRevision(bank, attemptedIds, questionCount = 20) {
    return generateFromIds(bank, Randomizer.sample(attemptedIds, questionCount), 0.8);
  }

  return {
    getConfigs,
    getConfig,
    generateFromConfig,
    generateFromIds,
    generateByTopic,
    generateRevision,
  };
})();
