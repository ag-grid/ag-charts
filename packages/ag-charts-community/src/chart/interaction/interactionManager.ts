import { allInStringUnion } from '../../util/array';
import { Debug } from '../../util/debug';
import { getWindow } from '../../util/dom';
import { Logger } from '../../util/logger';
import { partialAssign } from '../../util/object';
import { isFiniteNumber } from '../../util/type-guards';
import { BaseManager } from '../baseManager';
import type { DOMManager } from '../dom/domManager';
import { type PreventableEvent, type Unpreventable, dispatchTypedEvent } from './preventableEvent';

export const POINTER_INTERACTION_TYPES = [
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

export type PointerInteractionTypes = (typeof POINTER_INTERACTION_TYPES)[number];

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
    | 'mouseleave'
    | 'mouseenter'
    | 'touchstart'
    | 'touchmove'
    | 'touchend'
    | 'touchcancel'
    | 'pagehide'
    | 'wheel';
const SHADOW_DOM_HANDLERS: SUPPORTED_EVENTS[] = ['mousemove', 'mouseup'];
const WINDOW_EVENT_HANDLERS: SUPPORTED_EVENTS[] = ['pagehide', 'mousemove', 'mouseup'];
const EVENT_HANDLERS = [
    'click',
    'dblclick',
    'contextmenu',
    'mousedown',
    'mouseleave',
    'mouseenter',
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
    'wheel',
    'blur',
    'focus',
    'keydown',
    'keyup',
] as const;

type BaseInteractionEvent<T extends InteractionTypes, TEvent extends Event> = PreventableEvent & {
    type: T;
    sourceEvent: TEvent;
    relatedElement?: HTMLElement;
    targetElement?: HTMLElement;
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

    private rootElement: HTMLElement | undefined;

    private readonly eventHandler = (event: SupportedEvent) => this.processEvent(event);

    private mouseDown = false;
    private touchDown = false;
    private dragStartElement?: HTMLElement;
    private readonly clickHistory: [PointerHistoryEvent] = [{ offsetX: NaN, offsetY: NaN, type: 'mousedown' }];
    private readonly dblclickHistory: [PointerHistoryEvent, PointerHistoryEvent, PointerHistoryEvent] = [
        { offsetX: NaN, offsetY: NaN, type: 'mousedown' },
        { offsetX: NaN, offsetY: NaN, type: 'mouseup' },
        { offsetX: NaN, offsetY: NaN, type: 'mousedown' },
    ];

    private stateQueue: InteractionState = InteractionState.Default | InteractionState.Animation;

    public constructor(
        private readonly keyboardOptions: { readonly enabled: boolean },
        private readonly domManager: DOMManager
    ) {
        super();

        this.rootElement = this.domManager.getDocumentRoot();

        for (const type of EVENT_HANDLERS) {
            if (type.startsWith('touch') || type === 'wheel') {
                this.domManager.addEventListener(type, this.eventHandler, { passive: false });
            } else {
                this.domManager.addEventListener(type, this.eventHandler);
            }
        }

        for (const type of WINDOW_EVENT_HANDLERS) {
            getWindow().addEventListener(type, this.eventHandler);
        }

        this.containerChanged(true);
        this.domManager.addListener('container-changed', () => this.containerChanged());
    }

    private containerChanged(force = false) {
        const newRoot = this.domManager.getDocumentRoot();
        if (!force && newRoot === this.rootElement) return;

        for (const type of SHADOW_DOM_HANDLERS) {
            this.rootElement?.removeEventListener(type, this.eventHandler);
        }

        this.rootElement = newRoot;
        this.debug('[InteractionManager] Switching rootElement to:', this.rootElement);

        for (const type of SHADOW_DOM_HANDLERS) {
            this.rootElement?.addEventListener(type, this.eventHandler);
        }
    }

    override destroy() {
        super.destroy();

        for (const type of WINDOW_EVENT_HANDLERS) {
            getWindow().removeEventListener(type, this.eventHandler);
        }
        for (const type of SHADOW_DOM_HANDLERS) {
            this.rootElement?.removeEventListener(type, this.eventHandler);
        }

        for (const type of EVENT_HANDLERS) {
            this.domManager.removeEventListener(type, this.eventHandler);
        }

        this.domManager.removeStyles('interactionManager');
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

        // AG-11385 Ignore clicks on focusable & disabled elements.
        const target: (EventTarget & { ariaDisabled?: string }) | null = event.target;
        if (event.type === 'click' && target?.ariaDisabled === 'true') {
            event.preventDefault();
            return;
        }

        if (types.length > 0) {
            // Async dispatch to avoid blocking the event-processing thread.
            this.dispatchEvent(event, types).catch((e) => Logger.errorOnce(e));
        }
    }

    private async dispatchEvent(event: SupportedEvent, types: InteractionTypes[]) {
        if (allInStringUnion(POINTER_INTERACTION_TYPES, types)) {
            this.dispatchPointerEvent(event, types);
            return;
        }

        const { relatedElement, targetElement } = this.extractElements(event);
        if (allInStringUnion(FOCUS_INTERACTION_TYPES, types)) {
            for (const type of types) {
                const sourceEvent = event as FocusEvent;
                dispatchTypedEvent(this.listeners, { type, sourceEvent, relatedElement, targetElement });
            }
        } else if (allInStringUnion(KEY_INTERACTION_TYPES, types)) {
            for (const type of types) {
                const sourceEvent = event as KeyboardEvent;
                dispatchTypedEvent(this.listeners, { type, sourceEvent, relatedElement, targetElement });
            }
        }
    }

    extractElements(event: SupportedEvent): { relatedElement?: HTMLElement; targetElement?: HTMLElement } {
        let relatedElement;
        let targetElement;

        if ('relatedTarget' in event && event['relatedTarget'] instanceof HTMLElement) {
            relatedElement = event['relatedTarget'] as HTMLElement;
        }
        if ('target' in event && event['target'] instanceof HTMLElement) {
            targetElement = event['target'] as HTMLElement;
        }

        return { relatedElement, targetElement };
    }

    private dispatchPointerEvent(event: SupportedEvent, types: PointerInteractionTypes[]) {
        const coords = this.calculateCoordinates(event);

        if (coords == null) {
            return;
        }

        for (const type of types) {
            dispatchTypedEvent(this.listeners, this.buildPointerEvent({ type, event, ...coords }));
        }
    }

    private getEventHTMLTarget(event: SupportedEvent): HTMLElement | undefined {
        if (event.target instanceof HTMLElement) {
            return event.target;
        } else if (event.currentTarget instanceof HTMLElement) {
            return event.currentTarget;
        }
        return undefined;
    }

    private recordDown(event: SupportedEvent) {
        if (event instanceof MouseEvent) {
            partialAssign(['offsetX', 'offsetY'], this.clickHistory[0], event);
            partialAssign(['offsetX', 'offsetY'], this.dblclickHistory[2], this.dblclickHistory[0]);
            partialAssign(['offsetX', 'offsetY'], this.dblclickHistory[0], event);
        }
        this.dragStartElement = this.getEventHTMLTarget(event);
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
                return this.keyboardOptions.enabled ? [event.type] : [];

            case 'click':
            case 'dblclick':
            case 'contextmenu':
            case 'wheel':
                return [event.type];

            case 'mousedown':
                if (!this.isEventOverElement(event) || !('button' in event) || event.button !== 0) {
                    return [];
                }
                this.mouseDown = true;
                this.recordDown(event);
                return [dragStart];
            case 'touchstart':
                if (!this.isEventOverElement(event)) {
                    return [];
                }
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

            case 'mouseleave':
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
        return this.domManager.isEventOverElement(event);
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

        const target = this.getEventHTMLTarget(event);
        const { x = 0, y = 0 } = target ? this.domManager.calculateCanvasPosition(target) : {};
        if (this.dragStartElement != null && event.target !== this.dragStartElement) {
            // Offsets need to be relative to the drag-start element to avoid jumps when
            // the pointer moves between element boundaries.

            const offsetDragStart = this.domManager.calculateCanvasPosition(this.dragStartElement);
            offsetX -= offsetDragStart.x - x;
            offsetY -= offsetDragStart.y - y;
        } else {
            offsetX += x;
            offsetY += y;
        }
        return { clientX, clientY, pageX, pageY, offsetX, offsetY };
    }

    private isWheelEvent(event: Event): event is WheelEvent {
        return event.type === 'wheel';
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
    }): Unpreventable<PointerInteractionEvent<PointerInteractionTypes>> {
        const { type, event, clientX, clientY } = opts;
        let { offsetX, offsetY, pageX, pageY } = opts;

        if (!isFiniteNumber(offsetX) || !isFiniteNumber(offsetY)) {
            const rect = this.domManager.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
        }
        if (!isFiniteNumber(pageX) || !isFiniteNumber(pageY)) {
            const pageRect = this.rootElement?.getBoundingClientRect();
            pageX = clientX - (pageRect?.left ?? 0);
            pageY = clientY - (pageRect?.top ?? 0);
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

        const { relatedElement, targetElement } = this.extractElements(event);

        const builtEvent = {
            type,
            offsetX,
            offsetY,
            pageX,
            pageY,
            deltaX,
            deltaY,
            pointerHistory,
            sourceEvent: event,
            relatedElement,
            targetElement,
        };

        this.debug('InteractionManager - builtEvent: ', builtEvent);
        return builtEvent;
    }
}
