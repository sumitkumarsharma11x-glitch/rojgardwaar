/**
 * TestGenerator
 * -----------------------------------------------------------------------
 * Generates chapter mock tests with fixed-size, non-overlapping question
 * sets whenever the bank contains enough questions.
 *
 * Chapter size is controlled by meta.mockQuestionCount:
 *   30 => 30 questions / 18 minutes
 *   50 => 50 questions / 30 minutes
 *
 * Mock count is dynamic:
 *   floor(questionBank.length / mockQuestionCount)
 *
 * Example:
 *   350 questions / 50 => 7 mocks
 *   500 questions / 50 => 10 mocks
 *   700 questions / 50 => 14 mocks
 *
 * Question sets are persisted by TestSession/StorageManager so opening
 * Mock 4 directly still gives Mock 4's assigned set.
 * -----------------------------------------------------------------------
 */
const TestGenerator = (function () {
  const DEFAULT_QUESTION_COUNT = 30;
  const DEFAULT_TIME_MIN = 18;

  function getQuestionCount(meta, bank) {
    const configured = Number(meta && meta.mockQuestionCount);

    if (configured === 50) return 50;
    if (configured === 30) return 30;

    // Safe fallback for older meta files.
    return bank.length >= 50 ? 50 : DEFAULT_QUESTION_COUNT;
  }

  function getTimeLimitMin(questionCount) {
    return questionCount === 50 ? 30 : DEFAULT_TIME_MIN;
  }

  function getMockCount(bankLength, questionCount) {
    if (!questionCount || bankLength < questionCount) return 0;

    return Math.floor(bankLength / questionCount);
  }

  function makeConfigs(meta, bank) {
    const questionCount = getQuestionCount(meta, bank);
    const timeLimitMin = getTimeLimitMin(questionCount);
    const mockCount = getMockCount(
      bank.length,
      questionCount
    );

    return Array.from(
      { length: mockCount },
      (_, index) => ({
        id: `mock-${index + 1}`,

        label: {
          hi: `मॉक टेस्ट ${index + 1}`,
          en: `Mock Test ${index + 1}`,
        },

        questionCount,
        timeLimitMin,
      })
    );
  }

  function getConfig(testId, meta, bank) {
    return makeConfigs(meta, bank).find(
      (c) => c.id === testId
    ) || null;
  }

  function getConfigs(meta, bank) {
    return makeConfigs(meta, bank);
  }

  function timeLimitSeconds(
    config,
    actualQuestionCount
  ) {
    const count = Number(actualQuestionCount) || 0;

    if (count <= 0) return 0;

    // Exact standard times for normal mock sizes.
    if (
      config.questionCount === 50 &&
      count === 50
    ) {
      return 30 * 60;
    }

    if (
      config.questionCount === 30 &&
      count === 30
    ) {
      return 18 * 60;
    }

    // Only used for special/remainder practice cases.
    return Math.max(
      5 * 60,
      Math.round(
        config.timeLimitMin *
        (count / config.questionCount) *
        60
      )
    );
  }

  function validateBank(bank) {
    const seen = new Set();

    return (
      Array.isArray(bank) ? bank : []
    ).filter((q) => {
      if (!q || !q.id || seen.has(q.id)) {
        return false;
      }

      seen.add(q.id);
      return true;
    });
  }

  /**
   * Creates a deterministic non-overlapping pool of mock sets
   * from the chapter bank.
   */
  function buildMockSets(
    bank,
    questionCount
  ) {
    const cleanBank = validateBank(bank);

    const shuffled =
      Randomizer.shuffle(cleanBank);

    const mockCount =
      getMockCount(
        shuffled.length,
        questionCount
      );

    const sets = [];

    for (
      let i = 0;
      i < mockCount;
      i++
    ) {
      const start =
        i * questionCount;

      const set =
        shuffled.slice(
          start,
          start + questionCount
        );

      if (
        set.length === questionCount
      ) {
        sets.push(set);
      }
    }

    return sets;
  }

  /**
   * Generate a test from exact question IDs.
   */
  function generateFromIds(
    bank,
    ids,
    timeLimitMinutesPerQuestion = 1
  ) {
    const idSet = new Set(ids);

    const pool =
      validateBank(bank).filter(
        (q) => idSet.has(q.id)
      );

    const shuffled =
      Randomizer
        .shuffle(pool)
        .map(
          Randomizer.shuffleQuestionOptions
        );

    return {
      questions: shuffled,

      adjusted:
        shuffled.length < ids.length,

      timeLimitSeconds:
        Math.max(
          300,
          Math.round(
            shuffled.length *
            timeLimitMinutesPerQuestion *
            60
          )
        ),

      configId: "wrong-questions",

      label: {
        hi: "गलत प्रश्नों का टेस्ट",
        en: "Wrong Questions Test",
      },
    };
  }

  /**
   * Generate a normal Mock Test from its permanent
   * assigned question IDs.
   *
   * IMPORTANT:
   * It does NOT replace missing IDs with random questions.
   */
  function generateMockFromIds(
    bank,
    ids,
    config
  ) {
    const idSet = new Set(ids);

    const pool =
      validateBank(bank).filter(
        (q) => idSet.has(q.id)
      );

    const questions =
      Randomizer
        .shuffle(pool)
        .map(
          Randomizer.shuffleQuestionOptions
        );

    const expected =
      config.questionCount;

    const adjusted =
      questions.length !== expected;

    return {
      questions,

      adjusted,

      timeLimitSeconds:
        timeLimitSeconds(
          config,
          questions.length
        ),

      configId: config.id,

      label: config.label,
    };
  }

  /**
   * Legacy-compatible generator.
   *
   * Used only when a caller explicitly asks for
   * a fresh config.
   */
  function generateFromConfig(
    bank,
    config,
    seenIds = []
  ) {
    const cleanBank =
      validateBank(bank);

    const targetTotal =
      Math.min(
        config.questionCount,
        cleanBank.length
      );

    const seenSet =
      new Set(seenIds);

    const unseen =
      Randomizer.shuffle(
        cleanBank.filter(
          (q) => !seenSet.has(q.id)
        )
      );

    const seen =
      Randomizer.shuffle(
        cleanBank.filter(
          (q) => seenSet.has(q.id)
        )
      );

    const ordered =
      unseen.concat(seen);

    const picked =
      ordered.slice(
        0,
        targetTotal
      );

    const finalOrder =
      Randomizer
        .shuffle(picked)
        .map(
          Randomizer.shuffleQuestionOptions
        );

    return {
      questions: finalOrder,

      adjusted:
        finalOrder.length <
        config.questionCount,

      timeLimitSeconds:
        timeLimitSeconds(
          config,
          finalOrder.length
        ),

      configId: config.id,

      label: config.label,
    };
  }

  /**
   * Topic Test
   */
  function generateByTopic(
    bank,
    topicId,
    questionCount = 15
  ) {
    const pool =
      validateBank(bank).filter(
        (q) => q.topic === topicId
      );

    const count =
      Math.min(
        questionCount,
        pool.length
      );

    const chosen =
      Randomizer
        .sample(pool, count)
        .map(
          Randomizer.shuffleQuestionOptions
        );

    return {
      questions: chosen,

      adjusted:
        chosen.length <
        questionCount,

      timeLimitSeconds:
        Math.max(
          180,
          count * 60
        ),

      configId:
        `topic-${topicId}`,

      label: {
        hi: "टॉपिक टेस्ट",
        en: "Topic Test",
      },
    };
  }

  /**
   * Revision Test
   */
  function generateRevision(
    bank,
    attemptedIds,
    questionCount = 20
  ) {
    return generateFromIds(
      bank,
      Randomizer.sample(
        attemptedIds,
        questionCount
      ),
      0.8
    );
  }

  return {
    getQuestionCount,
    getTimeLimitMin,
    getMockCount,

    makeConfigs,
    getConfigs,
    getConfig,

    buildMockSets,
    generateMockFromIds,

    generateFromConfig,
    generateFromIds,

    generateByTopic,
    generateRevision,
  };
})();
