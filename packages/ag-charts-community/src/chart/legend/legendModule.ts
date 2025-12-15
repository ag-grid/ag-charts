import {
    CARTESIAN_POSITION,
    FONT_SIZE_RATIO,
    LEGEND_CONTAINER_THEME,
    type PluginModuleDefinition,
    boolean,
    borderOptionsDef,
    callback,
    colorUnion,
    fillOptionsDef,
    fontOptionsDef,
    legendPositionValidator,
    number,
    padding,
    positiveNumber,
    ratio,
    shapeValidator,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type { AgChartLegendOptions } from 'ag-charts-types';

import { VERSION } from '../../version';
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
    themeTemplate: {
        ...LEGEND_CONTAINER_THEME,
        enabled: {
            $and: [
                { $greaterThan: [{ $size: { $path: '/series' } }, 1] },
                {
                    $or: [
                        { $isChartType: 'cartesian' },
                        { $isChartType: 'standalone' },
                        {
                            $and: [
                                { $isChartType: 'polar' },
                                { $not: { $isSeriesType: 'pie' } },
                                { $not: { $isSeriesType: 'donut' } },
                            ],
                        },
                    ],
                },
            ],
        },
        position: CARTESIAN_POSITION.BOTTOM,
        orientation: {
            $if: [
                {
                    $or: [
                        { $eq: [{ $path: './position' }, CARTESIAN_POSITION.LEFT] },
                        { $eq: [{ $path: './position' }, CARTESIAN_POSITION.LEFT_TOP] },
                        { $eq: [{ $path: './position' }, CARTESIAN_POSITION.LEFT_BOTTOM] },
                        { $eq: [{ $path: './position' }, CARTESIAN_POSITION.RIGHT] },
                        { $eq: [{ $path: './position' }, CARTESIAN_POSITION.RIGHT_TOP] },
                        { $eq: [{ $path: './position' }, CARTESIAN_POSITION.RIGHT_BOTTOM] },
                        { $eq: [{ $path: './position/placement' }, CARTESIAN_POSITION.LEFT] },
                        { $eq: [{ $path: './position/placement' }, CARTESIAN_POSITION.LEFT_TOP] },
                        { $eq: [{ $path: './position/placement' }, CARTESIAN_POSITION.LEFT_BOTTOM] },
                        { $eq: [{ $path: './position/placement' }, CARTESIAN_POSITION.RIGHT] },
                        { $eq: [{ $path: './position/placement' }, CARTESIAN_POSITION.RIGHT_TOP] },
                        { $eq: [{ $path: './position/placement' }, CARTESIAN_POSITION.RIGHT_BOTTOM] },
                    ],
                },
                'vertical',
                'horizontal',
            ],
        },
        spacing: 30,
        listeners: {},
        toggleSeries: true,
        item: {
            paddingX: 16,
            paddingY: 8,
            marker: { size: 15, padding: 8 },
            showSeriesStroke: true,
            label: {
                color: { $ref: 'textColor' },
                fontSize: { $rem: FONT_SIZE_RATIO.SMALL },
                fontFamily: { $ref: 'fontFamily' },
                fontWeight: { $ref: 'fontWeight' },
            },
        },
        reverseOrder: false,
        pagination: {
            marker: { size: 12 },
            activeStyle: { fill: { $ref: 'foregroundColor' } },
            inactiveStyle: { fill: { $ref: 'subtleTextColor' } },
            highlightStyle: { fill: { $ref: 'foregroundColor' } },
            label: { color: { $ref: 'textColor' } },
        },
        fill: {
            $if: [{ $path: ['./position/floating', false] }, { $ref: 'chartBackgroundColor' }, 'transparent'],
        },
    },

    create: (ctx) => {
        const moduleInstance = new Legend(ctx);
        moduleInstance.attachLegend(ctx.scene);
        return moduleInstance;
    },
};
