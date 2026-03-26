import type { DeepRequired } from 'ag-charts-core';
import type { AgChartInstance, AgTouchOptions } from 'ag-charts-types';

import { Group } from '../scene/group';
import type { CaptionLike } from './captionLike';
import type { ChartHighlight } from './chartHighlight';
import type { ChartMode } from './chartMode';
import type { ISeries } from './series/seriesTypes';

// Subset of chart.ts exposed in the module context:
export interface ChartService {
    readonly id: string;
    readonly mode: ChartMode;
    readonly styleNonce?: string;
    readonly title: CaptionLike;
    readonly series: ISeries<any, any, any>[];
    readonly seriesRoot: Group;
    readonly publicApi?: AgChartInstance;
    readonly touch: DeepRequired<AgTouchOptions>;
    readonly context?: unknown;
    readonly highlight?: ChartHighlight;
    overrideFocusVisible(visible: boolean | undefined): void;
}
