/* A local photographic showroom: thumbnails, arrows and keyboard selection. */
(() => {
  "use strict";
  const image = document.getElementById("galleryMain");
  if (!image) return;
  const thumbnails = [...document.querySelectorAll("[data-gallery-src]")];
  if (!thumbnails.length) return;
  const caption = document.getElementById("galleryCaption");
  const count = document.getElementById("galleryCount");
  const previous = document.getElementById("galleryPrevious");
  const next = document.getElementById("galleryNext");
  const stage = image.closest(".photo-gallery");
  let current = Math.max(
    0,
    thumbnails.findIndex(
      (button) => button.getAttribute("aria-pressed") === "true",
    ),
  );

  function show(index, playSound = true) {
    current = (index + thumbnails.length) % thumbnails.length;
    const selected = thumbnails[current];
    image.src = selected.dataset.gallerySrc;
    image.alt =
      selected.dataset.galleryAlt ||
      selected.dataset.galleryTitle ||
      "Apex Motors vehicle";
    if (caption)
      caption.textContent = selected.dataset.galleryTitle || image.alt;
    if (count)
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(thumbnails.length).padStart(2, "0")}`;
    thumbnails.forEach((button, position) => {
      const active = position === current;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    });
    if (playSound) {
      window.Apex?.playSound?.();
      window.Apex?.animate?.(image);
    }
  }

  thumbnails.forEach((button, index) =>
    button.addEventListener("click", () => show(index)),
  );
  previous?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => show(current + 1));
  stage?.addEventListener("keydown", (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.matches("input,textarea,select")
    )
      return;
    let index;
    switch (event.key) {
      case "ArrowLeft":
        index = current - 1;
        break;
      case "ArrowRight":
        index = current + 1;
        break;
      case "Home":
        index = 0;
        break;
      case "End":
        index = thumbnails.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    show(index);
    if (event.target.matches("[data-gallery-src]"))
      thumbnails[current].focus({ preventScroll: true });
  });
  image.addEventListener("error", () => {
    if (caption)
      caption.textContent =
        "This photograph could not load. Choose another vehicle below.";
  });
  show(current, false);
})();
