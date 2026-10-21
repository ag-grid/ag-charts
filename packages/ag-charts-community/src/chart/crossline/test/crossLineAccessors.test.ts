import { afterEach, describe, expect, it } from 'vitest';

import { cachedTextMeasurer } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { createChart, deproxy, emitFontLoad, setupMockCanvas, setupMockConsole } from '../../test/utils';
import type { CrossLine } from '../crossLine';
import { getCrossLinesPlugin } from '../getCrossLinesPlugin';
import { getCrossLineFittedLabel } from './crossLineAccessors';

describe('cross line test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const options = (label: { maxWidth?: number } | undefined): AgCartesianChartOptions => ({
        data: Array.from({ length: 11 }, (_, i) => ({ x: i, y: i })),
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'number', position: 'bottom' },
            y: {
                type: 'number',
                position: 'left',
                crossLines: [
                    { type: 'line', value: 5, label: { text: 'A cross line label long enough to fit', ...label } },
                ],
            },
        },
    });

    const crossLineOf = (): CrossLine => {
        const [crossLine] = getCrossLinesPlugin(deproxy(chart).axes.findById('y')!)!.getInstances();
        return crossLine;
    };

    describe('getCrossLineFittedLabel', () => {
        it('returns the label as fitted to its size limit', async () => {
            chart = await createChart(options({ maxWidth: 80 }));

            const fitted = getCrossLineFittedLabel(crossLineOf());

            expect(fitted).toEqual(expect.objectContaining({ text: expect.any(String), fontSize: expect.any(Number) }));
        });

        it('returns the same object while the label does not have to be fitted again', async () => {
            chart = await createChart(options({ maxWidth: 80 }));

            const fitted = getCrossLineFittedLabel(crossLineOf());

            expect(getCrossLineFittedLabel(crossLineOf())).toBe(fitted);
        });

        it('returns a new object once a font load invalidates the text measurer', async () => {
            chart = await createChart(options({ maxWidth: 80 }));
            const fitted = getCrossLineFittedLabel(crossLineOf());
            expect(fitted).toBeDefined();

            cachedTextMeasurer.clear();
            await emitFontLoad(chart);

            const refitted = getCrossLineFittedLabel(crossLineOf());
            expect(refitted).toBeDefined();
            expect(refitted).not.toBe(fitted);
            // Only the measurer it was fitted with differs; the fitted text is unchanged.
            expect(refitted).toMatchObject({ text: (fitted as { text: string }).text });
        });
    });
});
