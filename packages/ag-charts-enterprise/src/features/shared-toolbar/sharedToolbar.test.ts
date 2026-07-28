import { describe, expect, it, vi } from 'vitest';

import { SharedToolbar } from './sharedToolbar';

// The width cache is exercised via the private helper directly: JSDOM reports offsetWidth as 0, so
// a full-chart test cannot drive the non-zero measurement path this cache is about.
interface SharedToolbarInternals {
    measureWidth(toolbar: { getBounds(): { width: number } }): number;
    invalidateWidthCache(): void;
    sectionButtons: Record<string, Array<{ label?: string; icon?: string; iconPosition?: string }>>;
    activeSections: Set<string>;
}

function createSharedToolbar(): SharedToolbarInternals {
    const instance = Object.create(SharedToolbar.prototype) as SharedToolbarInternals;
    instance.sectionButtons = { chartToolbar: [{ icon: 'candlestick' }], annotations: [] };
    instance.activeSections = new Set(['chartToolbar']);
    return instance;
}

describe('SharedToolbar width caching', () => {
    it('measures once and reuses the width while the button content is unchanged', () => {
        const toolbar = createSharedToolbar();
        const shared = { getBounds: vi.fn(() => ({ width: 96 })) };

        expect(toolbar.measureWidth(shared)).toBe(96);
        expect(toolbar.measureWidth(shared)).toBe(96);
        expect(shared.getBounds).toHaveBeenCalledTimes(1);
    });

    it('re-measures when a button icon changes', () => {
        const toolbar = createSharedToolbar();
        const shared = { getBounds: vi.fn(() => ({ width: 96 })) };

        toolbar.measureWidth(shared);
        toolbar.sectionButtons.chartToolbar = [{ icon: 'line' }];
        toolbar.measureWidth(shared);

        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });

    it('re-measures when a section becomes active', () => {
        const toolbar = createSharedToolbar();
        const shared = { getBounds: vi.fn(() => ({ width: 96 })) };

        toolbar.measureWidth(shared);
        toolbar.activeSections.add('annotations');
        toolbar.sectionButtons.annotations = [{ icon: 'trend-line' }];
        toolbar.measureWidth(shared);

        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });

    // Text metrics are not part of the signature, so the `font:load` listener must reset the cache;
    // without this a late webfont leaves the width pinned to fallback-font metrics.
    it('re-measures after the cache is invalidated by a font load', () => {
        const toolbar = createSharedToolbar();
        const shared = { getBounds: vi.fn(() => ({ width: 96 })) };

        toolbar.measureWidth(shared);
        toolbar.invalidateWidthCache();

        expect(toolbar.measureWidth(shared)).toBe(96);
        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });

    it('never caches a zero width (toolbar not yet laid out)', () => {
        const toolbar = createSharedToolbar();
        const shared = { getBounds: vi.fn(() => ({ width: 0 })) };

        expect(toolbar.measureWidth(shared)).toBe(0);
        expect(toolbar.measureWidth(shared)).toBe(0);
        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });
});
