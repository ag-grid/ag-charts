import { CleanupRegistry, EventEmitter } from 'ag-charts-core';

import type { Widget } from '../../widget/widget';
import type {
    DragWidgetEvent,
    MouseWidgetEvent,
    NativeMouseWidgetEvent,
    TouchSyntheticMouseWidgetEvent,
    TouchWidgetEvent,
    WidgetEventMap,
} from '../../widget/widgetEvents';

const DRAG_THRESHOLD_PX = 3;
const DOUBLE_TAP_TIMER_MS = 505;
const DOUBLE_TAP_THRESHOLD_PX = 30;

type TSynthetic = 'click' | 'dblclick';
type Device = MouseWidgetEvent['device'];

/**
 * A `DragInterpreterClickEvent` is either a native 'click' MouseEvent, or a synthetic click event fired by a single
 * finger 'touchstart' and 'touchend'.
 */
export type DragInterpreterClickEvent = NativeMouseWidgetEvent<'click'> | TouchSyntheticMouseWidgetEvent<'click'>;

/**
 * A `DragInterpreterDblClickEvent` is either a native 'dblclick' MouseEvent, or a synthetic click event fired by two
 * finger 'touchstart' and 'touchend' in quick succession (DOUBLE_TAP_TIMER_MS).
 */
export type DragInterpreterDblClickEvent =
    | NativeMouseWidgetEvent<'dblclick'>
    | TouchSyntheticMouseWidgetEvent<'dblclick'>;

type WE<D extends Device> = DragWidgetEvent & { device: D };
function makeSynthetic<T extends TSynthetic>(type: T, event: WE<'mouse'>): MouseWidgetEvent<T> & { device: 'mouse' };
function makeSynthetic<T extends TSynthetic>(type: T, event: WE<'touch'>): MouseWidgetEvent<T> & { device: 'touch' };
function makeSynthetic(type: TSynthetic, event: DragWidgetEvent) {
    const { device, offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent } = event;
    return { type, device, offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent };
}

function checkDragDistance(dx: number, dy: number) {
    const distanceSquared = dx * dx + dy * dy;
    const thresholdSquared = DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX;
    return distanceSquared >= thresholdSquared;
}

function checkDoubleTapDistance(t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    const distanceSquared = dx * dx + dy * dy;
    const thresholdSquared = DOUBLE_TAP_THRESHOLD_PX * DOUBLE_TAP_THRESHOLD_PX;
    return distanceSquared < thresholdSquared;
}

type EventMap = Omit<WidgetEventMap, 'click' | 'dblclick'> & {
    click: DragInterpreterClickEvent;
    dblclick: DragInterpreterDblClickEvent;
};

/**
 * In the interest of robustness (and simplicity), the Widget class always dispatches these events after mousedown &
 * mouseup events for the left-button:
 *
 * -   One 'drag-start'
 * -   Zero or more 'drag-move'
 * -   One 'drag-end'
 * -   Zero or one 'click' (only dispatched if the mouseup event is on target).
 *
 * To distinguish between drag and click actions, use this class. It ensure that for each mousedown-mouseup pair, it
 * dispatches either a set of 'drag-*' events or a single 'click' event but not both.
 */
export class DragInterpreter {
    private readonly cleanup = new CleanupRegistry();
    readonly events = new EventEmitter<EventMap>();

    private dragStartEvent?: DragWidgetEvent<'drag-start'>;
    private isDragging = false;
    private lastClick?: { time: number; clientX: number; clientY: number };
    private readonly touch = { distanceTravelledX: 0, distanceTravelledY: 0, clientX: 0, clientY: 0 };

