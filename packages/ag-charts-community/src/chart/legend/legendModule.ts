import {
    CARTESIAN_POSITION,
    FONT_SIZE_RATIO,
    LEGEND_CONTAINER_THEME,
    type PluginModuleDefinition,
    legendOptionsDefs,
} from 'ag-charts-core';
import type { AgChartLegendOptions } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { VERSION } from '../../version';
import { Legend } from './legend';
import { LegendManager } from './legendManager';

export const LegendModule: PluginModuleDefinition<AgChartLegendOptions, ChartRegistry> = {
    type: 'plugin',
    name: 'legend',
    version: VERSION,
    // TODO fix missing behaviour
    // removable: 'standalone-only',

    options: legendOptionsDefs,
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
            padding: { $applyPadding: { top: 4, right: 8, bottom: 4, left: 8 } },
            marker: { size: 15, padding: { $applyPadding: 8 } },
            line: { length: 25 },
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
            marker: { shape: 'triangle', size: 12, padding: { $applyPadding: 8 } },
            activeStyle: { fill: { $ref: 'foregroundColor' }, strokeWidth: 1, strokeOpacity: 1 },
            inactiveStyle: { fill: { $ref: 'subtleTextColor' }, strokeWidth: 1, strokeOpacity: 1 },
            highlightStyle: { fill: { $ref: 'foregroundColor' }, strokeWidth: 1, strokeOpacity: 1 },
            label: {
                color: { $ref: 'textColor' },
                fontSize: { $rem: FONT_SIZE_RATIO.SMALL },
                fontFamily: { $ref: 'fontFamily' },
            },
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
    register: (ctx) => {
        if (ctx.has('legendManager')) return;
        ctx.service('legendManager', (c) => new LegendManager(c));
    },
};
