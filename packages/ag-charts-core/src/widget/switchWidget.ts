import { setAttribute } from '../dom/attributeUtil';
import { getDocument } from '../dom/globalsProxy';
import { ButtonWidget } from './buttonWidget';

export class SwitchWidget extends ButtonWidget {
    /**
     * @param ownerDocument - The document to create the element in. Pass the container's `ownerDocument` when the
     * chart may live in another window, such as a popup.
     */
    constructor(ownerDocument: Document = getDocument()) {
        super(ownerDocument);
        setAttribute(this.elem, 'role', 'switch');
        this.setChecked(false);
    }

    setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
