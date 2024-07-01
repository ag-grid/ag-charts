import { type Direction, _ModuleSupport } from 'ag-charts-community';
import type { AnnotationPoint } from './annotationProperties';
import type { AnnotationAxisContext, AnnotationContext, Coords, Point } from './annotationTypes';
export declare function validateDatumLine(context: AnnotationContext, datum: {
    start: Point;
    end: Point;
}, warningPrefix?: string): boolean;
export declare function validateDatumValue(context: AnnotationContext, datum: {
    value?: string | number | Date;
    direction?: Direction;
}, warningPrefix: string): boolean;
export declare function validateDatumPoint(context: AnnotationContext, point: Point, warningPrefix?: string): boolean;
export declare function validateDatumPointDirection(value: any, context: AnnotationAxisContext): boolean;
export declare function convertLine(datum: {
    start: Pick<AnnotationPoint, 'x' | 'y'>;
    end: Pick<AnnotationPoint, 'x' | 'y'>;
}, context: AnnotationContext): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
} | undefined;
export declare function convertPoint(point: Point, context: AnnotationContext): {
    x: number;
    y: number;
};
export declare function convert(p: Point['x' | 'y'], context: Pick<AnnotationAxisContext, 'scaleBandwidth' | 'scaleConvert'>): number;
export declare function invertCoords(coords: Coords, context: AnnotationContext): {
    x: any;
    y: any;
};
export declare function invert(n: Coords['x' | 'y'], context: Pick<AnnotationAxisContext, 'scaleBandwidth' | 'continuous' | 'scaleInvert' | 'scaleInvertNearest'>): any;
export declare function calculateAxisLabelPadding(axisLayout: _ModuleSupport.AxisLayout): number;
