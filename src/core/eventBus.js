export function createEventBus() {
  const listeners = new Map();

  function on(eventName, handler) {
    const handlers = listeners.get(eventName) ?? new Set();
    handlers.add(handler);
    listeners.set(eventName, handlers);

    return () => {
      handlers.delete(handler);
      if (!handlers.size) {
        listeners.delete(eventName);
      }
    };
  }

  function emit(eventName, payload) {
    const handlers = listeners.get(eventName);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => handler(payload));
  }

  return {
    on,
    emit,
  };
}
