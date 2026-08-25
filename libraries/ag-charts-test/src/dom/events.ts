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
    | 'mousedown'
    | 'mouseup'
    | 'mouseenter'
    | 'mouseleave'
    | 'mousemove'
    | 'click'
    | 'dblclick'
    | 'contextmenu';

function makeMouseEvent<T extends TMouseEvent>(
    type: T,
    testTarget: MockEvent,
    clientX: number,
    clientY: number,
    bubbles: boolean,
    modifiers: EventModifierInit | undefined
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
