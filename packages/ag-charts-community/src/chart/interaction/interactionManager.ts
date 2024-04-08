import { allInStringUnion } from '../../util/array';
import { Debug } from '../../util/debug';
import { getDocument, getWindow, injectStyle } from '../../util/dom';
import { Logger } from '../../util/logger';
import { partialAssign } from '../../util/object';
import { isFiniteNumber } from '../../util/type-guards';
import { BaseManager } from './baseManager';

export const INTERACTION_TYPES = [
    'click',
    'dblclick',
    'contextmenu',
    'hover',
    'drag-start',
    'drag',
    'drag-end',
    'leave',
    'enter',
    'page-left',
    'wheel',
] as const;

const FOCUS_INTERACTION_TYPES = ['blur', 'focus'] as const;

const KEY_INTERACTION_TYPES = ['keydown', 'keyup'] as const;

export type PointerInteractionTypes = (typeof INTERACTION_TYPES)[number];

export type FocusInteractionTypes = (typeof FOCUS_INTERACTION_TYPES)[number];

export type KeyInteractionTypes = (typeof KEY_INTERACTION_TYPES)[number];

export type InteractionTypes = PointerInteractionTypes | FocusInteractionTypes | KeyInteractionTypes;

type SUPPORTED_EVENTS =
    | 'blur'
    | 'focus'
    | 'click'
    | 'dblclick'
    | 'contextmenu'
    | 'keydown'
    | 'keyup'
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

type BaseInteractionEvent<T extends InteractionTypes, TEvent extends Event> = {
    type: T;
    sourceEvent: TEvent;
    /** Consume the event, don't notify other listeners! */
    consume(): void;
    consumed?: boolean;
};

export type PointerOffsets = {
    offsetX: number;
    offsetY: number;
};

export type PointerHistoryEvent = PointerOffsets & { type: string };

export type PointerInteractionEvent<T extends PointerInteractionTypes = PointerInteractionTypes> = PointerOffsets &
    BaseInteractionEvent<T, Event> & {
        pageX: number;
        pageY: number;
        deltaX: number;
        deltaY: number;
        pointerHistory: PointerHistoryEvent[];
    };

export type FocusInteractionEvent<T extends FocusInteractionTypes = FocusInteractionTypes> = BaseInteractionEvent<
    T,
    FocusEvent
>;

export type KeyInteractionEvent<T extends KeyInteractionTypes = KeyInteractionTypes> = BaseInteractionEvent<
    T,
    KeyboardEvent
>;

export type InteractionEvent =
    | PointerInteractionEvent<PointerInteractionTypes>
    | FocusInteractionEvent<FocusInteractionTypes>
    | KeyInteractionEvent<KeyInteractionTypes>;

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

// These interaction state are both bitflags and priorities.
// Smaller numbers have higher priority, because it is possible to find the least
// significant bit in O(1) complexity using a bitwise operation.
export enum InteractionState {
    Default = 16,
    ZoomDrag = 8,
    Annotations = 4,
    ContextMenu = 2,
    Animation = 1,
    All = Default | ZoomDrag | Annotations | ContextMenu | Animation,
}

/**
 * Manages user interactions with a specific HTMLElement (or interactions that bubble from it's
 * children)
 */
export class InteractionManager extends BaseManager<InteractionTypes, InteractionEvent> {
    private readonly debug = Debug.create(true, 'interaction');

    private readonly rootElement: HTMLElement;
    private readonly element: HTMLElement;

    private eventHandler = (event: SupportedEvent) => this.processEvent(event);

    private mouseDown = false;
    private touchDown = false;
    private dragStartElement?: HTMLElement;
    private clickHistory: [PointerHistoryEvent] = [{ offsetX: NaN, offsetY: NaN, type: 'mousedown' }];
    private dblclickHistory: [PointerHistoryEvent, PointerHistoryEvent, PointerHistoryEvent] = [
        { offsetX: NaN, offsetY: NaN, type: 'mousedown' },
        { offsetX: NaN, offsetY: NaN, type: 'mouseup' },
        { offsetX: NaN, offsetY: NaN, type: 'mousedown' },
    ];

    private stateQueue: InteractionState = InteractionState.Default;

    public constructor(element: HTMLElement, container?: HTMLElement) {
        super();

        this.rootElement = getDocument('body');
        this.element = element;

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
            getWindow().addEventListener(type, this.eventHandler);
        }

        if (container) {
            for (const type of ['blur', 'focus', 'keydown', 'keyup']) {
                container.addEventListener(type, this.eventHandler);
            }
        }

