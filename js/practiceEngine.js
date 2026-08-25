/**
 * PracticeEngine
 * -----------------------------------------------------------------------
 * Untimed, one-question-at-a-time practice flow with instant
 * correct/wrong feedback + explanation. Reused for both the chapter's
 * "Practice Questions" widget AND "Practice My Wrong Questions".
 * -----------------------------------------------------------------------
 */
function createPracticeSession(container, questions, opts = {}) {
  let index = 0;
  let selected = null;
  let checked = false;
  const correctCount = { value: 0 };

  function optionLetter(i) {
    return String.fromCharCode(65 + i); // A, B, C, D
  }

  function render() {
    const q = questions[index];
    if (!q) {
      renderEmpty();
      return;
    }
    const qText = LanguageManager.pick(q.question);
    const options = LanguageManager.pick(q.options.hi ? q.options : q.options); // options is {hi,en}
    const optList = q.options[LanguageManager.getCurrent()] || q.options.hi;

    container.innerHTML = `
      <div class="rjd-practice-card">
        <div class="rjd-practice-card__meta">
          <span class="rjd-eyebrow">${LanguageManager.get("practice")} · ${index + 1}/${questions.length}</span>
          ${UIManager.difficultyBadge(q.difficulty)}
        </div>
        <h3 class="rjd-question-text">${qText}</h3>
        <div class="rjd-options" role="listbox">
          ${optList
            .map(
              (opt, i) => `
            <button type="button" class="rjd-option" data-index="${i}">
              <span class="rjd-option__letter">${optionLetter(i)}</span>
              <span class="rjd-option__text">${opt}</span>
            </button>
          `
            )
            .join("")}
        </div>
        <div class="rjd-feedback" id="rjd-feedback" hidden></div>
        <div class="rjd-practice-card__actions">
          <button type="button" class="rjd-btn rjd-btn--ghost" id="rjd-prev" ${index === 0 ? "disabled" : ""}>${LanguageManager.get("previous")}</button>
          <button type="button" class="rjd-btn rjd-btn--primary" id="rjd-check">${LanguageManager.get("checkAnswer")}</button>
          <button type="button" class="rjd-btn rjd-btn--primary" id="rjd-next" hidden>${LanguageManager.get("next")}</button>
        </div>
      </div>
    `;

    selected = null;
    checked = false;

    container.querySelectorAll(".rjd-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (checked) return;
        selected = parseInt(btn.dataset.index, 10);
        container.querySelectorAll(".rjd-option").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
    });

    container.querySelector("#rjd-check").addEventListener("click", handleCheck);
    container.querySelector("#rjd-prev").addEventListener("click", () => {
      if (index > 0) {
        index--;
        render();
      }
    });
    const nextBtn = container.querySelector("#rjd-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (index < questions.length - 1) {
          index++;
          render();
        } else if (opts.onComplete) {
          opts.onComplete(correctCount.value, questions.length);
        }
      });
    }
  }

  function handleCheck() {
    if (selected === null) {
      UIManager.toast(LanguageManager.getCurrent() === "hi" ? "कृपया एक विकल्प चुनें" : "Please select an option", "warn");
      return;
    }
    checked = true;
    const q = questions[index];
    const isCorrect = selected === q.correctAnswer;
    if (isCorrect) correctCount.value++;

    container.querySelectorAll(".rjd-option").forEach((btn, i) => {
      btn.classList.add("is-disabled");
      if (i === q.correctAnswer) btn.classList.add("is-correct");
      if (i === selected && !isCorrect) btn.classList.add("is-wrong");
    });

    const feedback = container.querySelector("#rjd-feedback");
    feedback.hidden = false;
    feedback.className = `rjd-feedback rjd-feedback--${isCorrect ? "correct" : "wrong"}`;
    feedback.innerHTML = `
      <p class="rjd-feedback__verdict">${isCorrect ? "✅ " + LanguageManager.get("correct") : "❌ " + LanguageManager.get("wrong")}</p>
      <p class="rjd-feedback__explanation"><strong>${LanguageManager.get("explanation")}:</strong> ${LanguageManager.pick(q.explanation)}</p>
    `;

    container.querySelector("#rjd-check").hidden = true;
    const nextBtn = container.querySelector("#rjd-next");
    nextBtn.hidden = false;
    if (index === questions.length - 1) {
      nextBtn.textContent = LanguageManager.getCurrent() === "hi" ? "समाप्त करें" : "Finish";
    }
  }

  function renderEmpty() {
    container.innerHTML = `<div class="rjd-empty-state"><p>${LanguageManager.get("noWrongQuestions")}</p></div>`;
  }

  LanguageManager.onChange(() => {
    // Re-render current question in the new language without losing
    // position — selection/checked state resets by design (a fresh
    // question view), but progress (index) is preserved.
    render();
  });

  render();

  return {
    goTo(i) {
      index = Math.max(0, Math.min(questions.length - 1, i));
      render();
    },
  };
}
