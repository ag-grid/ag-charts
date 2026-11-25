import { afterEach, describe, expect, it } from 'vitest';

import { containsFocus, isFocused } from './domUtil';

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

describe('containsFocus', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    function createGroup(parent: Node) {
        const group = document.createElement('div');
        const input = document.createElement('input');
        group.appendChild(input);
        parent.appendChild(group);
        return { group, input };
    }

    it.each([
        ['the light DOM', () => document.body],
        [
            'a shadow root',
            () => document.body.appendChild(document.createElement('div')).attachShadow({ mode: 'open' }),
        ],
    ])('is true for an ancestor of the focused element in %s', (_name, getParent) => {
        const { group, input } = createGroup(getParent());
        input.focus();

        expect(containsFocus(group)).toBe(true);
        expect(containsFocus(input)).toBe(true);
    });

    it('is false when the focus is outside the element', () => {
        const { group } = createGroup(document.body);
        createGroup(document.body).input.focus();

        expect(containsFocus(group)).toBe(false);
    });
});
