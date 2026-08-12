import { VERSION } from 'ag-charts-community';
import type { SeriesAreaPluginModuleDefinition } from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegion } from 'ag-charts-types';

import { BackgroundRegionsPlugin } from './backgroundRegionsPlugin';
import { CartesianBackgroundRegion } from './cartesianBackgroundRegion';

export const BackgroundRegionsModule: SeriesAreaPluginModuleDefinition<AgSeriesAreaBackgroundRegion[]> = {
    type: 'series-area:plugin',
    name: 'backgroundRegions',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    themeTemplate: {
        $apply: [
            {
                fill: { $ref: 'foregroundColor' },
                fillOpacity: 0.8,
                stroke: { $ref: 'backgroundColor' },
                strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
                label: {
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    fontWeight: { $ref: 'fontWeight' },
                    padding: {
                        $applyPadding: {
                            $if: [{ $path: './border/enabled' }, { left: 12, right: 12, top: 8, bottom: 8 }, 5],
                        },
                    },
                    color: { $ref: 'textColor' },
                    cornerRadius: 4,
                    border: {
                        enabled: false,
                        stroke: { $ref: 'foregroundColor' },
                        strokeOpacity: 1,
                        strokeWidth: 1,
                    },
                },
                marker: {
                    strokeWidth: { $isUserOption: ['./stroke', 1, 0] },
                },
            },
            undefined,
            {
                $pathString: [
                    '/$seriesType/seriesArea/backgroundRegions',
                    { seriesType: { $path: ['/series/0/type', 'line'] } },
                ],
            },
        ],
    },

    register: (ctx) => {
        ctx.factory('backgroundRegion', () => new CartesianBackgroundRegion());
    },
    create: (ctx) => new BackgroundRegionsPlugin(ctx),
};
