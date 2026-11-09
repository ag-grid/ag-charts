import { setAttribute } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import type { ElementID } from '../identity/idBranding';
import { Widget } from './widget';

export type InputWidgetType = 'number' | 'datetime-local' | 'text';

/**
 * A form-styled `<input>` for a number, a date-time or text. It opts out of `data-preventdefault`, so the arrow keys
 * still edit its value.
 */
export class InputWidget extends Widget<HTMLInputElement> {
    /** @param classNames - Extra class names, added after the base one. */
    constructor(type: InputWidgetType, ...classNames: string[]) {
        super(createElement('input'));
        this.addClass('ag-charts-input', ...classNames);
        this.elem.type = type;
        if (type === 'number') {
            this.elem.step = 'any';
        }
        this.setPreventsDefault(false);
    }

    get value(): string {
        return this.elem.value;
    }

    set value(value: string) {
        this.elem.value = value;
    }

    /** Sets the granularity of a `datetime-local` input, in seconds. A number input always accepts any value. */
    setStep(step: number) {
        if (this.elem.type !== 'number') {
            this.elem.step = String(step);
        }
    }

    /** Sets the `list` attribute to the id of a datalist of suggestions, or removes it when `undefined`. */
    setList(datalistId: ElementID | undefined) {
        setAttribute(this.elem, 'list', datalistId);
    }

    /**
     * Calls `listener` when the user commits a value: on `change`, or for a `datetime-local` input on blur or Enter.
     * A `datetime-local` input may commit a value that has not changed.
     */
    addCommitListener(listener: (event: Event) => void) {
        if (this.elem.type === 'datetime-local') {
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
