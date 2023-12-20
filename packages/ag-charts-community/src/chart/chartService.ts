import type { Caption } from './caption';
import type { ChartMode } from './chartMode';
import type { ISeries } from './series/seriesTypes';

// Subset of chart.ts exposed in the module context:
export interface ChartService {
    readonly mode: ChartMode;
    readonly title?: Caption;
    readonly series: ISeries<any>[];
}
