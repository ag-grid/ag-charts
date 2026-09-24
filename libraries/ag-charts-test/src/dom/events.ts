export type MockEvent = {
    bubbleChain: HTMLElement[];
    target: HTMLElement;
    offsetX: number;
    offsetY: number;
    clientX: number;
    clientY: number;
};

const KNOWN_AG_CHARTS_CLASSES: readonly string[] = [
    'ag-charts-series-area',
    'ag-charts-series-area-bounds',
    'ag-charts-canvas-proxy',
    'ag-charts-canvas-container',
] as const;

export function makeMockEvent(
    opts: Pick<MockEvent, 'target' | 'offsetX' | 'offsetY' | 'clientX' | 'clientY'>
): MockEvent {
    const bubbleChain: HTMLElement[] = [opts.target];
    let parent: HTMLElement | null = opts.target.parentElement;
    while (parent != null) {
        if (KNOWN_AG_CHARTS_CLASSES.includes(parent.className)) {
            bubbleChain.push(parent);
        }
        parent = parent.parentElement;
    }
    return { bubbleChain, ...opts };
}

type TMouseEvent =
    'mousedown' | 'mouseup' | 'mouseenter' | 'mouseleave' | 'mousemove' | 'click' | 'dblclick' | 'contextmenu';

type TPointerEvent = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'lostpointercapture';

function makeMouseEvent<T extends TMouseEvent | TPointerEvent>(
    type: T,
    testTarget: MockEvent,
    clientX: number,
    clientY: number,
    bubbles: boolean,
    modifiers: MouseEventInit | undefined
): MouseEvent {
    const { offsetX, offsetY, target } = testTarget;
    const view = target.ownerDocument.defaultView!;
    const event = new MouseEvent(type, { ...modifiers, bubbles, clientX, clientY, view });
    Object.defineProperty(event, 'offsetX', { value: offsetX, enumerable: true, configurable: true });
    Object.defineProperty(event, 'offsetY', { value: offsetY, enumerable: true, configurable: true });
    Object.defineProperty(event, 'pageX', { value: clientX, enumerable: true, configurable: true });
    Object.defineProperty(event, 'pageY', { value: clientY, enumerable: true, configurable: true });
    return event;
}

export function mouseDownEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('mousedown', offsets, clientX, clientY, true, modifiers);
}

export function mouseUpEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('mouseup', offsets, clientX, clientY, true, modifiers);
}

/** `mouseenter` does not bubble; the browser fires it on each element being entered. */
export function mouseEnterEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('mouseenter', offsets, clientX, clientY, false, modifiers);
}

/** `mouseleave` does not bubble; the browser fires it on each element being left. */
export function mouseLeaveEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('mouseleave', offsets, clientX, clientY, false, modifiers);
}

export function mouseMoveEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('mousemove', offsets, clientX, clientY, true, modifiers);
}

export function clickEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('click', offsets, clientX, clientY, true, modifiers);
}

export function doubleClickEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('dblclick', offsets, clientX, clientY, true, modifiers);
}

export function contextMenuEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    modifiers?: EventModifierInit
): MouseEvent {
    return makeMouseEvent('contextmenu', offsets, clientX, clientY, false, modifiers);
}

/**
 * jsdom implements no part of the Pointer Events API: there is no `PointerEvent` constructor and
 * `Element` has none of the capture methods. Chart drags are driven by `pointerdown` and pointer
 * capture, so the capture methods are shimmed below and pointer events are built from `MouseEvent`
 * with the pointer fields defined on top — jsdom delivers those to 'pointerdown' listeners just as
 * well, and nothing under test distinguishes the two by `instanceof`.
 */
export type PointerType = 'mouse' | 'touch' | 'pen';
export type PointerOpts = EventModifierInit & {
    pointerId?: number;
    pointerType?: PointerType;
    button?: number;
    buttons?: number;
};

const DEFAULT_POINTER_ID = 1;

// A captured pointer's events go to the capturing element, not the element under the cursor.
const pointerCaptures = new Map<number, Element>();

export function resetPointerCaptures() {
    pointerCaptures.clear();
}

export function installPointerCapture() {
    const proto = globalThis.Element.prototype;
    proto.setPointerCapture = function (pointerId: number) {
        pointerCaptures.set(pointerId, this);
    };
    proto.releasePointerCapture = function (pointerId: number) {
        if (pointerCaptures.get(pointerId) !== this) return;
        pointerCaptures.delete(pointerId);
        const event = new Event('lostpointercapture', { bubbles: true });
        Object.defineProperty(event, 'pointerId', { value: pointerId, enumerable: true, configurable: true });
        this.dispatchEvent(event);
    };
    proto.hasPointerCapture = function (pointerId: number) {
        return pointerCaptures.get(pointerId) === this;
    };
}

function makePointerEvent<T extends TPointerEvent>(
    type: T,
    testTarget: MockEvent,
    clientX: number,
    clientY: number,
    opts: PointerOpts | undefined
): MouseEvent {
    const {
        pointerId = DEFAULT_POINTER_ID,
        pointerType = 'mouse',
        button = 0,
        buttons = type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
        ...modifiers
    } = opts ?? {};
    const event = makeMouseEvent(type, testTarget, clientX, clientY, true, { ...modifiers, button, buttons });
    for (const [key, value] of [
        ['pointerId', pointerId],
        ['pointerType', pointerType],
        ['isPrimary', true],
        ['pressure', buttons === 0 ? 0 : 0.5],
    ] as const) {
        Object.defineProperty(event, key, { value, enumerable: true, configurable: true });
    }
    return event;
}

