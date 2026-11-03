/* Assignment 6, Task 0: the shared jQuery entry point. */
$(document).ready(function () {
  "use strict";
  console.log("jQuery is ready!");
  const Apex = (window.Apex = window.Apex || {});
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  $.fx.off = motion.matches;
  motion.addEventListener("change", function (event) { $.fx.off = event.matches; });

  // Task 4: recalculate against the actual document height, including filtered content.
  const $progress = $('<div id="scrollProgress" class="scroll-progress" role="progressbar" aria-label="Page scroll progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>').prependTo("body");
  function updateProgress() {
    const distance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const percent = distance ? Math.min(100, Math.max(0, window.scrollY / distance * 100)) : 100;
    $progress.attr("aria-valuenow", Math.round(percent)).find("span").css("width", percent + "%");
  }
  let frame;
  $(window).on("scroll.apex resize.apex", function () {
    if (!frame) frame = requestAnimationFrame(function () { frame = null; updateProgress(); checkViewport(); });
  });
  if ("ResizeObserver" in window) new ResizeObserver(updateProgress).observe(document.body);
  updateProgress();

  // Task 7: bounded, dismissible notifications with jQuery fade-in/fade-out.
  const $toasts = $('<div id="toastRegion" class="toast-region" role="status" aria-live="polite" aria-atomic="false"></div>').appendTo("body");
  Apex.toast = function (message, kind = "success") {
    const $toast = $('<div class="apex-toast"><span class="toast-symbol" aria-hidden="true">✓</span><p></p><button type="button" aria-label="Dismiss notification">×</button></div>');
    $toast.find("p").text(message);
    if (kind === "error") $toast.addClass("toast-error").find(".toast-symbol").text("!");
    if ($toasts.children().length >= 3) $toasts.children().first().stop(true, true).remove();
    $toast.hide().appendTo($toasts).fadeIn(180);
    let timer;
    const dismiss = function () { clearTimeout(timer); $toast.stop(true).fadeOut(280, function () { $(this).remove(); }); };
    const startTimer = function () { clearTimeout(timer); timer = setTimeout(dismiss, 4200); };
    $toast.on("mouseenter focusin", function () { clearTimeout(timer); }).on("mouseleave focusout", startTimer);
    $toast.find("button").on("click", dismiss);
    startTimer();
  };

  // Task 8: copy only reports success after the clipboard write has succeeded.
  async function writeClipboard(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(value); return; } catch (_) { /* Try the local-file fallback. */ }
    }
    const focus = document.activeElement;
    const $area = $('<textarea readonly class="clipboard-buffer" aria-label="Text to copy"></textarea>').val(value).appendTo("body");
    $area[0].select();
    let copied = false;
    try { copied = document.execCommand("copy"); } finally { $area.remove(); focus?.focus({ preventScroll: true }); }
    if (!copied) throw new Error("Copy unavailable");
  }
  $(document).on("click", "[data-copy-text], [data-copy-target]", async function () {
    const $button = $(this);
    if ($button.data("copyBusy")) return;
    const value = $button.attr("data-copy-text") || $($button.attr("data-copy-target")).text().trim();
    const original = $button.html();
    $button.data("copyBusy", true).attr("aria-busy", "true");
    try {
      await writeClipboard(value);
      $button.find(".copy-icon").text("✓");
      $button.find(".copy-label").text("Copied");
      $('<span class="copy-tooltip" role="tooltip">Copied to clipboard!</span>').appendTo($button);
      $button.addClass("is-copied");
      Apex.toast("Copied to clipboard!");
    } catch (_) {
      Apex.toast("Copy is unavailable. Select the text and copy it manually.", "error");
    } finally {
      $button.removeAttr("aria-busy");
      setTimeout(function () { $button.html(original).removeClass("is-copied").removeData("copyBusy"); }, 2400);
    }
  });

  // Tasks 5 and 9: defer counters and real image URLs until visible.
  function inView(element) {
    const bounds = element.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 && bounds.top < innerHeight && bounds.bottom > 0 && bounds.left < innerWidth && bounds.right > 0;
  }
  function loadImage(image) {
    const $image = $(image), source = $image.attr("data-src");
    if (!source) return;
    $image.removeAttr("data-src").addClass("is-loading");
    $image.one("load", function () { $(this).removeClass("is-loading").addClass("is-loaded"); });
    $image.one("error", function () { $(this).removeClass("is-loading").addClass("image-unavailable").attr("src", "assets/image-placeholder.svg"); });
    $image.attr("src", source);
  }
  function animateCounter(element) {
    const $number = $(element);
    if ($number.attr("data-counted")) return;
    $number.attr("data-counted", "true");
    const target = Number($number.attr("data-count-to"));
    $({ value: 0 }).animate({ value: target }, {
      duration: motion.matches ? 0 : 1400, easing: "swing",
      step: function (now) { $number.text(Math.floor(now).toLocaleString("en-US")); },
      complete: function () { $number.text(target.toLocaleString("en-US")); }
    });
  }
  const imageObserver = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) { loadImage(entry.target); imageObserver.unobserve(entry.target); } });
  }, { rootMargin: "0px", threshold: 0.01 }) : null;
  const countObserver = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) { animateCounter(entry.target); countObserver.unobserve(entry.target); } });
  }, { threshold: 0.25 }) : null;
  Apex.observeImages = function (container) {
    $(container || document).find("img[data-src]").each(function () { if (imageObserver) imageObserver.observe(this); else if (inView(this)) loadImage(this); });
  };
  function checkViewport() {
    if (!imageObserver) $("img[data-src]").each(function () { if (inView(this)) loadImage(this); });
    if (!countObserver) $("[data-count-to]").each(function () { if (inView(this)) animateCounter(this); });
  }
  $("[data-count-to]").each(function () { if (countObserver) countObserver.observe(this); });
  Apex.observeImages(document);
  checkViewport();
  $(document).on("apex:content", function () { Apex.observeImages(document); updateProgress(); });
});
