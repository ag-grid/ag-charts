type FocusWidgetEventType = 'blur' | 'focus';
type KeyboardWidgetEventType = 'keyup' | 'keydown';
type MouseWidgetEventType = 'contextmenu' | 'click' | 'dblclick' | 'mouseenter' | 'mousemove' | 'mouseleave';
type TouchWidgetEventType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
type DragWidgetEventType = 'drag-start' | 'drag-move' | 'drag-end';

export type WidgetEvent = {
    readonly type: keyof WidgetEventMap;
    readonly sourceEvent: Event;
};

export type FocusWidgetEvent<T extends FocusWidgetEventType = FocusWidgetEventType> = {
    readonly type: T;
    readonly sourceEvent: FocusEvent;
};

export type KeyboardWidgetEvent<T extends KeyboardWidgetEventType = KeyboardWidgetEventType> = {
    readonly type: T;
    readonly sourceEvent: KeyboardEvent;
};

export type MouseWidgetEvent<T extends MouseWidgetEventType = MouseWidgetEventType> = {
    readonly type: T;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly currentX: number;
    readonly currentY: number;
    readonly sourceEvent: MouseEvent;
};

export type WheelWidgetEvent = {
    readonly type: 'wheel';
    readonly offsetX: number;
    readonly offsetY: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly deltaX: number;
    readonly deltaY: number;
    readonly sourceEvent: WheelEvent;
};

export type TouchWidgetEvent<T extends TouchWidgetEventType = TouchWidgetEventType> = {
    readonly type: T;
    readonly sourceEvent: TouchEvent;
};

// `originDelta` is the offset relative to position of the HTML element when the drag initiated.
// This is helpful for elements that move during drag actions, like navigator sliders.
export type DragWidgetEvent<T extends DragWidgetEventType = DragWidgetEventType> = {
    readonly type: T;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly currentX: number;
    readonly currentY: number;
    readonly originDeltaX: number;
    readonly originDeltaY: number;
    readonly sourceEvent: MouseEvent | TouchEvent;
};

export type WidgetEventMap = {
    'drag-start': DragWidgetEvent<'drag-start'>;
    'drag-move': DragWidgetEvent<'drag-move'>;
    'drag-end': DragWidgetEvent<'drag-end'>;
    blur: FocusWidgetEvent<'blur'>;
    change: WidgetEvent;
    contextmenu: MouseWidgetEvent<'contextmenu'>;
    focus: FocusWidgetEvent<'focus'>;
    keydown: KeyboardWidgetEvent<'keydown'>;
    keyup: KeyboardWidgetEvent<'keyup'>;
    click: MouseWidgetEvent<'click'>;
    dblclick: MouseWidgetEvent<'dblclick'>;
    mouseenter: MouseWidgetEvent<'mouseenter'>;
    mousemove: MouseWidgetEvent<'mousemove'>;
    mouseleave: MouseWidgetEvent<'mouseleave'>;
    wheel: WheelWidgetEvent;
    touchstart: TouchWidgetEvent<'touchstart'>;
    touchmove: TouchWidgetEvent<'touchmove'>;
    touchend: TouchWidgetEvent<'touchend'>;
    touchcancel: TouchWidgetEvent<'touchcancel'>;
};

export const WIDGET_HTML_EVENTS: readonly (keyof WidgetEventMap & keyof HTMLElementEventMap)[] = [
    'blur',
    'change',
    'contextmenu',
    'focus',
    'keydown',
    'keyup',
    'click',
    'dblclick',
    'mouseenter',
    'mousemove',
    'mouseleave',
    'wheel',
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
] satisfies (keyof WidgetEventMap & keyof HTMLElementEventMap)[];

export type WidgetSourceEventMap = {
    [K in keyof WidgetEventMap]: WidgetEventMap[K]['sourceEvent'];
};

function allocMouseEvent<T extends MouseWidgetEventType>(type: T, sourceEvent: MouseEvent, current: HTMLElement) {
    const { offsetX, offsetY, clientX, clientY } = sourceEvent;
    const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current, sourceEvent);
    return { type, offsetX, offsetY, clientX, clientY, currentX, currentY, sourceEvent };
}

function allocTouchEvent<T extends TouchWidgetEventType>(type: T, sourceEvent: TouchEvent, _current: HTMLElement) {
    return { type, sourceEvent };
}

