import { CrossLinesModule as CommunityCrossLinesModule, _ModuleSupport } from 'ag-charts-community';
import { type AxisPluginModuleDefinition, ChartAxisDirection } from 'ag-charts-core';
import type { AgBaseCrossLineOptions } from 'ag-charts-types';

import { PolarCrossLine } from './polarCrossLine';

const { CartesianCrossLine } = _ModuleSupport;

/**
 * Enterprise override of the community `CrossLinesModule` (same `name`, same `version`,
 * `enterprise: true`). The registry's override-by-name mechanism replaces the community
 * definition when the enterprise bundle is loaded; only the `register` hook differs.
 * Installs a polar-aware `crossLine` factory that branches on `axisCtx.axisType`, returning
 * a `PolarCrossLine` for polar axes and falling back to the cartesian implementation otherwise.
 */
export const CrossLinesModule: AxisPluginModuleDefinition<AgBaseCrossLineOptions[]> = {
    ...CommunityCrossLinesModule,
    enterprise: true,
    register: (ctx) => {
        ctx.factory('crossLine', (c) => {
            const { axisType }: { axisType: string } = c.parent;
            if (axisType.startsWith('angle-')) {
                return new PolarCrossLine(ChartAxisDirection.Angle);
            }
            if (axisType.startsWith('radius-')) {
                return new PolarCrossLine(ChartAxisDirection.Radius);
            }
            return new CartesianCrossLine();
        });
    },
};
