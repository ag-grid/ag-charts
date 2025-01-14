import { Listeners } from '../../util/listeners';
import type { Widget } from '../../widget/widget';
import type { DragWidgetEvent, MouseWidgetEvent, WidgetEventMap } from '../../widget/widgetEvents';

const DRAG_THRESHOLD_PX = 3;

type Type = 'mousemove' | 'click' | 'dblclick' | 'drag-start' | 'drag-move' | 'drag-end';

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
    private preventNextClick = false;

    constructor(widget: Widget) {
        this.destroyFns.push(
            widget.addListener('mousemove', this.onMouseMove.bind(this)),
            widget.addListener('click', this.onClick.bind(this)),
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

    addListener<T extends Type>(type: T, handler: (e: WidgetEventMap[T]) => void): () => void;
    addListener<T extends Type>(type: T, handler: (e: unknown) => void): () => void {
        return this.listeners.addListener(type, handler);
    }

    private dispatch(event: (MouseWidgetEvent | DragWidgetEvent) & { type: Type }) {
        this.listeners.dispatch(event.type, event);
    }

    private onMouseMove(event: MouseWidgetEvent<'mousemove'>) {
        this.preventNextClick = false;
        this.dispatch(event);
    }

    private onClick(event: MouseWidgetEvent<'click'>) {
        if (!this.preventNextClick) {
            this.dispatch(event);
        }
        this.preventNextClick = false;
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
            const distanceSquared = dx * dx + (dy * dy);
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
            this.preventNextClick = true;
        }
    }
}
