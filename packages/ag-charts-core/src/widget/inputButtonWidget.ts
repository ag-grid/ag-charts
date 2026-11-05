import type { LabelIcon } from '../dom/domElements';
import { ButtonWidget } from './buttonWidget';
import { IconWidget } from './iconWidget';

/**
 * A form-styled `<button>` (`ag-charts-input ag-charts-button`) that shows its text label, or an icon when it has no
 * label. An icon-only button takes its accessible name from `altText`.
 */
export class InputButtonWidget extends ButtonWidget {
    /** @param classNames - Extra class names, added after the base ones. */
    constructor(content: LabelIcon, ...classNames: string[]) {
        super();
        this.addClass('ag-charts-input', 'ag-charts-button', ...classNames);
        if (content.label === undefined) {
            this.addChild(IconWidget.fromName(content.icon));
            this.setAriaLabel(content.altText);
        } else {
            this.setTextContent(content.label);
        }
    }
}
