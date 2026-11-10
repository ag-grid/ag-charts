import { afterEach, describe, expect, it } from 'vitest';

import type { ElementID } from '../identity/idBranding';
import { InputWidget } from './inputWidget';

describe('InputWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('is a number input that accepts any step and opts out of data-preventdefault', () => {
        const input = new InputWidget('number', 'ag-charts-dialog__input');
        const elem = input.getElement();
        expect(elem.type).toBe('number');
        expect(elem.className).toBe('ag-charts-input ag-charts-dialog__input');
        expect(elem.step).toBe('any');
        expect(elem.getAttribute('data-preventdefault')).toBe('false');

        input.setStep(1);
        expect(elem.step).toBe('any');
    });

    it('sets the step of a datetime-local input', () => {
        const input = new InputWidget('datetime-local');
        input.setStep(0.001);
        expect(input.getElement().step).toBe('0.001');
    });

    it('sets and removes the list attribute', () => {
        const input = new InputWidget('text');
        input.setList('ag-charts-3' as ElementID);
        expect(input.getElement().getAttribute('list')).toBe('ag-charts-3');
        input.setList(undefined);
        expect(input.getElement().hasAttribute('list')).toBe(false);
    });

    it('commits a text input on change', () => {
        const input = new InputWidget('text');
        const committed: string[] = [];
        input.addCommitListener((event) => committed.push(`${event.type}:${input.value}`));

        input.value = 'Pears';
        input.getElement().dispatchEvent(new Event('change'));

        expect(committed).toEqual(['change:Pears']);
    });

    it('commits a datetime-local input on Enter and on blur, not on change', () => {
        const input = new InputWidget('datetime-local');
        document.body.append(input.getElement());
        const committed: string[] = [];
        input.addCommitListener((event) => committed.push(event.type));

        input.getElement().dispatchEvent(new Event('change'));
        input.getElement().dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        input.getElement().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        input.getElement().dispatchEvent(new FocusEvent('blur'));

        expect(committed).toEqual(['keydown', 'blur']);
    });
});
