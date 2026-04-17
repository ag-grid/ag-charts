import type { DeepRequired, RequireOptional } from 'ag-charts-core';
import type { AgChartInstance, AgSelectionChangeEvent, AgTouchOptions } from 'ag-charts-types';

import { Group } from '../scene/group';
import type { CaptionLike } from './captionLike';
import type { ChartHighlight } from './chartHighlight';
import type { ChartMode } from './chartMode';
import type { ISeries } from './series/seriesTypes';

export type ChartServiceEvent = RequireOptional<Omit<AgSelectionChangeEvent<unknown, unknown>, 'context'>>;
export type ChartServiceEventType = ChartServiceEvent['type'];

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
    callListener(event: ChartServiceEvent): void;
}
