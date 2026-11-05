import { createElement } from '../dom/domElements';
import { Widget } from './widget';

export interface SelectWidgetOption {
    label: string;
    value: string;
}

/** A form-styled `<select>`. It opts out of `data-preventdefault`, so the arrow keys still change its value. */
export class SelectWidget extends Widget<HTMLSelectElement> {
    /** @param classNames - Extra class names, added after the base ones. */
    constructor(options: ReadonlyArray<SelectWidgetOption>, ...classNames: string[]) {
        super(createElement('select'));
        this.addClass('ag-charts-input', 'ag-charts-select', ...classNames);
        for (const { label, value } of options) {
            const option = createElement('option');
            option.value = value;
            option.textContent = label;
            this.elem.append(option);
        }
        this.setPreventsDefault(false);
    }

    get value(): string {
        return this.elem.value;
    }

    set value(value: string) {
        this.elem.value = value;
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
