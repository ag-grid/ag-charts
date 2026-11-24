import type { AgChartInstance, AgChartOptions, AgColorType } from 'ag-charts-types';

import { expectSamePixels } from './expectSamePixels';
import { expectNonBlank, type setupMockCanvas, waitForChartStability } from './utils';

/** A fill and the opacity beside it, given either as a solid colour object or as the plain options it stands for. */
export type Fill = (colour: string, fillOpacity?: number) => { fill: AgColorType; fillOpacity?: number };

export const solidFill: Fill = (fill, fillOpacity) => ({ fill: { type: 'solid', fill, fillOpacity } });

export const plainFill: Fill = (fill, fillOpacity) => (fillOpacity == null ? { fill } : { fill, fillOpacity });

interface ChartFactory {
    create: (options: AgChartOptions) => Promise<AgChartInstance>;
    prepare: (options: AgChartOptions) => AgChartOptions;
}

/**
 * Renders `solid` and then `plain` on one chart, which must come out pixel for pixel the same. The zero-tolerance
 * comparison is deliberate: `expectPixelIdenticalAcrossUpdate` lets through a difference the size of a legend marker.
 */
export async function expectSolidMatchesPlain(
    ctx: ReturnType<typeof setupMockCanvas>,
    { create, prepare }: ChartFactory,
    solid: AgChartOptions,
    plain: AgChartOptions
) {
    const withoutAnimation = (options: AgChartOptions) => ({ ...options, animation: { enabled: false } });

    const chart = await create(withoutAnimation(solid));
    try {
        const solidImage = ctx.snapshot();
        expectNonBlank(solidImage);

        await chart.update(prepare(withoutAnimation(plain)));
        await waitForChartStability(chart);

        expectSamePixels(ctx.snapshot(), solidImage);
    } finally {
        chart.destroy();
    }
}
