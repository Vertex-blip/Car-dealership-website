/* Apex Motors: shared data and reusable methods. Prices/specifications are demo data. */
(() => {
  'use strict';

  function createVehicle(id, name, category, year, price, distance, drive, image, description) {
    return {
      id, name, category, year, price, distance, drive, image, description,
      // An object method keeps presentation logic beside the properties it describes.
      summary() {
        return `${this.year} · ${this.distance.toLocaleString('en-US')} km · ${this.drive}`;
      }
    };
  }

  const vehicles = [
    createVehicle('vela', 'Vela Sport', 'sport', 2024, 46900, 12800, 'Automatic · RWD', 'images/car-04.jpg', 'A vivid blue coupe with a purposeful stance. Explore a little more of the open road.'),
    createVehicle('atlas', 'Atlas Explorer', 'suv', 2023, 38900, 24110, 'Automatic · AWD', 'images/car-08.jpg', 'An adaptable SUV for the everyday journey and the weekend away.'),
    createVehicle('meridian', 'Meridian S', 'sedan', 2024, 32900, 18240, 'Automatic · AWD', 'images/car-03.jpg', 'A refined touring sedan with an understated silhouette and everyday comfort.'),
    createVehicle('huracan', 'Solis Supercar', 'sport', 2022, 169900, 9100, 'Automatic · AWD', 'images/car-06.jpg', 'A yellow supercar that makes every arrival feel like an occasion.'),
    createVehicle('solis', 'Solis City', 'sedan', 2022, 21900, 31620, 'Automatic · FWD', 'images/car-01.jpg', 'An easygoing city sedan, with room for your daily plans.'),
    createVehicle('orion', 'Orion Grand', 'sedan', 2023, 62900, 19880, 'Automatic · AWD', 'images/car-07.jpg', 'A grand touring sedan with a flowing profile and a composed road presence.')
  ];

  let toastTimer;
  const currency = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0});

  window.Apex = {
    vehicles,
    formatPrice(price) { return currency.format(price); },
    notify(message) {
      const toast = document.getElementById('toast');
      if (!toast) return;
      clearTimeout(toastTimer);
      toast.textContent = message;
      toast.classList.add('is-visible');
      toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
    },
    prefersReducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
    animate(element) {
      if (!element || this.prefersReducedMotion() || !element.animate) return;
      element.animate(
        [{opacity: 0, transform: 'translateY(12px)'}, {opacity: 1, transform: 'translateY(0)'}],
        {duration: 300, easing: 'ease-out'}
      );
    }
  };
})();
