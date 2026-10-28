/* Render the existing Bootstrap cards from objects and filter them by category. */
(() => {
  'use strict';
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;

  const vehicles = window.Apex.vehicles;
  const categoryButtons = [...document.querySelectorAll('[data-category]')];
  const count = document.getElementById('inventoryCount');
  let category = 'all';

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function matchesCategory(vehicle) {
    // Each switch branch controls which objects reach the visible card grid.
    switch (category) {
      case 'touring': return vehicle.category === 'touring';
      case 'performance': return vehicle.category === 'performance';
      case 'adventure': return vehicle.category === 'adventure';
      default: return true;
    }
  }

  function makeCard(vehicle) {
    const column = element('div', 'col');
    const card = element('article', 'card h-100 shadow-sm vehicle-card');
    card.dataset.vehicleId = vehicle.id;
    const image = element('img', 'card-img-top');
    image.src = vehicle.image;
    image.alt = vehicle.alt;
    image.width = 1400;
    image.height = 933;
    const body = element('div', 'card-body d-flex flex-column');
    const label = element('p', 'text-uppercase small fw-bold text-primary mb-1', vehicle.label());
    const heading = element('h2', 'card-title h4', vehicle.name);
    const description = element('p', 'card-text text-muted-strong', vehicle.description);
    const action = element('a', 'btn btn-primary mt-auto align-self-start', 'Ask about this car');
    action.href = `responsive-form.html?vehicle=${encodeURIComponent(vehicle.id)}`;
    body.append(label, heading, description, action);
    card.append(image, body);
    column.append(card);
    return column;
  }

  function render(animate = true) {
    // filter is higher-order: it receives matchesCategory as its predicate callback.
    const selectedVehicles = vehicles.filter(matchesCategory);
    const fragment = document.createDocumentFragment();
    for (const vehicle of selectedVehicles) fragment.append(makeCard(vehicle));
    grid.replaceChildren(fragment);
    count.textContent = `${selectedVehicles.length} ${selectedVehicles.length === 1 ? 'vehicle' : 'vehicles'} shown.`;
    if (animate) window.Apex.animate(grid);
  }

  categoryButtons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    categoryButtons.forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-pressed', String(selected));
      item.classList.toggle('active', selected);
      item.classList.toggle('btn-primary', selected);
      item.classList.toggle('btn-outline-primary', !selected);
    });
    render();
  }));
  render(false);
})();
