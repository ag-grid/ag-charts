export type FocusWidgetEvent = {
    sourceEvent: FocusEvent;
};

export type KeyboardWidgetEvent = {
    sourceEvent: KeyboardEvent;
};

export type WidgetEventMap = {
    focus: FocusWidgetEvent;
    keydown: KeyboardWidgetEvent;
};

const WidgetAllocators: { [K in keyof WidgetEventMap]: (sourceEvent: HTMLElementEventMap[K]) => WidgetEventMap[K] } = {
    focus: (sourceEvent: FocusEvent): FocusWidgetEvent => {
        return { sourceEvent };
    },
    keydown: (sourceEvent: KeyboardEvent): KeyboardWidgetEvent => {
        return { sourceEvent };
    },
};

export const WidgetEvent = {
    alloc<K extends keyof WidgetEventMap>(type: K, sourceEvent: HTMLElementEventMap[K]): WidgetEventMap[K] {
        return WidgetAllocators[type](sourceEvent);
    },
};
