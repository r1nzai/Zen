import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not implement the native Popover API — polyfill the methods so
// components that call them don't throw during tests.
HTMLElement.prototype.showPopover = vi.fn();
HTMLElement.prototype.hidePopover = vi.fn();
HTMLElement.prototype.togglePopover = vi.fn();
