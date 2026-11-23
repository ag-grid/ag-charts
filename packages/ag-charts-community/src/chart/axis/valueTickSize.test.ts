import { ChartAxisDirection } from 'ag-charts-core';

import { inferValueTickSize } from './valueTickSize';

interface TestSeries {
    rows: unknown[];
    yKeys?: string[];
    enabled?: boolean;
    suppressFieldDotNotation?: boolean;
}

function series({ rows, yKeys = ['y'], enabled = true, suppressFieldDotNotation = false }: TestSeries) {
    return {
        data: { data: rows, suppressFieldDotNotation },
        isEnabled: () => enabled,
        getKeys: (direction: ChartAxisDirection) => (direction === ChartAxisDirection.Y ? yKeys : ['x']),
    };
}

const ys = (...values: unknown[]) => values.map((y) => ({ y }));

describe('inferValueTickSize', () => {
    it.each<[string, TestSeries[], number | undefined]>([
        ['the smallest gap of unsorted values', [{ rows: ys(10.7, 10.5, 10.55) }], 0.05],
        ['a gap between whole numbers', [{ rows: ys(4000, 6500, 5250) }], 1250],
        [
            'the values of every key of a series',
            [{ rows: [{ open: 1, high: 4, low: 0.75, close: 3 }], yKeys: ['open', 'high', 'low', 'close'] }],
            0.25,
        ],
        ['the values of every series', [{ rows: ys(1, 3) }, { rows: ys(2.5) }], 0.5],
        ['no value of a disabled series', [{ rows: ys(1, 3) }, { rows: ys(2.5), enabled: false }], 2],
        ['a small gap between large values', [{ rows: ys(135000.32, 135000.33, 135001) }], 0.01],
        ['no gap for the noise of decimal arithmetic', [{ rows: ys(0.1 + 0.2, 0.3, 0.5) }], 0.2],
        ['only the finite numbers', [{ rows: ys(1, '1.5', null, Number.NaN, new Date(2), 3n, 2) }], 1],
        ['a nested key', [{ rows: [{ price: { close: 1 } }, { price: { close: 1.5 } }], yKeys: ['price.close'] }], 0.5],
        [
            'a key holding a dot when dot notation is suppressed',
            [{ rows: [{ 'a.b': 1 }, { 'a.b': 3 }], yKeys: ['a.b'], suppressFieldDotNotation: true }],
            2,
        ],
        ['nothing where no two values differ', [{ rows: ys(7, 7) }], undefined],
        ['nothing where every value is zero', [{ rows: ys(0, 0) }], undefined],
        ['nothing without data', [], undefined],
    ])('finds %s', (_name, testSeries, expected) => {
        expect(inferValueTickSize(testSeries.map(series), ChartAxisDirection.Y)).toBe(expected);
    });
});
