import { type AxisModuleDefinition, constant, ratio, required, union } from 'ag-charts-core';
import type { AgCategoryAxisOptions } from 'ag-charts-types';

import {
    cartesianAxisBandHighlightOptions,
    cartesianAxisCrosshairOptions,
    cartesianAxisLabelOptionsDefs,
    cartesianAxisOptionsDefs,
    commonAxisIntervalOptionsDefs,
} from '../../chart/axesOptionsDefs';
import { CategoryAxis } from '../../chart/axis/categoryAxis';

export const CategoryAxisModule: AxisModuleDefinition<AgCategoryAxisOptions> = {
    type: 'axis',
    name: 'category',
    chartType: 'cartesian',

    options: {
        ...cartesianAxisOptionsDefs,
        type: required(constant('category')),
        label: cartesianAxisLabelOptionsDefs,
        paddingInner: ratio,
        paddingOuter: ratio,
        groupPaddingInner: ratio,
        crosshair: cartesianAxisCrosshairOptions(),
        bandHighlight: cartesianAxisBandHighlightOptions,
        interval: {
            ...commonAxisIntervalOptionsDefs,
            placement: union('on', 'between'),
        },
    },

    create: (ctx) => new CategoryAxis(ctx),
};
