import { _ModuleSupport } from 'ag-charts-community';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
declare const LineAnnotation_base: {
    new (...args: any[]): {
        id: string;
        isValidWithContext(_context: AnnotationContext, warningPrefix: string): boolean;
        locked?: boolean | undefined;
        visible?: boolean | undefined;
        set(properties: object): any;
        isValid<TContext = Omit<object, "type">>(this: TContext, warningPrefix?: string | undefined): boolean;
        toJson<J>(this: J): object;
    };
} & {
    new (...args: any[]): {
        start: import("../annotationProperties").AnnotationPoint;
        end: import("../annotationProperties").AnnotationPoint;
    };
} & {
    new (...args: any[]): {
        handle: import("../annotationProperties").AnnotationHandleProperties;
    };
} & {
    new (...args: any[]): {
        startCap?: "circle" | "arrow" | undefined;
        endCap?: "circle" | "arrow" | undefined;
    };
} & {
    new (...args: any[]): {
        extendLeft?: boolean | undefined;
        extendRight?: boolean | undefined;
    };
} & {
    new (...args: any[]): {
        stroke?: string | undefined;
        strokeOpacity?: number | undefined;
        strokeWidth?: number | undefined;
    };
} & {
    new (...args: any[]): {
        lineDash?: number[] | undefined;
        lineDashOffset?: number | undefined;
    };
} & typeof _ModuleSupport.BaseProperties;
export declare class LineAnnotation extends LineAnnotation_base {
    static is(value: unknown): value is LineAnnotation;
    type: AnnotationType.Line;
    isValidWithContext(context: AnnotationContext, warningPrefix?: string): boolean;
}
export {};
