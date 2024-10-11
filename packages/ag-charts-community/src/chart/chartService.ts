import type { AgChartInstance } from 'ag-charts-types';

import { Group } from '../scene/group';
import type { CaptionLike } from './captionLike';
import type { ChartMode } from './chartMode';
import type { ISeries } from './series/seriesTypes';

// Subset of chart.ts exposed in the module context:
export interface ChartService {
    readonly mode: ChartMode;
    readonly title: CaptionLike;
    readonly series: ISeries<any, any>[];
    readonly backgroundRoot: Group;
    readonly axisRoot: Group;
    readonly seriesRoot: Group;
    readonly publicApi?: AgChartInstance;

    readonly removeMeAboveOverlayRoot: Group;
}
