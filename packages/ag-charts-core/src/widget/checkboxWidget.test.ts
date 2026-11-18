import { afterEach, describe, expect, it } from 'vitest';

import { CheckboxWidget } from './checkboxWidget';
import { pressKey } from './test/openerFixtures';

describe('CheckboxWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('is an unchecked checkbox input with the base and extra classes', () => {
        const checkbox = new CheckboxWidget('ag-charts-dialog__checkbox');
        const elem = checkbox.getElement();
        expect(elem.type).toBe('checkbox');
        expect(elem.className).toBe('ag-charts-input ag-charts-checkbox ag-charts-dialog__checkbox');
        expect(checkbox.checked).toBe(false);

        checkbox.checked = true;
        expect(elem.checked).toBe(true);
    });

    it('toggles and reports a change on Enter, preventing the default action', () => {
        const checkbox = new CheckboxWidget();
        document.body.append(checkbox.getElement());
        const changes: boolean[] = [];
        checkbox.addListener('change', () => changes.push(checkbox.checked));

        const event = pressKey(checkbox, 'Enter', { code: 'Enter' });

        expect(event.defaultPrevented).toBe(true);
        expect(changes).toEqual([true]);
    });

    it('toggles on Space and ignores Shift+Space', () => {
        const checkbox = new CheckboxWidget();
        document.body.append(checkbox.getElement());

        pressKey(checkbox, ' ', { code: 'Space' });
        expect(checkbox.checked).toBe(true);

        const shifted = pressKey(checkbox, ' ', { code: 'Space', shiftKey: true });
        expect(shifted.defaultPrevented).toBe(false);
        expect(checkbox.checked).toBe(true);
    });
});
