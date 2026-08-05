import type { SeriesAreaPluginModuleDefinition } from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegion } from 'ag-charts-types';

import { VERSION } from '../../version';
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
                enabled: true,
                // `fill`/`fillOpacity` style the `range` variant only; applying them to a `line`
                // cross-line would surface as an "unknown option" validation warning.
                fill: { $if: [{ $eq: [{ $path: './type' }, 'range'] }, { $ref: 'foregroundColor' }, undefined] },
                fillOpacity: { $if: [{ $eq: [{ $path: './type' }, 'range'] }, 0.08, undefined] },
                label: {
                    fontSize: { $ref: 'fontSize' },
                    fontFamily: { $ref: 'fontFamily' },
                    fontWeight: { $ref: 'fontWeight' },
                    padding: {
                        $if: [{ $path: './border/enabled' }, { left: 12, right: 12, top: 8, bottom: 8 }, 5],
                    },
                    color: { $ref: 'textColor' },
                    cornerRadius: 4,
                    border: {
                        enabled: false,
                        stroke: { $foregroundOpacity: 0.08 },
                        strokeOpacity: 1,
                        strokeWidth: 1,
                    },
                },
            },
        ],
    },

    register: (ctx) => {
        ctx.factory('backgroundRegion', () => new CartesianBackgroundRegion());
    },
    create: (ctx) => new BackgroundRegionsPlugin(ctx),
};
