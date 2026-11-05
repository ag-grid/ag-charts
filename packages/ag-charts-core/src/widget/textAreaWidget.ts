import { setAttribute } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import { Widget } from './widget';

/** A form-styled `<textarea>`. It opts out of `data-preventdefault`, so the arrow keys still move the caret. */
export class TextAreaWidget extends Widget<HTMLTextAreaElement> {
    /** @param classNames - Extra class names, added after the base ones. */
    constructor(...classNames: string[]) {
        super(createElement('textarea'));
        this.addClass('ag-charts-input', 'ag-charts-textarea', ...classNames);
        this.setPreventsDefault(false);
    }

    get value(): string {
        return this.elem.value;
    }

    set value(value: string) {
        this.elem.value = value;
    }

    /** Sets the `placeholder` attribute, or removes it when `undefined` or empty. */
    setPlaceholder(placeholder: string | undefined) {
        setAttribute(this.elem, 'placeholder', placeholder);
    }

    /** Focuses the text area without scrolling and puts the caret after the last character. */
    focusCursorAtEnd() {
        // The DOM-Range `focusCursorAtEnd()` helper is for contenteditable; a textarea's caret is its selection range.
        this.elem.focus({ preventScroll: true });
        const end = this.elem.value.length;
        this.elem.setSelectionRange(end, end);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
