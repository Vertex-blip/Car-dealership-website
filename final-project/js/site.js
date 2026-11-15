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
  function closeMenu(focus = false) {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open navigation");
    if (focus) navToggle?.focus();
  }
  navToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
    if (event.target.closest(".nav-link")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) closeMenu(true);
  });
  matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });

  const toggle = document.getElementById("themeToggle");
  function updateTheme() {
    const dark = root.dataset.theme === "dark";
    toggle?.setAttribute("aria-pressed", String(dark));
    toggle?.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#15181b" : "#ffffff");
  }
  toggle?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("apex-theme", root.dataset.theme); } catch { /* The preference lasts for this page when storage is blocked. */ }
    updateTheme();
  });
  addEventListener("storage", (event) => {
    if (event.key === "apex-theme") {
      root.dataset.theme = event.newValue === "dark" ? "dark" : "light";
      updateTheme();
    }
  });
  updateTheme();
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
  let rating = 0;
  try { rating = Number(localStorage.getItem("apex-rating")) || 0; } catch { /* Optional preference. */ }
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
})();
