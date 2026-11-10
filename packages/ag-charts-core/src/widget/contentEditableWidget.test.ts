import { afterEach, describe, expect, it } from 'vitest';

import { ContentEditableWidget } from './contentEditableWidget';

describe('ContentEditableWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('creates a focusable plain-text textbox that opts out of data-preventdefault', () => {
        const textArea = new ContentEditableWidget('ag-charts-text');
        const elem = textArea.getElement();
        expect(elem.tagName).toBe('DIV');
        expect(elem.className).toBe('ag-charts-text');
        expect(elem.getAttribute('contenteditable')).toBe('plaintext-only');
        expect(elem.getAttribute('tabindex')).toBe('0');
        expect(elem.getAttribute('role')).toBe('textbox');
        expect(elem.getAttribute('data-preventdefault')).toBe('false');
    });

    it('sets the placeholder', () => {
        const textArea = new ContentEditableWidget();
        textArea.setPlaceholder('Add Text');
        expect(textArea.getElement().getAttribute('placeholder')).toBe('Add Text');
    });

    it('sets only the given text styles', () => {
        const textArea = new ContentEditableWidget();
        const { style } = textArea.getElement();

        textArea.setTextStyle({ color: 'red', fontSize: '14px', lineHeight: '18px' });
        textArea.setTextStyle({ fontSize: '20px' });

        expect(style.color).toBe('red');
        expect(style.fontSize).toBe('20px');
        expect(style.lineHeight).toBe('18px');
    });

    it('focusCursorAtEnd focuses it and collapses the selection after the last character', () => {
        const textArea = new ContentEditableWidget();
        const elem = textArea.getElement();
        elem.append('Hello');
        document.body.append(elem);

        textArea.focusCursorAtEnd();

        expect(textArea.isFocused()).toBe(true);
        const selection = document.getSelection();
        expect(selection?.anchorNode).toBe(elem.lastChild);
        expect(selection?.anchorOffset).toBe(5);
        expect(selection?.isCollapsed).toBe(true);
    });

    it('creates its element in the given document', () => {
        const popupDocument = document.implementation.createHTMLDocument('popup');
        const widget = new ContentEditableWidget(popupDocument, 'ag-charts-text');
        expect(widget.getElement().ownerDocument).toBe(popupDocument);
        expect(widget.getElement().className).toBe('ag-charts-text');
    });
});
