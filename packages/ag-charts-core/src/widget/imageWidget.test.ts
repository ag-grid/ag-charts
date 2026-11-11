import { describe, expect, it } from 'vitest';

import { ImageWidget } from './imageWidget';

const box = {
    width: 20,
    height: 16,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    verticalAlign: 'middle',
} as const;

describe('ImageWidget', () => {
    it('creates an img with its source, text alternative and a contain-fit box', () => {
        const image = new ImageWidget('https://example.com/flag.svg', 'Flag', box);
        const elem = image.getElement();
        expect(elem.tagName).toBe('IMG');
        expect(elem.src).toBe('https://example.com/flag.svg');
        expect(elem.alt).toBe('Flag');
        expect(elem.hasAttribute('aria-hidden')).toBe(false);
        expect(elem.style.width).toBe('20px');
        expect(elem.style.height).toBe('16px');
        expect(elem.style.boxSizing).toBe('border-box');
        expect(elem.style.objectFit).toBe('contain');
        expect(elem.style.verticalAlign).toBe('middle');
        expect(elem.style.padding).toBe('0px 0px 0px 0px');
        expect(elem.style.backgroundColor).toBe('');
        expect(elem.style.borderRadius).toBe('');
    });

    it('decorates the box with padding, a background and rounded corners', () => {
        const image = new ImageWidget('https://example.com/flag.svg', '', {
            ...box,
            padding: { top: 1, right: 2, bottom: 3, left: 4 },
            backgroundColor: 'red',
            cornerRadius: 4,
        });
        const { style } = image.getElement();
        expect(style.padding).toBe('1px 2px 3px 4px');
        expect(style.backgroundColor).toBe('red');
        expect(style.borderRadius).toBe('4px');
    });
});
