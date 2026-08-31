/**
 * MockTestApp
 * -----------------------------------------------------------------------
 * Entry point for mock-test.html.
 * Initializes the TestSession on the mock-root container.
 * -----------------------------------------------------------------------
 */
(function () {
  const root = document.getElementById("rjd-mock-root");
  if (root) {
    initTestSession(root);
  }
})();
