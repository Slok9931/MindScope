// jsdom has no layout engine: give charts a width, and route relative /api calls to a running backend.
import { vi } from "vitest";

globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 640 });
HTMLElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, right: 640, bottom: 300, width: 640, height: 300, x: 0, y: 0 });
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();

const realFetch = globalThis.fetch;
globalThis.fetch = (url, opts) => realFetch(typeof url === "string" && url.startsWith("/") ? `http://127.0.0.1:8000${url}` : url, opts);
