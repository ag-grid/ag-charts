import { setAttribute, setElementStyle } from '../util/attributeUtil';
import { getDocument } from '../util/dom';
import { Widget } from './widget';

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
}
