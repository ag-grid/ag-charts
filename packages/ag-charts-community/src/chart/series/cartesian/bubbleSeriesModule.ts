import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { InternalAgGradientColor } from 'ag-charts-core';
import type { AgBubbleSeriesOptions, AgTooltipPositionOptions, WithThemeParams } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { BubbleSeries } from './bubbleSeries';
import { bubbleSeriesOptionsDef } from './bubbleSeriesOptionsDef';

export const BubbleSeriesModule: SeriesModule<'bubble'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bubble',
    moduleFactory: (ctx) => new BubbleSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.BOTTOM,
        },
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
    ],
    themeTemplate: {
        series: {
            shape: 'circle',
            size: 7,
            maxSize: 30,
            fill: { $palette: 'fill' },
            stroke: { $palette: 'stroke' },
            // @ts-expect-error undocumented option
            fillGradientDefaults: {
                type: 'gradient',
                gradient: 'radial',
                bounds: 'item',
                colorStops: { $palette: 'gradient' },
                rotation: 0,
                reverse: true,
            } satisfies WithThemeParams<Required<InternalAgGradientColor>>,
            fillOpacity: 0.8,
            tooltip: { position: { _seriesOverrideType: 'node' } as AgTooltipPositionOptions },
            label: {
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
        },
    },
};

export const NewBubbleSeriesModule: SeriesModuleDefinition<AgBubbleSeriesOptions> = {
    type: 'series',
    name: 'bubble',
    chartType: 'cartesian',

    options: bubbleSeriesOptionsDef,

    create: (ctx: ModuleContext) => new BubbleSeries(ctx),
};
