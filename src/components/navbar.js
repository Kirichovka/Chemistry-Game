import { createElement } from '../utils/helpers.js';

export function createNavbar({ routes, onNavigate }) {
  const buttons = new Map();
  const element = createElement('nav', { className: 'navbar' });
  const brand = createElement('button', {
    className: 'navbar__brand',
    text: 'Chemistry World',
    events: {
      click: () => onNavigate('home'),
    },
  });
  const list = createElement('div', { className: 'navbar__links' });

  routes.forEach((route) => {
    const button = createElement('button', {
      className: 'navbar__link',
      text: route.label,
      attrs: { type: 'button' },
      events: {
        click: () => onNavigate(route.id),
      },
    });

    buttons.set(route.id, button);
    list.append(button);
  });

  element.append(brand, list);

  function update(activeRouteId) {
    buttons.forEach((button, routeId) => {
      button.classList.toggle('is-active', routeId === activeRouteId);
    });
  }

  return {
    element,
    update,
  };
}
