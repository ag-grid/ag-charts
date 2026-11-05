import { describe, expect, it } from 'vitest';

import { IconWidget } from './iconWidget';

describe('IconWidget', () => {
    it('fromName creates an aria-hidden span with the icon classes first', () => {
        const icon = IconWidget.fromName('drag-handle', 'ag-charts-toolbar__icon');
        const elem = icon.getElement();
        expect(elem.tagName).toBe('SPAN');
        expect(elem.className).toBe('ag-charts-icon ag-charts-icon-drag-handle ag-charts-toolbar__icon');
        expect(elem.getAttribute('aria-hidden')).toBe('true');
    });

    it('fromUrl creates an aria-hidden img', () => {
        const icon = IconWidget.fromUrl('https://example.com/icon.png');
        const elem = icon.getElement();
        expect(elem).toBeInstanceOf(HTMLImageElement);
        expect(elem).toHaveProperty('src', 'https://example.com/icon.png');
        expect(elem.className).toBe('');
        expect(elem.getAttribute('aria-hidden')).toBe('true');
    });

    it('can be exposed to assistive technology', () => {
        const icon = IconWidget.fromName('chevron-right');
        icon.setAriaHidden(undefined);
        expect(icon.getElement().hasAttribute('aria-hidden')).toBe(false);
    });
});
