import {
    type PluginModuleDefinition,
    boolean,
    borderOptionsDef,
    callback,
    colorUnion,
    fillOptionsDef,
    fontOptionsDef,
    number,
    padding,
    positiveNumber,
    ratio,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type { AgChartLegendOptions } from 'ag-charts-types';

import { VERSION } from '../../version';
import { legendPositionValidator, shapeValidator } from '../commonOptionsDefs';
import { Legend } from './legend';

export const LegendModule: PluginModuleDefinition<AgChartLegendOptions> = {
    type: 'plugin',
    name: 'legend',
    version: VERSION,
    // TODO fix missing behaviour
    // removable: 'standalone-only',

    options: {
        enabled: boolean,
        position: legendPositionValidator,
        orientation: union('horizontal', 'vertical'),
        maxWidth: positiveNumber,
        maxHeight: positiveNumber,
        spacing: positiveNumber,
        border: borderOptionsDef,
        cornerRadius: number,
        padding: padding,
        fill: colorUnion,
        fillOpacity: ratio,
        preventHidingAll: boolean,
        reverseOrder: boolean,
        toggleSeries: boolean,
        item: {
            marker: {
                size: positiveNumber,
                shape: shapeValidator,
                padding: positiveNumber,
                strokeWidth: positiveNumber,
            },
            line: {
                length: positiveNumber,
                strokeWidth: positiveNumber,
            },
            label: {
                maxLength: positiveNumber,
                formatter: callback,
                ...fontOptionsDef,
            },
            maxWidth: positiveNumber,
            paddingX: positiveNumber,
            paddingY: positiveNumber,
            showSeriesStroke: boolean,
        },
        pagination: {
            marker: {
                size: positiveNumber,
                shape: shapeValidator,
                padding: positiveNumber,
            },
            activeStyle: {
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            inactiveStyle: {
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            highlightStyle: {
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            label: fontOptionsDef,
        },
        listeners: {
            legendItemClick: callback,
            legendItemDoubleClick: callback,
        },
    },

    create: (ctx) => {
        const moduleInstance = new Legend(ctx);
        moduleInstance.attachLegend(ctx.scene);
        return moduleInstance;
    },
};
