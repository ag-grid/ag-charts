import { describe, expect, it } from 'vitest';

import { DatalistWidget } from './datalistWidget';

describe('DatalistWidget', () => {
    it('lists its values under a generated id', () => {
        const datalist = new DatalistWidget(['Apples', 'Pears']);
        const elem = datalist.getElement();
        expect(elem.tagName).toBe('DATALIST');
        expect(datalist.id).toMatch(/^ag-charts-\d+$/);
        expect(elem.id).toBe(datalist.id);
        expect(Array.from(elem.options, (o) => o.value)).toEqual(['Apples', 'Pears']);
    });
});
