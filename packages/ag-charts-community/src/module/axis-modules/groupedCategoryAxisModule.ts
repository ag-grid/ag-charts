import {
    type AxisModuleDefinition,
    arrayOfDefs,
    boolean,
    color,
    constant,
    fontOptionsDef,
    labelBoxOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    union,
} from 'ag-charts-core';
import type { AgGroupedCategoryAxisOptions, AgGroupedCategoryDepthOptions } from 'ag-charts-types';

import {
    cartesianAxisBandHighlightOptions,
    cartesianAxisCrosshairOptions,
    cartesianAxisLabelOptionsDefs,
    cartesianAxisOptionsDefs,
} from '../../chart/axesOptionsDefs';
import { GroupedCategoryAxis } from '../../chart/axis/groupedCategoryAxis';
import { VERSION } from '../../version';

export const GroupedCategoryAxisModule: AxisModuleDefinition<AgGroupedCategoryAxisOptions> = {
    type: 'axis',
    name: 'grouped-category',
    chartType: 'cartesian',
    version: VERSION,

    options: {
        ...cartesianAxisOptionsDefs,
        type: required(constant('grouped-category')),
        label: cartesianAxisLabelOptionsDefs,
        crosshair: cartesianAxisCrosshairOptions(),
        bandHighlight: cartesianAxisBandHighlightOptions,
        paddingInner: ratio,
        groupPaddingInner: ratio,
        depthOptions: arrayOfDefs<AgGroupedCategoryDepthOptions>(
            {
                label: {
                    enabled: boolean,
                    avoidCollisions: boolean,
                    wrapping: union('never', 'always', 'hyphenate', 'on-space'),
                    truncate: boolean,
                    rotation: number,
                    spacing: number,
                    ...fontOptionsDef,
                    ...labelBoxOptionsDef,
                },
                tick: {
                    enabled: boolean,
                    stroke: color,
                    width: positiveNumber,
                },
            },
            'depth options objects array'
        ),
    },

    create: (ctx) => new GroupedCategoryAxis(ctx),
};
