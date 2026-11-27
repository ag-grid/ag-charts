import { setAttribute } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import type { ElementID } from '../identity/idBranding';
import { Widget } from './widget';

export type InputWidgetType = 'number' | 'date' | 'datetime-local' | 'text';

/**
 * A form-styled `<input>` for a number, a date, a date-time or text. It opts out of `data-preventdefault`, so the arrow
 * keys still edit its value.
 */
export class InputWidget extends Widget<HTMLInputElement> {
    /** @param classNames - Extra class names, added after the base one. */
    constructor(type: InputWidgetType, ...classNames: string[]) {
        super(createElement('input'));
        this.addClass('ag-charts-input', ...classNames);
        this.elem.type = type;
        this.setStep(undefined);
        this.setPreventsDefault(false);
    }

    /** Switches between a `date` and a `datetime-local` input, which commit alike; the value is not carried over. */
    setType(type: 'date' | 'datetime-local') {
        if (this.elem.type !== type) {
            this.elem.type = type;
        }
    }

    get value(): string {
        return this.elem.value;
    }

    set value(value: string) {
        // A number steps from its `value` attribute, so the value set here is on a step and any other can be typed.
        if (this.elem.type === 'number') {
            this.elem.defaultValue = value;
        }
        this.elem.value = value;
    }

    /**
     * Sets the granularity of a `datetime-local` input, in seconds, or the amount a number input's spinner and arrow
     * keys move its value by. Without a step, a number steps by one and a date or a date-time by its default.
     */
    setStep(step: number | undefined) {
        if (step != null) {
            this.elem.step = String(step);
        } else if (this.elem.type === 'number') {
            this.elem.step = 'any';
        } else {
            this.elem.removeAttribute('step');
        }
    }

    /** Bounds the value a number input's spinner and arrow keys reach; other input types ignore it. */
    setRange(min: number, max: number) {
        if (this.elem.type === 'number') {
            this.elem.min = String(min);
            this.elem.max = String(max);
        }
    }

    /** Sets the `list` attribute to the id of a datalist of suggestions, or removes it when `undefined`. */
    setList(datalistId: ElementID | undefined) {
        setAttribute(this.elem, 'list', datalistId);
    }

    /**
     * Calls `listener` when the user commits a value: on `change`, or for a `date` or `datetime-local` input on blur or
     * Enter. Those inputs may commit a value that has not changed.
     */
    addCommitListener(listener: (event: Event) => void) {
        if (this.elem.type === 'date' || this.elem.type === 'datetime-local') {
            // Chrome fires `change` after every edited segment, committing a half-typed date, so commit on blur or Enter.
            this.addListener('blur', ({ sourceEvent }) => listener(sourceEvent));
            this.addListener('keydown', ({ sourceEvent }) => {
                if (sourceEvent.key === 'Enter') {
                    listener(sourceEvent);
                }
            });
        } else {
            this.addListener('change', ({ sourceEvent }) => listener(sourceEvent));
        }
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
