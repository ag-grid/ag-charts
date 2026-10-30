import type {
    AxisID,
    AxisPrimaryTickCount,
    BBox,
    ChartAnimationPhase,
    ChartAxisDirection,
    ChartSidePadding,
    ChartUpdateType,
    DomainWithMetadata,
    DynamicContext,
    Group,
    NormalisedBaseAxisOptions,
    NormalisedPaddingOptions,
    Scale,
} from 'ag-charts-core';
import type {
    AgAxisLabelFormatterParams,
    AgAxisLabelStylerParams,
    AgBaseAxisLabelStyleOptions,
    AgCartesianAxisPosition,
    AgTimeAxisFormattableLabelUnitFormat,
    AgTimeIntervalUnit,
    FormatterParams,
    Padding,
    RichFormatter,
    Styler,
    TextOptions,
    TextWrap,
} from 'ag-charts-types';

import type { AxisLayout } from '../core/eventsHub';
import type { AxisContext, AxisFormattableLabel } from '../module/axisContext';
import type { ChartAxisRegistry } from '../module/moduleContext';
import type { ModuleMap } from '../module/moduleMap';
import type { ScrollbarLayoutMap } from './layout/layoutManager';
import type { ISeries, ISeriesOptions, SeriesNodeDatum } from './series/seriesTypes';

export type ChartAxisLabelFlipFlag = 1 | -1;

interface AxisLayoutConstraints {
    stacked: boolean;
    align: 'justify' | 'start' | 'center' | 'end';
    width: number;
    unit: 'percent' | 'px';
}

export interface AxisGroups {
    axisNode: Group;
    gridNode: Group;
    labelNode: Group;
    /** Three z-index-ordered overlay slots that follow the axis transform, for axis plugins to draw into. */
    overlayLowNode: Group;
    overlayMidNode: Group;
    overlayHighNode: Group;
}

export type FormatDatumParams = Omit<FormatterParams<any>, 'type' | 'value'>;

export interface ChartLayout {
    padding: NormalisedPaddingOptions;
    sizeLimit: number;
    scrollbars?: ScrollbarLayoutMap;
}

export interface ChartAxis<TOptions extends NormalisedBaseAxisOptions = NormalisedBaseAxisOptions> {
    userKey: string;
    setPickComputationEnabled(enabled: boolean): void;
    attachAxis(opts: AxisGroups): void;
    calculateLayout(
        primaryTickCount?: AxisPrimaryTickCount,
        chartLayout?: ChartLayout
    ): { primaryTickCount?: AxisPrimaryTickCount; bbox?: BBox };
    clipGrid(x: number, y: number, width: number, height: number): void;
    clipTickLines(x: number, y: number, width: number, height: number): void;
    createAxisContext(): AxisContext;
    createModuleContext(): DynamicContext<ChartAxisRegistry<AxisContext>>;
    destroy(): void;
    detachAxis(): void;
    formatDatum(
        contextProvider: { context?: unknown },
        value: any,
        source: 'tooltip' | 'series-label',
        seriesId: string,
        legendItemName: string | undefined,
        datum: any,
        key: string,
        domain?: undefined,
        label?: undefined,
        params?: undefined,
        allowNull?: boolean,
        axisLabelFallback?: boolean
    ): string;
    formatDatum<Params extends object>(
        contextProvider: { context?: unknown } | undefined,
        value: any,
        source: 'crosshair' | 'annotation-label',
        seriesId: undefined,
        legendItemName: undefined,
        datum: undefined,
        key: undefined,
        domain: undefined,
        label: AxisFormattableLabel<Params>,
        params: Params,
        allowNull?: boolean
    ): string;
    formatDatum<Params extends object>(
        contextProvider: { context?: unknown } | undefined,
        value: any,
        source: 'tooltip' | 'series-label',
        seriesId: string,
        legendItemName: string | undefined,
        datum: any,
        key: string,
        domain: any[],
        label: AxisFormattableLabel<Params>,
        params: Params,
        allowNull?: boolean,
        axisLabelFallback?: boolean
    ): string;
    getBBox(): BBox;
    getLayoutState(): AxisLayout;
    collectPluginPadding(padding: ChartSidePadding): void;
    getModuleMap(): ModuleMap;
    getUpdateTypeOnResize(): ChartUpdateType;
    inRange(x: number, tolerance?: number): boolean;
    isReversed(): boolean;
    resetAnimation(chartAnimationPhase: ChartAnimationPhase): unknown;
    processData(): void;
    update(animated?: boolean): void;
    applyOptions(options: TOptions): void;
    setDomains(...domains: DomainWithMetadata<unknown>[]): void;
    isCategoryLike(): boolean;
    boundSeries: ISeries<SeriesNodeDatum, ISeriesOptions>[];
    dataDomain: { domain: any[]; clipped: boolean };
    direction: ChartAxisDirection;
    gridLength: number;
    gridPadding: number;
    id: AxisID;
    interactionEnabled: boolean;
    seriesAreaVisible: boolean;
    layoutConstraints: AxisLayoutConstraints;
    nice: boolean;
    options: TOptions;
    mirrored: boolean;
    parallel: boolean;
    position?: AgCartesianAxisPosition;
    range: [number, number];
    requiredRange?: number;
    scale: Scale<any, any, any>;
    seriesAreaPadding: number;
    minimumTimeGranularity?: AgTimeIntervalUnit;
    translation: { x: number; y: number };
    type: string;
    visibleRange: [number, number];
}

export interface ChartAxisLabel extends TextOptions {
    fontSize: number; // This is required
    autoRotate?: boolean;
    autoRotateAngle?: number;
    avoidCollisions: boolean;
    border?: { enabled?: boolean; stroke?: string };
    enabled: boolean;
    format?: string | Record<string, string> | AgTimeAxisFormattableLabelUnitFormat;
    formatter?: RichFormatter<AgAxisLabelFormatterParams>;
    itemStyler?: Styler<AgAxisLabelStylerParams, AgBaseAxisLabelStyleOptions>;
    minSpacing?: number;
    spacing: number;
    padding?: Padding;
    rotation?: number;
    truncate?: boolean;
    wrapping?: TextWrap;
    maxWidth?: number;
    maxHeight?: number;
    minimumFontSize?: number;
}
