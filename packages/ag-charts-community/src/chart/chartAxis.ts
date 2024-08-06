import type { AgAxisLabelFormatterParams, AgCartesianAxisPosition, FontOptions, Formatter } from 'ag-charts-types';

import type { AxisContext } from '../module/axisContext';
import type { ModuleContextWithParent } from '../module/moduleContext';
import type { ModuleMap } from '../module/moduleMap';
import type { Scale } from '../scale/scale';
import type { BBox } from '../scene/bbox';
import type { Group } from '../scene/group';
import type { Node } from '../scene/node';
import type { AxisGridLine } from './axis/axisGridLine';
import type { AxisLine } from './axis/axisLine';
import type { AxisTick, TickInterval } from './axis/axisTick';
import type { ChartAnimationPhase } from './chartAnimationPhase';
import type { ChartAxisDirection } from './chartAxisDirection';
import type { CrossLine } from './crossline/crossLine';
import type { RegionBBoxProvider } from './interaction/regions';
import type { AxisLayout } from './layout/layoutService';
import type { ISeries } from './series/seriesTypes';

export type ChartAxisLabelFlipFlag = 1 | -1;

export interface ChartAxis {
    attachAxis(axisGroup: Node, gridGroup: Node): void;
    getAxisGroup(): Group;
    getRegionBBoxProvider(): RegionBBoxProvider;
    boundSeries: ISeries<unknown, unknown>[];
    calculateLayout(primaryTickCount?: number): { primaryTickCount: number | undefined; bbox: BBox };
    calculatePadding(min: number, max: number): [number, number];
    clipGrid(x: number, y: number, width: number, height: number): void;
    clipTickLines(x: number, y: number, width: number, height: number): void;
    getBBox(): BBox;
    isReversed(): boolean;
    crossLines?: CrossLine[];
    dataDomain: { domain: any[]; clipped: boolean };
    destroy(): void;
    detachAxis(axisGroup: Node, gridGroup: Node): void;
    direction: ChartAxisDirection;
    interactionEnabled: boolean;
    formatDatum(datum: any): string;
    getLayoutState(): AxisLayout;
    getModuleMap(): ModuleMap<any, any, any>;
    createAxisContext(): AxisContext;
    gridLength: number;
    gridPadding: number;
    id: string;
    inRange(x: number, width?: number, tolerance?: number): boolean;
    keys: string[];
    line: AxisLine;
    gridLine: AxisGridLine;
    label: ChartAxisLabel;
    tick: AxisTick;
    maxThickness: number;
    nice: boolean;
    position?: AgCartesianAxisPosition;
    range: [number, number];
    rotation: number;
    scale: Scale<any, any, any>;
    seriesAreaPadding: number;
    setCrossLinesVisible(visible: boolean): void;
    thickness?: number;
    translation: { x: number; y: number };
    type: string;
    update(primaryTickCount?: number, animated?: boolean): number | undefined;
    updateScale(): void;
    updatePosition(): void;
    visibleRange: [number, number];
    createModuleContext: () => ModuleContextWithParent<AxisContext>;
    resetAnimation(chartAnimationPhase: ChartAnimationPhase): unknown;
    interval: {
        step?: number | TickInterval<any>;
        values?: any[];
        minSpacing?: number;
        maxSpacing?: number;
    };
    layoutConstraints: {
        stacked: boolean;
        align: 'start' | 'end';
        width: number;
        unit: 'percent' | 'px';
    };
}

export interface ChartAxisLabel extends FontOptions {
    autoRotate?: boolean;
    autoRotateAngle?: number;
    avoidCollisions: boolean;
    enabled: boolean;
    format?: string;
    formatter?: Formatter<AgAxisLabelFormatterParams>;
    getSideFlag(): ChartAxisLabelFlipFlag;
    minSpacing: number;
    mirrored: boolean;
    padding: number;
    parallel: boolean;
    rotation?: number;
    set(props: object): void;
}
