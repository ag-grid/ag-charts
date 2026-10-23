import type { CrossLine } from 'ag-charts-core';

import type { AxisContext } from '../../module/axisContext';
import type { ChartAxisRegistry } from '../../module/moduleContext';
import type { CrossLinesDOMProxy } from './crossLinesDOMProxy';

/** An axis's module context as the cross-lines modules see it. */
export interface CrossLinesRegistry extends ChartAxisRegistry<AxisContext> {
    readonly crossLinesDOMProxy?: CrossLinesDOMProxy;
    /** Installed by the owning cross-lines module's `register`; each read yields a fresh instance. */
    crossLine: CrossLine;
}
