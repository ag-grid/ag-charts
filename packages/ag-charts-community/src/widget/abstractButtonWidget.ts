import { setAttribute } from 'ag-charts-core';

import { isButtonClickEvent } from '../util/keynavUtil';
import { Widget } from './widget';
import type { WidgetEventMap as EventMap, KeyboardWidgetEvent } from './widgetEvents';

type R = ReturnType<Widget['addListener']>;

export class AbstractButtonWidget<TElement extends HTMLElement> extends Widget<TElement> {
    constructor(element: TElement, role?: 'menuitem' | 'menuitemradio') {
        super(element);
        setAttribute(this.elem, 'role', role);
        this.setEnabled(true);
        this.addListener('keydown', ({ sourceEvent }: KeyboardWidgetEvent) => {
            if (isButtonClickEvent(sourceEvent)) {
                sourceEvent.preventDefault();
                this.htmlListener?.dispatch('click', this, { type: 'click', device: 'keyboard', sourceEvent });
            }
        });
    }

    protected override destructor() {
        // Nothing to destroy.
    }

    setEnabled(enabled: boolean) {
        setAttribute(this.elem, 'aria-disabled', !enabled);
    }

    override addListener<K extends keyof EventMap>(type: K, listener: (ev: EventMap[K], current: this) => unknown): R;
    override addListener<K extends keyof EventMap>(type: K, listener: (ev: unknown, current: this) => unknown): R {
        return super.addListener(type, (ev, current: this) => {
            if ((type === 'click' || type === 'dblclick') && this.isDisabled()) return;
            listener(ev, current);
        });
    }
}