export type WidgetEventMap_HTML = Pick<WidgetEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;
export type WidgetEventMap_Internal = Omit<WidgetEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;
export type WidgetSourceEventMap_HTML = Pick<WidgetSourceEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;
export type WidgetSourceEventMap_Internal = Omit<WidgetSourceEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;

type Allocator<K extends keyof WidgetEventMap_HTML> = (
    sourceEvent: WidgetSourceEventMap_HTML[K],
    current: HTMLElement
) => WidgetEventMap_HTML[K];
const WidgetAllocators: { [K in keyof WidgetEventMap_HTML]: Allocator<K> } = {
    blur: (sourceEvent: FocusEvent): FocusWidgetEvent<'blur'> => {
        return { type: 'blur', sourceEvent };
    },
    change: (sourceEvent: Event): WidgetEvent => {
        return { type: 'change', sourceEvent };
    },
    contextmenu: (sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'contextmenu'> => {
        return allocMouseEvent('contextmenu', sourceEvent, current);
    },
    focus: (sourceEvent: FocusEvent): FocusWidgetEvent<'focus'> => {
        return { type: 'focus', sourceEvent };
    },
    keydown: (sourceEvent: KeyboardEvent): KeyboardWidgetEvent<'keydown'> => {
        return { type: 'keydown', sourceEvent };
    },
    keyup: (sourceEvent: KeyboardEvent): KeyboardWidgetEvent<'keyup'> => {
        return { type: 'keyup', sourceEvent };
    },
    click: (sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'click'> => {
        return allocMouseEvent('click', sourceEvent, current);
    },
    dblclick: (sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'dblclick'> => {
        return allocMouseEvent('dblclick', sourceEvent, current);
    },
    mouseenter: (sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'mouseenter'> => {
        return allocMouseEvent('mouseenter', sourceEvent, current);
    },
    mousemove: (sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'mousemove'> => {
        return allocMouseEvent('mousemove', sourceEvent, current);
    },
    mouseleave: (sourceEvent: MouseEvent, current: HTMLElement): MouseWidgetEvent<'mouseleave'> => {
        return allocMouseEvent('mouseleave', sourceEvent, current);
    },
    wheel: (sourceEvent: WheelEvent): WheelWidgetEvent => {
        const { offsetX, offsetY, clientX, clientY } = sourceEvent;
        // AG-10475 On Chrome (Windows), wheel clicks send deltaMode: 0 events with deltaY: -100 or +100.
        // So we divide this by 100 to give us the desired step.
        const factor = sourceEvent.deltaMode === 0 ? 0.01 : 1;
        const deltaX = sourceEvent.deltaX * factor;
        const deltaY = sourceEvent.deltaY * factor;
        return { type: 'wheel', offsetX, offsetY, clientX, clientY, deltaX, deltaY, sourceEvent };
    },
    touchstart: (sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchstart'> => {
        return allocTouchEvent('touchstart', sourceEvent, current);
    },
    touchmove: (sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchmove'> => {
        return allocTouchEvent('touchmove', sourceEvent, current);
    },
    touchend: (sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchend'> => {
        return allocTouchEvent('touchend', sourceEvent, current);
    },
    touchcancel: (sourceEvent: TouchEvent, current: HTMLElement): TouchWidgetEvent<'touchcancel'> => {
        return allocTouchEvent('touchcancel', sourceEvent, current);
    },
};

export class WidgetEventUtil {
    static alloc<K extends keyof WidgetEventMap_HTML>(
        type: K,
        sourceEvent: WidgetSourceEventMap_HTML[K],
        current: HTMLElement
    ): WidgetEventMap_HTML[K] {
        return WidgetAllocators[type](sourceEvent, current);
    }

    static isHTMLEvent(type: keyof WidgetEventMap): type is keyof WidgetEventMap & keyof HTMLElementEventMap {
        const htmlTypes: readonly string[] = WIDGET_HTML_EVENTS;
        return htmlTypes.includes(type);
    }

    static calcCurrentXY(
        current: HTMLElement,
        event: { clientX: number; clientY: number }
    ): { currentX: number; currentY: number } {
        const currentRect = current.getBoundingClientRect();
        return { currentX: event.clientX - currentRect.x, currentY: event.clientY - currentRect.y };
    }
}
