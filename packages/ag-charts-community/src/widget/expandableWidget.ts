import type { CollapseWidgetEvent, ExpandWidgetEvent } from './widgetEvents';

export type ExpandEvent = {
    readonly sourceEvent: Event;
};
export type ExpandOpts = {
    readonly overrideFocusVisible?: boolean;
};

// Widget interface
interface WidgetProps<TElement extends HTMLElement> {
    destroy(): void;
    getElement(): TElement;
    addListener(type: 'collapse-widget', listener: (ev: CollapseWidgetEvent, current: this) => unknown): () => void;
    addListener(type: 'expand-widget', listener: (ev: ExpandWidgetEvent, current: this) => unknown): () => void;
    removeListener(type: 'collapse-widget', listener: (ev: CollapseWidgetEvent, current: this) => unknown): void;
    removeListener(type: 'expand-widget', listener: (ev: ExpandWidgetEvent, current: this) => unknown): void;
}

export interface ExpandableWidget<TElement extends HTMLElement = HTMLElement> extends WidgetProps<TElement> {
    expand(event: ExpandEvent, opts?: ExpandOpts): void;
    collapse(): void;
}
