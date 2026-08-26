function ensureMockAssignments() {
  const questionCount =
    TestGenerator.getQuestionCount(
      meta,
      bank
    );

  const expectedMockCount =
    TestGenerator.getMockCount(
      bank.length,
      questionCount
    );

  if (
    expectedMockCount <= 0
  ) {
    StorageManager.clearMockSets(
      classNum,
      subject,
      chapter
    );

    return {};
  }

  const existing =
    StorageManager.getMockSets(
      classNum,
      subject,
      chapter
    );

  /*
   * Validate old assignments very strictly.
   *
   * Old assignments must:
   * 1. Have exactly the expected number of mocks.
   * 2. Each mock must have exactly questionCount questions.
   * 3. Every question must still exist in the current bank.
   * 4. No question may appear in two different mocks.
   */

  if (
    existing &&
    typeof existing === "object"
  ) {
    const keys =
      Object.keys(existing);

    const bankIds =
      new Set(
        bank.map(
          (q) => q.id
        )
      );

    const usedIds =
      new Set();

    let valid = true;

    if (
      keys.length !==
      expectedMockCount
    ) {
      valid = false;
    }

    if (valid) {
      for (const id of keys) {
        const ids =
          existing[id];

        if (
          !Array.isArray(ids) ||
          ids.length !==
            questionCount
        ) {
          valid = false;
          break;
        }

        for (const questionId of ids) {

          /*
           * Question no longer exists.
           */
          if (
            !bankIds.has(
              questionId
            )
          ) {
            valid = false;
            break;
          }

          /*
           * Duplicate across mocks.
           */
          if (
            usedIds.has(
              questionId
            )
          ) {
            valid = false;
            break;
          }

          usedIds.add(
            questionId
          );
        }

        if (!valid) {
          break;
        }
      }
    }

    if (valid) {
      return existing;
    }
  }

  /*
   * Old data is invalid.
   * Delete it and create completely new
   * non-overlapping assignments.
   */

  StorageManager.clearMockSets(
    classNum,
    subject,
    chapter
  );

  const sets =
    TestGenerator.buildMockSets(
      bank,
      questionCount
    );

  const mapped = {};

  sets.forEach(
    (questions, index) => {

      mapped[
        `mock-${index + 1}`
      ] =
        questions.map(
          (q) => q.id
        );
    }
  );

  StorageManager.saveMockSets(
    classNum,
    subject,
    chapter,
    mapped
  );

  return mapped;
}
