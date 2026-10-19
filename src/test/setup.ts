import '@testing-library/jest-dom';

// Force mock services during tests
if (typeof import.meta !== 'undefined' && import.meta.env) {
  (import.meta.env as any).VITE_USE_MOCK = 'true';
} else {
  // @ts-expect-error — globalThis.import is not typed but needed for test environment
  globalThis.import = { meta: { env: { VITE_USE_MOCK: 'true' } } };
}

// Polyfill window.matchMedia if not available in jsdom
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // Polyfill window.print
  window.print = () => {};
}
