import "@testing-library/jest-dom";

// jsdom does not implement ResizeObserver, needed by @radix-ui/react-slider.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
