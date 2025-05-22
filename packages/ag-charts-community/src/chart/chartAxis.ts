import type {
    AgAxisLabelFormatterParams,
    AgAxisLabelStylerParams,
    AgBaseAxisLabelStyleOptions,
    AgCartesianAxisPosition,
    FontOptions,
    Formatter,
    FormatterParams,
    Styler,
} from 'ag-charts-types';

import type { AxisContext } from '../module/axisContext';
import type { ModuleContextWithParent } from '../module/moduleContext';
import type { ModuleMap } from '../module/moduleMap';
import type { Scale } from '../scale/scale';
import type { BBox } from '../scene/bbox';
import type { Node } from '../scene/node';
import type { TransformableText } from '../scene/shape/text';
import type { Padding } from '../util/padding';
import type { AxisPrimaryTickCount } from '../util/secondaryAxisTicks';
import type { AxisGridLine } from './axis/axisGridLine';
import type { AxisLine } from './axis/axisLine';
import type { AxisTick, TickInterval } from './axis/axisTick';
import type { ChartAnimationPhase } from './chartAnimationPhase';
import type { ChartAxisDirection } from './chartAxisDirection';
import type { CrossLine } from './crossline/crossLine';
import type { AxisLayout } from './layout/layoutManager';
import type { ISeries } from './series/seriesTypes';

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
    axisNode: Node;
    gridNode: Node;
    crossLineRangeNode: Node;
    crossLineLineNode: Node;
    crossLineLabelNode: Node;
    labelNode: Node;
}

export type FormatDatumParams = Omit<FormatterParams<any, any>, 'type' | 'value'>;

export type ContextFormatter<Params> = (
    fn: (params: Params) => string | undefined,
    params: Params
) => string | undefined;

export interface ChartAxisFormattableLabel<Params extends object> {
    formatValue(
        formatInContext: ContextFormatter<Params>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: Params
    ): string | undefined;
}

export interface ChartAxis {
    attachAxis(opts: AxisGroups): void;
    calculateLayout(
        primaryTickCount?: AxisPrimaryTickCount,
        chartPadding?: Padding
    ): { primaryTickCount?: AxisPrimaryTickCount; bbox?: BBox };
    clipGrid(x: number, y: number, width: number, height: number): void;
    clipTickLines(x: number, y: number, width: number, height: number): void;
    createAxisContext(): AxisContext;
    createModuleContext(): ModuleContextWithParent<AxisContext>;
    destroy(): void;
    detachAxis(opts: AxisGroups): void;
    formatDatum(value: any, source: 'axis' | 'crosshair'): string;
    formatDatum(value: any, source: 'tooltip' | 'series-label', datum: any, key: string): string;
    formatDatum<Params extends object>(
        value: any,
        source: 'axis' | 'crosshair',
        datum: undefined,
        key: undefined,
        label: ChartAxisFormattableLabel<Params>,
        params: Params,
        formatInContext: ContextFormatter<Params>
    ): string;
    formatDatum<Params extends object>(
        value: any,
        source: 'tooltip' | 'series-label',
        datum: any,
        key: string,
        label: ChartAxisFormattableLabel<Params>,
        params: Params,
        formatInContext: ContextFormatter<Params>
    ): string;
    getBBox(): BBox;
    getLayoutState(): AxisLayout;
    getModuleMap(): ModuleMap<any, any, any>;
    inRange(x: number, tolerance?: number): boolean;
    isReversed(): boolean;
    resetAnimation(chartAnimationPhase: ChartAnimationPhase): unknown;
    setCrossLinesVisible(visible: boolean): void;
    processData(): void;
    update(animated?: boolean): void;
    setDomains(domain: unknown[]): void;
    boundSeries: ISeries<unknown, unknown, unknown>[];
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
    tick: AxisTick;
    translation: { x: number; y: number };
    type: string;
    visibleRange: [number, number];
    labelNodes: TransformableText[];
}

export interface ChartAxisLabel extends FontOptions {
    fontSize: number; // This is required
    getSideFlag(): ChartAxisLabelFlipFlag;
    set(props: object): void;
    autoRotate?: boolean;
    autoRotateAngle?: number;
    avoidCollisions: boolean;
    enabled: boolean;
    format?: string | Record<string, string>;
    formatter?: Formatter<AgAxisLabelFormatterParams>;
    itemStyler?: Styler<AgAxisLabelStylerParams, AgBaseAxisLabelStyleOptions>;
    minSpacing?: number;
    mirrored: boolean;
    spacing: number;
    parallel: boolean;
    rotation?: number;
}
