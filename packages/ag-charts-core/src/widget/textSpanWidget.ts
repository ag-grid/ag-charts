import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, PixelSize } from 'ag-charts-types';

import { type WithOwnerDocument, splitOwnerDocument } from './ownerDocument';
import { Widget } from './widget';

/** Inline text styling for a `TextSpanWidget`. Omitted properties are inherited from the parent. */
export interface TextSpanStyle {
    color?: CssColor;
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    lineHeight?: PixelSize;
}

/** A `<span>` of visible text, such as the label beside an icon in a menu row or toolbar button. */
export class TextSpanWidget extends Widget<HTMLSpanElement> {
    /**
     * @param ownerDocument - Optional: the document to create the element in (see `WithOwnerDocument`).
     * @param text - The initial text content.
     * @param classNames - Class names to add.
     */
    constructor(...args: WithOwnerDocument<[text?: string, ...classNames: string[]]>) {
        const [ownerDocument, [text, ...classNames]] = splitOwnerDocument(args);
        super(ownerDocument.createElement('span'));
        if (classNames.length > 0) this.addClass(...classNames);
        if (text !== undefined) this.setTextContent(text);
    }

    /** Sets inline text styles; `fontSize` and `lineHeight` are in CSS pixels. */
    setTextStyle({ color, fontFamily, fontSize, fontStyle, fontWeight, lineHeight }: TextSpanStyle) {
        const { style } = this.elem;
        if (color != null) style.color = color;
        if (fontSize != null) style.fontSize = `${fontSize}px`;
        if (fontFamily != null) style.fontFamily = fontFamily;
        if (fontWeight != null) style.fontWeight = String(fontWeight);
        if (fontStyle != null) style.fontStyle = fontStyle;
        if (lineHeight != null) style.lineHeight = `${lineHeight}px`;
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
