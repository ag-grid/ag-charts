import { Debug } from '../../util/debug';
import { injectStyle } from '../../util/dom';
import { Logger } from '../../util/logger';
import { isFiniteNumber } from '../../util/type-guards';
import { BaseManager } from './baseManager';

type InteractionTypes =
    | 'click'
    | 'dblclick'
    | 'contextmenu'
    | 'hover'
    | 'drag-start'
    | 'drag'
    | 'drag-end'
    | 'leave'
    | 'page-left'
    | 'wheel';

type SUPPORTED_EVENTS =
    | 'click'
    | 'dblclick'
    | 'contextmenu'
    | 'mousedown'
    | 'mousemove'
    | 'mouseup'
    | 'mouseout'
    | 'mouseenter'
    | 'touchstart'
    | 'touchmove'
    | 'touchend'
    | 'touchcancel'
    | 'pagehide'
    | 'wheel';
const WINDOW_EVENT_HANDLERS: SUPPORTED_EVENTS[] = ['pagehide', 'mousemove', 'mouseup'];
const EVENT_HANDLERS: SUPPORTED_EVENTS[] = [
    'click',
    'dblclick',
    'contextmenu',
    'mousedown',
    'mouseout',
    'mouseenter',
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
    'wheel',
];

export type InteractionEvent<T extends InteractionTypes = InteractionTypes> = {
    type: T;
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
    deltaX: number;
    deltaY: number;
    sourceEvent: Event;
    /** Consume the event, don't notify other listeners! */
    consume(): void;
    consumed?: boolean;
};

interface Coords {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    offsetX: number;
    offsetY: number;
}

const CSS = `
.ag-chart-wrapper {
    touch-action: none;
}
`;

type SupportedEvent = MouseEvent | TouchEvent | Event;

export enum InteractionState {
    Default = -Infinity,
    ZoomPan = 1,
    ContextMenu = 2,
    Animation = 3,
}

const DEBUG_SELECTORS = [true, 'interaction'];

/**
 * Manages user interactions with a specific HTMLElement (or interactions that bubble from it's
 * children)
 */
export class InteractionManager extends BaseManager<InteractionTypes, InteractionEvent<InteractionTypes>> {
    private readonly debug = Debug.create(...DEBUG_SELECTORS);

    private static interactionDocuments: Document[] = [];

    private readonly rootElement: HTMLElement;
    private readonly element: HTMLElement;
    private readonly window: Window;

    private eventHandler = (event: SupportedEvent) => this.processEvent(event);

    private mouseDown = false;
    private touchDown = false;
    private dragStartElement?: HTMLElement;

    private stateQueue: Set<InteractionState> = new Set();
    private _state: InteractionState = InteractionState.Default;
    public get state() {
        return this._state;
    }

    public constructor(element: HTMLElement, document: Document, window: Window) {
        super();

        this.rootElement = document.body;
        this.element = element;
        this.window = window;

        for (const type of EVENT_HANDLERS) {
            if (type.startsWith('touch')) {
                element.addEventListener(type, this.eventHandler, { passive: true });
            } else if (type === 'wheel') {
                element.addEventListener(type, this.eventHandler, { passive: false });
            } else {
                element.addEventListener(type, this.eventHandler);
            }
        }

        for (const type of WINDOW_EVENT_HANDLERS) {
            this.window.addEventListener(type, this.eventHandler);
        }

        if (!InteractionManager.interactionDocuments.includes(document)) {
            injectStyle(document, CSS);
            InteractionManager.interactionDocuments.push(document);
        }
    }

    override destroy() {
        super.destroy();

        for (const type of WINDOW_EVENT_HANDLERS) {
            this.window.removeEventListener(type, this.eventHandler);
        }

        for (const type of EVENT_HANDLERS) {
            this.element.removeEventListener(type, this.eventHandler);
        }
    }

    public pushState(state: InteractionState) {
        this.stateQueue.add(state);
        this.updateCurrentState();
    }

    public popState(state: InteractionState) {
        this.stateQueue.delete(state);
        this.updateCurrentState();
    }

    private updateCurrentState() {
        this._state = Array.from(this.stateQueue).reduce((max, s) => Math.max(max, s), InteractionState.Default);
    }

    private processEvent(event: SupportedEvent) {
        const types: InteractionTypes[] = this.decideInteractionEventTypes(event);

        if (types.length > 0) {
            // Async dispatch to avoid blocking the event-processing thread.
            this.dispatchEvent(event, types).catch((e) => Logger.errorOnce(e));
        }
    }

    private async dispatchEvent(event: SupportedEvent, types: InteractionTypes[]) {
        const coords = this.calculateCoordinates(event);

        if (coords == null) {
            return;
        }

        for (const type of types) {
            this.listeners.dispatchWrapHandlers(
                type,
                (handler, interactionEvent) => {
                    if (!interactionEvent.consumed) {
                        handler(interactionEvent);
                    }
                },
                this.buildEvent({ type, event, ...coords })
            );
        }
    }

