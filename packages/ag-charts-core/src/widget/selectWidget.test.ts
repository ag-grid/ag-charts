import { describe, expect, it } from 'vitest';

import { SelectWidget } from './selectWidget';

describe('SelectWidget', () => {
    it('lists its options and selects by value', () => {
        const select = new SelectWidget(
            [
                { label: 'Thin', value: '1' },
                { label: 'Thick', value: '4' },
            ],
            'ag-charts-dialog__select'
        );
        const elem = select.getElement();
        expect(elem.className).toBe('ag-charts-input ag-charts-select ag-charts-dialog__select');
        expect(Array.from(elem.options, (o) => [o.textContent, o.value])).toEqual([
            ['Thin', '1'],
            ['Thick', '4'],
        ]);

        select.value = '4';
        expect(elem.selectedIndex).toBe(1);
        expect(select.value).toBe('4');
    });

    it('opts out of data-preventdefault', () => {
        const select = new SelectWidget([]);
        expect(select.getElement().getAttribute('data-preventdefault')).toBe('false');
    });
});
