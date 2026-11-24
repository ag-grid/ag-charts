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
    });

    it('steps a number from the value it is given, so that a value between steps of zero is valid', () => {
        const input = new InputWidget('number');
        const elem = input.getElement();
        input.setStep(0.25);
        input.value = '123.46';

        expect(elem.validity.valid).toBe(true);
        elem.stepUp();
        expect(elem.value).toBe('123.71');

        input.setStep(undefined);
        expect(elem.step).toBe('any');
    });

    it('sets and clears the step of a datetime-local input, and switches it to a date input', () => {
        const input = new InputWidget('datetime-local');
        const elem = input.getElement();
        input.setStep(0.001);
        expect(elem.step).toBe('0.001');

        input.setType('date');
        input.setStep(undefined);
        expect(elem.type).toBe('date');
        expect(elem.hasAttribute('step')).toBe(false);
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

    it.each(['date', 'datetime-local'] as const)('commits a %s input on Enter and on blur, not on change', (type) => {
        const input = new InputWidget(type);
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
