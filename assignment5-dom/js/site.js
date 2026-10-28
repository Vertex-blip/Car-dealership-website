/* Shared data and interactions for the Apex Motors website. */
(() => {
  'use strict';

  function createVehicle(id, name, category, categoryLabel, year, image, alt, description) {
    return {
      id, name, category, categoryLabel, year, image, alt, description,
      label() {
        return `${this.categoryLabel} · ${this.year}`;
      }
    };
  }

  // Keep the original three listings and extend the collection with local photographs.
  const vehicles = [
    createVehicle('solis', 'Solis GT', 'touring', 'Grand touring', 2024,
      'images/car-01.jpg', 'Black sedan driving along a tree-lined road',
      'A poised coupe with crisp steering and the composure for a full day on the road.'),
    createVehicle('meridian', 'Meridian S', 'performance', 'Performance', 2024,
      'images/car-02.jpg', 'Dark estate car facing the camera on a country lane',
      'A serene, driver-focused cabin wrapped in a clean, confident silhouette.'),
    createVehicle('atlas', 'Atlas X', 'adventure', 'Adventure', 2023,
      'images/car-03.jpg', 'White fastback car parked in a dimly lit garage',
      'A roomy, all-weather companion with space for family and a little more gear.'),
    createVehicle('camaro', 'Chevrolet Camaro', 'performance', 'Performance', 2018,
      'images/car-04.jpg', 'Turquoise Chevrolet Camaro coupe parked in a desert landscape',
      'Bold coupe styling and an athletic stance for a drive that feels like an occasion.'),
    createVehicle('huracan', 'Lamborghini Huracan', 'performance', 'Performance', 2017,
      'images/car-06.jpg', 'Yellow Lamborghini Huracan on a tree-lined street',
      'A low-slung silhouette and unmistakable presence for your next memorable drive.'),
    createVehicle('panamera', 'Porsche Panamera', 'touring', 'Grand touring', 2018,
      'images/car-07.jpg', 'Rear view of a black Porsche Panamera on a road',
      'Elegant four-door proportions with the character for a rewarding long-distance journey.'),
    createVehicle('expedition', 'Ford Expedition', 'adventure', 'Adventure', 2019,
      'images/car-08.jpg', 'White Ford Expedition SUV in a rocky desert landscape',
      'A spacious SUV with a confident stance and room for your next family adventure.'),
    createVehicle('laferrari', 'Ferrari LaFerrari', 'performance', 'Performance', 2015,
      'images/car-09.jpg', 'Red Ferrari LaFerrari displayed in a showroom',
      'Sculpted bodywork and dramatic proportions make every arrival feel special.')
  ];

  const animations = new WeakMap();
  window.Apex = {
    vehicles,
    animate(element) {
      if (!element || !element.animate
          || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      animations.get(element)?.cancel();
      const animation = element.animate(
        [{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}],
        {duration: 260, easing: 'ease-out'}
      );
      animations.set(element, animation);
    }
  };

  const navigation = document.getElementById('assignmentNav');
  if (navigation) {
    const links = [...navigation.querySelectorAll('.nav-link')];
    const navToggle = document.getElementById('navToggle');
    function closeMenu(returnFocus = false) {
      navigation.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
      if (returnFocus && navToggle?.getClientRects().length) navToggle.focus();
    }
    navToggle?.addEventListener('click', () => {
      const open = navigation.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      if (open) links[0]?.focus();
    });
    navigation.addEventListener('keydown', event => {
      const current = links.indexOf(document.activeElement);
      if (current === -1) return;
      let next;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': next = (current + 1) % links.length; break;
        case 'ArrowLeft':
        case 'ArrowUp': next = (current - 1 + links.length) % links.length; break;
        case 'Home': next = 0; break;
        case 'End': next = links.length - 1; break;
        case 'Escape': {
          if (window.matchMedia('(max-width: 991px)').matches
              && navigation.classList.contains('is-open')) {
            event.preventDefault();
            closeMenu(true);
          }
          return;
        }
        default: return;
      }
      event.preventDefault();
      links[next].focus();
    });
    links.forEach(link => link.addEventListener('click', () => closeMenu()));
    window.matchMedia('(min-width: 992px)').addEventListener('change', event => {
      if (event.matches) closeMenu();
    });
  }

  const readMoreButton = document.getElementById('readMoreButton');
  const readMoreContent = document.getElementById('readMoreContent');
  if (readMoreButton && readMoreContent) {
    // The selected attribute task changes style.display without rebuilding the text.
    readMoreContent.hidden = false;
    readMoreContent.style.display = 'none';
    readMoreButton.setAttribute('aria-expanded', 'false');
    readMoreButton.addEventListener('click', () => {
      const expanded = readMoreButton.getAttribute('aria-expanded') !== 'true';
      readMoreContent.style.display = expanded ? 'block' : 'none';
      readMoreButton.setAttribute('aria-expanded', String(expanded));
      readMoreButton.textContent = expanded ? 'Read less' : 'Read more';
      if (expanded) window.Apex.animate(readMoreContent);
    });
  }

  const backgroundButton = document.getElementById('backgroundButton');
  const backgroundStatus = document.getElementById('backgroundStatus');
  if (backgroundButton && backgroundStatus) {
    const colors = [
      {name: 'Cream', value: '#f5f0e7'},
      {name: 'Paper', value: '#fffdf9'},
      {name: 'Soft blue', value: '#e9eef2'}
    ];
    let currentColor = 0;
    backgroundStatus.textContent = `Current background: ${colors[currentColor].name}.`;
    backgroundButton.addEventListener('click', () => {
      currentColor = (currentColor + 1) % colors.length;
      const color = colors[currentColor];
      document.body.style.backgroundColor = color.value;
      backgroundStatus.textContent = `Current background: ${color.name}.`;
    });
  }

  const timeButton = document.getElementById('timeButton');
  const timeOutput = document.getElementById('timeOutput');
  if (timeButton && timeOutput) {
    timeButton.addEventListener('click', () => {
      timeOutput.textContent = `Current local time: ${new Date().toLocaleTimeString('en-GB')}`;
      window.Apex.animate(timeOutput);
    });
  }

  const soundButton = document.getElementById('soundButton');
  const soundStatus = document.getElementById('soundStatus');
  if (soundButton && soundStatus) {
    // A single player is stopped and rewound, so rapid clicks do not overlap sounds.
    const sound = new Audio('assets/chime.wav');
    sound.preload = 'auto';
    sound.volume = 0.4;
    let requestNumber = 0;
    async function playChime() {
      const currentRequest = ++requestNumber;
      sound.pause();
      sound.currentTime = 0;
      try {
        await sound.play();
        if (currentRequest !== requestNumber) return;
        soundStatus.textContent = 'Playing the notification sound.';
        soundButton.dataset.audioState = 'playing';
        window.Apex.animate(soundButton);
      } catch (error) {
        if (currentRequest !== requestNumber || error.name === 'AbortError') return;
        soundStatus.textContent = 'The sound could not play. Check browser audio settings and try again.';
        soundButton.dataset.audioState = 'error';
      }
    }
    sound.addEventListener('ended', () => {
      soundStatus.textContent = 'Notification played. Press the button to play it again.';
      soundButton.dataset.audioState = 'ended';
    });
    soundButton.addEventListener('click', playChime);
    window.Apex.sound = sound;
    window.Apex.playChime = playChime;
  }
})();
