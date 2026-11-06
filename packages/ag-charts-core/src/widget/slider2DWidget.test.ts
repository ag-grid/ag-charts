import { describe, expect, it } from 'vitest';

import { Slider2DWidget } from './slider2DWidget';

describe('Slider2DWidget', () => {
    it('creates a focusable div with the slider role', () => {
        const slider = new Slider2DWidget('ag-charts-palette');
        const elem = slider.getElement();
        expect(elem.tagName).toBe('DIV');
        expect(elem.className).toBe('ag-charts-palette');
        expect(elem.getAttribute('role')).toBe('slider');
        expect(elem.getAttribute('tabindex')).toBe('0');
    });

    it('sets and removes the role description and value text', () => {
        const slider = new Slider2DWidget();
        const elem = slider.getElement();

        slider.setAriaRoleDescription('2D slider');
        slider.setAriaValueText('s 50%, v 25%');
        expect(elem.getAttribute('aria-roledescription')).toBe('2D slider');
        expect(elem.getAttribute('aria-valuetext')).toBe('s 50%, v 25%');

        slider.setAriaRoleDescription(undefined);
        slider.setAriaValueText(undefined);
        expect(elem.hasAttribute('aria-roledescription')).toBe(false);
        expect(elem.hasAttribute('aria-valuetext')).toBe(false);
    });

    it('creates its element in the given document', () => {
        const popupDocument = document.implementation.createHTMLDocument('popup');
        const widget = new Slider2DWidget(popupDocument, 'ag-charts-palette');
        expect(widget.getElement().ownerDocument).toBe(popupDocument);
        expect(widget.getElement().className).toBe('ag-charts-palette');
    });
});
