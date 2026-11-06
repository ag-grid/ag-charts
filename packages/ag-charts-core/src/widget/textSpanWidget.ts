import { createElement } from '../dom/domElements';
import { Widget } from './widget';

/** A `<span>` of visible text, such as the label beside an icon in a menu row or toolbar button. */
export class TextSpanWidget extends Widget<HTMLSpanElement> {
    /**
     * @param text - The initial text content.
     * @param classNames - Class names to add.
     */
    constructor(text?: string, ...classNames: string[]) {
        super(createElement('span'));
        if (classNames.length > 0) this.addClass(...classNames);
        if (text !== undefined) this.setTextContent(text);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
