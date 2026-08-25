/**
 * UIManager
 * -----------------------------------------------------------------------
 * Small shared UI utilities: toast notifications, a confirm modal, and
 * difficulty-badge markup. Kept framework-free so it drops into a Blogger
 * template without conflicts.
 * -----------------------------------------------------------------------
 */
const UIManager = (function () {
  function ensureToastRoot() {
    let root = document.getElementById("rjd-toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "rjd-toast-root";
      root.className = "rjd-toast-root";
      document.body.appendChild(root);
    }
    return root;
  }

  function toast(message, type = "info", duration = 3200) {
    const root = ensureToastRoot();
    const el = document.createElement("div");
    el.className = `rjd-toast rjd-toast--${type}`;
    el.textContent = message;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    setTimeout(() => {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 250);
    }, duration);
  }

  function confirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
    const overlay = document.createElement("div");
    overlay.className = "rjd-modal-overlay";
    overlay.innerHTML = `
      <div class="rjd-modal" role="dialog" aria-modal="true">
        <p class="rjd-modal__title">${title}</p>
        <p class="rjd-modal__message">${message}</p>
        <div class="rjd-modal__actions">
          <button type="button" class="rjd-btn rjd-btn--ghost" data-action="cancel">${cancelLabel}</button>
          <button type="button" class="rjd-btn rjd-btn--primary" data-action="confirm">${confirmLabel}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-visible"));

    function close() {
      overlay.classList.remove("is-visible");
      setTimeout(() => overlay.remove(), 200);
    }

    overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => {
      close();
      if (onConfirm) onConfirm();
    });
    overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => {
      close();
      if (onCancel) onCancel();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        close();
        if (onCancel) onCancel();
      }
    });
  }

  function difficultyBadge(difficulty) {
    const key = `difficulty_${difficulty}`;
    return `<span class="rjd-badge rjd-badge--${difficulty}">${LanguageManager.get(key)}</span>`;
  }

  function showLoading(container, message) {
    container.innerHTML = `
      <div class="rjd-loading">
        <div class="rjd-loading__spinner" aria-hidden="true"></div>
        <p>${message}</p>
      </div>
    `;
  }

  function showError(container, message, onRetry) {
    container.innerHTML = `
      <div class="rjd-error">
        <p class="rjd-error__icon" aria-hidden="true">⚠️</p>
        <p class="rjd-error__message">${message}</p>
        <button type="button" class="rjd-btn rjd-btn--primary" id="rjd-error-retry">${LanguageManager.get("retry")}</button>
      </div>
    `;
    const btn = container.querySelector("#rjd-error-retry");
    if (btn && onRetry) btn.addEventListener("click", onRetry);
  }

  return { toast, confirmModal, difficultyBadge, showLoading, showError };
})();
