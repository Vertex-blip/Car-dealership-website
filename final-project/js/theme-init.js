/* Restore the selected mode before the first paint. */
(() => {
  "use strict";
  let theme = "light";
  try {
    const saved = localStorage.getItem("apex-theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch { /* Light mode is available when storage is blocked. */ }
  document.documentElement.dataset.theme = theme;
})();
