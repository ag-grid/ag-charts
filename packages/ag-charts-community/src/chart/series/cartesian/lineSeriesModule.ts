import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgLineSeriesOptions } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import {
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    SAFE_STROKE_FILL_OPERATION,
    multiSeriesHighlightStyle,
} from '../../themes/util';
import { LineSeries } from './lineSeries';
import { lineSeriesOptionsDef } from './lineSeriesOptionsDef';

export const LineSeriesModule: SeriesModule<'line'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['cartesian'],

    identifier: 'line',
    moduleFactory: (ctx) => new LineSeries(ctx),
    stackable: true,
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    ],
    themeTemplate: {
        series: {
            stroke: SAFE_STROKE_FILL_OPERATION,
            strokeWidth: 2,
            strokeOpacity: 1,
            lineDash: [0],
            lineDashOffset: 0,
            interpolation: {
                type: 'linear',
            },
            marker: {
                shape: 'circle',
                size: 7,
                strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
                fill: { $palette: 'fill' },
                stroke: { $palette: 'stroke' },
                // @ts-expect-error undocumented option
                fillGradientDefaults: FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
                fillPatternDefaults: FILL_PATTERN_DEFAULTS,
                fillImageDefaults: FILL_IMAGE_DEFAULTS,
            },
            label: {
                enabled: false,
                fontSize: { $ref: 'fontSize' },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
                color: { $ref: 'textColor' },
            },
            errorBar: {
                cap: {
                    lengthRatio: 1,
                },
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

export const NewLineSeriesModule: SeriesModuleDefinition<AgLineSeriesOptions> = {
    type: 'series',
    name: 'line',
    chartType: 'cartesian',

    options: lineSeriesOptionsDef,

    create: (ctx: ModuleContext) => new LineSeries(ctx),
};
