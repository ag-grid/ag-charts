import {
    type AxisPluginModuleDefinition,
    type DynamicContext,
    crossLineListenerContributions,
    crossLinesContribution,
    date,
    defined,
    numericValue,
    or,
} from 'ag-charts-core';
import type { AgBaseCrossLineOptions } from 'ag-charts-types';

import { communityModule } from '../../module/moduleIdentity';
import { VERSION } from '../../version';
import { CartesianCrossLine } from './cartesianCrossLine';
import { cartesianCrossLineLabelOptionsDefs } from './crossLineOptionsDefs';
import { CrossLinesDOMProxyModule } from './crossLinesDOMProxyModule';
import { CrossLinesPlugin } from './crossLinesPlugin';
import type { CrossLinesRegistry } from './crossLinesRegistry';

export const CrossLinesModule: AxisPluginModuleDefinition<AgBaseCrossLineOptions[]> = /* #__PURE__ */ communityModule({
    type: 'axis:plugin',
    name: 'crossLines',
    chartTypes: ['cartesian'],
    enterprise: false,
    version: VERSION,
    dependencies: [CrossLinesDOMProxyModule],

    contributes: [
        /* #__PURE__ */ crossLinesContribution(
            ['category', 'grouped-category'],
            defined,
            cartesianCrossLineLabelOptionsDefs
        ),
        /* #__PURE__ */ crossLinesContribution(['number', 'log'], numericValue, cartesianCrossLineLabelOptionsDefs),
        /* #__PURE__ */ crossLinesContribution(
            ['time', 'unit-time', 'ordinal-time'],
            /* #__PURE__ */ or(numericValue, date),
            cartesianCrossLineLabelOptionsDefs
        ),
        ...crossLineListenerContributions,
    ],

    register: (ctx: DynamicContext<CrossLinesRegistry>) => {
        ctx.factory('crossLine', (c) => new CartesianCrossLine(c));
    },
    create: (ctx) => new CrossLinesPlugin(ctx),
});
