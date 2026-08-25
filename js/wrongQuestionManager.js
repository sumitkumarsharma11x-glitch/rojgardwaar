/**
 * WrongQuestionManager
 * -----------------------------------------------------------------------
 * Everything related to "questions the student got wrong" lives here:
 * reading/writing the list, and building the navigation link that opens
 * them elsewhere (practice widget or a timed Wrong Questions Test).
 * -----------------------------------------------------------------------
 */
const WrongQuestionManager = (function () {
  function record(classNum, subject, chapter, wrongIds) {
    // A fresh test result REPLACES the wrong list for that chapter with
    // this attempt's mistakes (most-recent-attempt view). Practice mode
    // clears an id once the student answers it correctly there.
    StorageManager.setWrongQuestionIds(classNum, subject, chapter, wrongIds);
  }

  function getIds(classNum, subject, chapter) {
    return StorageManager.getWrongQuestionIds(classNum, subject, chapter);
  }

  function removeId(classNum, subject, chapter, id) {
    const ids = getIds(classNum, subject, chapter).filter((x) => x !== id);
    StorageManager.setWrongQuestionIds(classNum, subject, chapter, ids);
  }

  function practiceUrl(classNum, subject, chapter) {
    return `index.html?class=${classNum}&subject=${subject}&chapter=${chapter}&open=practice-wrong#practice`;
  }

  function timedTestUrl(classNum, subject, chapter) {
    return `mock-test.html?class=${classNum}&subject=${subject}&chapter=${chapter}&mode=wrong`;
  }

  return { record, getIds, removeId, practiceUrl, timedTestUrl };
})();
