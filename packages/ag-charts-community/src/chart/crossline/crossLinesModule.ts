import {
    type AxisPluginModuleDefinition,
    type DynamicContext,
    type OptionsContribution,
    type Validator,
    crossLineThemeOptionsDefs,
    crossLinesArrayOptionsDefs,
    crossLinesThemeTemplate,
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

function cartesianCrossLines(axisTypes: string[], value: Validator): OptionsContribution {
    return {
        path: 'axes[].crossLines',
        axisTypes,
        options: crossLinesArrayOptionsDefs(value, cartesianCrossLineLabelOptionsDefs),
        themeOptions: crossLineThemeOptionsDefs(cartesianCrossLineLabelOptionsDefs),
        themeTemplate: crossLinesThemeTemplate,
    };
}

export const CrossLinesModule: AxisPluginModuleDefinition<AgBaseCrossLineOptions[]> = /* #__PURE__ */ communityModule({
    type: 'axis:plugin',
    name: 'crossLines',
    chartTypes: ['cartesian'],
    enterprise: false,
    version: VERSION,
    dependencies: [CrossLinesDOMProxyModule],

    contributes: [
        /* #__PURE__ */ cartesianCrossLines(['category', 'grouped-category'], defined),
        /* #__PURE__ */ cartesianCrossLines(['number', 'log'], numericValue),
        /* #__PURE__ */ cartesianCrossLines(
            ['time', 'unit-time', 'ordinal-time'],
            /* #__PURE__ */ or(numericValue, date)
        ),
    ],

    register: (ctx: DynamicContext<CrossLinesRegistry>) => {
        ctx.factory('crossLine', (c) => new CartesianCrossLine(c));
    },
    create: (ctx) => new CrossLinesPlugin(ctx),
});
