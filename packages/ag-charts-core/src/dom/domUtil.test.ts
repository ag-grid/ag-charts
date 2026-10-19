import { afterEach, describe, expect, it } from 'vitest';

import { isFocused } from './domUtil';

describe('isFocused', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    const createInput = (parent: Node) => {
        const input = document.createElement('input');
        parent.appendChild(input);
        return input;
    };

    it('is true for the focused element in the light DOM', () => {
        const input = createInput(document.body);
        input.focus();

        expect(isFocused(input)).toBe(true);
    });

    it('is true for the focused element inside a shadow root', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const input = createInput(host.attachShadow({ mode: 'open' }));
        input.focus();

        expect(document.activeElement).toBe(host);
        expect(isFocused(input)).toBe(true);
    });

    it('is false for an element that does not have focus', () => {
        const input = createInput(document.body);
        createInput(document.body).focus();

        expect(isFocused(input)).toBe(false);
    });

    it('is false for a detached element', () => {
        expect(isFocused(document.createElement('input'))).toBe(false);
    });
});