        injectStyle(CSS, 'interactionManager');
    }

    override destroy() {
        super.destroy();

        for (const type of WINDOW_EVENT_HANDLERS) {
            getWindow().removeEventListener(type, this.eventHandler);
        }

        for (const type of EVENT_HANDLERS) {
            this.element.removeEventListener(type, this.eventHandler);
        }
    }

    // Wrapper to only broadcast events when the InteractionManager is a given state.
    override addListener<T extends InteractionTypes>(
        type: T,
        handler: (event: InteractionEvent & { type: T }) => void,
        triggeringStates: InteractionState = InteractionState.Default
    ) {
        return super.addListener(type, (e) => {
            const currentState = this.getState();
            if (currentState & triggeringStates) {
                handler(e);
            }
        });
    }

    public pushState(state: InteractionState) {
        this.stateQueue |= state;
    }

    public popState(state: InteractionState) {
        this.stateQueue &= ~state;
    }

    public getState() {
        // Bitwise operation to get the least significant bit:
        return this.stateQueue & -this.stateQueue;
    }

    private processEvent(event: SupportedEvent) {
        const types: InteractionTypes[] = this.decideInteractionEventTypes(event);

        if (types.length > 0) {
            // Async dispatch to avoid blocking the event-processing thread.
            this.dispatchEvent(event, types).catch((e) => Logger.errorOnce(e));
        }
    }

    private async dispatchEvent(event: SupportedEvent, types: InteractionTypes[]) {
        if (allInStringUnion(INTERACTION_TYPES, types)) {
            this.dispatchPointerEvent(event, types);
        } else if (allInStringUnion(FOCUS_INTERACTION_TYPES, types)) {
            this.dispatchFocusEvent(event as FocusEvent, types);
        } else if (allInStringUnion(KEY_INTERACTION_TYPES, types)) {
            this.dispatchKeyEvent(event as KeyboardEvent, types);
        }
    }

    private dispatchWrapper: (handler: (e: InteractionEvent) => void, e: InteractionEvent) => void = (handler, e) => {
        if (!e.consumed) {
            handler(e);
        }
    };

    private dispatchPointerEvent(event: SupportedEvent, types: PointerInteractionTypes[]) {
        const coords = this.calculateCoordinates(event);

        if (coords == null) {
            return;
        }

        for (const type of types) {
            this.listeners.dispatchWrapHandlers(
                type,
                this.dispatchWrapper,
                this.buildPointerEvent({ type, event, ...coords })
            );
        }
    }

    private dispatchFocusEvent(sourceEvent: FocusEvent, types: FocusInteractionTypes[]) {
        this.dispatchTypedEvent<FocusInteractionTypes, FocusInteractionEvent>(sourceEvent, types);
    }

    private dispatchKeyEvent(sourceEvent: KeyboardEvent, types: KeyInteractionTypes[]) {
        this.dispatchTypedEvent<KeyInteractionTypes, KeyInteractionEvent>(sourceEvent, types);
    }

    private dispatchTypedEvent<
        T extends FocusInteractionTypes | KeyInteractionTypes,
        E extends FocusInteractionEvent | KeyInteractionEvent,
    >(sourceEvent: FocusEvent | KeyboardEvent, types: T[]) {
        for (const type of types) {
            this.listeners.dispatchWrapHandlers(
                type,
                this.dispatchWrapper,
                this.buildConsumable({ type, sourceEvent } as E)
            );
        }
    }

    private recordDown(event: SupportedEvent) {
        if (event instanceof MouseEvent) {
            partialAssign(['offsetX', 'offsetY'], this.clickHistory[0], event);
            partialAssign(['offsetX', 'offsetY'], this.dblclickHistory[2], this.dblclickHistory[0]);
            partialAssign(['offsetX', 'offsetY'], this.dblclickHistory[0], event);
        }
        this.dragStartElement = event.target as HTMLElement;
    }

    private recordUp(event: SupportedEvent) {
        if (event instanceof MouseEvent) {
            partialAssign(['offsetX', 'offsetY'], this.dblclickHistory[1], event);
        }
        this.dragStartElement = undefined;
    }
    private decideInteractionEventTypes(event: SupportedEvent): InteractionTypes[] {
        const dragStart = 'drag-start';

        switch (event.type) {
            case 'blur':
            case 'focus':
            case 'keydown':
            case 'keyup':
            case 'click':
            case 'dblclick':
            case 'contextmenu':
            case 'wheel':
                return [event.type];

            case 'mousedown':
                this.mouseDown = true;
                this.recordDown(event);
                return [dragStart];
            case 'touchstart':
                this.touchDown = true;
                this.recordDown(event);
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
                this.recordUp(event);
                return ['drag-end'];
            case 'touchend':
                if (!this.touchDown && !this.isEventOverElement(event)) {
                    // We only care about these events if the target is the canvas, unless
                    // we're in the middle of a slide.
                    return [];
                }
                this.touchDown = false;
                this.recordUp(event);
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
                return ['enter'];

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

    private buildConsumable<T>(obj: T): T & { consume: () => void; consumed?: boolean } {
        const builtEvent = {
            ...obj,

            consumed: false,
            consume() {
                builtEvent.consumed = true;
            },
        };
        return builtEvent;
    }

    private buildPointerEvent(opts: {
        type: PointerInteractionTypes;
        event: Event;
        clientX: number;
        clientY: number;
        offsetX?: number;
        offsetY?: number;
        pageX?: number;
        pageY?: number;
    }): PointerInteractionEvent<PointerInteractionTypes> {
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
            // AG-10475 On Chrome (Windows), wheel clicks send deltaMode: 0 events with deltaY: -100 or +100.
            // So we divide this by 100 to give us the desired step.
            const factor = event.deltaMode === 0 ? 0.01 : 1;
            deltaX = event.deltaX * factor;
            deltaY = event.deltaY * factor;
        }

        // AG-8880 Because we are using listeners globally on the canvases, click events are always fired
        // whenever the mouse button is lifted. The pointerHistory allows listeners to check that click events
        // are only fired when both the mousedown & mouseup events are in the revelant bounding area.
        let pointerHistory: PointerHistoryEvent[] = [];
        if (event.type === 'click') {
            pointerHistory = this.clickHistory;
        } else if (event.type === 'dblclick') {
            pointerHistory = this.dblclickHistory;
        }

        const builtEvent = this.buildConsumable({
            type,
            offsetX,
            offsetY,
            pageX,
            pageY,
            deltaX,
            deltaY,
            pointerHistory,
            sourceEvent: event,
        });

        this.debug('InteractionManager - builtEvent: ', builtEvent);
        return builtEvent;
    }
}
