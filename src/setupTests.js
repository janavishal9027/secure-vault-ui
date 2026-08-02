// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// --- jsdom polyfills -------------------------------------------------------
//
// CRA 5 pins a jsdom that predates TextEncoder/TextDecoder being globals.
// React Router 7 uses them at import time, so without these every test that
// touches a routed component dies with "TextEncoder is not defined" before a
// single assertion runs.
//
// These are Node's own implementations, not stubs — jsdom simply does not
// expose them, so handing over the real ones is both correct and the smallest
// possible fix.
import { TextDecoder, TextEncoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// jsdom implements neither. MUI queries matchMedia for responsive styles, and
// anything observing layout constructs a ResizeObserver on mount.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
