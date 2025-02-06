import { Listeners } from '../../util/listeners';
import type { Widget } from '../../widget/widget';
import type { DragWidgetEvent, MouseWidgetEvent, TouchWidgetEvent, WidgetEventMap } from '../../widget/widgetEvents';

const DRAG_THRESHOLD_PX = 3;

/**
 * A `DragInterpreterClickEvent` is either a native 'click' MouseEvent, or a sythetic click event fired by single finger
 * 'touchstart' and 'touchend'.
 */
type MouseClick = { device: 'mouse' } & MouseWidgetEvent<'click'>;
type TouchClick = { device: 'touch'; sourceEvent: TouchEvent } & Omit<MouseWidgetEvent<'click'>, 'sourceEvent'>;
export type DragInterpreterClickEvent = MouseClick | TouchClick;

type Type = 'mousemove' | 'click' | 'dblclick' | 'drag-start' | 'drag-move' | 'drag-end';
type EventMap = Omit<WidgetEventMap, 'click'> & { click: DragInterpreterClickEvent };

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

    constructor(widget: Widget) {
        this.destroyFns.push(
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
        this.dispatch(event);
    }

    private onDragStart(event: DragWidgetEvent<'drag-start'>) {
        this.dragStartEvent = event;
    }

    private onDragMove(event: DragWidgetEvent<'drag-move'>) {
        if (this.dragStartEvent != null) {
            const { originDeltaX: dx, originDeltaY: dy } = event;
            const distanceSquared = dx * dx + dy * dy;
            const thresholdSquared = DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX;
            if (distanceSquared >= thresholdSquared) {
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
        } else {
            const { device, offsetX, offsetY, clientX, clientY, currentX, currentY } = event;
            const type = 'click';

            let sytheticClick: DragInterpreterClickEvent | undefined;
            if (device === 'mouse') {
                const sourceEvent: MouseEvent = event.sourceEvent;
                sytheticClick = { type, device, offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent };
            } else {
                const sourceEvent: TouchEvent = event.sourceEvent;
                if (sourceEvent.type === 'touchend') {
                    // ignore 'drag-end' events from 'touchstart' or 'touchcancel'
                    sytheticClick = {
                        type,
                        device,
                        offsetX,
                        offsetY,
                        clientX,
                        clientY,
                        currentX,
                        currentY,
                        sourceEvent,
                    };
                }
            }

            if (sytheticClick) this.dispatch(sytheticClick);
        }
    }
}
