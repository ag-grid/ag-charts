type FocusWidgetEventType = 'blur' | 'focus';
type KeyboardWidgetEventType = 'keyup' | 'keydown';
type MouseWidgetEventType = 'contextmenu' | 'click' | 'dblclick' | 'mouseenter' | 'mousemove' | 'mouseleave';
type DragWidgetEventType = 'drag-start' | 'drag-move' | 'drag-end';

export type WidgetEvent = {
    type: keyof WidgetEventMap;
    sourceEvent: Event;
};

export type FocusWidgetEvent<T extends FocusWidgetEventType = FocusWidgetEventType> = {
    type: T;
    sourceEvent: FocusEvent;
};

export type KeyboardWidgetEvent<T extends KeyboardWidgetEventType = KeyboardWidgetEventType> = {
    type: T;
    sourceEvent: KeyboardEvent;
};

export type MouseWidgetEvent<T extends MouseWidgetEventType = MouseWidgetEventType> = {
    type: T;
    offsetX: number;
    offsetY: number;
    sourceEvent: MouseEvent;
};

// `originDelta` is the offset relative to position of the HTML element when the drag initiated.
// This is helpful for elements that move during drag actions, like navigator sliders.
export type DragWidgetEvent<T extends DragWidgetEventType = DragWidgetEventType> = {
    type: T;
    offsetX: number;
    offsetY: number;
    originDeltaX: number;
    originDeltaY: number;
    sourceEvent: MouseEvent | TouchEvent;
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
] satisfies (keyof WidgetEventMap & keyof HTMLElementEventMap)[];

export type WidgetSourceEventMap = {
    [K in keyof WidgetEventMap]: WidgetEventMap[K]['sourceEvent'];
};

function allocDragEvent<T extends DragWidgetEventType>(type: T, sourceEvent: MouseEvent | TouchEvent) {
    return { type, offsetX: NaN, offsetY: NaN, originDeltaX: NaN, originDeltaY: NaN, sourceEvent };
}
function allocMouseEvent<T extends MouseWidgetEventType>(type: T, sourceEvent: MouseEvent) {
    return { type, offsetX: sourceEvent.offsetX, offsetY: sourceEvent.offsetY, sourceEvent };
}

const WidgetAllocators: { [K in keyof WidgetEventMap]: (sourceEvent: WidgetSourceEventMap[K]) => WidgetEventMap[K] } = {
    'drag-start': (sourceEvent: MouseEvent | TouchEvent): DragWidgetEvent<'drag-start'> => {
        return allocDragEvent('drag-start', sourceEvent);
    },
    'drag-move': (sourceEvent: MouseEvent | TouchEvent): DragWidgetEvent<'drag-move'> => {
        return allocDragEvent('drag-move', sourceEvent);
    },
    'drag-end': (sourceEvent: MouseEvent | TouchEvent): DragWidgetEvent<'drag-end'> => {
        return allocDragEvent('drag-end', sourceEvent);
    },
    blur: (sourceEvent: FocusEvent): FocusWidgetEvent<'blur'> => {
        return { type: 'blur', sourceEvent };
    },
    change: (sourceEvent: Event): WidgetEvent => {
        return { type: 'change', sourceEvent };
    },
    contextmenu: (sourceEvent: MouseEvent): MouseWidgetEvent<'contextmenu'> => {
        return allocMouseEvent('contextmenu', sourceEvent);
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
    click: (sourceEvent: MouseEvent): MouseWidgetEvent<'click'> => {
        return allocMouseEvent('click', sourceEvent);
    },
    dblclick: (sourceEvent: MouseEvent): MouseWidgetEvent<'dblclick'> => {
        return allocMouseEvent('dblclick', sourceEvent);
    },
    mouseenter: (sourceEvent: MouseEvent): MouseWidgetEvent<'mouseenter'> => {
        return allocMouseEvent('mouseenter', sourceEvent);
    },
    mousemove: (sourceEvent: MouseEvent): MouseWidgetEvent<'mousemove'> => {
        return allocMouseEvent('mousemove', sourceEvent);
    },
    mouseleave: (sourceEvent: MouseEvent): MouseWidgetEvent<'mouseleave'> => {
        return allocMouseEvent('mouseleave', sourceEvent);
    },
};

export type WidgetEventMap_HTML = Pick<WidgetEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;
export type WidgetEventMap_Internal = Omit<WidgetEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;
export type WidgetSourceEventMap_HTML = Pick<WidgetSourceEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;
export type WidgetSourceEventMap_Internal = Omit<WidgetSourceEventMap, (typeof WIDGET_HTML_EVENTS)[number]>;

export class WidgetEventUtil {
    static alloc<K extends keyof WidgetEventMap_HTML>(
        type: K,
        sourceEvent: WidgetSourceEventMap_HTML[K]
    ): WidgetEventMap_HTML[K];

    static alloc<K extends keyof WidgetEventMap_Internal>(
        type: K,
        sourceEvent: WidgetSourceEventMap_Internal[K]
    ): WidgetEventMap_Internal[K];

    static alloc<K extends keyof WidgetEventMap>(type: K, sourceEvent: WidgetSourceEventMap[K]): WidgetEventMap[K] {
        return WidgetAllocators[type](sourceEvent);
    }

    static isHTMLEvent(type: keyof WidgetEventMap): type is keyof WidgetEventMap & keyof HTMLElementEventMap {
        const htmlTypes: readonly string[] = WIDGET_HTML_EVENTS;
        return htmlTypes.includes(type);
    }
}
