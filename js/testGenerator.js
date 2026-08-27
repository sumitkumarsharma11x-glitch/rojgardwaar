/**
 * TestGenerator
 * -----------------------------------------------------------------------
 * Turns a (large, growing) question bank into concrete test question
 * sets. "Multiple Mock Tests" are DERIVED, not hardcoded: given the
 * chapter's unique question bank + meta.mockQuestionCount, this module
 * computes exactly how many complete Mock Tests exist and which
 * questions belong to each — with NO overlap between Mock Tests and NO
 * incomplete Mock Tests ever created.
 *
 * SINGLE SOURCE OF TRUTH: buildMockPlan() is the only place mock count /
 * mock size / mock membership is decided. Chapter landing page and
 * testSession both call getConfigs()/getConfig()/generateFromConfig() —
 * neither computes mock count on its own.
 *
 * Mock membership is made deterministic by sorting the unique bank by
 * question ID and slicing in fixed order — so calling this with the
 * same bank + same meta always yields the same Mock 1 / Mock 2 / ...
 * membership. StorageManager + TestSession additionally persist this
 * to localStorage so it survives even if the bank/meta later change in
 * a way that would shift the sort order.
 * -----------------------------------------------------------------------
 */
const TestGenerator = (function () {
  /** Below this many unique questions, a chapter is "small" (30/18min). */
  const LARGE_CHAPTER_THRESHOLD = 50;
  const SMALL_CHAPTER_QUESTION_COUNT = 30;
  const LARGE_CHAPTER_QUESTION_COUNT = 50;

  /** Minutes-per-question ratio that satisfies both spec points at once:
   *  30 questions -> 18 minutes, 50 questions -> 30 minutes (both = x0.6). */
  const MINUTES_PER_QUESTION = 0.6;
  const MIN_TIME_LIMIT_MINUTES = 5;

  /**
   * Removes duplicate question IDs from a bank, keeping the first
   * occurrence. Duplicate IDs are never counted as separate unique
   * questions.
   */
  function getUniqueQuestions(bank) {
    if (!Array.isArray(bank)) return [];
    const seenIds = new Set();
    const unique = [];
    bank.forEach((q) => {
      if (!q || !q.id) return;
      if (seenIds.has(q.id)) return;
      seenIds.add(q.id);
      unique.push(q);
    });
    return unique;
  }

  /**
   * Deterministic ordering for partitioning: sort unique questions by
   * ID. This is what makes Mock 1 / Mock 2 / ... membership stable
   * across repeated calls without any storage — the same bank always
   * produces the same slices.
   */
  function sortedUniqueQuestions(bank) {
    return getUniqueQuestions(bank)
      .slice()
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  /**
   * meta.mockQuestionCount is the primary source of truth. Only when it
   * is missing/invalid do we fall back to the bank-size-based default.
   */
  function resolveMockQuestionCount(meta, uniqueCount) {
    const fromMeta = meta && Number(meta.mockQuestionCount);
    if (Number.isFinite(fromMeta) && fromMeta > 0) {
      return fromMeta;
    }
    return uniqueCount >= LARGE_CHAPTER_THRESHOLD
      ? LARGE_CHAPTER_QUESTION_COUNT
      : SMALL_CHAPTER_QUESTION_COUNT;
  }

  function timeLimitMinutesFor(mockQuestionCount) {
    return Math.max(
      MIN_TIME_LIMIT_MINUTES,
      Math.round(mockQuestionCount * MINUTES_PER_QUESTION)
    );
  }

  /**
   * Core planning function — the single source of truth for:
   *   - how many complete Mock Tests exist (Math.floor(unique/mockQuestionCount))
   *   - how many questions each Mock has (meta.mockQuestionCount, with fallback)
   *   - the timer for each Mock
   *   - exactly which questions belong to which Mock (no overlap, no duplicates)
   *
   * Incomplete Mocks are never created: any leftover questions that
   * don't fill a full Mock are simply not assigned to any Mock this
   * pass.
   */
  function buildMockPlan(bank, meta) {
    const unique = sortedUniqueQuestions(bank);
    const mockQuestionCount = resolveMockQuestionCount(meta, unique.length);
    const mockCount = Math.floor(unique.length / mockQuestionCount);
    const timeLimitMin = timeLimitMinutesFor(mockQuestionCount);

    const configs = [];
    const sets = [];

    for (let i = 0; i < mockCount; i++) {
      const id = `mock-${i + 1}`;
      const slice = unique.slice(i * mockQuestionCount, (i + 1) * mockQuestionCount);
      configs.push({
        id,
        label: { hi: `मॉक टेस्ट ${i + 1}`, en: `Mock Test ${i + 1}` },
        questionCount: mockQuestionCount,
        timeLimitMin,
      });
      sets.push({ id, questions: slice });
    }

    return {
      uniqueCount: unique.length,
      mockQuestionCount,
      mockCount,
      timeLimitMin,
      configs,
      sets,
    };
  }

  /**
   * Returns the dynamic list of Mock Test configs for this chapter.
   * `bank` and `meta` are REQUIRED to compute this correctly. Called
   * without a valid bank, this safely returns an empty list rather than
   * throwing.
   */
  function getConfigs(bank, meta) {
    return buildMockPlan(bank, meta).configs;
  }

  /** Same idea as getConfigs, but for a single testId (e.g. "mock-3"). */
  function getConfig(testId, bank, meta) {
    const configs = getConfigs(bank, meta);
    return configs.find((c) => c.id === testId) || null;
  }

  /**
   * Builds the actual question set + shuffled options for one Mock
   * Test config. Question MEMBERSHIP for this mock comes from the
   * deterministic partition (buildMockPlan) — never randomly re-picked
   * per call. Only the ORDER of questions within the mock and each
   * question's OPTION order are randomized (via the existing
   * Randomizer, unchanged).
   *
   * `seenIds` is accepted for backward API compatibility with existing
   * callers but no longer perturbs which questions belong to a Mock —
   * membership must stay fixed. `meta` is an added optional 4th
   * argument; existing 3-argument calls keep working (they'll fall back
   * to the bank-size-based default question count).
   */
  function generateFromConfig(bank, config, seenIds = [], meta = null) {
    if (!config) {
      return {
        questions: [],
        adjusted: true,
        timeLimitSeconds: MIN_TIME_LIMIT_MINUTES * 60,
        configId: null,
        label: { hi: "", en: "" },
      };
    }

    const plan = buildMockPlan(bank, meta);
    const matchedSet = plan.sets.find((s) => s.id === config.id);
    const selected = matchedSet ? matchedSet.questions : [];

    // Never pad with fake/duplicate questions — if the slice is short,
    // the test is honestly marked "adjusted" instead.
    const adjusted = selected.length < config.questionCount;

    const finalOrder = Randomizer.shuffle(selected);
    const withShuffledOptions = finalOrder.map(Randomizer.shuffleQuestionOptions);

    return {
      questions: withShuffledOptions,
      adjusted,
      timeLimitSeconds: (config.timeLimitMin || plan.timeLimitMin) * 60,
      configId: config.id,
      label: config.label,
    };
  }

  /** Wrong-Questions Test: pull specific IDs from the bank, fully re-shuffled. Unchanged. */
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

  /** Topic Test: filter bank by a topic id, then behave like a mini mock test. Unchanged. */
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

  /** Revision Test: previously-attempted questions, re-shuffled, untimed-friendly length. Unchanged. */
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
