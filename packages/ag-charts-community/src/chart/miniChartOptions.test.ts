import { describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { deriveMiniChartOptions } from './miniChartOptions';

describe('deriveMiniChartOptions', () => {
    it.each([
        [false, true],
        [true, false],
    ])(
        'maps the mini-chart label avoidCollisions %s onto the horizontal axis as collision.alwaysShow %s',
        (avoidCollisions, alwaysShow) => {
            const derived = deriveMiniChartOptions({
                data: [],
                axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                navigator: { miniChart: { enabled: true, label: { avoidCollisions } } },
            } as AgCartesianChartOptions) as AgCartesianChartOptions;

            const x = derived.axes?.x;
            expect(x).toBeDefined();
            const label = x!.label;
            expect(label).toMatchObject({ collision: { alwaysShow } });
            expect(label).not.toHaveProperty('avoidCollisions');
        }
    );
});
