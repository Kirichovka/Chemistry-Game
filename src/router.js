import { routes } from './utils/constants.js';

const routeIds = new Set(routes.map((route) => route.id));

function resolveRoute(hashValue) {
  const routeId = hashValue.replace('#', '').trim();
  return routeIds.has(routeId) ? routeId : 'home';
}

export function createRouter({ onRouteChange }) {
  function handleRouteChange() {
    onRouteChange(resolveRoute(window.location.hash));
  }

  function navigate(routeId) {
    if (!routeIds.has(routeId)) {
      return;
    }

    if (resolveRoute(window.location.hash) === routeId) {
      onRouteChange(routeId);
      return;
    }

    window.location.hash = routeId;
  }

  window.addEventListener('hashchange', handleRouteChange);

  return {
    start() {
      if (!window.location.hash) {
        window.location.hash = 'home';
        return;
      }

      handleRouteChange();
    },
    navigate,
  };
}
