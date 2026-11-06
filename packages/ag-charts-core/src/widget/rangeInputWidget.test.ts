import { describe, expect, it } from 'vitest';

import { RangeInputWidget } from './rangeInputWidget';

describe('RangeInputWidget', () => {
    it('creates a range input with its bounds and opts out of data-preventdefault', () => {
        const range = new RangeInputWidget('ag-charts-hue');
        range.setRange(0, 360);
        const elem = range.getElement();
        expect(elem.type).toBe('range');
        expect(elem.min).toBe('0');
        expect(elem.max).toBe('360');
        expect(elem.hasAttribute('step')).toBe(false);
        expect(elem.className).toBe('ag-charts-hue');
        expect(elem.getAttribute('data-preventdefault')).toBe('false');
    });

    it('reads and writes its value as a number', () => {
        const range = new RangeInputWidget();
        range.setRange(0, 1, 0.01);
        expect(range.getElement().step).toBe('0.01');

        range.value = 0.25;
        expect(range.getElement().value).toBe('0.25');
        expect(range.value).toBe(0.25);
    });

    it('creates its element in the given document', () => {
        const popupDocument = document.implementation.createHTMLDocument('popup');
        const range = new RangeInputWidget(popupDocument, 'ag-charts-hue');
        expect(range.getElement().ownerDocument).toBe(popupDocument);
        expect(range.getElement().className).toBe('ag-charts-hue');
    });
});
