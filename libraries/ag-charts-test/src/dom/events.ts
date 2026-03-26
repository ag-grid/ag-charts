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
    bubbles = true
): MouseEvent {
    const { offsetX, offsetY, target } = testTarget;
    const view = target.ownerDocument.defaultView!;
    const event = new MouseEvent(type, { bubbles, clientX, clientY, view });
    Object.assign(event, { offsetX, offsetY, pageX: clientX, pageY: clientY });
    return event;
}

export function mouseDownEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('mousedown', offsets, clientX, clientY);
}

export function mouseUpEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('mouseup', offsets, clientX, clientY);
}

export function mouseEnterEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('mouseenter', offsets, clientX, clientY);
}

export function mouseLeaveEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('mouseleave', offsets, clientX, clientY);
}

export function mouseMoveEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('mousemove', offsets, clientX, clientY);
}

export function clickEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('click', offsets, clientX, clientY);
}

export function doubleClickEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('dblclick', offsets, clientX, clientY);
}

export function contextMenuEvent(offsets: MockEvent, clientX: number, clientY: number): MouseEvent {
    return makeMouseEvent('contextmenu', offsets, clientX, clientY, false);
}

export function dispatchEvent({ bubbleChain, target }: MockEvent, event: Event) {
    if (!event.bubbles && bubbleChain.length > 0) {
        bubbleChain = [bubbleChain[0]];
    }

    for (const currentTarget of bubbleChain) {
        Object.defineProperty(event, 'target', {
            value: target,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(event, 'currentTarget', {
            value: currentTarget,
            writable: true,
            configurable: true,
        });
        currentTarget.dispatchEvent(event);
        delete (event as any).target;
        delete (event as any).currentTarget;
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
    Object.assign(event, { offsetX, offsetY, pageX: clientX, pageY: clientY });
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
