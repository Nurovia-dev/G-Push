import '@testing-library/jest-dom';

// jsdom doesn't implement matchMedia
if (typeof window !== 'undefined' && !window.matchMedia) {
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
}

// jsdom doesn't have File polyfill fully — ensure it's available
if (typeof globalThis.File === 'undefined') {
  const { Blob } = require('buffer');
  globalThis.File = class File extends Blob {
    name: string;
    constructor(chunks: any[], name: string, opts: any = {}) {
      super(chunks, opts);
      this.name = name;
    }
  } as any;
}