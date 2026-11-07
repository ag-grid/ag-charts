import { afterEach, describe, expect, it } from 'vitest';

import type { Logger } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { Chart } from './chart';
import { OptionsGraphService, getItemCastBase } from './optionsGraphService';
import { CATEGORY_DATA, SERIES_SHADOW, themeShadow } from './test/shadowFixtures';
import { createChart, deproxy, setupMockCanvas, setupMockConsole } from './test/utils';

describe('OptionsGraphService item casts', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        chart?.destroy();
    });

    const resolveShadow = async (theme: string | undefined, shadow: object | undefined) => {
        chart = deproxy(
            await createChart({
                theme,
                data: CATEGORY_DATA,
                series: [{ type: 'bar', xKey: 'category', yKey: 'value', shadow, itemStyler: () => ({}) }],
            } as AgChartOptions)
        );
        return chart.ctx.optionsGraphService.resolvePartial(['series', `${chart.series[0].declarationOrder}`], {
            shadow: { blur: 8 },
        })?.shadow;
    };

    it.each([
        ['light', undefined, 0.5],
        ['dark', 'ag-default-dark', 1],
    ])('keeps the %s theme shadow as the base of a cast that sets only some fields', async (_name, theme, opacity) => {
        const cast = await resolveShadow(theme, undefined);

        expect(cast).toEqual({ blur: 8 });
        expect(getItemCastBase(cast!)).toMatchObject({ ...themeShadow(opacity), blur: 8 });
    });

    it('keeps the series shadow, over the theme, as the base of a cast', async () => {
        const cast = await resolveShadow(undefined, SERIES_SHADOW);

        expect(getItemCastBase(cast!)).toMatchObject({ ...SERIES_SHADOW, blur: 8 });
    });

    it.each(['shadow', 'glow'] as const)(
        'restores the %s onto the result of the graph, with no copy of the result',
        (key) => {
            const filled = { enabled: true, blur: 8, spread: 3 };
            const resolved = { [key]: filled, fill: 'red' };
            const service = new OptionsGraphService({} as Logger);
            service.updateCallback(() => resolved as never);

            const result = service.resolvePartial(['series', '0'], { [key]: { blur: 8 }, fill: 'red' });

            expect(result).toBe(resolved);
            expect(result?.[key]).toEqual({ blur: 8 });
            expect(getItemCastBase(result?.[key] as object)).toBe(filled);
        }
    );
});
