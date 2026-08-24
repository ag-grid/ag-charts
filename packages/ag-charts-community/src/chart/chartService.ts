import type { BoxBounds, CanvasPoint } from 'ag-charts-core';
import type { AgBaseChartListeners, AgChartInstance, AgCoordinates } from 'ag-charts-types';

import { Group } from '../scene/group';
import type { CaptionLike } from './captionLike';
import type { ChartHighlight } from './chartHighlight';
import type { ChartType } from './chartType';
import type { SeriesProperties } from './series/seriesProperties';
import type { DatumIndex, ISeries, SeriesNodeDatum } from './series/seriesTypes';
import type { CategoryGroupSeries } from './sharedCategoryGroup';

export type ChartListeners = AgBaseChartListeners<unknown, unknown>;
export type ChartEventType = keyof ChartListeners;
export type ChartEventMap = { [K in ChartEventType]: Parameters<NonNullable<ChartListeners[K]>>[0] };

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
    /** The index of the item `series` contributes at the hovered datum's category. Optional for partial stubs. */
    getSharedHighlightMatch?(
        hoveredSeries: CategoryGroupSeries,
        hoveredDatumIndex: DatumIndex,
        series: CategoryGroupSeries
    ): DatumIndex | undefined;
    overrideFocusVisible(visible: boolean | undefined): void;
    readonly listeners: ChartListeners;
    callListener<K extends ChartEventType>(event: ChartEventMap[K] & { type: K }): void;
    toAgCoordinates(point: CanvasPoint): AgCoordinates | undefined;
}
