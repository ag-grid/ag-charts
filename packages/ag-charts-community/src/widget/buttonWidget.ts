import { createElement } from 'ag-charts-core';

import { setAttribute } from '../util/attributeUtil';
import { Widget } from './widget';
import type { WidgetEventMap as EventMap } from './widgetEvents';

type R = ReturnType<Widget['addListener']>;

export class ButtonWidget extends Widget<HTMLButtonElement> {
    constructor() {
        super(createElement('button'));
        this.setEnabled(true);
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
