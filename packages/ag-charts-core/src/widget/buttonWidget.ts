import { getDocument } from '../dom/globalsProxy';
import { AbstractButtonWidget } from './abstractButtonWidget';

export class ButtonWidget extends AbstractButtonWidget<HTMLButtonElement> {
    /**
     * @param ownerDocument - The document to create the element in. Pass the container's `ownerDocument` when the
     * chart may live in another window, such as a popup.
     */
    constructor(ownerDocument: Document = getDocument()) {
        super(ownerDocument.createElement('button'));
    }

    /**
     * Sets the native button `type`. A `<button>` defaults to `submit`, so a chart inside the page's own `<form>`
     * would submit that form when the button is clicked; `'button'` prevents this.
     */
    setType(type: HTMLButtonElement['type']) {
        this.elem.type = type;
    }
}
