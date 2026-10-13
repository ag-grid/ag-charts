import { describe, expect, it } from 'vitest';

import { WidgetEventUtil } from './widgetEvents';

interface RectStub {
    x: number;
    y: number;
    width: number;
    height: number;
}

function makeElement(rect: RectStub, clientWidth: number, clientHeight: number): HTMLElement {
    const fullRect = { ...rect, top: rect.y, left: rect.x, right: rect.x + rect.width, bottom: rect.y + rect.height };
    return {
        getBoundingClientRect: () => fullRect as DOMRect,
        clientWidth,
        clientHeight,
    } as unknown as HTMLElement;
}

describe('WidgetEventUtil.calcCurrentXY', () => {
    it('returns rect-relative coordinates with no ancestor transform', () => {
        const elem = makeElement({ x: 10, y: 20, width: 100, height: 50 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(elem, { clientX: 60, clientY: 45 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('recovers canvas-local coordinates under a uniform scale(0.5)', () => {
        // Canvas is 100x50 in layout pixels; rendered at 50x25 due to ancestor scale(0.5).
        const elem = makeElement({ x: 10, y: 20, width: 50, height: 25 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(elem, { clientX: 35, clientY: 32.5 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('recovers canvas-local coordinates under a uniform scale(2)', () => {
        const elem = makeElement({ x: 0, y: 0, width: 200, height: 100 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(elem, { clientX: 100, clientY: 50 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('handles non-uniform scale(1, 2) with independent per-axis ratios', () => {
        const elem = makeElement({ x: 0, y: 0, width: 100, height: 100 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(elem, { clientX: 50, clientY: 50 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('continues to work under a translate-only ancestor transform', () => {
        const elem = makeElement({ x: 200, y: 150, width: 100, height: 50 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(elem, { clientX: 250, clientY: 175 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('falls back to a scale ratio of 1 on a degenerate zero-size rect', () => {
        const elem = makeElement({ x: 0, y: 0, width: 0, height: 0 }, 0, 0);
        const result = WidgetEventUtil.calcCurrentXY(elem, { clientX: 50, clientY: 25 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });
});
