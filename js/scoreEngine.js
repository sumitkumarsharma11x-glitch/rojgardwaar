/**
 * ScoreEngine
 * -----------------------------------------------------------------------
 * Pure calculation: takes the question set + the student's answers and
 * returns a structured result object. No DOM, no storage — ResultRenderer
 * and StorageManager consume its output.
 * -----------------------------------------------------------------------
 */
const ScoreEngine = (function () {
  /**
   * @param {Array} questions - the generated (shuffled) question set
   * @param {Object} answers - map of questionId -> selectedOptionIndex
   * @param {number} timeTakenSeconds
   */
  function calculate(questions, answers, timeTakenSeconds) {
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    const wrongQuestionIds = [];
    const topicStats = {};
    const review = [];

    questions.forEach((q) => {
      const userAnswer = Object.prototype.hasOwnProperty.call(answers, q.id) ? answers[q.id] : null;
      const isAttempted = userAnswer !== null && userAnswer !== undefined;
      const isCorrect = isAttempted && userAnswer === q.correctAnswer;

      if (!isAttempted) {
        unattempted++;
      } else if (isCorrect) {
        correct++;
      } else {
        wrong++;
        wrongQuestionIds.push(q.id);
      }

      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { total: 0, correct: 0 };
      }
      topicStats[q.topic].total++;
      if (isCorrect) topicStats[q.topic].correct++;

      review.push({
        id: q.id,
        question: q.question,
        options: q.options,
        userAnswer: isAttempted ? userAnswer : null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        isAttempted,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
      });
    });

    const total = questions.length;
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTimePerQ = total > 0 ? Math.round(timeTakenSeconds / total) : 0;

    const topicWise = Object.keys(topicStats).map((topic) => ({
      topic,
      total: topicStats[topic].total,
      correct: topicStats[topic].correct,
      accuracy: Math.round((topicStats[topic].correct / topicStats[topic].total) * 100),
    }));

    let performanceKey = "performanceWeak";
    if (percentage >= 85) performanceKey = "performanceGreat";
    else if (percentage >= 65) performanceKey = "performanceGood";
    else if (percentage >= 40) performanceKey = "performanceAverage";

    return {
      summary: {
        total,
        attempted,
        correct,
        wrong,
        unattempted,
        percentage,
        accuracy,
        timeTakenSeconds,
        avgTimePerQ,
        performanceKey,
      },
      topicWise,
      wrongQuestionIds,
      review,
    };
  }

  return { calculate };
})();
