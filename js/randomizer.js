/**
 * Randomizer
 * -----------------------------------------------------------------------
 * Pure functions for shuffling. No state, no side effects — easy to unit
 * test and easy to reuse for Class 7-10 / Railway content later.
 * -----------------------------------------------------------------------
 */
const Randomizer = (function () {
  /** Fisher-Yates shuffle. Returns a NEW array; does not mutate input. */
  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Shuffles a single question's options (both language arrays, kept in
   * sync) and remaps correctAnswer to the new index. Returns a new
   * question object; does not mutate the original bank entry.
   */
  function shuffleQuestionOptions(question) {
    const order = shuffle([0, 1, 2, 3].slice(0, question.options.hi.length));
    const newCorrectIndex = order.indexOf(question.correctAnswer);

    const remap = (arr) => order.map((i) => arr[i]);

    return {
      ...question,
      options: {
        hi: remap(question.options.hi),
        en: remap(question.options.en),
      },
      correctAnswer: newCorrectIndex,
    };
  }

  /** Pick `count` random items without replacement from an array. */
  function sample(array, count) {
    return shuffle(array).slice(0, Math.min(count, array.length));
  }

  return { shuffle, shuffleQuestionOptions, sample };
})();