export function pointerDownEvent(offsets: MockEvent, clientX: number, clientY: number, opts?: PointerOpts): MouseEvent {
    return makePointerEvent('pointerdown', offsets, clientX, clientY, opts);
}

export function pointerMoveEvent(offsets: MockEvent, clientX: number, clientY: number, opts?: PointerOpts): MouseEvent {
    return makePointerEvent('pointermove', offsets, clientX, clientY, opts);
}

export function pointerUpEvent(offsets: MockEvent, clientX: number, clientY: number, opts?: PointerOpts): MouseEvent {
    return makePointerEvent('pointerup', offsets, clientX, clientY, opts);
}

export function pointerCancelEvent(
    offsets: MockEvent,
    clientX: number,
    clientY: number,
    opts?: PointerOpts
): MouseEvent {
    return makePointerEvent('pointercancel', offsets, clientX, clientY, opts);
}

/**
 * Delivers a pointer event to whichever element has captured that pointer, falling back to the
 * element under the cursor. Use this rather than {@link dispatchEvent} for pointer events, or a
 * drag that leaves the captured element stops being delivered.
 */
export function dispatchPointerEvent(mockEvent: MockEvent, event: MouseEvent) {
    const { pointerId = DEFAULT_POINTER_ID } = event as { pointerId?: number };
    (pointerCaptures.get(pointerId) ?? mockEvent.target).dispatchEvent(event);
}

/**
 * Dispatches `event` on `target` only, exactly as a real user interaction does. jsdom implements
 * bubbling, so it walks the ancestors itself and sets `target`/`currentTarget` on the way; dispatching
 * on the ancestors here as well would deliver the event once per ancestor to every listener registered
 * above `target` — a `click` on the series area would reach a `canvas-container` listener three times.
 */
export function dispatchEvent({ target }: MockEvent, event: Event) {
    target.dispatchEvent(event);
}

/**
 * Dispatches `event` on each element of `bubbleChain` in turn, with `target` pinned to the element the
 * pointer is over. For the non-bubbling `mouseenter`/`mouseleave` pair, which the browser fires
 * separately on every element being entered or left rather than propagating a single event.
 */
export function dispatchEventToChain({ bubbleChain, target }: MockEvent, event: Event) {
    for (const currentTarget of bubbleChain) {
        Object.defineProperty(event, 'target', {
            value: target,
            writable: true,
            configurable: true,
        });
        currentTarget.dispatchEvent(event);
        delete (event as any).target;
    }
}

export enum WheelDeltaMode {
    Pixels = 0,
    Lines = 1,
    Pages = 2,
}

type WheelEventData = {
    deltaX: number;
    deltaY: number;
    deltaMode: WheelDeltaMode;
    cancelable?: boolean;
};

export function wheelEvent(
    mockEvent: MockEvent,
    { deltaX, deltaY, deltaMode, cancelable }: WheelEventData
): WheelEvent {
    const { offsetX, offsetY, clientX, clientY } = mockEvent;
    const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: cancelable ?? true,
        clientX,
        clientY,
        deltaX,
        deltaY,
        deltaMode,
    });
    Object.defineProperty(event, 'offsetX', { value: offsetX, enumerable: true, configurable: true });
    Object.defineProperty(event, 'offsetY', { value: offsetY, enumerable: true, configurable: true });
    Object.defineProperty(event, 'pageX', { value: clientX, enumerable: true, configurable: true });
    Object.defineProperty(event, 'pageY', { value: clientY, enumerable: true, configurable: true });
    return event;
}

export type MockTouch = {
    identifier: number;
    clientX: number;
    clientY: number;
    states: ('changed' | 'target')[];
};
export type MockTouchTypes = 'touchstart' | 'touchmove' | 'touchend';

export function touchAverage(touches: MockTouch[]): Pick<MockTouch, 'clientX' | 'clientY'> {
    expect(touches.length).not.toBe(0);
    let sumX = 0,
        sumY = 0;
    for (const t of touches) {
        sumX += t.clientX;
        sumY += t.clientY;
    }
    return { clientX: sumX / touches.length, clientY: sumY / touches.length };
}

export function touchEvent(type: MockTouchTypes, mockEvent: MockEvent, mockTouches: MockTouch[]): TouchEvent {
    const targetTouches: Touch[] = [];
    const changedTouches: Touch[] = [];
    for (const mockTouch of mockTouches) {
        const { identifier, clientX, clientY } = mockTouch;
        if (mockTouch.states.includes('target')) {
            targetTouches.push({
                clientX,
                clientY,
                force: 0,
                identifier,
                pageX: clientX,
                pageY: clientY,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                screenX: clientX,
                screenY: clientY,
                target: mockEvent.target,
            });
        }
        if (mockTouch.states.includes('changed')) {
            changedTouches.push({
                clientX,
                clientY,
                force: 0,
                identifier,
                pageX: clientX,
                pageY: clientY,
                radiusX: 0,
                radiusY: 0,
                rotationAngle: 0,
                screenX: clientX,
                screenY: clientY,
                target: mockEvent.target,
            });
        }
    }

    const event = new TouchEvent(type, { bubbles: true, targetTouches, changedTouches });
    const originalPreventDefault = event.preventDefault.bind(event);
    event.preventDefault = function () {
        originalPreventDefault();
        Object.defineProperty(event, 'defaultPrevented', { value: true, configurable: true });
    };
    return event;
}

export function keydownEvent(input: { key: string; code: string }): KeyboardEvent {
    return new KeyboardEvent('keydown', input);
}
