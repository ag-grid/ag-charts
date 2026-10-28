import { describe, expect, it, vi } from 'vitest';

import { SharedToolbar } from './sharedToolbar';

// The width cache is exercised via the private helper directly: JSDOM reports offsetWidth as 0, so
// a full-chart test cannot drive the non-zero measurement path this cache is about.
interface SharedToolbarInternals {
    measureWidth(toolbar: MeasuredToolbar): number;
    invalidateWidthCache(): void;
    sectionButtons: Record<string, Array<{ label?: string; icon?: string; iconPosition?: string }>>;
    sectionButtonSize: Record<string, number | undefined>;
    activeSections: Set<string>;
}

interface MeasuredToolbar {
    getBounds(): { width: number };
    getElement(): HTMLElement;
}

function createMeasuredToolbar(width: number) {
    const element = document.createElement('div');
    return { element, getBounds: vi.fn(() => ({ width })), getElement: () => element };
}

function createSharedToolbar(): SharedToolbarInternals {
    const instance = Object.create(SharedToolbar.prototype) as SharedToolbarInternals;
    instance.sectionButtons = { chartToolbar: [{ icon: 'candlestick' }], annotations: [] };
    instance.sectionButtonSize = { chartToolbar: undefined, annotations: undefined };
    instance.activeSections = new Set(['chartToolbar']);
    return instance;
}

describe('SharedToolbar width caching', () => {
    it('measures once and reuses the width while the button content is unchanged', () => {
        const toolbar = createSharedToolbar();
        const shared = createMeasuredToolbar(96);

        expect(toolbar.measureWidth(shared)).toBe(96);
        expect(toolbar.measureWidth(shared)).toBe(96);
        expect(shared.getBounds).toHaveBeenCalledTimes(1);
    });

    it('re-measures when a button icon changes', () => {
        const toolbar = createSharedToolbar();
        const shared = createMeasuredToolbar(96);

        toolbar.measureWidth(shared);
        toolbar.sectionButtons.chartToolbar = [{ icon: 'line' }];
        toolbar.measureWidth(shared);

        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });

    it('re-measures when a section becomes active', () => {
        const toolbar = createSharedToolbar();
        const shared = createMeasuredToolbar(96);

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
        const shared = createMeasuredToolbar(96);

        toolbar.measureWidth(shared);
        toolbar.invalidateWidthCache();

        expect(toolbar.measureWidth(shared)).toBe(96);
        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });

    it('re-measures when a section button size changes', () => {
        const toolbar = createSharedToolbar();
        const shared = createMeasuredToolbar(96);

        toolbar.measureWidth(shared);
        toolbar.sectionButtonSize.chartToolbar = 44;
        toolbar.measureWidth(shared);

        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });

    it('clears the inline width before re-measuring', () => {
        const toolbar = createSharedToolbar();
        const shared = createMeasuredToolbar(96);
        shared.element.style.width = '34px';

        toolbar.measureWidth(shared);

        expect(shared.element.style.width).toBe('');
    });

    it('never caches a zero width (toolbar not yet laid out)', () => {
        const toolbar = createSharedToolbar();
        const shared = createMeasuredToolbar(0);

        expect(toolbar.measureWidth(shared)).toBe(0);
        expect(toolbar.measureWidth(shared)).toBe(0);
        expect(shared.getBounds).toHaveBeenCalledTimes(2);
    });
});

// One pass in chart order: annotations measures first, then the chart toolbar adds a larger button.
describe('SharedToolbar layout pass', () => {
    interface LayoutBox {
        x: number;
        y: number;
        width: number;
        height: number;
        shrink(amount: number, position: 'left' | 'right'): void;
    }

    function createLayoutBox(): LayoutBox {
        return {
            x: 0,
            y: 0,
            width: 600,
            height: 400,
            shrink(amount, position) {
                if (position === 'left') this.x += amount;
                this.width -= amount;
            },
        };
    }

    function createPass(isRtl: boolean) {
        const element = document.createElement('div');
        let buttons: Array<{ buttonSize?: number }> = [];
        const sharedToolbar = {
            horizontalSpacing: 10,
            getElement: () => element,
            // The natural column width is the widest button (34px unless sized).
            getBounds: () => ({ width: Math.max(0, ...buttons.map((b) => b.buttonSize ?? 34)) }),
            setBounds: vi.fn(),
            updateButtons: (next: typeof buttons) => {
                buttons = next;
            },
            setButtonHiddenByIndex: vi.fn(),
            clearActiveButton: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
        };
        const instance = Object.create(SharedToolbar.prototype);
        Object.assign(instance, {
            ctx: { domManager: { isRtl } },
            sharedToolbar,
            activeSections: new Set(),
            sectionButtons: { annotations: [], chartToolbar: [] },
            sectionButtonSize: { annotations: undefined, chartToolbar: undefined },
        });
        const annotations = instance.toolbarWithSection('annotations');
        const chartToolbar = instance.toolbarWithSection('chartToolbar');
        return { sharedToolbar, annotations, chartToolbar };
    }

    it.each([false, true])('widens the column to the chart toolbar button size in one pass (rtl %s)', (isRtl) => {
        const { sharedToolbar, annotations, chartToolbar } = createPass(isRtl);
        chartToolbar.setButtonSize(44);
        annotations.updateButtons([{ icon: 'trend-line-drawing' }, { icon: 'text-annotation' }]);

        const layoutBox = createLayoutBox();
        annotations.layout(layoutBox, 20);
        chartToolbar.updateButtons([{ icon: 'candlestick-series' }]);
        chartToolbar.layout(layoutBox);

        expect(sharedToolbar.setBounds).toHaveBeenLastCalledWith({ x: isRtl ? 600 - 44 : 0, y: 0, width: 44 });
        expect(layoutBox.width).toBe(600 - (44 + 10 + 20));
        expect(layoutBox.x).toBe(isRtl ? 0 : 44 + 10 + 20);
    });

    it('does not adjust the layout box when the later section leaves the width unchanged', () => {
        const { sharedToolbar, annotations, chartToolbar } = createPass(false);
        annotations.updateButtons([{ icon: 'trend-line-drawing' }]);
        chartToolbar.updateButtons([{ icon: 'candlestick-series' }]);

        const layoutBox = createLayoutBox();
        annotations.layout(layoutBox, 20);
        chartToolbar.layout(layoutBox);

        expect(sharedToolbar.setBounds).toHaveBeenCalledTimes(1);
        expect(layoutBox.width).toBe(600 - (34 + 10 + 20));
    });
});
