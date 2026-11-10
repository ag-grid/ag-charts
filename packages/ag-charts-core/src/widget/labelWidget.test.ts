import { describe, expect, it } from 'vitest';

import type { ElementID } from '../identity/idBranding';
import { LabelWidget } from './labelWidget';

describe('LabelWidget', () => {
    it('is a label with text and classes', () => {
        const label = new LabelWidget('Weight', 'ag-charts-dialog__input-group-label');
        const elem = label.getElement();
        expect(elem.tagName).toBe('LABEL');
        expect(elem.className).toBe('ag-charts-dialog__input-group-label');
        expect(elem.textContent).toBe('Weight');
        expect(elem.hasAttribute('for')).toBe(false);
    });

    it('sets and removes the for attribute', () => {
        const label = new LabelWidget('Extend line start');
        label.setFor('ag-charts-7' as ElementID);
        expect(label.getElement().htmlFor).toBe('ag-charts-7');
        label.setFor(undefined);
        expect(label.getElement().hasAttribute('for')).toBe(false);
    });
});
