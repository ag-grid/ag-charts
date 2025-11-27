import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgAreaSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import {
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    SEGMENTATION_DEFAULTS,
    markerSeriesHighlightStyle,
} from '../../themes/util';
import { AreaSeries } from './areaSeries';
import { areaSeriesOptionsDef } from './areaSeriesOptionsDef';
import { predictCartesianNonPrimitiveAxis } from './util';

const themeTemplate: ExtensibleTheme<'area'> = {
    series: {
        nodeClickRange: 'nearest',
        fill: {
            $applySwitch: [
                { $path: 'type' },
                { $palette: 'fill' },
                ['gradient', FILL_GRADIENT_LINEAR_DEFAULTS],
                ['image', FILL_IMAGE_DEFAULTS],
                ['pattern', FILL_PATTERN_DEFAULTS],
            ],
        },
        stroke: { $palette: 'stroke' },
        fillOpacity: 0.8,
        strokeOpacity: 1,
        strokeWidth: { $isUserOption: ['./stroke', 2, 0] },
        lineDash: [0],
        lineDashOffset: 0,
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        interpolation: {
            type: 'linear',
        },
        marker: {
            enabled: false,
            shape: 'circle',
            size: 7,
            strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
            fill: {
                $applySwitch: [
                    { $path: 'type' },
                    { $palette: 'fill' },
                    ['gradient', FILL_GRADIENT_RADIAL_REVERSED_DEFAULTS],
                    ['pattern', FILL_PATTERN_DEFAULTS],
                ],
            },
            stroke: { $palette: 'stroke' },
        },
        label: {
            ...LABEL_BOXING_DEFAULTS,
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
        highlight: markerSeriesHighlightStyle(),
        segmentation: SEGMENTATION_DEFAULTS,
    },
};

export const AreaSeriesModule: SeriesModuleDefinition<AgAreaSeriesOptions> = {
    type: 'series',
    name: 'area',
    chartType: 'cartesian',
    stackable: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: areaSeriesOptionsDef,
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: {
        y: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        x: {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    axisValueKeys: { [ChartAxisDirection.X]: 'xKey', [ChartAxisDirection.Y]: 'yKey' },
    themeTemplate,

    create: (ctx: ModuleContext) => new AreaSeries(ctx),
};
