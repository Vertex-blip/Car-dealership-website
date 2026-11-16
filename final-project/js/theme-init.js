/* Restore the selected mode and a validated background tint before first paint. */
(() => {
  "use strict";
  let theme = "light";
  let hue = null;
  try {
    const saved = localStorage.getItem("apex-theme");
    if (saved === "light" || saved === "dark") theme = saved;
    const value = localStorage.getItem("apex-background-hue");
    if (typeof value === "string" && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())) {
      const number = Number(value);
      if (Number.isFinite(number) && number >= 0 && number <= 360) hue = Math.round((number % 360) * 100) / 100;
    }
  } catch { /* Light mode is available when storage is blocked. */ }
  document.documentElement.dataset.theme = theme;
  if (hue !== null) {
    document.documentElement.style.setProperty("--page-bg", `hsl(${hue} 28% ${theme === "dark" ? "9%" : "95%"})`);
    document.documentElement.dataset.backgroundHue = String(hue);
  }
})();
