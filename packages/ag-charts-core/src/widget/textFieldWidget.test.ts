import { afterEach, describe, expect, it } from 'vitest';

import { TextFieldWidget } from './textFieldWidget';

describe('TextFieldWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('holds a value and opts out of data-preventdefault', () => {
        const field = new TextFieldWidget('ag-charts-field');
        const elem = field.getElement();
        expect(elem.tagName).toBe('INPUT');
        expect(elem.className).toBe('ag-charts-field');
        expect(elem.getAttribute('data-preventdefault')).toBe('false');

        field.value = '#00FF00';
        expect(elem.value).toBe('#00FF00');
        expect(field.value).toBe('#00FF00');
    });

    it('blur moves focus away', () => {
        const field = new TextFieldWidget();
        document.body.append(field.getElement());
        field.focus();
        expect(field.isFocused()).toBe(true);

        field.blur();

        expect(field.isFocused()).toBe(false);
    });

    it('creates its element in the given document', () => {
        const popupDocument = document.implementation.createHTMLDocument('popup');
        const widget = new TextFieldWidget(popupDocument, 'ag-charts-field');
        expect(widget.getElement().ownerDocument).toBe(popupDocument);
        expect(widget.getElement().className).toBe('ag-charts-field');
    });
});
