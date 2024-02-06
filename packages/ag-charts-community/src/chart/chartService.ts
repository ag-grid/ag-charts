import type { CaptionLike } from './captionLike';
import type { ChartMode } from './chartMode';
import type { ISeries } from './series/seriesTypes';

// Subset of chart.ts exposed in the module context:
export interface ChartService {
    readonly mode: ChartMode;
    readonly title?: CaptionLike;
    readonly series: ISeries<any>[];
}
