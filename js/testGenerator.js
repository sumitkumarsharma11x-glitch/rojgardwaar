/**
 * TestGenerator
 * -----------------------------------------------------------------------
 * Dynamic Mock Test Generator
 *
 * Rules:
 * - meta.mockQuestionCount = 30 -> 30 questions / 18 minutes
 * - meta.mockQuestionCount = 50 -> 50 questions / 30 minutes
 * - Number of mocks is based on available UNIQUE questions.
 * - Never creates a fake 50-question test from a 48-question bank.
 * - Never duplicates a question inside the same test.
 * - Prefers unique questions across different mocks.
 * -----------------------------------------------------------------------
 */

const TestGenerator = (function () {

  const DEFAULT_SMALL_COUNT = 30;
  const DEFAULT_LARGE_COUNT = 50;

  const SMALL_TIME_MIN = 18;
  const LARGE_TIME_MIN = 30;


  // ---------------------------------------------------------------------
  // Determine standard mock size
  // ---------------------------------------------------------------------

  function getQuestionCount(meta, bank) {

    const configured =
      Number(meta && meta.mockQuestionCount);

    if (
      configured === DEFAULT_SMALL_COUNT ||
      configured === DEFAULT_LARGE_COUNT
    ) {
      return configured;
    }

    /*
     * Safe fallback:
     * If metadata does not specify a size,
     * 50 is used only when the bank actually
     * contains at least 50 questions.
     */
    if (bank.length >= DEFAULT_LARGE_COUNT) {
      return DEFAULT_LARGE_COUNT;
    }

    return DEFAULT_SMALL_COUNT;
  }


  // ---------------------------------------------------------------------
  // Time
  // ---------------------------------------------------------------------

  function getTimeLimitMin(questionCount) {

    if (
      questionCount === DEFAULT_LARGE_COUNT
    ) {
      return LARGE_TIME_MIN;
    }

    return SMALL_TIME_MIN;
  }


  function timeLimitSeconds(
    config,
    actualQuestionCount
  ) {

    const count =
      Number(actualQuestionCount) || 0;

    if (count <= 0) {
      return 0;
    }

    /*
     * Normal mock sizes use exact times.
     */
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

    /*
     * Special smaller test:
     * scale proportionally.
     */
    return Math.max(
      5 * 60,
      Math.round(
        config.timeLimitMin *
        (count / config.questionCount) *
        60
      )
    );
  }


  // ---------------------------------------------------------------------
  // Clean Question Bank
  // ---------------------------------------------------------------------

  function cleanBank(bank) {

    if (!Array.isArray(bank)) {
      return [];
    }

    const ids = new Set();

    return bank.filter(function (q) {

      if (
        !q ||
        !q.id ||
        ids.has(q.id)
      ) {
        return false;
      }

      ids.add(q.id);

      return true;
    });
  }


  // ---------------------------------------------------------------------
  // Number of COMPLETE mocks possible
  // ---------------------------------------------------------------------

  function getMockCount(
    bankLength,
    questionCount
  ) {

    if (
      !questionCount ||
      bankLength < questionCount
    ) {
      return 0;
    }

    return Math.floor(
      bankLength / questionCount
    );
  }


  // ---------------------------------------------------------------------
  // Create Dynamic Mock Configs
  // ---------------------------------------------------------------------

  function makeConfigs(
    meta,
    bank
  ) {

    const clean =
      cleanBank(bank);

    const questionCount =
      getQuestionCount(
        meta,
        clean
      );

    const mockCount =
      getMockCount(
        clean.length,
        questionCount
      );

    const timeLimitMin =
      getTimeLimitMin(
        questionCount
      );

    return Array.from(
      {
        length: mockCount
      },
      function (_, index) {

        const number =
          index + 1;

        return {

          id:
            `mock-${number}`,

          label: {
            hi:
              `मॉक टेस्ट ${number}`,

            en:
              `Mock Test ${number}`
          },

          questionCount,

          timeLimitMin
        };
      }
    );
  }


  function getConfigs(
    meta,
    bank
  ) {
    return makeConfigs(
      meta,
      bank
    );
  }


  function getConfig(
    testId,
    meta,
    bank
  ) {

    return makeConfigs(
      meta,
      bank
    ).find(function (config) {

      return (
        config.id === testId
      );

    }) || null;
  }


  // ---------------------------------------------------------------------
  // Build UNIQUE Mock Sets
  // ---------------------------------------------------------------------

  function buildMockSets(
    bank,
    questionCount
  ) {

    const clean =
      cleanBank(bank);

    /*
     * Shuffle ONCE.
     *
     * Then split the bank into chunks.
     *
     * This is important because it guarantees
     * that a question assigned to Mock 1 will
     * not also be assigned to Mock 2, 3, etc.
     */
    const shuffled =
      Randomizer.shuffle(
        clean
      );

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

      const end =
        start + questionCount;

      const questions =
        shuffled.slice(
          start,
          end
        );

      /*
       * Only create a COMPLETE mock.
       *
       * Example:
       * 48 questions / 30
       * = 1 complete mock.
       *
       * We DO NOT create a fake
       * 30-question second mock.
       */
      if (
        questions.length ===
        questionCount
      ) {

        sets.push(
          questions
        );
      }
    }

    return sets;
  }


  // ---------------------------------------------------------------------
  // Generate Mock From Permanent IDs
  // ---------------------------------------------------------------------

  function generateMockFromIds(
    bank,
    ids,
    config
  ) {

    const idSet =
      new Set(ids);

    const clean =
      cleanBank(bank);

    const pool =
      clean.filter(function (q) {

        return idSet.has(q.id);

      });

    const questions =
      Randomizer
        .shuffle(pool)
        .map(
          Randomizer
            .shuffleQuestionOptions
        );

    return {

      questions,

      adjusted:
        questions.length !==
        config.questionCount,

      timeLimitSeconds:
        timeLimitSeconds(
          config,
          questions.length
        ),

      configId:
        config.id,

      label:
        config.label
    };
  }


  // ---------------------------------------------------------------------
  // Legacy / Fresh Generator
  // ---------------------------------------------------------------------

  function generateFromConfig(
    bank,
    config,
    seenIds = []
  ) {

    const clean =
      cleanBank(bank);

    const seen =
      new Set(
        seenIds
      );

    const unseen =
      Randomizer.shuffle(
        clean.filter(function (q) {

          return !seen.has(q.id);

        })
      );

    const alreadySeen =
      Randomizer.shuffle(
        clean.filter(function (q) {

          return seen.has(q.id);

        })
      );

    const ordered =
      unseen.concat(
        alreadySeen
      );

    const picked =
      ordered.slice(
        0,
        Math.min(
          config.questionCount,
          clean.length
        )
      );

    const questions =
      Randomizer
        .shuffle(picked)
        .map(
          Randomizer
            .shuffleQuestionOptions
        );

    return {

      questions,

      adjusted:
        questions.length !==
        config.questionCount,

      timeLimitSeconds:
        timeLimitSeconds(
          config,
          questions.length
        ),

      configId:
        config.id,

      label:
        config.label
    };
  }


  // ---------------------------------------------------------------------
  // Wrong Questions Test
  // ---------------------------------------------------------------------

  function generateFromIds(
    bank,
    ids,
    timeLimitMinutesPerQuestion = 1
  ) {

    const idSet =
      new Set(ids);

    const pool =
      cleanBank(bank)
        .filter(function (q) {

          return idSet.has(q.id);

        });

    const questions =
      Randomizer
        .shuffle(pool)
        .map(
          Randomizer
            .shuffleQuestionOptions
        );

    return {

      questions,

      adjusted:
        questions.length <
        ids.length,

      timeLimitSeconds:
        Math.max(
          300,
          Math.round(
            questions.length *
            timeLimitMinutesPerQuestion *
            60
          )
        ),

      configId:
        "wrong-questions",

      label: {
        hi:
          "गलत प्रश्नों का टेस्ट",

        en:
          "Wrong Questions Test"
      }
    };
  }


  // ---------------------------------------------------------------------
  // Topic Test
  // ---------------------------------------------------------------------

  function generateByTopic(
    bank,
    topicId,
    questionCount = 15,
    timeLimitMin = 15
  ) {

    const pool =
      cleanBank(bank)
        .filter(function (q) {

          return (
            q.topic === topicId
          );

        });

    const count =
      Math.min(
        questionCount,
        pool.length
      );

    const chosen =
      Randomizer
        .sample(
          pool,
          count
        )
        .map(
          Randomizer
            .shuffleQuestionOptions
        );

    return {

      questions:
        chosen,

      adjusted:
        chosen.length <
        questionCount,

      timeLimitSeconds:
        Math.max(
          180,
          Math.round(
            timeLimitMin * 60
          )
        ),

      configId:
        `topic-${topicId}`,

      label: {
        hi:
          "टॉपिक टेस्ट",

        en:
          "Topic Test"
      }
    };
  }


  // ---------------------------------------------------------------------
  // Revision Test
  // ---------------------------------------------------------------------

  function generateRevision(
    bank,
    attemptedIds,
    questionCount = 20
  ) {

    const selected =
      Randomizer.sample(
        attemptedIds,
        questionCount
      );

    return generateFromIds(
      bank,
      selected,
      0.8
    );
  }


  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

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

    generateRevision

  };

})();
