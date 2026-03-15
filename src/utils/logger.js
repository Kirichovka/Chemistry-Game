export function createLogger(scope) {
  function write(method, ...args) {
    if (!import.meta.env.DEV && method === 'debug') {
      return;
    }

    console[method](`[${scope}]`, ...args);
  }

  return {
    debug: (...args) => write('debug', ...args),
    info: (...args) => write('info', ...args),
    warn: (...args) => write('warn', ...args),
    error: (...args) => write('error', ...args),
  };
}
