import '@testing-library/jest-dom';
import { vi } from 'vite-plus/test';

// jsdom does not implement the native Popover API — polyfill the methods so
// components that call them don't throw during tests.
// Skipped for tests that opt into the node environment (e.g. SSR tests).
if (typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.showPopover = vi.fn();
    HTMLElement.prototype.hidePopover = vi.fn();
    HTMLElement.prototype.togglePopover = vi.fn();
}

// Nor modal <dialog>: open and close by toggling the attribute.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
        this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
        this.open = false;
        this.dispatchEvent(new Event('close'));
    };
}

// jsdom has no canvas/WebGL: pin the graphics mode so components don't try to detect it.
// (utils/graphics.test.ts clears this to test detection itself.)
if (typeof document !== 'undefined') document.documentElement.setAttribute('data-zen-graphics', 'full');

// Nor ResizeObserver: a no-op, as jsdom lays nothing out to observe.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
    window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
