import { Logger } from '../../util/logger';
import { isNumber } from '../../util/value';
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

export type InteractionEvent<T extends InteractionTypes> = {
    type: T;
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
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

/**
 * Manages user interactions with a specific HTMLElement (or interactions that bubble from it's
 * children)
 */
export class InteractionManager extends BaseManager<InteractionTypes, InteractionEvent<InteractionTypes>> {
    private static interactionDocuments: Document[] = [];

    private readonly rootElement: HTMLElement;
    private readonly element: HTMLElement;
    private readonly window: Window;

    private eventHandler = (event: SupportedEvent) => this.processEvent(event);

    private mouseDown = false;
    private touchDown = false;
    private dragStartElement?: HTMLElement;

    private enabled = true;
    private pausers: string[] = [];

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

        if (InteractionManager.interactionDocuments.indexOf(document) < 0) {
            const styleElement = document.createElement('style');
            styleElement.innerHTML = CSS;
            document.head.insertBefore(styleElement, document.head.querySelector('style'));
            InteractionManager.interactionDocuments.push(document);
        }
    }

    public destroy() {
        for (const type of WINDOW_EVENT_HANDLERS) {
            this.window.removeEventListener(type, this.eventHandler);
        }

        for (const type of EVENT_HANDLERS) {
            this.element.removeEventListener(type, this.eventHandler);
        }
    }

    resume(callerId: string) {
        this.pausers = this.pausers.filter((id) => id !== callerId);
        this.enabled = this.pausers.length <= 0;

        return this.enabled;
    }

    pause(callerId: string) {
        this.enabled = false;
        this.pausers.push(callerId);
    }

    private processEvent(event: SupportedEvent) {
        const types: InteractionTypes[] = this.decideInteractionEventTypes(event);

        if (types.length > 0 && this.enabled) {
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
                return ['click'];

            case 'dblclick':
                return ['dblclick'];

            case 'contextmenu':
                return ['contextmenu'];

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

            case 'wheel':
                return ['wheel'];
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
            const { clientX, clientY, pageX, pageY, offsetX, offsetY } = event;
            return this.fixOffsets(event, { clientX, clientY, pageX, pageY, offsetX, offsetY });
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

    private fixOffsets(event: MouseEvent, coords: Coords) {
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
            coords.offsetX -= offsetDragStart.x - offsetEvent.x;
            coords.offsetY -= offsetDragStart.y - offsetEvent.y;
        }
        return coords;
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

        if (!isNumber(offsetX) || !isNumber(offsetY)) {
            const rect = this.element.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
        }
        if (!isNumber(pageX) || !isNumber(pageY)) {
            const pageRect = this.rootElement.getBoundingClientRect();
            pageX = clientX - pageRect.left;
            pageY = clientY - pageRect.top;
        }

        const builtEvent = {
            type,
            offsetX: offsetX!,
            offsetY: offsetY!,
            pageX: pageX!,
            pageY: pageY!,
            sourceEvent: event,
            consumed: false,
            consume() {
                builtEvent.consumed = true;
            },
        };

        return builtEvent;
    }
}
