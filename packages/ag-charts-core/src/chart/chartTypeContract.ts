import type { AgChartOptions, AgCoordinates, SeriesType } from 'ag-charts-types';

import type { BBox } from '../scene/bbox';
import type { TranslatableGroup } from '../scene/group';
import type { ChartAnimationPhase } from '../types/animationPhase';
import type { ChartAxisDirection } from '../types/axisDirection';
import type { CanvasPoint } from '../types/scene';

export type ChartType = 'cartesian' | 'polar' | 'topology' | 'standalone';

export type SeriesChangeType =
    'no-op' | 'no-change' | 'replaced' | 'data-change' | 'series-grouping-change' | 'series-count-changed' | 'updated';

/** The chart-side types the contract is expressed in; a chart type names only those it uses. */
export interface ChartTypeEnv {
    ctx?: unknown;
    series?: unknown;
    axes?: unknown;
    seriesArea?: unknown;
    chartOptions?: unknown;
    layoutContext?: unknown;
}

type EnvType<E extends ChartTypeEnv, K extends keyof ChartTypeEnv> = E[K] extends undefined ? unknown : E[K];

/** A chart-like owner of series: the chart itself or the navigator's mini chart. */
export interface SeriesHost<TSeries = unknown> {
    series: TSeries[];
    setSeries(series: TSeries[]): void;
}

/** A chart-like owner of axes: a chart type's axes component or the navigator's mini chart. */
export interface AxesHost<TAxes = unknown> {
    axes: TAxes;
    setAxes(axes: TAxes): void;
}

/** What a chart type may use of the core chart it sits on. */
export interface ChartTypeHost<E extends ChartTypeEnv = ChartTypeEnv> extends SeriesHost<EnvType<E, 'series'>> {
    readonly id: string;
    readonly ctx: EnvType<E, 'ctx'>;
    readonly seriesRoot: TranslatableGroup;
    readonly annotationRoot: TranslatableGroup;
    readonly seriesArea: EnvType<E, 'seriesArea'>;
    readonly chartOptions: EnvType<E, 'chartOptions'>;
    getOptions(): AgChartOptions;
    getSeriesAreaPadding(): { top: number; right: number; bottom: number; left: number };
    getCaptionText(): string;
    applySeries(
        host: SeriesHost<EnvType<E, 'series'>>,
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

/** The behaviour a chart type adds on top of the core chart; the core calls each hook at a fixed pipeline stage. */
export interface ChartTypeInstance<E extends ChartTypeEnv = ChartTypeEnv> {
    readonly type: ChartType;
    /** Exposed for the `chart.axes` compatibility getter only; the core chart never acts on it. */
    readonly axes?: EnvType<E, 'axes'>;
    /** Page up/down navigation between series items; true when omitted. */
    readonly pageNavigation?: boolean;

    applyAxisOptions?(
        options: AgChartOptions,
        chartOptions: EnvType<E, 'chartOptions'>,
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
    layout(ctx: EnvType<E, 'layoutContext'>): Promise<void> | void;

    getResizeUpdateType?(): number;
    resetAnimations?(phase: ChartAnimationPhase): void;
    /** Return false to skip the core relayout after a zoom change. */
    shouldRelayoutOnZoomChange?(): boolean;
    onSeriesDestroyed?(): void;
    toAgCoordinates?(point: CanvasPoint): AgCoordinates | undefined;
    getDefaultAriaLabel?(): string;
    destroy?(): void;
}
