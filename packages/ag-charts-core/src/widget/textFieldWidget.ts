import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

/** A single-line `<input>` for free text. It opts out of `data-preventdefault`, so the arrow keys still move the caret. */
export class TextFieldWidget extends Widget<HTMLInputElement> {
    /**
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param classNames - Class names to add.
     */
    constructor(...args: WithOwnerDocument<string[]>) {
        const [ownerDocument, classNames] = splitOwnerDocument(args);
        super(ownerDocument.createElement('input'));
        if (classNames.length > 0) this.addClass(...classNames);
        this.setPreventsDefault(false);
    }

    get value(): string {
        return this.elem.value;
    }

    set value(value: string) {
        this.elem.value = value;
    }

    blur() {
        this.elem.blur();
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
