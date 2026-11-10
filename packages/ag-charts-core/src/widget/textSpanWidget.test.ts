import { describe, expect, it } from 'vitest';

import { TextSpanWidget } from './textSpanWidget';

describe('TextSpanWidget', () => {
    it('creates a span with text and classes', () => {
        const label = new TextSpanWidget('Delete', 'ag-charts-menu__label');
        const elem = label.getElement();
        expect(elem.tagName).toBe('SPAN');
        expect(elem.className).toBe('ag-charts-menu__label');
        expect(elem.textContent).toBe('Delete');
    });

    it('can start empty', () => {
        const label = new TextSpanWidget();
        expect(label.getElement().textContent).toBe('');
        expect(label.getElement().className).toBe('');
    });
});

describe('TextSpanWidget.setTextStyle', () => {
    it('sets inline text styles, with sizes in pixels', () => {
        const span = new TextSpanWidget('Revenue');
        span.setTextStyle({
            color: 'red',
            fontFamily: 'Verdana',
            fontSize: 14,
            fontStyle: 'italic',
            fontWeight: 'bold',
            lineHeight: 20,
        });
        const { style } = span.getElement();
        expect(style.color).toBe('red');
        expect(style.fontFamily).toBe('Verdana');
        expect(style.fontSize).toBe('14px');
        expect(style.fontStyle).toBe('italic');
        expect(style.fontWeight).toBe('bold');
        expect(style.lineHeight).toBe('20px');
    });

    it('leaves omitted properties to be inherited', () => {
        const span = new TextSpanWidget('Revenue');
        span.setTextStyle({ fontWeight: 600 });
        const { style } = span.getElement();
        expect(style.fontWeight).toBe('600');
        expect(style.color).toBe('');
        expect(style.fontSize).toBe('');
        expect(style.lineHeight).toBe('');
    });
});