    constructor(widget: Widget) {
        this.cleanup.register(
            widget.addListener('touchstart', this.onTouchStart.bind(this)),
            widget.addListener('touchmove', this.onTouchMove.bind(this)),
            widget.addListener('touchend', this.onTouchEnd.bind(this)),
            widget.addListener('mousemove', this.onMouseMove.bind(this)),
            widget.addListener('dblclick', this.onDblClick.bind(this)),
            widget.addListener('drag-start', this.onDragStart.bind(this)),
            widget.addListener('drag-move', this.onDragMove.bind(this)),
            widget.addListener('drag-end', this.onDragEnd.bind(this))
        );
    }

    destroy(): void {
        this.cleanup.flush();
    }

    private onTouchStart(e: TouchWidgetEvent<'touchstart'>) {
        const { clientX, clientY } = e.sourceEvent.targetTouches[0] ?? { clientX: Infinity, clientY: Infinity };
        this.touch.distanceTravelledX = 0;
        this.touch.distanceTravelledY = 0;
        this.touch.clientX = clientX;
        this.touch.clientY = clientY;
    }

    private onTouchMove(e: TouchWidgetEvent<'touchmove'>) {
        const { clientX, clientY } = e.sourceEvent.targetTouches[0] ?? { clientX: Infinity, clientY: Infinity };
        this.touch.distanceTravelledX += Math.abs(this.touch.clientX - clientX);
        this.touch.distanceTravelledY += Math.abs(this.touch.clientY - clientY);
        this.touch.clientX = clientX;
        this.touch.clientY = clientY;
    }

    private onTouchEnd(event: TouchWidgetEvent<'touchend'>) {
        // Suppress the browser's MouseEvent emulation on touch devices. Emulation not standardised, iOS Webkit
        // dispatches hover events if the <div> element is blurred, or click events if the <div> element is focused. On
        // the other hand, Chromium Blink and Firefox Gecko always emulate a mouse click on the <div>.        //
        // We'll emulate mouse click and hover events in this class to ensure consistent and predictable behaviour.
        event.sourceEvent.preventDefault();
    }

    private onMouseMove(event: MouseWidgetEvent<'mousemove'>) {
        this.events.emit('mousemove', event);
    }

    private onDblClick(event: MouseWidgetEvent<'dblclick'>) {
        this.events.emit('dblclick', event);
    }

    private onDragStart(event: DragWidgetEvent<'drag-start'>) {
        this.dragStartEvent = event;
    }

    private onDragMove(event: DragWidgetEvent<'drag-move'>) {
        if (this.dragStartEvent != null) {
            if (checkDragDistance(event.originDeltaX, event.originDeltaY)) {
                this.events.emit('drag-start', this.dragStartEvent);
                this.events.emit('drag-move', { ...this.dragStartEvent, type: 'drag-move' });
                this.dragStartEvent = undefined;
                this.isDragging = true;
            }
        }

        if (this.isDragging) {
            this.events.emit('drag-move', event);
        }
    }

    private onDragEnd(event: DragWidgetEvent<'drag-end'>) {
        if (this.isDragging) {
            this.events.emit('drag-end', event);
            this.isDragging = false;
            return;
        }

        if (event.device === 'mouse') {
            const click = makeSynthetic('click', event);
            this.events.emit('click', click);
        }
        // ignore 'drag-end' events from 'touchstart' or 'touchcancel'
        else if (event.sourceEvent.type === 'touchend') {
            if (checkDragDistance(this.touch.distanceTravelledX, this.touch.distanceTravelledY)) {
                return; // this is a drag not a click, do not dispatch a 'click' event.
            }

            const click = makeSynthetic('click', event);
            this.events.emit('click', click);

            // Handle double-click logic
            const now = Date.now();
            if (
                this.lastClick !== undefined &&
                now - this.lastClick.time <= DOUBLE_TAP_TIMER_MS &&
                checkDoubleTapDistance(this.lastClick, event)
            ) {
                const dblClick = makeSynthetic('dblclick', event);
                this.events.emit('dblclick', dblClick);
                this.lastClick = undefined;
            } else {
                this.lastClick = { time: now, clientX: event.clientX, clientY: event.clientY };
            }
        }
    }
}
