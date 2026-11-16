/* Shared navigation, theme preference and small About-page interactions. */
(() => {
  "use strict";
  const Apex = (window.Apex = window.Apex || {});
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new WeakMap();
  Apex.animate = (element) => {
    if (!element?.animate || motion.matches) return;
    animations.get(element)?.cancel();
    animations.set(element, element.animate(
      [{ opacity: .5, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 220, easing: "ease-out" },
    ));
  };
  const nav = document.getElementById("assignmentNav");
  const navToggle = document.getElementById("navToggle");
  const appearanceToggle = document.getElementById("appearanceToggle");
  const appearancePanel = document.getElementById("appearancePanel");
  const colourPicker = document.getElementById("backgroundColor");
  const backgroundStatus = document.getElementById("backgroundStatus");
  const themeToggle = document.getElementById("themeToggle");
  const themeChoices = [...document.querySelectorAll("[data-theme-choice]")];
  let storageWorking = true;
  let editingColour = false;

  function parseHue(value) {
    if (typeof value !== "string" || !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && number <= 360
      ? Math.round((number % 360) * 100) / 100
      : null;
  }
  function readAppearance() {
    try {
      const theme = localStorage.getItem("apex-theme");
      const savedHue = localStorage.getItem("apex-background-hue");
      storageWorking = true;
      return { theme: theme === "dark" ? "dark" : "light", hue: parseHue(savedHue) };
    } catch {
      storageWorking = false;
      return null;
    }
  }
  function savePreference(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, String(value));
      storageWorking = true;
    } catch { storageWorking = false; }
  }
  const storedAppearance = readAppearance();
  let hue = storedAppearance ? storedAppearance.hue : parseHue(root.dataset.backgroundHue);
  if (storedAppearance) root.dataset.theme = storedAppearance.theme;

  function hueHex(angle, saturation, lightness) {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const sector = ((angle % 360) + 360) % 360 / 60;
    const secondary = chroma * (1 - Math.abs(sector % 2 - 1));
    const values = sector < 1 ? [chroma, secondary, 0]
      : sector < 2 ? [secondary, chroma, 0]
      : sector < 3 ? [0, chroma, secondary]
      : sector < 4 ? [0, secondary, chroma]
      : sector < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
    const offset = lightness - chroma / 2;
    return "#" + values.map(value => Math.round((value + offset) * 255).toString(16).padStart(2, "0")).join("");
  }
  function backgroundHex() {
    const dark = root.dataset.theme === "dark";
    return hue === null ? (dark ? "#15181b" : "#ffffff") : hueHex(hue, .28, dark ? .09 : .95);
  }
  function colourHue(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
    // Avoid a rounding shift when an unchanged pale tint is committed again.
    if (hue !== null && hex.toLowerCase() === backgroundHex()) return hue;
    const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
    const [red, green, blue] = values;
    const high = Math.max(...values), low = Math.min(...values), delta = high - low;
    if (!delta) return null;
    const sector = high === red ? (green - blue) / delta
      : high === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
    return Math.round(((sector * 60 + 360) % 360) * 100) / 100;
  }
  function applyAppearance(syncPicker = true) {
    const dark = root.dataset.theme === "dark";
    root.dataset.theme = dark ? "dark" : "light";
    if (hue === null) {
      root.style.removeProperty("--page-bg");
      delete root.dataset.backgroundHue;
    } else {
      root.style.setProperty("--page-bg", `hsl(${hue} 28% ${dark ? "9%" : "95%"})`);
      root.dataset.backgroundHue = String(hue);
    }
    themeToggle?.setAttribute("aria-pressed", String(dark));
    themeToggle?.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
    themeChoices.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.themeChoice === root.dataset.theme)));
    const colour = backgroundHex();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colour);
    if (colourPicker && syncPicker && !editingColour) colourPicker.value = colour;
    if (backgroundStatus) backgroundStatus.textContent = (hue === null ? "Default background." : "Custom background.")
      + (storageWorking ? "" : " Your browser could not save this choice; it applies on this page.");
    root.dispatchEvent(new CustomEvent("apex:appearance", { bubbles: true, detail: { theme: root.dataset.theme, hue } }));
  }
  function restoreAppearance() {
    const saved = readAppearance();
    if (saved) {
      root.dataset.theme = saved.theme;
      hue = saved.hue;
    }
    applyAppearance();
  }
  function setTheme(theme) {
    if (theme !== "light" && theme !== "dark") return;
    root.dataset.theme = theme;
    savePreference("apex-theme", theme);
    applyAppearance();
  }
  function setHue(next, syncPicker = true) {
    hue = next;
    savePreference("apex-background-hue", hue);
    applyAppearance(syncPicker);
  }
  function closeAppearance(returnFocus = false) {
    if (!appearancePanel) return;
    appearancePanel.hidden = true;
    appearanceToggle?.setAttribute("aria-expanded", "false");
    if (returnFocus) appearanceToggle?.focus({ preventScroll: true });
  }
  function closeMenu(focus = false) {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open navigation");
    if (focus) navToggle?.focus();
  }
  function openMenu(focusActive = true) {
    if (!nav) return;
    closeAppearance();
    nav.classList.add("is-open");
    navToggle?.setAttribute("aria-expanded", "true");
    navToggle?.setAttribute("aria-label", "Close navigation");
    if (focusActive) (nav.querySelector('[aria-current="page"]') || nav.querySelector("a[href]"))?.focus({ preventScroll: true });
  }
  navToggle?.addEventListener("click", () => {
    if (nav?.classList.contains("is-open")) closeMenu();
    else openMenu();
  });
  appearanceToggle?.addEventListener("click", () => {
    if (!appearancePanel) return;
    if (!appearancePanel.hidden) { closeAppearance(true); return; }
    closeMenu();
    appearancePanel.hidden = false;
    appearanceToggle.setAttribute("aria-expanded", "true");
    (appearancePanel.querySelector('[data-theme-choice][aria-pressed="true"]')
      || document.getElementById("appearanceClose") || appearancePanel.querySelector("button,input"))?.focus({ preventScroll: true });
  });
  document.getElementById("appearanceClose")?.addEventListener("click", () => closeAppearance(true));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
    if (event.target.closest(".nav-link")) { closeMenu(); closeAppearance(); }
    if (appearancePanel && !appearancePanel.hidden && !appearancePanel.contains(event.target) && !appearanceToggle?.contains(event.target)) {
      closeAppearance(appearancePanel.contains(document.activeElement));
    }
  });
  document.addEventListener("focusin", (event) => {
    if (appearancePanel && !appearancePanel.hidden && !appearancePanel.contains(event.target) && !appearanceToggle?.contains(event.target)) closeAppearance();
    if (!event.target.closest(".site-header")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      if (appearancePanel && !appearancePanel.hidden) { event.preventDefault(); closeAppearance(true); }
      else if (nav?.classList.contains("is-open")) { event.preventDefault(); closeMenu(true); }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
    if (appearancePanel && !appearancePanel.hidden) return;
    const target = event.target;
    const fromPage = target === document.body || target === root;
    const fromMenu = nav?.contains(target);
    if (!fromPage && !fromMenu) return;
    if (target.closest('form,input,textarea,select,button,[contenteditable],[role="tab"],[role="tablist"],[role="slider"],.photo-gallery,dialog[open]')) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    if ((event.key === "Home" || event.key === "End") && !fromMenu) return;
    const links = [...(nav?.querySelectorAll("a.nav-link[href]") || [])];
    if (!links.length) return;
    let index = links.indexOf(document.activeElement);
    if (index < 0) index = Math.max(0, links.findIndex(link => link.hasAttribute("aria-current")));
    const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + links.length) % links.length;
    event.preventDefault();
    if (navToggle && getComputedStyle(navToggle).display !== "none") openMenu(false);
    links[next].focus({ preventScroll: true });
  });
  matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });

  themeToggle?.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  themeChoices.forEach(button => button.addEventListener("click", () => setTheme(button.dataset.themeChoice)));
  colourPicker?.addEventListener("input", () => {
    editingColour = true;
    setHue(colourHue(colourPicker.value), false);
  });
  function finishColour() {
    editingColour = false;
    applyAppearance();
  }
  colourPicker?.addEventListener("change", () => {
    editingColour = false;
    setHue(colourHue(colourPicker.value));
  });
  colourPicker?.addEventListener("blur", finishColour);
  document.getElementById("backgroundButton")?.addEventListener("click", () => {
    let random;
    try { random = crypto.getRandomValues(new Uint32Array(1))[0]; }
    catch { random = Math.floor(Math.random() * 0x100000000); }
    const next = hue === null ? random % 360 : Math.round(((hue + 45 + random % 271) % 360) * 100) / 100;
    setHue(next);
  });
  document.getElementById("backgroundReset")?.addEventListener("click", () => setHue(null));
  addEventListener("storage", (event) => {
    if (event.key === "apex-theme" || event.key === "apex-background-hue" || event.key === null) restoreAppearance();
  });
  applyAppearance();
  document.querySelectorAll("[data-copy-page]").forEach((button) => {
    button.dataset.copyText = new URL(button.dataset.copyPage, location.href).href;
  });

  const moreButton = document.getElementById("readMoreButton");
  const moreContent = document.getElementById("readMoreContent");
  if (moreButton && moreContent) {
    moreContent.hidden = true;
    moreContent.style.removeProperty("display");
    moreButton.addEventListener("click", () => {
      moreContent.hidden = !moreContent.hidden;
      moreButton.setAttribute("aria-expanded", String(!moreContent.hidden));
      moreButton.textContent = moreContent.hidden ? "More about Apex +" : "Show less −";
    });
  }

  const stars = [...document.querySelectorAll("[data-rating]")];
  const ratingStatus = document.getElementById("ratingStatus");
  function readRating() {
    try {
      const saved = Number(localStorage.getItem("apex-rating"));
      return Number.isInteger(saved) && saved >= 1 && saved <= 5 ? saved : 0;
    } catch { return 0; }
  }
  let rating = readRating();
  function paintRating(value = rating) {
    stars.forEach((star) => {
      star.classList.toggle("is-active", Number(star.dataset.rating) <= value);
      star.setAttribute("aria-pressed", String(Number(star.dataset.rating) === rating));
    });
  }
  stars.forEach((star) => {
    star.addEventListener("pointerenter", () => paintRating(Number(star.dataset.rating)));
    star.addEventListener("focus", () => paintRating(Number(star.dataset.rating)));
    star.addEventListener("blur", () => paintRating());
    star.addEventListener("click", () => {
      rating = Number(star.dataset.rating);
      let saved = true;
      try { localStorage.setItem("apex-rating", String(rating)); } catch { saved = false; }
      paintRating();
      if (ratingStatus) ratingStatus.textContent = `Thank you. Your rating: ${rating} of 5.${saved ? "" : " This rating could not be saved for your next visit."}`;
    });
  });
  document.querySelector(".rating-controls")?.addEventListener("pointerleave", () => paintRating());
  paintRating();
  if (rating && ratingStatus) ratingStatus.textContent = `Your previous rating: ${rating} of 5.`;
  function restoreRating() {
    rating = readRating();
    paintRating();
    if (ratingStatus) ratingStatus.textContent = rating
      ? `Your previous rating: ${rating} of 5.`
      : "Choose from one to five stars.";
  }
  addEventListener("storage", (event) => {
    if (event.key === "apex-rating" || event.key === null) restoreRating();
  });
  // A cached page can return after preferences were changed elsewhere in this tab.
  addEventListener("pageshow", () => {
    restoreAppearance();
    restoreRating();
  });
})();
