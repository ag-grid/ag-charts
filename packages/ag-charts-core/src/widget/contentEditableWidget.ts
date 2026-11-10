import { setAttribute } from '../dom/attributeUtil';
import { focusCursorAtEnd } from '../dom/domUtil';
import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

export type ContentEditableTextStyle = Pick<
    CSSStyleDeclaration,
    'color' | 'fontFamily' | 'fontSize' | 'fontStyle' | 'fontWeight' | 'lineHeight'
>;

/**
 * A plain-text `contenteditable` `<div>` with the `textbox` role. Unlike a `<textarea>`, it grows with its text.
 * It opts out of `data-preventdefault`, so the arrow keys still move the caret.
 */
export class ContentEditableWidget extends Widget<HTMLDivElement> {
    /**
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param classNames - Class names to add.
     */
    constructor(...args: WithOwnerDocument<string[]>) {
        const [ownerDocument, classNames] = splitOwnerDocument(args);
        super(ownerDocument.createElement('div'));
        if (classNames.length > 0) this.addClass(...classNames);
        setAttribute(this.elem, 'contenteditable', 'plaintext-only');
        this.setTabIndex(0);
        this.setAriaRole('textbox');
        this.setPreventsDefault(false);
    }

    /** The rendered text, as `innerText`, so line breaks read and write as `\n`. */
    get text(): string {
        return this.elem.innerText;
    }

    set text(text: string) {
        this.elem.innerText = text;
    }

    /** Sets the `placeholder` attribute, which the stylesheet shows while the text is empty. */
    setPlaceholder(placeholder: string) {
        this.elem.setAttribute('placeholder', placeholder);
    }

    /** Sets inline text styles. Properties that are left out keep their current value. */
    setTextStyle(style: Partial<ContentEditableTextStyle>) {
        Object.assign(this.elem.style, style);
    }

    /** Focuses the text without scrolling and puts the caret after the last character. */
    focusCursorAtEnd() {
        focusCursorAtEnd(this.elem);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
