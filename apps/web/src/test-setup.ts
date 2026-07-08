import "@testing-library/jest-dom";

// jsdom does not implement ResizeObserver, needed by @radix-ui/react-slider.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// jsdom does not implement IntersectionObserver, needed for infinite-scroll/reveal effects.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

// jsdom does not implement these, needed by @radix-ui/react-select.
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
