export type WidgetEvent = {
    type: keyof WidgetEventMap;
    sourceEvent: Event;
};

export type FocusWidgetEvent = {
    type: 'blur' | 'focus';
    sourceEvent: FocusEvent;
};

export type KeyboardWidgetEvent = {
    type: 'keyup' | 'keydown';
    sourceEvent: KeyboardEvent;
};

export type MouseWidgetEvent = {
    type: 'mouseenter' | 'mousemove' | 'mouseleave';
    sourceEvent: MouseEvent;
};

export type ContextMenuWidgetEvent = {
    type: 'contextmenu';
    sourceEvent: MouseEvent;
};

// `originDelta` is the offset relative to position of the HTML element when the drag initiated.
// This is helpful for elements that move during drag actions, like navigator sliders.
export type DragStartWidgetEvent = {
    type: 'drag-start';
    offsetX: number;
    offsetY: number;
    originDeltaX: number;
    originDeltaY: number;
    sourceEvent: MouseEvent | TouchEvent;
};

export type DragMoveWidgetEvent = {
    type: 'drag-move';
    offsetX: number;
    offsetY: number;
    originDeltaX: number;
    originDeltaY: number;
    sourceEvent: MouseEvent | TouchEvent;
};

export type DragEndWidgetEvent = {
    type: 'drag-end';
    offsetX: number;
    offsetY: number;
    originDeltaX: number;
    originDeltaY: number;
    sourceEvent: MouseEvent | TouchEvent;
};

export type WidgetEventMap = {
    'drag-start': DragStartWidgetEvent;
    'drag-move': DragMoveWidgetEvent;
    'drag-end': DragEndWidgetEvent;
    blur: FocusWidgetEvent;
    change: WidgetEvent;
    contextmenu: ContextMenuWidgetEvent;
    focus: FocusWidgetEvent;
    keydown: KeyboardWidgetEvent;
    keyup: KeyboardWidgetEvent;
    mousemove: MouseWidgetEvent;
    mouseleave: MouseWidgetEvent;
};

export const WIDGET_HTML_EVENTS: readonly (keyof WidgetEventMap & keyof HTMLElementEventMap)[] = [
    'blur',
    'change',
    'contextmenu',
    'focus',
    'keydown',
    'keyup',
    'mousemove',
    'mouseleave',
] satisfies (keyof WidgetEventMap & keyof HTMLElementEventMap)[];

export type WidgetSourceEventMap = {
    [K in keyof WidgetEventMap]: WidgetEventMap[K]['sourceEvent'];
};

function allocDragEvent<T extends 'drag-start' | 'drag-move' | 'drag-end'>(
    type: T,
    sourceEvent: MouseEvent | TouchEvent
) {
    return { type, offsetX: NaN, offsetY: NaN, originDeltaX: NaN, originDeltaY: NaN, sourceEvent };
}
const WidgetAllocators: { [K in keyof WidgetEventMap]: (sourceEvent: WidgetSourceEventMap[K]) => WidgetEventMap[K] } = {
    'drag-start': (sourceEvent: MouseEvent | TouchEvent): DragStartWidgetEvent => {
        return allocDragEvent('drag-start', sourceEvent);
    },
    'drag-move': (sourceEvent: MouseEvent | TouchEvent): DragMoveWidgetEvent => {
        return allocDragEvent('drag-move', sourceEvent);
    },
    'drag-end': (sourceEvent: MouseEvent | TouchEvent): DragEndWidgetEvent => {
        return allocDragEvent('drag-end', sourceEvent);
    },
    blur: (sourceEvent: FocusEvent): FocusWidgetEvent => {
        return { type: 'blur', sourceEvent };
    },
    change: (sourceEvent: Event): WidgetEvent => {
        return { type: 'change', sourceEvent };
    },
    contextmenu: (sourceEvent: MouseEvent): ContextMenuWidgetEvent => {
        return { type: 'contextmenu', sourceEvent };
    },
    focus: (sourceEvent: FocusEvent): FocusWidgetEvent => {
        return { type: 'focus', sourceEvent };
    },
    keydown: (sourceEvent: KeyboardEvent): KeyboardWidgetEvent => {
        return { type: 'keydown', sourceEvent };
    },
    keyup: (sourceEvent: KeyboardEvent): KeyboardWidgetEvent => {
        return { type: 'keyup', sourceEvent };
    },
    mousemove: (sourceEvent: MouseEvent): MouseWidgetEvent => {
        return { type: 'mousemove', sourceEvent };
    },
    mouseleave: (sourceEvent: MouseEvent): MouseWidgetEvent => {
        return { type: 'mouseleave', sourceEvent };
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
