import { mockCanvas, toMatchImage } from '_ag-charts-test';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { URL } from 'node:url';
import { TextDecoder, TextEncoder } from 'node:util';
import { DOMMatrix, Image, Path2D } from 'skia-canvas';
import { expect, vi } from 'vitest';

// @ts-expect-error types don't exactly align
globalThis.Canvas = mockCanvas.ConfiguredCanvas;

// @ts-expect-error types don't exactly align
globalThis.OffscreenCanvas = mockCanvas.ConfiguredCanvas;

// @ts-expect-error types don't exactly align
globalThis.DOMMatrix ??= DOMMatrix;

// @ts-expect-error types don't exactly align
globalThis.Image = Image;

// @ts-expect-error types don't exactly align
globalThis.Path2D ??= Path2D;

// @ts-expect-error types don't exactly align
globalThis.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder as any;

// @ts-expect-error types don't exactly align
globalThis.URL = URL;

const TOGGLE_POPOVER_ATTRIBUTE = 'data-presented-as-popover';
globalThis.HTMLElement.prototype.togglePopover = function (visible) {
    visible ??= !this.hasAttribute(TOGGLE_POPOVER_ATTRIBUTE);

    if (visible) {
        this.setAttribute(TOGGLE_POPOVER_ATTRIBUTE, '');
    } else {
        this.removeAttribute(TOGGLE_POPOVER_ATTRIBUTE);
    }

    return visible;
};

const origMatches = globalThis.HTMLElement.prototype.matches;
globalThis.HTMLElement.prototype.matches = function (selector: string): boolean {
    if (selector === ':focus-visible') {
        return false;
    }
    try {
        return origMatches.call(this, selector);
    } catch {
        return false;
    }
};

// Vitest's jsdom window doesn't pass jsdom's own `instanceof Window` check,
// so `new MouseEvent(type, { view: document.defaultView })` throws. Patch the
// constructor to retry without `view`, then re-attach it via defineProperty.
const OrigMouseEvent = globalThis.MouseEvent;
// @ts-expect-error patching global constructor
globalThis.MouseEvent = function MouseEvent(type: string, eventInitDict?: MouseEventInit) {
    try {
        return new OrigMouseEvent(type, eventInitDict);
    } catch (e) {
        if (e instanceof TypeError && String(e).includes('view is not of type Window')) {
            const { view, ...rest } = eventInitDict ?? {};
            const event = new OrigMouseEvent(type, rest);
            if (view != null) {
                Object.defineProperty(event, 'view', { value: view, configurable: true });
            }
            return event;
        }
        throw e;
    }
};
globalThis.MouseEvent.prototype = OrigMouseEvent.prototype;
Object.setPrototypeOf(globalThis.MouseEvent, OrigMouseEvent);

expect.extend({ toMatchImageSnapshot, toMatchImage });

vi.mock('./src/license/licenseManager');

const { setupEnterpriseModules } = await import('./src/setup');
setupEnterpriseModules();

const { ModuleRegistry } = await import('ag-charts-core');
ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.Enterprise);
