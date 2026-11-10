import { setAttribute } from '../dom/attributeUtil';
import type { ElementID } from '../identity/idBranding';
import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

/** A `<label>` of visible text. Tie it to a form control with `setFor()` to give that control its accessible name. */
export class LabelWidget extends Widget<HTMLLabelElement> {
    /**
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param text - The label text.
     * @param classNames - Class names to add.
     */
    constructor(...args: WithOwnerDocument<[text: string, ...classNames: string[]]>) {
        const [ownerDocument, [text, ...classNames]] = splitOwnerDocument(args);
        super(ownerDocument.createElement('label'));
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
