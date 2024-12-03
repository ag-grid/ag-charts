import { setAttribute, setElementStyle } from '../util/attributeUtil';
import { getDocument } from '../util/dom';
import { Widget } from './widget';
import type { WidgetEventMap } from './widgetEvents';

export class ButtonWidget extends Widget<HTMLButtonElement> {
    constructor() {
        super(getDocument().createElement('button'));
        this.setEnabled(true);
    }

    protected override destructor() {
        // Nothing to destroy.
    }

    setEnabled(enabled: boolean) {
        setAttribute(this.elem, 'aria-disabled', !enabled);
        setElementStyle(this.elem, 'pointer-events', enabled ? undefined : 'none');
    }

    override addListener<K extends keyof WidgetEventMap>(
        type: K,
        listener: (ev: WidgetEventMap[K], current: this) => unknown
    ): void;
    override addListener<K extends keyof WidgetEventMap>(
        type: K,
        listener: (ev: unknown, current: this) => unknown
    ): void {
        return super.addListener(type, (ev, current: this) => {
            if ((type === 'click' || type === 'dblclick') && this.isDisabled()) return;
            listener(ev, current);
        });
    }
}
