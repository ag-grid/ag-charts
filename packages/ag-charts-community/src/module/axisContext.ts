import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { AgCartesianAxisPosition } from '../options/agChartOptions';

export interface AxisContext {
    axisId: string;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    keys(): string[];
    seriesKeyProperties(): string[];
    scaleDomain(): any[] | undefined;
    scaleBandwidth(): number;
    scaleConvert(val: any): number;
    scaleInvert(position: number): any;
    scaleInvertNearest(position: number): any;
    scaleValueFormatter(specifier?: string): ((x: any) => string) | undefined;
}
