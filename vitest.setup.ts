import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
