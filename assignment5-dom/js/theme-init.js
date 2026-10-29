/* Restore appearance before the stylesheet paints. Preferences never block loading. */
(() => {
  "use strict";
  const root = document.documentElement;
  let theme = "light";
  let hue = null;
  try {
    const saved = localStorage.getItem("apex-theme");
    if (saved === "dark" || saved === "light") theme = saved;
    const value = localStorage.getItem("apex-background-hue");
    if (value !== null && Number.isFinite(Number(value)))
      hue = Number(value) % 360;
  } catch {
    /* Storage can be disabled; appearance still works for this visit. */
  }
  root.dataset.theme = theme;
  if (hue !== null)
    root.style.setProperty(
      "--page-bg",
      `hsl(${hue} 28% ${theme === "dark" ? "9%" : "95%"})`,
    );
})();
