import type { ElementID } from 'ag-charts-core';

import type { CollapseMode } from './collapseMode';
import type { CollapseWidgetEvent, ExpandWidgetEvent } from './widgetEvents';

// Either a controller (e.g. Financial Charts toolbar buttons) or sourceEvent (e.g. Context menu) is required in order for ExpandableWidget.expand() to
export type ExpandOpts =
    | {
          readonly sourceEvent: Event;
          readonly controller?: never;
          readonly overrideFocusVisible?: boolean;
      }
    | {
          readonly sourceEvent?: never;
          readonly controller: ExpansionControllerWidget<HTMLElement>;
          readonly overrideFocusVisible?: boolean;
      };

export type ExpandControlledOpts = {
    readonly overrideFocusVisible?: boolean;
};

export type CollapseOpts = {
    readonly mode: CollapseMode;
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
    id?: ElementID;
    expand(opts: ExpandOpts): void;
    collapse(opts?: CollapseOpts): void;
}

export interface ExpansionControllerWidget<TElement extends HTMLElement> {
    setControlled(controls: ExpandableWidget<TElement> | undefined): void;
    expandControlled(opts?: ExpandControlledOpts): void;
}
