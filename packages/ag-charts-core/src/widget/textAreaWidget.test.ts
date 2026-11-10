import { afterEach, describe, expect, it } from 'vitest';

import { TextAreaWidget } from './textAreaWidget';

describe('TextAreaWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('holds a value and opts out of data-preventdefault', () => {
        const textArea = new TextAreaWidget();
        const elem = textArea.getElement();
        expect(elem.className).toBe('ag-charts-input ag-charts-textarea');
        expect(elem.getAttribute('data-preventdefault')).toBe('false');

        textArea.value = 'Line 1';
        expect(elem.value).toBe('Line 1');
        expect(textArea.value).toBe('Line 1');
    });

    it('sets and removes the placeholder', () => {
        const textArea = new TextAreaWidget();
        textArea.setPlaceholder('Add Text');
        expect(textArea.getElement().placeholder).toBe('Add Text');
        textArea.setPlaceholder(undefined);
        expect(textArea.getElement().hasAttribute('placeholder')).toBe(false);
    });

    it('focusCursorAtEnd focuses it', () => {
        const textArea = new TextAreaWidget();
        document.body.append(textArea.getElement());

        textArea.focusCursorAtEnd();

        expect(textArea.isFocused()).toBe(true);
    });

    it('focusCursorAtEnd moves the caret after the last character', () => {
        const textArea = new TextAreaWidget();
        document.body.append(textArea.getElement());
        textArea.value = 'Line 1';
        textArea.getElement().setSelectionRange(0, 0);

        textArea.focusCursorAtEnd();

        expect(textArea.getElement().selectionStart).toBe(6);
        expect(textArea.getElement().selectionEnd).toBe(6);
    });
});
