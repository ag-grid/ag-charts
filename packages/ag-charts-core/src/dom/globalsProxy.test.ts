import { describe, expect, it } from 'vitest';

import { isHTMLElement } from './globalsProxy';

describe('isHTMLElement', () => {
    it('accepts an HTML element', () => {
        expect(isHTMLElement(document.createElement('button'))).toBe(true);
    });

    it('accepts an HTML element from another document', () => {
        const otherDocument = document.implementation.createHTMLDocument('other');
        expect(isHTMLElement(otherDocument.createElement('div'))).toBe(true);
    });

    it('rejects nodes that are not elements', () => {
        expect(isHTMLElement(document.createTextNode('text'))).toBe(false);
        expect(isHTMLElement(document)).toBe(false);
    });

    it('rejects values that are not nodes', () => {
        expect(isHTMLElement(undefined)).toBe(false);
        expect(isHTMLElement(null)).toBe(false);
        expect(isHTMLElement({ style: {} })).toBe(false);
        expect(isHTMLElement({ nodeType: 1 })).toBe(false);
    });
});
