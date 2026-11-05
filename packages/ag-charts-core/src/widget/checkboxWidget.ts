import { createElement } from '../dom/domElements';
import { isButtonClickEvent } from '../dom/keynavUtil';
import { Widget } from './widget';

/** A form-styled `<input type="checkbox">` that Enter toggles as well as Space. */
export class CheckboxWidget extends Widget<HTMLInputElement> {
    /** @param classNames - Extra class names, added after the base ones. */
    constructor(...classNames: string[]) {
        super(createElement('input'));
        this.addClass('ag-charts-input', 'ag-charts-checkbox', ...classNames);
        this.elem.type = 'checkbox';
        this.addListener('keydown', ({ sourceEvent }) => {
            if (isButtonClickEvent(sourceEvent)) {
                sourceEvent.preventDefault();
                this.elem.click();
            }
        });
    }

    get checked(): boolean {
        return this.elem.checked;
    }

    set checked(checked: boolean) {
        this.elem.checked = checked;
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
