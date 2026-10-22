import { CrossLinesModule } from 'ag-charts-community';
import {
    type AxisPluginModuleDefinition,
    ChartAxisDirection,
    crossLineListenerContributions,
    defined,
    numericValue,
} from 'ag-charts-core';
import type { AgBaseCrossLineOptions } from 'ag-charts-types';

import { PolarCrossLine } from './polarCrossLine';
import { angleCrossLines, radiusCrossLines } from './polarCrossLineOptionsDefs';

/**
 * Polar counterpart to the community `CrossLinesModule`. A distinct registry entry — both modules
 * share `optionsKey: 'crossLines'` so users continue to write `axis.crossLines` on every axis type.
 * Scoped to polar charts via `chartTypes` and the polar axis types via `axisTypes`, so the
 * factory only ever sees angle/radius axes.
 */
export const PolarCrossLinesModule: AxisPluginModuleDefinition<AgBaseCrossLineOptions[]> = {
    ...CrossLinesModule,
    name: 'polarCrossLines',
    optionsKey: 'crossLines',
    chartTypes: ['polar'],
    axisTypes: ['angle-category', 'angle-number', 'radius-category', 'radius-number'],
    enterprise: true,
    contributes: [
        /* #__PURE__ */ angleCrossLines('angle-category', defined),
        /* #__PURE__ */ angleCrossLines('angle-number', numericValue),
        /* #__PURE__ */ radiusCrossLines('radius-category', defined),
        /* #__PURE__ */ radiusCrossLines('radius-number', numericValue),
        ...crossLineListenerContributions,
    ],
    register: (ctx) => {
        ctx.factory('crossLine', (c) => {
            const { axisType }: { axisType: string } = c.parent;
            return axisType.startsWith('angle-')
                ? new PolarCrossLine(ChartAxisDirection.Angle)
                : new PolarCrossLine(ChartAxisDirection.Radius);
        });
    },
};
