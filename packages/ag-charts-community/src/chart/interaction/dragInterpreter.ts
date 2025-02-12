import { Listeners } from '../../util/listeners';
import type { Widget } from '../../widget/widget';
import type { DragWidgetEvent, MouseWidgetEvent, TouchWidgetEvent, WidgetEventMap } from '../../widget/widgetEvents';

const DRAG_THRESHOLD_PX = 3;
const DOUBLE_TAP_TIMER_MS = 505;

type TSythetic = 'click' | 'dblclick';
type SytheticMap<T extends TSythetic> = {
    mouse: { device: 'mouse' } & MouseWidgetEvent<T>;
    touch: { device: 'touch'; sourceEvent: TouchEvent } & Omit<MouseWidgetEvent<T>, 'sourceEvent'>;
};
type Device = keyof SytheticMap<TSythetic>;
type SyntheticEvent<D extends Device, T extends TSythetic> = SytheticMap<T>[D];

/**
 * A `DragInterpreterClickEvent` is either a native 'click' MouseEvent, or a sythetic click event fired by a single
 * finger 'touchstart' and 'touchend'.
 */
type MouseClick = SyntheticEvent<'mouse', 'click'>;
type TouchClick = SyntheticEvent<'touch', 'click'>;
export type DragInterpreterClickEvent = MouseClick | TouchClick;

/**
 * A `DragInterpreterDblClickEvent` is either a native 'dblclick' MouseEvent, or a sythetic click event fired by two
 * finger 'touchstart' and 'touchend' in quick succession (DOUBLE_TAP_TIMER_MS).
 */
type MouseDblClick = SyntheticEvent<'mouse', 'dblclick'>;
type TouchDblClick = SyntheticEvent<'touch', 'dblclick'>;
export type DragInterpreterDblClickEvent = MouseDblClick | TouchDblClick;

type WE<D extends Device> = DragWidgetEvent & { device: D };
function makeSynthetic<T extends TSythetic>(device: 'mouse', type: T, event: WE<'mouse'>): SyntheticEvent<'mouse', T>;
function makeSynthetic<T extends TSythetic>(device: 'touch', type: T, event: WE<'touch'>): SyntheticEvent<'touch', T>;
function makeSynthetic(device: Device, type: TSythetic, event: DragWidgetEvent) {
    const { offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent } = event;
    return { type, device, offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent };
}

function checkDistanceSquared(dx: number, dy: number) {
    const distanceSquared = dx * dx + dy * dy;
    const thresholdSquared = DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX;
    return distanceSquared >= thresholdSquared;
}

type Type = 'mousemove' | 'click' | 'dblclick' | 'drag-start' | 'drag-move' | 'drag-end';
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
    private readonly destroyFns: (() => void)[] = [];
    private readonly listeners = new Listeners<Type, (e: unknown) => void>();

    private dragStartEvent?: DragWidgetEvent<'drag-start'>;
    private isDragging = false;
    private lastClickTime?: number;
    private readonly touch = { distanceTravelledX: 0, distanceTravelledY: 0, clientX: 0, clientY: 0 };

    constructor(widget: Widget) {
        this.destroyFns.push(
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
        this.destroyFns.forEach((fn) => fn());
        this.listeners.destroy();
    }

    addListener<T extends Type>(type: T, handler: (e: EventMap[T]) => void): () => void;
    addListener<T extends Type>(type: T, handler: (e: unknown) => void): () => void {
        return this.listeners.addListener(type, handler);
    }

    private dispatch(event: EventMap[Type]) {
        this.listeners.dispatch(event.type, event);
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
        // the other hand, Chromium Blink and Firefox Gecko always enumlate a mouse click the on <div>.
        //
        // We'll emulate mouse click and hover events in this class to ensure consistent and predictable behaviour.
        event.sourceEvent.preventDefault();
    }

    private onMouseMove(event: MouseWidgetEvent<'mousemove'>) {
        this.dispatch(event);
    }

    private onDblClick(event: MouseWidgetEvent<'dblclick'>) {
        this.dispatch({ device: 'mouse', ...event });
    }

    private onDragStart(event: DragWidgetEvent<'drag-start'>) {
        this.dragStartEvent = event;
    }

    private onDragMove(event: DragWidgetEvent<'drag-move'>) {
        if (this.dragStartEvent != null) {
            if (checkDistanceSquared(event.originDeltaX, event.originDeltaY)) {
                this.dispatch(this.dragStartEvent);
                this.dispatch({ ...this.dragStartEvent, type: 'drag-move' });
                this.dragStartEvent = undefined;
                this.isDragging = true;
            }
        }

        if (this.isDragging) {
            this.dispatch(event);
        }
    }

    private onDragEnd(event: DragWidgetEvent<'drag-end'>) {
        if (this.isDragging) {
            this.dispatch(event);
            this.isDragging = false;
            return;
        }

        if (event.device === 'mouse') {
            const click = makeSynthetic('mouse', 'click', event);
            this.dispatch(click);
        }
        // ignore 'drag-end' events from 'touchstart' or 'touchcancel'
        else if (event.sourceEvent.type === 'touchend') {
            if (checkDistanceSquared(this.touch.distanceTravelledX, this.touch.distanceTravelledY)) {
                return; // this is a drag not a click, do not dispatch a 'click' event.
            }

            const click = makeSynthetic('touch', 'click', event);
            this.dispatch(click);

            // Handle double-click logic
            const now = Date.now();
            if (this.lastClickTime !== undefined && now - this.lastClickTime <= DOUBLE_TAP_TIMER_MS) {
                const dblClick = makeSynthetic(event.device, 'dblclick', event);
                this.dispatch(dblClick);
                this.lastClickTime = undefined;
            } else {
                this.lastClickTime = now;
            }
        }
    }
}