    private decideInteractionEventTypes(event: SupportedEvent): InteractionTypes[] {
        const dragStart = 'drag-start';

        switch (event.type) {
            case 'click':
            case 'dblclick':
            case 'contextmenu':
            case 'wheel':
                return [event.type];

            case 'mousedown':
                this.mouseDown = true;
                this.dragStartElement = event.target as HTMLElement;
                return [dragStart];
            case 'touchstart':
                this.touchDown = true;
                this.dragStartElement = event.target as HTMLElement;
                return [dragStart];

            case 'touchmove':
            case 'mousemove':
                if (!this.mouseDown && !this.touchDown && !this.isEventOverElement(event)) {
                    // We only care about these events if the target is the canvas, unless
                    // we're in the middle of a drag/slide.
                    return [];
                }
                return this.mouseDown || this.touchDown ? ['drag'] : ['hover'];

            case 'mouseup':
                if (!this.mouseDown && !this.isEventOverElement(event)) {
                    // We only care about these events if the target is the canvas, unless
                    // we're in the middle of a drag.
                    return [];
                }
                this.mouseDown = false;
                this.dragStartElement = undefined;
                return ['drag-end'];
            case 'touchend':
                if (!this.touchDown && !this.isEventOverElement(event)) {
                    // We only care about these events if the target is the canvas, unless
                    // we're in the middle of a slide.
                    return [];
                }
                this.touchDown = false;
                this.dragStartElement = undefined;
                return ['drag-end'];

            case 'mouseout':
            case 'touchcancel':
                return ['leave'];

            case 'mouseenter':
                const mouseButtonDown = event instanceof MouseEvent && (event.buttons & 1) === 1;
                if (this.mouseDown !== mouseButtonDown) {
                    this.mouseDown = mouseButtonDown;
                    return [mouseButtonDown ? dragStart : 'drag-end'];
                }
                return [];

            case 'pagehide':
                return ['page-left'];
        }

        return [];
    }

    private isEventOverElement(event: SupportedEvent) {
        return event.target === this.element || (event.target as any)?.parentElement === this.element;
    }

    private static readonly NULL_COORDS: Coords = {
        clientX: -Infinity,
        clientY: -Infinity,
        pageX: -Infinity,
        pageY: -Infinity,
        offsetX: -Infinity,
        offsetY: -Infinity,
    };

    private calculateCoordinates(event: SupportedEvent): Coords | undefined {
        if (event instanceof MouseEvent) {
            return this.getMouseEventCoords(event);
        } else if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
            const lastTouch = event.touches[0] ?? event.changedTouches[0];
            const { clientX, clientY, pageX, pageY } = lastTouch;
            return { ...InteractionManager.NULL_COORDS, clientX, clientY, pageX, pageY };
        } else if (event instanceof PageTransitionEvent) {
            if (event.persisted) {
                // Don't fire the page-left event since the page maybe revisited.
                return;
            }
            return InteractionManager.NULL_COORDS;
        }

        // Unsupported event - abort.
    }

    private getMouseEventCoords(event: MouseEvent): Coords {
        const { clientX, clientY, pageX, pageY } = event;
        let { offsetX, offsetY } = event;
        const offsets = (el: HTMLElement) => {
            let x = 0;
            let y = 0;

            while (el) {
                x += el.offsetLeft;
                y += el.offsetTop;
                el = el.offsetParent as HTMLElement;
            }

            return { x, y };
        };

        if (this.dragStartElement != null && event.target !== this.dragStartElement) {
            // Offsets need to be relative to the drag-start element to avoid jumps when
            // the pointer moves between element boundaries.

            const offsetDragStart = offsets(this.dragStartElement);
            const offsetEvent = offsets(event.target as HTMLElement);
            offsetX -= offsetDragStart.x - offsetEvent.x;
            offsetY -= offsetDragStart.y - offsetEvent.y;
        }
        return { clientX, clientY, pageX, pageY, offsetX, offsetY };
    }

    private isWheelEvent(event: Event): event is WheelEvent {
        return event.type === 'wheel';
    }

    private buildEvent(opts: {
        type: InteractionTypes;
        event: Event;
        clientX: number;
        clientY: number;
        offsetX?: number;
        offsetY?: number;
        pageX?: number;
        pageY?: number;
    }): InteractionEvent<(typeof opts)['type']> {
        const { type, event, clientX, clientY } = opts;
        let { offsetX, offsetY, pageX, pageY } = opts;

        if (!isFiniteNumber(offsetX) || !isFiniteNumber(offsetY)) {
            const rect = this.element.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
        }
        if (!isFiniteNumber(pageX) || !isFiniteNumber(pageY)) {
            const pageRect = this.rootElement.getBoundingClientRect();
            pageX = clientX - pageRect.left;
            pageY = clientY - pageRect.top;
        }

        let [deltaX, deltaY] = [NaN, NaN];
        if (this.isWheelEvent(event)) {
            const factor = event.deltaMode === 0 ? 0.1 : 1;
            deltaX = event.deltaX * factor;
            deltaY = event.deltaY * factor;
        }

        const builtEvent = {
            type,
            offsetX,
            offsetY,
            pageX,
            pageY,
            deltaX,
            deltaY,
            sourceEvent: event,
            consumed: false,
            consume() {
                builtEvent.consumed = true;
            },
        };

        this.debug('InteractionManager - builtEvent: ', builtEvent);
        return builtEvent;
    }
}
