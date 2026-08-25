/**
 * ResultRenderer
 * -----------------------------------------------------------------------
 * Pure rendering of a ScoreEngine result object into the DOM. Takes
 * callbacks for the action buttons (retake / new test / wrong practice)
 * so it stays decoupled from TestSession's navigation decisions.
 * -----------------------------------------------------------------------
 */
const ResultRenderer = (function () {
  function formatDuration(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}${LanguageManager.getCurrent() === "hi" ? "मि " : "m "}${s}${LanguageManager.getCurrent() === "hi" ? "से" : "s"}`;
  }

  function render(container, result, callbacks) {
    const { summary, review, wrongQuestionIds } = result;

    container.innerHTML = `
      <div class="rjd-result">
        <div class="rjd-result__banner rjd-result__banner--${summary.performanceKey.replace("performance", "").toLowerCase()}">
          <p class="rjd-result__score">${summary.percentage}%</p>
          <p class="rjd-result__performance">${LanguageManager.get(summary.performanceKey)}</p>
        </div>

        <div class="rjd-stat-grid">
          <div class="rjd-stat"><span class="rjd-stat__value">${summary.total}</span><span class="rjd-stat__label">${LanguageManager.get("totalQuestions")}</span></div>
          <div class="rjd-stat"><span class="rjd-stat__value">${summary.attempted}</span><span class="rjd-stat__label">${LanguageManager.get("attempted")}</span></div>
          <div class="rjd-stat rjd-stat--correct"><span class="rjd-stat__value">${summary.correct}</span><span class="rjd-stat__label">${LanguageManager.get("correct")}</span></div>
          <div class="rjd-stat rjd-stat--wrong"><span class="rjd-stat__value">${summary.wrong}</span><span class="rjd-stat__label">${LanguageManager.get("wrong")}</span></div>
          <div class="rjd-stat"><span class="rjd-stat__value">${summary.unattempted}</span><span class="rjd-stat__label">${LanguageManager.get("unattempted")}</span></div>
          <div class="rjd-stat"><span class="rjd-stat__value">${summary.accuracy}%</span><span class="rjd-stat__label">${LanguageManager.get("accuracy")}</span></div>
          <div class="rjd-stat"><span class="rjd-stat__value">${formatDuration(summary.timeTakenSeconds)}</span><span class="rjd-stat__label">${LanguageManager.get("timeTaken")}</span></div>
          <div class="rjd-stat"><span class="rjd-stat__value">${summary.avgTimePerQ}${LanguageManager.getCurrent() === "hi" ? "से" : "s"}</span><span class="rjd-stat__label">${LanguageManager.get("avgTimePerQ")}</span></div>
        </div>

        <div class="rjd-result__actions">
          <button type="button" class="rjd-btn rjd-btn--danger" id="rjd-practice-wrong" ${wrongQuestionIds.length === 0 ? "disabled" : ""}>${LanguageManager.get("practiceWrong")}</button>
          <button type="button" class="rjd-btn rjd-btn--secondary" id="rjd-wrong-test" ${wrongQuestionIds.length === 0 ? "disabled" : ""}>${LanguageManager.get("wrongQuestionsTest")}</button>
          <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-retake">${LanguageManager.get("retakeTest")}</button>
          <button type="button" class="rjd-btn rjd-btn--primary" id="rjd-new-test">${LanguageManager.get("newMockTest")}</button>
        </div>

        <h3 class="rjd-section-title">${LanguageManager.get("reviewAnswers")}</h3>
        <div class="rjd-review-list">
          ${review
            .map(
              (r, i) => `
            <div class="rjd-review-item rjd-review-item--${r.isAttempted ? (r.isCorrect ? "correct" : "wrong") : "unattempted"}">
              <div class="rjd-review-item__head">
                <span class="rjd-review-item__num">${i + 1}</span>
                <span class="rjd-review-item__status">${r.isAttempted ? (r.isCorrect ? "✅" : "❌") : "⬜"} ${LanguageManager.get(r.isAttempted ? (r.isCorrect ? "correct" : "wrong") : "unattempted")}</span>
              </div>
              <p class="rjd-question-text rjd-question-text--sm">${LanguageManager.pick(r.question)}</p>
              <p class="rjd-review-item__answer"><strong>${LanguageManager.get("yourAnswer")}:</strong> ${r.isAttempted ? LanguageManager.pick(r.options)[r.userAnswer] : "—"}</p>
              ${!r.isCorrect ? `<p class="rjd-review-item__answer"><strong>${LanguageManager.get("correctAnswer")}:</strong> ${LanguageManager.pick(r.options)[r.correctAnswer]}</p>` : ""}
              <p class="rjd-review-item__explanation"><strong>${LanguageManager.get("explanation")}:</strong> ${LanguageManager.pick(r.explanation)}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    container.querySelector("#rjd-practice-wrong")?.addEventListener("click", callbacks.onPracticeWrong);
    container.querySelector("#rjd-wrong-test")?.addEventListener("click", callbacks.onWrongTest);
    container.querySelector("#rjd-retake")?.addEventListener("click", callbacks.onRetake);
    container.querySelector("#rjd-new-test")?.addEventListener("click", callbacks.onNewTest);
  }

  return { render };
})();
