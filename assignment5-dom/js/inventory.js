/* Arsen / Farabi: object data, array rendering, switch filtering and attribute updates. */
(() => {
  'use strict';
  const {vehicles, formatPrice, notify} = window.Apex;
  const grid = document.getElementById('vehicle-grid');
  if (!grid) return;

  const search = document.getElementById('vehicle-search');
  const sort = document.getElementById('sort-select');
  const savedOnly = document.getElementById('saved-only');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const count = document.getElementById('result-count');
  const emptyState = document.getElementById('empty-state');
  const dialog = document.getElementById('vehicle-dialog');
  let category = 'all';
  let activeVehicle = null;
  let opener = null;
  let restoreOpenerFocus = true;
  let saved = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem('apex-saved-vehicles') || '[]');
    if (Array.isArray(stored)) saved = new Set(stored.filter(id => vehicles.some(vehicle => vehicle.id === id)));
  } catch { /* Storage is optional, including when index.html is opened as a file. */ }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function matchesCategory(vehicle) {
    // The switch controls the actual filtering behavior, rather than decorative labels.
    switch (category) {
      case 'sport': return vehicle.category === 'sport';
      case 'suv': return vehicle.category === 'suv';
      case 'sedan': return vehicle.category === 'sedan';
      default: return true;
    }
  }

  function makeCard(vehicle) {
    const card = element('article', 'vehicle-card');
    card.dataset.vehicleId = vehicle.id;
    const media = element('div', 'vehicle-media');
    const photo = element('img', 'vehicle-photo');
    photo.src = vehicle.image;
    photo.alt = `${vehicle.name}: ${vehicle.description.split('.')[0].toLowerCase()}`;
    photo.loading = 'lazy';
    photo.width = 1400;
    photo.height = 933;
    const badge = element('span', 'vehicle-badge', vehicle.category === 'suv' ? 'SUV' : vehicle.category === 'sport' ? 'Performance' : 'Sedan');
    const save = element('button', 'save-button', saved.has(vehicle.id) ? '♥' : '♡');
    save.type = 'button';
    save.dataset.save = vehicle.id;
    save.setAttribute('aria-label', `${saved.has(vehicle.id) ? 'Unsave' : 'Save'} ${vehicle.name}`);
    save.setAttribute('aria-pressed', String(saved.has(vehicle.id)));
    media.append(photo, badge, save);
    const body = element('div', 'vehicle-body');
    const meta = element('p', 'vehicle-meta', `${vehicle.year} / APEX COLLECTION`);
    const title = element('h3', '', vehicle.name);
    const facts = element('p', 'vehicle-facts', vehicle.summary());
    const bottom = element('div', 'vehicle-bottom');
    const price = element('p', 'vehicle-price', formatPrice(vehicle.price));
    const view = element('button', 'button button-secondary', 'View details ↗');
    view.type = 'button';
    view.dataset.viewCar = vehicle.id;
    view.setAttribute('aria-label', `View details for ${vehicle.name}`);
    bottom.append(price, view);
    body.append(meta, title, facts, bottom);
    card.append(media, body);
    return card;
  }

  function render(animate = true) {
    const query = search.value.trim().toLowerCase();
    // filter is a higher-order function: our callback decides which objects remain.
    const filtered = vehicles.filter(vehicle => matchesCategory(vehicle)
      && (!savedOnly.checked || saved.has(vehicle.id))
      && `${vehicle.name} ${vehicle.category} ${vehicle.year} ${vehicle.description}`.toLowerCase().includes(query));
    if (sort.value === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (sort.value === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    const fragment = document.createDocumentFragment();
    // Explicit loop creates one article per vehicle without inserting user-written HTML.
    for (const vehicle of filtered) fragment.append(makeCard(vehicle));
    grid.replaceChildren(fragment);
    count.textContent = `${filtered.length} ${filtered.length === 1 ? 'vehicle' : 'vehicles'} in your selection`;
    emptyState.hidden = filtered.length > 0;
    if (animate) window.Apex.animate(grid);
    const savedCount = document.getElementById('saved-count');
    if (savedCount) savedCount.textContent = saved.size;
  }

  filterButtons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render();
  }));
  search.addEventListener('input', () => render());
  sort.addEventListener('change', () => render());
  savedOnly.addEventListener('change', () => render());
  document.getElementById('reset-filters').addEventListener('click', () => {
    search.value = '';
    sort.value = 'featured';
    savedOnly.checked = false;
    category = 'all';
    filterButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.filter === 'all');
      button.setAttribute('aria-pressed', String(button.dataset.filter === 'all'));
    });
    render();
  });

  function selectGalleryImage(item, button) {
    const image = document.getElementById('detail-image');
    image.src = item.src;
    image.alt = item.alt;
    document.getElementById('detail-caption').textContent = item.caption;
    document.querySelectorAll('#detail-thumbnails button').forEach(thumbnail => {
      thumbnail.classList.toggle('is-active', thumbnail === button);
      thumbnail.setAttribute('aria-pressed', String(thumbnail === button));
    });
    window.Apex.animate(image);
  }

  function openDetails(vehicle, button) {
    activeVehicle = vehicle;
    opener = button;
    restoreOpenerFocus = true;
    document.getElementById('detail-name').textContent = vehicle.name;
    document.getElementById('detail-category').textContent = `${vehicle.category.toUpperCase()} / ${vehicle.year}`;
    document.getElementById('detail-price').textContent = formatPrice(vehicle.price);
    document.getElementById('detail-specs').textContent = `${vehicle.summary()}. ${vehicle.description} Illustrative listing, price and specifications.`;
    const gallery = [
      {src: vehicle.image, alt: `${vehicle.name} demo vehicle`, caption: `${vehicle.name} / selected vehicle`},
      {src: 'images/showroom-1.jpg', alt: 'Apex Motors showroom atmosphere', caption: 'Showroom / collection atmosphere, not another view of this vehicle'},
      {src: 'images/service-care.jpg', alt: 'Vehicle care at the dealership', caption: 'Ownership / care and service, not another view of this vehicle'}
    ];
    const thumbnails = document.getElementById('detail-thumbnails');
    thumbnails.replaceChildren();
    gallery.forEach((item, index) => {
      const thumbnail = element('button', 'gallery-thumbnail');
      thumbnail.type = 'button';
      thumbnail.dataset.image = item.src;
      thumbnail.setAttribute('aria-label', `Show ${index === 0 ? vehicle.name : index === 1 ? 'showroom' : 'vehicle care'} photo`);
      thumbnail.setAttribute('aria-pressed', String(index === 0));
      const image = element('img');
      image.src = item.src;
      image.alt = '';
      thumbnail.append(image);
      thumbnail.addEventListener('click', () => selectGalleryImage(item, thumbnail));
      thumbnails.append(thumbnail);
    });
    selectGalleryImage(gallery[0], thumbnails.firstElementChild);
    dialog.showModal();
  }

  grid.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view-car]');
    const saveButton = event.target.closest('[data-save]');
    if (viewButton) {
      const vehicle = vehicles.find(item => item.id === viewButton.dataset.viewCar);
      if (vehicle) openDetails(vehicle, viewButton);
    }
    if (saveButton) {
      const id = saveButton.dataset.save;
      const vehicle = vehicles.find(item => item.id === id);
      if (saved.has(id)) saved.delete(id); else saved.add(id);
      try { localStorage.setItem('apex-saved-vehicles', JSON.stringify([...saved])); } catch { /* In-memory saving still works. */ }
      notify(`${vehicle.name} ${saved.has(id) ? 'saved to' : 'removed from'} your shortlist.`);
      render(false);
      const replacement = grid.querySelector(`[data-save="${id}"]`);
      if (replacement) replacement.focus({preventScroll: true});
      else savedOnly.focus({preventScroll: true});
    }
  });

  document.getElementById('close-vehicle').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (restoreOpenerFocus && opener?.isConnected) opener.focus({preventScroll: true});
    restoreOpenerFocus = true;
  });
  document.getElementById('detail-book').addEventListener('click', () => {
    if (!activeVehicle) return;
    const select = document.getElementById('booking-vehicle');
    select.value = activeVehicle.id;
    select.dispatchEvent(new Event('change', {bubbles: true}));
    restoreOpenerFocus = false;
    dialog.close();
    document.getElementById('booking').scrollIntoView({behavior: window.Apex.prefersReducedMotion() ? 'instant' : 'smooth'});
    select.focus({preventScroll: true});
  });
  render(false);
})();
