import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { Scale } from '../scale/scale';
import type { Node } from '../scene/node';

export interface AxisContext {
    axisId: string;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    scale: Scale<any, any, any>;
    keys(): string[];
    seriesKeyProperties(): string[];
    scaleDomain(): any[] | undefined;
    scaleBandwidth(): number;
    scaleConvert(val: any): number;
    scaleInvert(position: number): any;
    scaleInvertNearest(position: number): any;
    scaleStep(): number;
    scaleValueFormatter(specifier?: string): ((x: any) => string) | undefined;
    attachLabel(node: Node): void;
    inRange(x: number, tolerance?: number): boolean;
}
