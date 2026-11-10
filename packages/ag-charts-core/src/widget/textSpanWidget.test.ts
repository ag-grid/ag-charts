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
