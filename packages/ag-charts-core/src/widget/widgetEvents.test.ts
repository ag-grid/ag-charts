import { describe, expect, it } from 'vitest';

import type { ClientPoint } from '../types/scene';
import { NativeWidget } from './nativeWidget';
import type { CanvasOrigin, DragWidgetEvent, MouseWidgetEvent, WidgetTarget } from './widgetEvents';
import { WidgetEventUtil } from './widgetEvents';

interface RectStub {
    x: number;
    y: number;
    width: number;
    height: number;
}

function makeTarget(rect: RectStub, clientWidth: number, clientHeight: number): WidgetTarget {
    const fullRect = { ...rect, top: rect.y, left: rect.x, right: rect.x + rect.width, bottom: rect.y + rect.height };
    const element = {
        getBoundingClientRect: () => fullRect as DOMRect,
        clientWidth,
        clientHeight,
    } as unknown as HTMLElement;
    return { getElement: () => element, getCanvasOrigin: () => undefined };
}

function makeOriginTarget(origin: CanvasOrigin | undefined): WidgetTarget {
    return { getElement: () => document.createElement('div'), getCanvasOrigin: () => origin };
}

describe('WidgetEventUtil.calcCurrentXY', () => {
    it('returns rect-relative coordinates with no ancestor transform', () => {
        const target = makeTarget({ x: 10, y: 20, width: 100, height: 50 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(target, { clientX: 60, clientY: 45 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('recovers canvas-local coordinates under a uniform scale(0.5)', () => {
        // Canvas is 100x50 in layout pixels; rendered at 50x25 due to ancestor scale(0.5).
        const target = makeTarget({ x: 10, y: 20, width: 50, height: 25 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(target, { clientX: 35, clientY: 32.5 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('recovers canvas-local coordinates under a uniform scale(2)', () => {
        const target = makeTarget({ x: 0, y: 0, width: 200, height: 100 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(target, { clientX: 100, clientY: 50 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('handles non-uniform scale(1, 2) with independent per-axis ratios', () => {
        const target = makeTarget({ x: 0, y: 0, width: 100, height: 100 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(target, { clientX: 50, clientY: 50 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('continues to work under a translate-only ancestor transform', () => {
        const target = makeTarget({ x: 200, y: 150, width: 100, height: 50 }, 100, 50);
        const result = WidgetEventUtil.calcCurrentXY(target, { clientX: 250, clientY: 175 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });

    it('falls back to a scale ratio of 1 on a degenerate zero-size rect', () => {
        const target = makeTarget({ x: 0, y: 0, width: 0, height: 0 }, 0, 0);
        const result = WidgetEventUtil.calcCurrentXY(target, { clientX: 50, clientY: 25 });
        expect(result).toEqual({ currentX: 50, currentY: 25 });
    });
});

describe('WidgetEventUtil.calcCanvasXY', () => {
    it('delegates to the canvas origin', () => {
        const origin = {
            toCanvasPoint: ({ clientX, clientY }: ClientPoint) => ({ canvasX: clientX - 10, canvasY: clientY - 20 }),
        };
        expect(WidgetEventUtil.calcCanvasXY(makeOriginTarget(origin), { clientX: 60, clientY: 45 })).toEqual({
            canvasX: 50,
            canvasY: 25,
        });
    });

    it('returns NaN without a canvas origin', () => {
        expect(WidgetEventUtil.calcCanvasXY(makeOriginTarget(undefined), { clientX: 60, clientY: 45 })).toEqual({
            canvasX: Number.NaN,
            canvasY: Number.NaN,
        });
    });
});

describe('MouseWidgetEvent canvasX / canvasY', () => {
    const origin = {
        toCanvasPoint: ({ clientX, clientY }: ClientPoint) => ({ canvasX: clientX - 5, canvasY: clientY - 5 }),
    };

    function dispatchMouseMove(target: NativeWidget, listener: NativeWidget, clientX: number, clientY: number) {
        let received: MouseWidgetEvent<'mousemove'> | undefined;
        listener.addListener('mousemove', (event) => (received = event));
        target.getElement().dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX, clientY }));
        return received;
    }

    it('is the same for listeners on nested widgets with different origins', () => {
        const parent = new NativeWidget(document.createElement('div'));
        const child = new NativeWidget(document.createElement('div'));
        parent.addChild(child);
        parent.setCanvasOrigin(origin);

        const onParent = dispatchMouseMove(child, parent, 30, 40);
        const onChild = dispatchMouseMove(child, child, 30, 40);
        expect(onParent).toMatchObject({ canvasX: 25, canvasY: 35 });
        expect(onChild).toMatchObject({ canvasX: 25, canvasY: 35 });
    });

    it('prefers the nearest canvas origin in the widget tree', () => {
        const parent = new NativeWidget(document.createElement('div'));
        const child = new NativeWidget(document.createElement('div'));
        parent.addChild(child);
        parent.setCanvasOrigin(origin);
        child.setCanvasOrigin({ toCanvasPoint: () => ({ canvasX: 1, canvasY: 2 }) });

        expect(child.getCanvasOrigin()).not.toBe(origin);
        expect(dispatchMouseMove(child, child, 30, 40)).toMatchObject({ canvasX: 1, canvasY: 2 });
    });

    it('is NaN for widgets outside a chart widget tree', () => {
        const widget = new NativeWidget(document.createElement('div'));
        const event = dispatchMouseMove(widget, widget, 30, 40);
        expect(event?.canvasX).toBeNaN();
        expect(event?.canvasY).toBeNaN();
    });
});

describe('DragWidgetEvent canvasX / canvasY', () => {
    // Mimics an ancestor `scale(0.5)`: one screen pixel is two canvas pixels.
    const scaledOrigin = {
        toCanvasPoint: ({ clientX, clientY }: ClientPoint) => ({
            canvasX: (clientX - 10) / 0.5,
            canvasY: (clientY - 20) / 0.5,
        }),
    };

    function pointer(type: string, clientX: number, clientY: number) {
        const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY });
        Object.defineProperties(event, {
            pointerId: { value: 1 },
            pointerType: { value: 'mouse' },
            pageX: { value: clientX },
            pageY: { value: clientY },
        });
        return event;
    }

    it('converts drag movement into canvas units under an ancestor scale', () => {
        const widget = new NativeWidget(document.createElement('div'));
        widget.setCanvasOrigin(scaledOrigin);
        const element = widget.getElement();
        Object.assign(element, { setPointerCapture() {}, releasePointerCapture() {} });

        const received: DragWidgetEvent[] = [];
        widget.addListener('drag-start', (event) => received.push(event));
        widget.addListener('drag-move', (event) => received.push(event));
        widget.addListener('drag-end', (event) => received.push(event));

        element.dispatchEvent(pointer('pointerdown', 60, 45));
        element.dispatchEvent(pointer('pointermove', 70, 55));
        element.dispatchEvent(pointer('pointerup', 70, 55));

        expect(received.map(({ type, canvasX, canvasY }) => ({ type, canvasX, canvasY }))).toEqual([
            { type: 'drag-start', canvasX: 100, canvasY: 50 },
            { type: 'drag-move', canvasX: 120, canvasY: 70 },
            { type: 'drag-end', canvasX: 120, canvasY: 70 },
        ]);
    });
});
