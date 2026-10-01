import { type AxisPluginModuleDefinition, undocumentedThemeOptions } from 'ag-charts-core';
import type { AgBaseCrossLineOptions } from 'ag-charts-types';

import { communityModule } from '../../module/moduleIdentity';
import { VERSION } from '../../version';
import { CartesianCrossLine } from './cartesianCrossLine';
import { CrossLinesPlugin } from './crossLinesPlugin';

// Keys the theme styles each type by; the `Record` keeps it in step with the `type` union.
const CROSS_LINE_TYPES = Object.keys({ line: true, range: true } satisfies Record<
    AgBaseCrossLineOptions['type'],
    true
>);

export const CrossLinesModule: AxisPluginModuleDefinition<AgBaseCrossLineOptions[]> = /* #__PURE__ */ communityModule({
    type: 'axis:plugin',
    name: 'crossLines',
    chartTypes: ['cartesian'],
    enterprise: false,
    version: VERSION,

    themeTemplate: {
        $apply: [
            {
                enabled: true,
                // `fill`/`fillOpacity` style the `range` variant only; applying them to a `line`
                // cross-line would surface as an "unknown option" validation warning.
                fill: { $if: [{ $eq: [{ $path: './type' }, 'range'] }, { $ref: 'foregroundColor' }, undefined] },
                fillOpacity: { $if: [{ $eq: [{ $path: './type' }, 'range'] }, 0.08, undefined] },
                stroke: { $ref: 'foregroundColor' },
                strokeWidth: 1,
                label: {
                    ...undocumentedThemeOptions({ overflow: 'pad-chart' }),
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
            undefined,
            { $pathString: ['/common/axes/$axisType/crossLines', { axisType: { $path: ['../type'] } }] },
            {
                $pathString: [
                    '/$seriesType/axes/$axisType/crossLines',
                    {
                        seriesType: { $path: ['/series/0/type', 'line'] },
                        axisType: { $path: ['../type'] },
                    },
                ],
            },
            CROSS_LINE_TYPES,
        ],
    },

    register: (ctx) => {
        ctx.factory('crossLine', () => new CartesianCrossLine());
    },
    create: (ctx) => new CrossLinesPlugin(ctx),
});
