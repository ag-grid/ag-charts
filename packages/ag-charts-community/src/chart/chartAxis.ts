import type { ModuleMap } from '../module/moduleMap';
import type { AgAxisLabelFormatterParams } from '../options/chart/axisOptions';
import type { FontStyle, FontWeight } from '../options/chart/types';
import type { AgCartesianAxisPosition } from '../options/series/cartesian/cartesianOptions';
import type { Scale } from '../scale/scale';
import type { BBox } from '../scene/bbox';
import type { Node } from '../scene/node';
import type { ChartAxisDirection } from './chartAxisDirection';
import type { AxisLayout } from './layout/layoutService';

export interface BoundSeries {
    getBandScalePadding?(): { inner: number; outer: number };
    getDomain(direction: ChartAxisDirection): any[];
    getKeys(direction: ChartAxisDirection): string[];
    getNames(direction: ChartAxisDirection): (string | undefined)[];
    isEnabled(): boolean;
    type: string;
    visible: boolean;
}

export type ChartAxisLabelFlipFlag = 1 | -1;

export interface ChartAxis {
    attachAxis(axisGroup: Node, gridGroup: Node): void;
    boundSeries: BoundSeries[];
    calculatePadding(min: number, _max: number): [number, number];
    clipGrid(x: number, y: number, width: number, height: number): void;
    clipTickLines(x: number, y: number, width: number, height: number): void;
    computeBBox(): BBox;
    crossLines?: any[];
    dataDomain: { domain: any[]; clipped: boolean };
    destroy(): void;
    detachAxis(naxisGroup: Node, gridGroup: Node): void;
    direction: ChartAxisDirection;
    formatDatum(datum: any): string;
    getLayoutState(): AxisLayout;
    getModuleMap(): ModuleMap<any, any, any>;
    gridLength: number;
    gridPadding: number;
    id: string;
    inRange(x: number, width?: number, tolerance?: number): boolean;
    keys: string[];
    label: ChartAxisLabel;
    linkedTo?: ChartAxis;
    maxThickness: number;
    nice: boolean;
    position?: AgCartesianAxisPosition;
    range: number[];
    rotation: number;
    scale: Scale<any, any, any>;
    seriesAreaPadding: number;
    setCrossLinesVisible(visible: boolean): void;
    thickness?: number;
    translation: { x: number; y: number };
    type: string;
    update(primaryTickCount?: number): number | undefined;
    updateScale(): void;
    updatePosition(position: { rotation: number; sideFlag: ChartAxisLabelFlipFlag }): void;
    visibleRange: number[];
}

export interface ChartAxisLabel {
    autoRotate?: boolean;
    autoRotateAngle?: number;
    autoWrap?: boolean;
    avoidCollisions: boolean;
    color?: string;
    enabled: boolean;
    fontFamily: string;
    fontSize: number;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    format?: string;
    formatter?: (params: AgAxisLabelFormatterParams) => string;
    getFont(): string;
    getSideFlag(): ChartAxisLabelFlipFlag;
    maxHeight?: number;
    maxWidth?: number;
    minSpacing: number;
    mirrored: boolean;
    padding: number;
    parallel: boolean;
    rotation?: number;
}
