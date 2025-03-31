import { type SeriesModuleDefinition } from 'ag-charts-core';
import type { InternalAgGradientColor } from 'ag-charts-core';
import type { AgBarSeriesOptions, WithThemeParams } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import { DIRECTION_SWAP_AXES, FILL_PATTERN_DEFAULTS } from '../../themes/util';
import { BarSeries } from './barSeries';
import { barSeriesOptionsDef } from './barSeriesOptionsDef';

export const BarSeriesModule: SeriesModule<'bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bar',
    moduleFactory: (ctx) => new BarSeries(ctx),
    stackable: true,
    groupable: true,
    tooltipDefaults: { range: 'exact' },
    defaultAxes: DIRECTION_SWAP_AXES,
    themeTemplate: {
        series: {
            direction: 'vertical',
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            // @ts-expect-error undocumented option
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'linear',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: false,
            } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
            fillPatternDefaults: FILL_PATTERN_DEFAULTS,
            fillOpacity: 1,
            strokeWidth: 0,
            lineDash: [0],
            lineDashOffset: 0,
            label: {
                enabled: false,
                fontWeight: { $ref: 'fontWeight' },
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                color: {
                    $if: [
                        {
                            $or: [
                                { $eq: [{ $path: './placement' }, 'outside-start'] },
                                { $eq: [{ $path: './placement' }, 'outside-end'] },
                            ],
                        },
                        { $ref: 'textColor' },
                        { $ref: 'backgroundColor' },
                    ],
                },
                placement: 'inside-center',
            },
            shadow: {
                enabled: false,
                color: DEFAULT_SHADOW_COLOUR,
                xOffset: 3,
                yOffset: 3,
                blur: 5,
            },
            errorBar: {
                cap: {
                    lengthRatio: 0.3,
                },
            },
        },
    },
};

export const NewBarSeriesModule: SeriesModuleDefinition<AgBarSeriesOptions<never>> = {
    type: 'series',
    name: 'bar',
    chartType: 'cartesian',

    options: barSeriesOptionsDef,

    create: (ctx: ModuleContext) => new BarSeries(ctx),
};
