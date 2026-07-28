import { afterEach, describe, expect, it, vi } from 'vitest';

import { type DynamicContext, EventEmitter } from 'ag-charts-core';

import type { EventsHubMap } from '../../core/eventsHub';
import type { DOMManager } from '../../dom/domManager';
import type { ChartRegistry } from '../../module/moduleContext';
import { FontManager } from './fontManager';

// `getDocument('fonts')` (used by waitForFonts) reads the global document's FontFaceSet, so
// override it per-test to exercise the path without relying on the jsdom font stub.
const realFontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts');
function setDocumentFonts(fonts: unknown) {
    Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
}
afterEach(() => {
    if (realFontsDescriptor) {
        Object.defineProperty(document, 'fonts', realFontsDescriptor);
    } else {
        delete (document as any).fonts;
    }
});

// Capture the ResizeObserver callback so we can simulate a font load
let resizeObserverCallback: ResizeObserverCallback | undefined;

class MockResizeObserver {
    constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}

// Install mock before importing fontManager (getResizeObserver reads globalThis)
(globalThis as any).ResizeObserver = MockResizeObserver;

function createMockDomManager(): DOMManager {
    return {
        addStyles: vi.fn(),
        addChild: vi.fn(),
        getDocument: () => ({
            createElement: (_tag: string, _styles: Record<string, string>) => ({
                textContent: '',
            }),
        }),
    } as unknown as DOMManager;
}

