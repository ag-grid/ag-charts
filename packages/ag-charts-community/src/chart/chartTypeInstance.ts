import type {
    BBox,
    CanvasPoint,
    ChartAnimationPhase,
    ChartAxisDirection,
    DynamicContext,
    TranslatableGroup,
} from 'ag-charts-core';
import type { AgChartOptions, AgCoordinates, SeriesType } from 'ag-charts-types';

import type { ChartRegistry } from '../module/moduleContext';
import type { ChartOptions } from '../module/optionsModule';
import type { ChartAxes } from './chartAxes';
import type { ChartType } from './chartType';
import type { SyncStatus } from './interaction/syncManager';
import type { LayoutContext } from './layout/layoutManager';
import type { ModulesManager } from './modulesManager';
import type { SeriesArea } from './series-area/seriesArea';
import type { UnknownSeries } from './series/series';

export type SeriesChangeType =
    'no-op' | 'no-change' | 'replaced' | 'data-change' | 'series-grouping-change' | 'series-count-changed' | 'updated';

/** A chart-like owner of series: the chart itself or the navigator's mini chart. */
export interface SeriesHost {
    series: UnknownSeries[];
    setSeries(series: UnknownSeries[]): void;
}

/** A chart-like owner of axes: a chart type's axes component or the navigator's mini chart. */
export interface AxesHost {
    axes: ChartAxes;
    setAxes(axes: ChartAxes): void;
}

export type SeriesAxesHost = SeriesHost & AxesHost;

/** What a chart type may use of the core chart it sits on. */
export interface ChartTypeHost extends SeriesHost {
    readonly id: string;
    readonly ctx: DynamicContext<ChartRegistry>;
    readonly seriesRoot: TranslatableGroup;
    readonly annotationRoot: TranslatableGroup;
    readonly seriesArea: SeriesArea;
    readonly seriesRect?: BBox;
    readonly chartOptions: ChartOptions;
    readonly chartAnimationPhase: ChartAnimationPhase;
    // SPIKE: the navigator and sync lookups this serves move to their modules.
    readonly modulesManager: ModulesManager;
    syncStatus: SyncStatus;
    getOptions(): AgChartOptions;
    getSeriesAreaPadding(): { top: number; right: number; bottom: number; left: number };
    getCaptionText(): string;
    applySeries(
        host: SeriesHost,
        optSeries: AgChartOptions['series'],
        oldOptSeries?: AgChartOptions['series']
    ): SeriesChangeType;
    /** Publishes the layout result; `animationRect` changing between layouts skips the pending animations. */
    setLayoutRects(seriesRect: BBox, animationRect: BBox): void;
    /** The default placement of the series roots, for chart types that don't animate them. */
    placeSeriesRoots(seriesRect: BBox, opts: { snap: boolean; clipRect: BBox | undefined }): void;
}

export interface RequiredRange {
    requiredRangeRatio: number;
    requiredRangeDirection: ChartAxisDirection;
    requiredRange: number;
}

/** The behaviour a chart type adds on top of the core chart; every member is optional except the layout. */
export interface ChartTypeInstance {
    readonly type: ChartType;
    /** Exposed for the `chart.axes` compatibility getter only; the core chart never acts on it. */
    readonly axes?: ChartAxes;
    /** Page up/down navigation between series items; true when omitted. */
    readonly pageNavigation?: boolean;

    applyAxisOptions?(
        options: AgChartOptions,
        chartOptions: ChartOptions,
        seriesStatus: SeriesChangeType,
        axesChanged: boolean
    ): void;
    applyChartTypeOptions?(newOpts: AgChartOptions, oldOpts: AgChartOptions & { type?: SeriesType }): void;
    /** Whether a delta of only layout keys can skip the node data refresh. */
    supportsLayoutOnlyDelta?(): boolean;

    updateData?(): void;
    beforeProcessData?(): void;
    afterProcessData?(): void;
    beforeSeriesDomains?(): void;
    afterSeriesDomains?(): Promise<void>;
    processRanges?(): void;
    getRequiredRange?(seriesRect: BBox): RequiredRange;
    layout(ctx: LayoutContext): Promise<void> | void;

    getResizeUpdateType?(): number;
    resetAnimations?(phase: ChartAnimationPhase): void;
    /** Return false to skip the core relayout after a zoom change. */
    shouldRelayoutOnZoomChange?(): boolean;
    onSeriesDestroyed?(): void;
    toAgCoordinates?(point: CanvasPoint): AgCoordinates | undefined;
    getDefaultAriaLabel?(): string;
    destroy(): void;
}
