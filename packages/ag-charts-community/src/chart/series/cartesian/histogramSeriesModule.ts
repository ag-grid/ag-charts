import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgHistogramSeriesOptions, ExtensibleTheme } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { CartesianChartModule } from '../../cartesianChartModule';
import { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } from '../../themes/constants';
import { DEFAULT_SHADOW_COLOUR } from '../../themes/symbols';
import {
    FILL_GRADIENT_LINEAR_DEFAULTS,
    FILL_IMAGE_DEFAULTS,
    FILL_PATTERN_DEFAULTS,
    LABEL_BOXING_DEFAULTS,
    multiSeriesHighlightStyle,
} from '../../themes/util';
import { HistogramSeries } from './histogramSeries';
import { histogramSeriesOptionsDef } from './histogramSeriesOptionsDef';
import { predictCartesianTimeAxis } from './util';

const themeTemplate: ExtensibleTheme<'histogram'> = {
    series: {
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
        strokeWidth: 1,
        fillOpacity: 1,
        strokeOpacity: 1,
        lineDash: [0],
        lineDashOffset: 0,
        label: {
            ...LABEL_BOXING_DEFAULTS,
            enabled: false,
            fontSize: { $ref: 'fontSize' },
            fontFamily: { $ref: 'fontFamily' },
            fontWeight: { $ref: 'fontWeight' },
            color: { $ref: 'chartBackgroundColor' },
        },
        shadow: {
            enabled: false,
            color: DEFAULT_SHADOW_COLOUR,
            xOffset: 3,
            yOffset: 3,
            blur: 5,
        },
        highlight: multiSeriesHighlightStyle(),
    },
};

export const HistogramSeriesModule: SeriesModuleDefinition<AgHistogramSeriesOptions> = {
    type: 'series',
    name: 'histogram',
    chartType: 'cartesian',
    // enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule],

    options: histogramSeriesOptionsDef,
    predictAxis: predictCartesianTimeAxis,
    defaultAxes: {
        x: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.BOTTOM,
        },
        y: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
    },
    themeTemplate,

    create: (ctx: ModuleContext) => new HistogramSeries(ctx),
};
