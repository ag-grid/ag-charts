import type { AgAxisLabelFormatterParams, AgCartesianAxisPosition, FontOptions, Formatter } from 'ag-charts-types';

import type { AxisContext } from '../module/axisContext';
import type { ModuleContextWithParent } from '../module/moduleContext';
import type { ModuleMap } from '../module/moduleMap';
import type { Scale } from '../scale/scale';
import type { BBox } from '../scene/bbox';
import type { Node } from '../scene/node';
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

export interface ChartAxis {
    attachAxis(axisGroup: Node, gridGroup: Node): void;
    calculateLayout(domain?: any[], primaryTickCount?: number): { primaryTickCount?: number; bbox: BBox };
    clipGrid(x: number, y: number, width: number, height: number): void;
    clipTickLines(x: number, y: number, width: number, height: number): void;
    createAxisContext(): AxisContext;
    createModuleContext(): ModuleContextWithParent<AxisContext>;
    destroy(): void;
    detachAxis(axisGroup: Node, gridGroup: Node): void;
    formatDatum(datum: any): string;
    getBBox(): BBox;
    getLayoutState(): AxisLayout;
    getModuleMap(): ModuleMap<any, any, any>;
    getRegionNode(): Node;
    inRange(x: number, width?: number, tolerance?: number): boolean;
    isReversed(): boolean;
    resetAnimation(chartAnimationPhase: ChartAnimationPhase): unknown;
    setCrossLinesVisible(visible: boolean): void;
    update(animated?: boolean): number | undefined;
    updatePosition(): void;
    boundSeries: ISeries<unknown, unknown>[];
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
    rotation: number;
    scale: Scale<any, any, any>;
    seriesAreaPadding: number;
    thickness?: number;
    tick: AxisTick;
    translation: { x: number; y: number };
    type: string;
    visibleRange: [number, number];
}

export interface ChartAxisLabel extends FontOptions {
    getSideFlag(): ChartAxisLabelFlipFlag;
    set(props: object): void;
    autoRotate?: boolean;
    autoRotateAngle?: number;
    avoidCollisions: boolean;
    enabled: boolean;
    format?: string;
    formatter?: Formatter<AgAxisLabelFormatterParams>;
    minSpacing: number;
    mirrored: boolean;
    padding: number;
    parallel: boolean;
    rotation?: number;
}
