import { setAttribute } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import type { ElementID } from '../identity/idBranding';
import { Widget } from './widget';

/** A `<label>` of visible text. Tie it to a form control with `setFor()` to give that control its accessible name. */
export class LabelWidget extends Widget<HTMLLabelElement> {
    /**
     * @param text - The label text.
     * @param classNames - Class names to add.
     */
    constructor(text: string, ...classNames: string[]) {
        super(createElement('label'));
        if (classNames.length > 0) this.addClass(...classNames);
        this.setTextContent(text);
    }

    /** Sets the `for` attribute to the labelled control's id, or removes it when `undefined`. */
    setFor(controlId: ElementID | undefined) {
        setAttribute(this.elem, 'for', controlId);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
