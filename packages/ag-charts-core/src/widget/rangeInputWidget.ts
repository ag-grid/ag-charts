import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

/** A native `<input type="range">`. It opts out of `data-preventdefault`, so the arrow keys still change its value. */
export class RangeInputWidget extends Widget<HTMLInputElement> {
    /**
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param classNames - Class names to add.
     */
    constructor(...args: WithOwnerDocument<string[]>) {
        const [ownerDocument, classNames] = splitOwnerDocument(args);
        super(ownerDocument.createElement('input'));
        if (classNames.length > 0) this.addClass(...classNames);
        this.elem.type = 'range';
        this.setPreventsDefault(false);
    }

    /** Sets the `min`, `max` and, when given, `step` attributes. */
    setRange(min: number, max: number, step?: number) {
        this.elem.min = `${min}`;
        this.elem.max = `${max}`;
        if (step != null) this.elem.step = `${step}`;
    }

    get value(): number {
        return this.elem.valueAsNumber;
    }

    set value(value: number) {
        this.elem.value = `${value}`;
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
