import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgBubbleSeriesOptions } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import {
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    multiSeriesHighlightStyle,
} from '../../themes/util';
import { BubbleSeries } from './bubbleSeries';
import { bubbleSeriesOptionsDef } from './bubbleSeriesOptionsDef';

export const BubbleSeriesModule: SeriesModule<'bubble'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'bubble',
    moduleFactory: (ctx) => new BubbleSeries(ctx),
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
            fillGradientDefaults: FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
            fillPatternDefaults: FILL_PATTERN_DEFAULTS,
            fillImageDefaults: FILL_IMAGE_DEFAULTS,
            fillOpacity: 0.8,
            maxRenderedItems: 10_000,
            label: {
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            tooltip: {
                range: { $path: ['/tooltip/range', 'nearest'] },
                position: {
                    anchorTo: { $path: ['/tooltip/position/anchorTo', 'node'] },
                },
            },
            highlight: multiSeriesHighlightStyle(),
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
