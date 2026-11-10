import { setAttribute } from '../dom/attributeUtil';
import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

/**
 * A focusable `<div>` with the `slider` role, for a control that sets two values at once, such as a colour palette.
 * The owner handles its keys and pointer input, and describes both values with `setAriaValueText()`.
 */
export class Slider2DWidget extends Widget<HTMLDivElement> {
    /**
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param classNames - Class names to add.
     */
    constructor(...args: WithOwnerDocument<string[]>) {
        const [ownerDocument, classNames] = splitOwnerDocument(args);
        super(ownerDocument.createElement('div'));
        if (classNames.length > 0) this.addClass(...classNames);
        this.setAriaRole('slider');
        this.setTabIndex(0);
    }

    setAriaRoleDescription(roleDescription: string | undefined) {
        setAttribute(this.elem, 'aria-roledescription', roleDescription);
    }

    setAriaValueText(valueText: string | undefined) {
        setAttribute(this.elem, 'aria-valuetext', valueText);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
