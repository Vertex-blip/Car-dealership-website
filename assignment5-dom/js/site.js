/* Shared page navigation, appearance, audio and small editorial interactions. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const Apex = (window.Apex = window.Apex || {});
  const animations = new WeakMap();
  const read = (key, fallback = null) => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* Features remain available when browser storage is blocked. */
    }
  };
  Apex.animate = (element) => {
    if (!element?.animate || reducedMotion.matches) return;
    animations.get(element)?.cancel();
    animations.set(
      element,
      element.animate(
        [
          { opacity: 0.4, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 320, easing: "cubic-bezier(.2,.7,.3,1)" },
      ),
    );
  };

  // Every sound shares one voice: rapid presses stop the previous voice first.
  let soundEnabled = read("apex-sound", "on") !== "off";
  let audioContext;
  let voice;
  let voiceGain;
  let audioRequest = 0;
  let soundCount = 0;
  const notification = new Audio("assets/chime.wav");
  notification.preload = "auto";
  notification.volume = 0.25;
  function stopSound() {
    notification.pause();
    notification.currentTime = 0;
    if (voice) {
      try {
        voice.stop();
      } catch {
        /* A voice may have just ended. */
      }
      voice.disconnect();
      voice = null;
    }
    if (voiceGain) {
      voiceGain.disconnect();
      voiceGain = null;
    }
  }
  Apex.playSound = async (kind = "navigate") => {
    const request = ++audioRequest;
    stopSound();
    if (!soundEnabled) return false;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext || kind === "notification") {
        await notification.play();
      } else {
        audioContext ||= new AudioContext();
        if (audioContext.state === "suspended") await audioContext.resume();
        if (request !== audioRequest) return false;
        const now = audioContext.currentTime;
        voice = audioContext.createOscillator();
        voiceGain = audioContext.createGain();
        voice.type = "triangle";
        voice.frequency.setValueAtTime(kind === "confirm" ? 660 : 880, now);
        voice.frequency.exponentialRampToValueAtTime(
          kind === "confirm" ? 990 : 660,
          now + 0.09,
        );
        voiceGain.gain.setValueAtTime(0.0001, now);
        voiceGain.gain.exponentialRampToValueAtTime(0.055, now + 0.008);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.115);
        voice.connect(voiceGain);
        voiceGain.connect(audioContext.destination);
        voice.start(now);
        voice.stop(now + 0.12);
      }
      root.dataset.soundPlays = String(++soundCount);
      return true;
    } catch {
      return false;
    }
  };
  Apex.sound = notification;
  Apex.playChime = () => Apex.playSound("notification");
  const soundToggle = document.getElementById("soundToggle");
  function updateSoundControl() {
    soundToggle?.setAttribute("aria-pressed", String(soundEnabled));
    soundToggle?.setAttribute(
      "aria-label",
      soundEnabled ? "Mute interface sounds" : "Enable interface sounds",
    );
    if (soundToggle) soundToggle.dataset.muted = String(!soundEnabled);
  }
  soundToggle?.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    write("apex-sound", soundEnabled ? "on" : "off");
    updateSoundControl();
    if (soundEnabled) Apex.playSound("confirm");
    else {
      ++audioRequest;
      stopSound();
    }
  });
  updateSoundControl();

  const nav = document.getElementById("assignmentNav");
  const navToggle = document.getElementById("navToggle");
  const links = nav ? [...nav.querySelectorAll(".nav-link")] : [];
  function closeMenu(returnFocus = false) {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    if (returnFocus) navToggle?.focus();
  }
  navToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    if (open) links.find((link) => link.hasAttribute("aria-current"))?.focus();
    Apex.playSound();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      target.closest(
        "input,textarea,select,[contenteditable=true],[role=slider],[data-showroom],dialog[open]",
      )
    )
      return;
    if (event.key === "Escape") {
      if (nav?.classList.contains("is-open")) closeMenu(true);
      return;
    }
    // Only the page itself or the menu participates; buttons retain their own keys.
    if (!(target === document.body || target === root || nav?.contains(target)))
      return;
    if (!links.length) return;
    let index = links.indexOf(document.activeElement);
    if (index < 0)
      index = links.findIndex(
        (link) => link.getAttribute("aria-current") === "page",
      );
    if (index < 0) index = 0;
    let next;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % links.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + links.length) % links.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = links.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (getComputedStyle(navToggle).display !== "none") {
      nav.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
    }
    links[next].focus({ preventScroll: true });
    Apex.playSound();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
    const link = event.target.closest("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    )
      return;
    const url = new URL(link.href, location.href);
    if (url.pathname === location.pathname && url.search === location.search)
      return;
    if (
      url.origin !== location.origin ||
      url.protocol !== location.protocol ||
      !url.pathname.endsWith(".html") ||
      url.href === location.href
    )
      return;
    closeMenu();
    Apex.playSound();
    if (soundEnabled) {
      event.preventDefault();
      root.classList.add("is-leaving");
      setTimeout(() => {
        location.href = url.href;
      }, 110);
    }
  });
  addEventListener("pageshow", () => root.classList.remove("is-leaving"));
  matchMedia("(min-width: 992px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });

  const themeToggle = document.getElementById("themeToggle");
  const appearanceToggle = document.getElementById("appearanceToggle");
  const panel = document.getElementById("appearancePanel");
  const hueValue = read("apex-background-hue");
  let hue =
    hueValue === null || !Number.isFinite(Number(hueValue))
      ? null
      : Number(hueValue) % 360;
  function applyAppearance() {
    const dark = root.dataset.theme === "dark";
    if (hue !== null) {
      const color = `hsl(${hue} 28% ${dark ? "9%" : "95%"})`;
      root.style.setProperty("--page-bg", color);
      document.body.style.backgroundColor = color;
    } else {
      root.style.removeProperty("--page-bg");
      document.body.style.removeProperty("background-color");
    }
    themeToggle?.setAttribute("aria-pressed", String(dark));
    themeToggle?.setAttribute(
      "aria-label",
      dark ? "Switch to day mode" : "Switch to night mode",
    );
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.themeChoice === root.dataset.theme),
      );
    });
    const status = document.getElementById("backgroundStatus");
    if (status)
      status.textContent =
        hue === null
          ? "Signature palette"
          : `Custom atmosphere · hue ${Math.round(hue)}°`;
    const themeLabel = document.getElementById("themeLabel");
    if (themeLabel) themeLabel.textContent = dark ? "Night mode" : "Day mode";
    root.dispatchEvent(
      new CustomEvent("apex:appearance", {
        bubbles: true,
        detail: { theme: root.dataset.theme, hue },
      }),
    );
  }
  function setTheme(theme) {
    root.dataset.theme = theme;
    write("apex-theme", theme);
    applyAppearance();
    Apex.playSound();
  }
  themeToggle?.addEventListener("click", () =>
    setTheme(root.dataset.theme === "dark" ? "light" : "dark"),
  );
  document
    .querySelectorAll("[data-theme-choice]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setTheme(button.dataset.themeChoice),
      ),
    );
  function closeAppearance(focus = false) {
    if (!panel) return;
    panel.hidden = true;
    appearanceToggle?.setAttribute("aria-expanded", "false");
    if (focus) appearanceToggle?.focus();
  }
  appearanceToggle?.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    appearanceToggle.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) panel.querySelector("button")?.focus();
  });
  document.addEventListener("click", (event) => {
    if (
      panel &&
      !panel.hidden &&
      !panel.contains(event.target) &&
      !appearanceToggle?.contains(event.target)
    )
      closeAppearance();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel && !panel.hidden) {
      event.preventDefault();
      closeAppearance(true);
    }
  });
  document.getElementById("backgroundButton")?.addEventListener("click", () => {
    // An advancing random hue avoids a tiny repeated preset array.
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    hue = ((hue ?? 25) + 47 + (random[0] % 267)) % 360;
    write("apex-background-hue", String(hue));
    applyAppearance();
    Apex.playSound();
  });
  document
    .getElementById("backgroundColor")
    ?.addEventListener("input", (event) => {
      const hex = event.target.value;
      const values = [1, 3, 5].map(
        (index) => parseInt(hex.slice(index, index + 2), 16) / 255,
      );
      const [red, green, blue] = values;
      const max = Math.max(...values),
        min = Math.min(...values),
        delta = max - min;
      let angle = 0;
      if (delta) {
        if (max === red) angle = ((green - blue) / delta) % 6;
        else if (max === green) angle = (blue - red) / delta + 2;
        else angle = (red - green) / delta + 4;
      }
      hue = (angle * 60 + 360) % 360;
      write("apex-background-hue", String(hue));
      applyAppearance();
    });
  document.getElementById("backgroundReset")?.addEventListener("click", () => {
    hue = null;
    write("apex-background-hue", null);
    applyAppearance();
    Apex.playSound("confirm");
  });
  applyAppearance();

  const readMoreButton = document.getElementById("readMoreButton");
  const readMoreContent = document.getElementById("readMoreContent");
  if (readMoreButton && readMoreContent) {
    readMoreContent.hidden = false;
    readMoreContent.style.display = "none";
    readMoreButton.addEventListener("click", () => {
      const expanded = readMoreButton.getAttribute("aria-expanded") !== "true";
      readMoreContent.style.display = expanded ? "block" : "none";
      readMoreButton.setAttribute("aria-expanded", String(expanded));
      readMoreButton.textContent = expanded
        ? "A little less −"
        : "More about Apex +";
      if (expanded) Apex.animate(readMoreContent);
      Apex.playSound();
    });
  }
  document.getElementById("timeButton")?.addEventListener("click", () => {
    document.getElementById("timeOutput").textContent =
      `Your local time · ${new Date().toLocaleTimeString("en-GB")}`;
    Apex.playSound();
  });
  document
    .getElementById("soundButton")
    ?.addEventListener("click", async () => {
      const played = await Apex.playChime();
      const status = document.getElementById("soundStatus");
      if (status)
        status.textContent = played
          ? "A short studio chime. Press again to replay."
          : soundEnabled
            ? "Audio is unavailable in this browser."
            : "Sound is muted. Enable it in the header.";
    });
  document
    .querySelectorAll(".faq-item summary")
    .forEach((summary) =>
      summary.addEventListener("click", () => Apex.playSound()),
    );
  document.querySelectorAll("[data-rating]").forEach((button) =>
    button.addEventListener("click", () => {
      const rating = Number(button.dataset.rating);
      document
        .querySelectorAll("[data-rating]")
        .forEach((star) =>
          star.setAttribute(
            "aria-pressed",
            String(Number(star.dataset.rating) <= rating),
          ),
        );
      const status = document.getElementById("ratingStatus");
      if (status)
        status.textContent = `Thank you. Your rating: ${rating} of 5.`;
      Apex.playSound("confirm");
      Apex.animate(button.parentElement);
    }),
  );
})();
