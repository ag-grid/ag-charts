import type { BoxBounds, RequireOptional } from 'ag-charts-core';
import type {
    AgAxisClickEvent,
    AgChartInstance,
    AgCollapsedChangeEvent,
    AgSelectionChangeEvent,
} from 'ag-charts-types';

import { Group } from '../scene/group';
import type { CaptionLike } from './captionLike';
import type { ChartHighlight } from './chartHighlight';
import type { ChartType } from './chartType';
import type { SeriesProperties } from './series/seriesProperties';
import type { ISeries, SeriesNodeDatum } from './series/seriesTypes';

export type ChartServiceEvent =
    | RequireOptional<Omit<AgSelectionChangeEvent<unknown, unknown>, 'context'>>
    | RequireOptional<Omit<AgCollapsedChangeEvent<unknown, unknown>, 'context'>>
    | Omit<AgAxisClickEvent<'axisClick', unknown>, 'context'>
    | Omit<AgAxisClickEvent<'axisDoubleClick', unknown>, 'context'>;
export type ChartServiceEventType = ChartServiceEvent['type'];

type BaseSeries = ISeries<SeriesNodeDatum, SeriesProperties<object>>;

// Subset of chart.ts exposed in the module context:
export interface ChartService {
    readonly id: string;
    readonly title: CaptionLike;
    readonly series: BaseSeries[];
    readonly seriesRoot: Group;
    readonly seriesRect?: Readonly<BoxBounds>;
    readonly selectionRoot: Group;
    readonly publicApi?: AgChartInstance;
    readonly context?: unknown;
    readonly highlight?: ChartHighlight;
    getChartType(): ChartType;
    overrideFocusVisible(visible: boolean | undefined): void;
    hasListener(type: ChartServiceEventType): boolean;
    callListener(event: ChartServiceEvent): void;
}
