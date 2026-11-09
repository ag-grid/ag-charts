import { setAttribute } from '../dom/attributeUtil';
import { getDocument } from '../dom/globalsProxy';
import { Widget } from './widget';

/** A `role="separator"` divider between groups of items, such as the rows of a menu. */
export class SeparatorWidget extends Widget<HTMLDivElement> {
    /**
     * @param ownerDocument - The document to create the element in. Pass the container's `ownerDocument` when the
     * chart may live in another window, such as a popup.
     */
    constructor(ownerDocument: Document = getDocument()) {
        super(ownerDocument.createElement('div'));
        setAttribute(this.elem, 'role', 'separator');
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
