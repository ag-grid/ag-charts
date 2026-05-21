import { CrossLinesModule } from 'ag-charts-community';
import { type AxisPluginModuleDefinition, ChartAxisDirection } from 'ag-charts-core';
import type { AgBaseCrossLineOptions } from 'ag-charts-types';

import { PolarCrossLine } from './polarCrossLine';

/**
 * Polar counterpart to the community `CrossLinesModule`. A distinct registry entry — both modules
 * share `optionsKey: 'crossLines'` so users continue to write `axis.crossLines` on every axis type.
 * Scoped to polar charts via `chartType: 'polar'` and the polar axis types via `axisTypes`, so the
 * factory only ever sees angle/radius axes.
 */
export const PolarCrossLinesModule: AxisPluginModuleDefinition<AgBaseCrossLineOptions[]> = {
    ...CrossLinesModule,
    name: 'polarCrossLines',
    optionsKey: 'crossLines',
    chartType: 'polar',
    axisTypes: ['angle-category', 'angle-number', 'radius-category', 'radius-number'],
    enterprise: true,
    register: (ctx) => {
        ctx.factory('crossLine', (c) => {
            const { axisType }: { axisType: string } = c.parent;
            return axisType.startsWith('angle-')
                ? new PolarCrossLine(ChartAxisDirection.Angle)
                : new PolarCrossLine(ChartAxisDirection.Radius);
        });
    },
};
