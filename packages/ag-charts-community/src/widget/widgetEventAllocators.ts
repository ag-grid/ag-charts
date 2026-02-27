import type {
    DragWidgetEvent,
    KeyboardSyntheticMouseWidgetEvent,
    TouchSyntheticMouseWidgetEvent,
    WidgetEventMap_HTML,
    WidgetSourceEventMap_HTML,
} from './widgetEvents';

export type AllocatableInternals = DragWidgetEvent | KeyboardSyntheticMouseWidgetEvent | TouchSyntheticMouseWidgetEvent;

export type WidgetEventAllocator = {
    allocNativeEvent<K extends keyof WidgetEventMap_HTML>(
        type: K,
        sourceEvent: WidgetSourceEventMap_HTML[K],
        current: HTMLElement
    ): WidgetEventMap_HTML[K];

    allocInternalEvent(
        partialEvent: Omit<KeyboardSyntheticMouseWidgetEvent, 'stopInternalPropagation'>
    ): KeyboardSyntheticMouseWidgetEvent;

    allocInternalEvent<T extends DragWidgetEvent['type']>(
        partialEvent: Omit<DragWidgetEvent<T>, 'stopInternalPropagation'>
    ): DragWidgetEvent<T>;
};
