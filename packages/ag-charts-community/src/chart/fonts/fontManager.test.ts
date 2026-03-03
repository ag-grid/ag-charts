import { describe, expect, it, jest } from '@jest/globals';

import { EventEmitter } from 'ag-charts-core';

import type { EventsHubMap } from '../../core/eventsHub';
import type { DOMManager } from '../../dom/domManager';
import { FontManager } from './fontManager';

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
        addStyles: jest.fn(),
        addChild: jest.fn(),
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
        const fontManager = new FontManager(domManager, eventsHub);

        const handler = jest.fn();
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
        const fontManager = new FontManager(domManager, eventsHub);

        const handler = jest.fn();
        eventsHub.on('font:load', handler);

        fontManager.updateFonts(new Set(['Roboto']));

        // Simulate an initial observation with zero width (no font change yet)
        resizeObserverCallback?.(
            [{ contentBoxSize: [{ inlineSize: 0 }] }] as unknown as ResizeObserverEntry[],
            {} as ResizeObserver
        );

        expect(handler).not.toHaveBeenCalled();
    });
});
