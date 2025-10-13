import type { Scale } from 'ag-charts-core';
import type {
    AgAxisLabelFormatterParams,
    AgAxisLabelStylerParams,
    AgBaseAxisLabelStyleOptions,
    AgCartesianAxisPosition,
    Padding as AgPadding,
    AgTimeIntervalUnit,
    FontOptions,
    FormatterParams,
    RichFormatter,
    Styler,
    TextWrap,
} from 'ag-charts-types';

import type { AxisLayout } from '../core/eventsHub';
import type { AxisContext, AxisFormattableLabel } from '../module/axisContext';
import type { ModuleContextWithParent } from '../module/moduleContext';
import type { ModuleMap } from '../module/moduleMap';
import type { BBox } from '../scene/bbox';
import type { Group } from '../scene/group';
import type { Padding } from '../util/padding';
import type { AxisPrimaryTickCount } from '../util/secondaryAxisTicks';
import type { AxisGridLine } from './axis/axisGridLine';
import type { AxisLine } from './axis/axisLine';
import type { AxisTick, TickInterval } from './axis/axisTick';
import type { ChartAnimationPhase } from './chartAnimationPhase';
import type { ChartAxisDirection } from './chartAxisDirection';
import type { CrossLine } from './crossline/crossLine';
import type { DatumIndexType, ISeries } from './series/seriesTypes';

export type ChartAxisLabelFlipFlag = 1 | -1;

interface AxisInterval {
    step?: number | TickInterval<any>;
    values?: any[];
    minSpacing?: number;
    maxSpacing?: number;
}

interface AxisLayoutConstraints {
    stacked: boolean;
    align: 'start' | 'end';
    width: number;
    unit: 'percent' | 'px';
}

export interface AxisGroups {
    axisNode: Group;
    gridNode: Group;
    crossLineRangeNode: Group;
    crossLineLineNode: Group;
    crossLineLabelNode: Group;
    labelNode: Group;
}

export type FormatDatumParams = Omit<FormatterParams<any>, 'type' | 'value'>;

export interface ChartLayout {
    padding: Padding;
    sizeLimit: number;
}

export interface ChartAxis {
    attachAxis(opts: AxisGroups): void;
    calculateLayout(
        primaryTickCount?: AxisPrimaryTickCount,
        chartLayout?: ChartLayout
    ): { primaryTickCount?: AxisPrimaryTickCount; bbox?: BBox };
    clipGrid(x: number, y: number, width: number, height: number): void;
    clipTickLines(x: number, y: number, width: number, height: number): void;
    createAxisContext(): AxisContext;
    createModuleContext(): ModuleContextWithParent<AxisContext>;
    destroy(): void;
    detachAxis(): void;
    formatDatum(
        contextProvider: { context?: unknown },
        value: any,
        source: 'tooltip' | 'series-label',
        seriesId: string,
        legendItemName: string | undefined,
        datum: any,
        key: string
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
        params: Params
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
        params: Params
    ): string;
    getBBox(): BBox;
    getLayoutState(): AxisLayout;
    getModuleMap(): ModuleMap;
    inRange(x: number, tolerance?: number): boolean;
    isReversed(): boolean;
    resetAnimation(chartAnimationPhase: ChartAnimationPhase): unknown;
    setCrossLinesVisible(visible: boolean): void;
    processData(): void;
    update(animated?: boolean): void;
    setDomains(domain: unknown[]): void;
    isCategoryLike(): boolean;
    boundSeries: ISeries<DatumIndexType, unknown, unknown>[];
    crossLines?: CrossLine[];
    dataDomain: { domain: any[]; clipped: boolean };
    direction: ChartAxisDirection;
    gridLength: number;
    gridLine: AxisGridLine;
    gridPadding: number;
    id: string;
    interactionEnabled: boolean;
    interval: AxisInterval;
    keys: string[];
    label: ChartAxisLabel;
    layoutConstraints: AxisLayoutConstraints;
    line: AxisLine;
    nice: boolean;
    position?: AgCartesianAxisPosition;
    range: [number, number];
    reverse: boolean;
    scale: Scale<any, any, any>;
    seriesAreaPadding: number;
    thickness?: number;
    maxThicknessRatio?: number;
    tick: AxisTick;
    translation: { x: number; y: number };
    type: string;
    visibleRange: [number, number];
    minimumTimeGranularity?: AgTimeIntervalUnit;
}

export interface ChartAxisLabel extends FontOptions {
    fontSize: number; // This is required
    getSideFlag(): ChartAxisLabelFlipFlag;
    set(props: object): void;
    autoRotate?: boolean;
    autoRotateAngle?: number;
    avoidCollisions: boolean;
    border: { enabled: boolean; stroke?: string };
    enabled: boolean;
    format?: string | Record<string, string>;
    formatter?: RichFormatter<AgAxisLabelFormatterParams>;
    itemStyler?: Styler<AgAxisLabelStylerParams, AgBaseAxisLabelStyleOptions>;
    minSpacing?: number;
    mirrored: boolean;
    spacing: number;
    padding?: AgPadding;
    parallel: boolean;
    rotation?: number;
    truncate?: boolean;
    wrapping?: TextWrap;
}