describe('FontManager', () => {
    it('should emit font:load on eventsHub when a font loads', () => {
        const eventsHub = new EventEmitter<EventsHubMap>();
        const domManager = createMockDomManager();
        const fontManager = new FontManager({ domManager, eventsHub } as unknown as DynamicContext<ChartRegistry>);

        const handler = vi.fn();
        eventsHub.on('font:load', handler);

        fontManager.updateFonts(new Set(['Pacifico']));

        // Simulate the ResizeObserver firing (font metrics changed)
        resizeObserverCallback?.(
            [{ contentBoxSize: [{ inlineSize: 42 }] }] as unknown as ResizeObserverEntry[],
            {} as ResizeObserver
        );

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not emit font:load when observed width is zero', () => {
        const eventsHub = new EventEmitter<EventsHubMap>();
        const domManager = createMockDomManager();
        const fontManager = new FontManager({ domManager, eventsHub } as unknown as DynamicContext<ChartRegistry>);

        const handler = vi.fn();
        eventsHub.on('font:load', handler);

        fontManager.updateFonts(new Set(['Roboto']));

        // Simulate an initial observation with zero width (no font change yet)
        resizeObserverCallback?.(
            [{ contentBoxSize: [{ inlineSize: 0 }] }] as unknown as ResizeObserverEntry[],
            {} as ResizeObserver
        );

        expect(handler).not.toHaveBeenCalled();
    });

    function createFontManager() {
        const eventsHub = new EventEmitter<EventsHubMap>();
        const fontManager = new FontManager({
            domManager: createMockDomManager(),
            eventsHub,
        } as unknown as DynamicContext<ChartRegistry>);
        const handler = vi.fn();
        eventsHub.on('font:load', handler);
        return { fontManager, handler };
    }

    it('waitForFonts loads the exact weight-specific shorthand and emits font:load once it settles', async () => {
        const { fontManager, handler } = createFontManager();
        const fontSet = { check: vi.fn().mockReturnValue(false), load: vi.fn().mockResolvedValue([]) };
        setDocumentFonts(fontSet);

        fontManager.waitForFonts(new Set(['900 16px "Font Awesome 6 Free"']));

        expect(fontSet.load).toHaveBeenCalledWith('900 16px "Font Awesome 6 Free"');
        await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    });

    it('waitForFonts skips already-available fonts and does not re-render', async () => {
        const { fontManager, handler } = createFontManager();
        const fontSet = { check: vi.fn().mockReturnValue(true), load: vi.fn() };
        setDocumentFonts(fontSet);

        fontManager.waitForFonts(new Set(['16px Arial']));

        expect(fontSet.load).not.toHaveBeenCalled();
        await Promise.resolve();
        expect(handler).not.toHaveBeenCalled();
    });

    it('waitForFonts checks each confirmed spec only once across updates', () => {
        const { fontManager } = createFontManager();
        const fontSet = { check: vi.fn().mockReturnValue(true), load: vi.fn() };
        setDocumentFonts(fontSet);

        fontManager.waitForFonts(new Set(['16px Arial']));
        fontManager.waitForFonts(new Set(['16px Arial']));

        expect(fontSet.check).toHaveBeenCalledTimes(1);
    });

    it('waitForFonts still checks a newly-referenced spec once', () => {
        const { fontManager } = createFontManager();
        const fontSet = { check: vi.fn().mockReturnValue(true), load: vi.fn() };
        setDocumentFonts(fontSet);

        fontManager.waitForFonts(new Set(['16px Arial']));
        fontManager.waitForFonts(new Set(['16px Arial', '16px Roboto']));

        expect(fontSet.check).toHaveBeenCalledTimes(2);
        expect(fontSet.check).toHaveBeenNthCalledWith(2, '16px Roboto');
    });

    it('waitForFonts re-checks a confirmed spec after a font-set loadingdone event', () => {
        const { fontManager } = createFontManager();
        const listeners: Record<string, () => void> = {};
        const fontSet = {
            check: vi.fn().mockReturnValue(true),
            load: vi.fn(),
            addEventListener: vi.fn((type: string, handler: () => void) => {
                listeners[type] = handler;
            }),
            removeEventListener: vi.fn(),
        };
        setDocumentFonts(fontSet);

        fontManager.waitForFonts(new Set(['16px Arial']));
        expect(fontSet.check).toHaveBeenCalledTimes(1);

        // A late @font-face load fires loadingdone; the cached verdict must be dropped and re-checked.
        listeners.loadingdone?.();
        fontManager.waitForFonts(new Set(['16px Arial']));

        expect(fontSet.check).toHaveBeenCalledTimes(2);
    });

    // Font availability is per-document, so verdicts cached against the previous set cannot carry
    // over when the chart is moved into another document.
    it('waitForFonts re-checks a confirmed spec against a swapped font set and detaches the old one', () => {
        const { fontManager } = createFontManager();
        const createFontSet = () => ({
            check: vi.fn().mockReturnValue(true),
            load: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        const first = createFontSet();
        setDocumentFonts(first);
        fontManager.waitForFonts(new Set(['16px Arial']));

        const second = createFontSet();
        setDocumentFonts(second);
        fontManager.waitForFonts(new Set(['16px Arial']));

        expect(second.check).toHaveBeenCalledWith('16px Arial');
        expect(first.removeEventListener).toHaveBeenCalledTimes(2);
    });

    it('waitForFonts re-checks an unconfirmed spec until it becomes available', () => {
        const { fontManager } = createFontManager();
        const fontSet = { check: vi.fn().mockReturnValue(false), load: vi.fn().mockResolvedValue([]) };
        setDocumentFonts(fontSet);

        fontManager.waitForFonts(new Set(['16px Arial']));
        fontManager.waitForFonts(new Set(['16px Arial']));

        expect(fontSet.check).toHaveBeenCalledTimes(2);
    });

    it('waitForFonts is a no-op without a document FontFaceSet (SSR)', async () => {
        const { fontManager, handler } = createFontManager();
        setDocumentFonts(undefined);

        expect(() => fontManager.waitForFonts(new Set(['16px Roboto']))).not.toThrow();
        await Promise.resolve();
        expect(handler).not.toHaveBeenCalled();
    });

    it('waitForFonts does not emit after the chart is destroyed', async () => {
        const { fontManager, handler } = createFontManager();
        let resolveLoad: () => void = () => {};
        const loadPromise = new Promise<void>((resolve) => {
            resolveLoad = resolve;
        });
        const fontSet = { check: vi.fn().mockReturnValue(false), load: vi.fn().mockReturnValue(loadPromise) };
        setDocumentFonts(fontSet);

        fontManager.waitForFonts(new Set(['16px Roboto']));
        fontManager.destroy();
        resolveLoad();
        await loadPromise;
        await Promise.resolve();

        expect(handler).not.toHaveBeenCalled();
    });
});
