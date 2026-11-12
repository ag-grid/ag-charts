import type { BoxBounds, CanvasPoint, ChartType } from 'ag-charts-core';
import { Group } from 'ag-charts-core';
import type { AgAxesChartListeners, AgChartInstance, AgCoordinates } from 'ag-charts-types';

import type { CaptionLike } from './captionLike';
import type { ChartAxis } from './chartAxis';
import type { DatumIndex, ISeries, ISeriesOptions, SeriesNodeDatum } from './series/seriesTypes';
import type { CategoryGroupSeries } from './sharedCategoryGroup';
import type { TooltipContent } from './tooltip/tooltip';

export type ChartListeners = AgAxesChartListeners<unknown, unknown>;
export type ChartEventType = keyof ChartListeners;
export type ChartEventMap = { [K in ChartEventType]: Parameters<NonNullable<ChartListeners[K]>>[0] };

type BaseSeries = ISeries<SeriesNodeDatum, ISeriesOptions>;

// Subset of chart.ts exposed in the module context:
export interface ChartService {
    readonly id: string;
    readonly title: CaptionLike;
    readonly series: BaseSeries[];
    readonly axes: readonly ChartAxis[];
    readonly seriesRoot: Group;
    readonly seriesRect?: Readonly<BoxBounds>;
    readonly selectionRoot: Group;
    readonly publicApi?: AgChartInstance;
    readonly context?: unknown;
    getChartType(): ChartType;
    /** The index of the item `series` contributes at the hovered datum's category. Optional for partial stubs. */
    getSharedHighlightMatch?(
        hoveredSeries: CategoryGroupSeries,
        hoveredDatumIndex: DatumIndex,
        series: CategoryGroupSeries
    ): DatumIndex | undefined;
    readonly listeners: ChartListeners;
    callListener<K extends ChartEventType>(event: ChartEventMap[K] & { type: K }): void;
    toAgCoordinates(point: CanvasPoint): AgCoordinates | undefined;
    getTooltipContent(
        series: BaseSeries,
        datumIndex: DatumIndex,
        removeMeDatum: SeriesNodeDatum,
        purpose: 'aria-label' | 'tooltip'
    ): TooltipContent[];
}
