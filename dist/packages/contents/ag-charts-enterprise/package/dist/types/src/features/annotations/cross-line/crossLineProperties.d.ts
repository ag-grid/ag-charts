import { _ModuleSupport } from 'ag-charts-community';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
declare const HorizontalLineAnnotation_base: {
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
        value?: string | number | Date | undefined;
    };
} & {
    new (...args: any[]): {
        handle: import("../annotationProperties").AnnotationHandleProperties;
    };
} & {
    new (...args: any[]): {
        axisLabel: import("../annotationProperties").AnnotationAxisLabelProperties;
    };
} & {
    new (...args: any[]): {
        startCap?: "circle" | "arrow" | undefined;
        endCap?: "circle" | "arrow" | undefined;
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
export declare class HorizontalLineAnnotation extends HorizontalLineAnnotation_base {
    readonly direction = "horizontal";
    static is(value: unknown): value is HorizontalLineAnnotation;
    type: AnnotationType.HorizontalLine;
    isValidWithContext(context: AnnotationContext, warningPrefix: string): boolean;
}
declare const VerticalLineAnnotation_base: {
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
        value?: string | number | Date | undefined;
    };
} & {
    new (...args: any[]): {
        handle: import("../annotationProperties").AnnotationHandleProperties;
    };
} & {
    new (...args: any[]): {
        axisLabel: import("../annotationProperties").AnnotationAxisLabelProperties;
    };
} & {
    new (...args: any[]): {
        startCap?: "circle" | "arrow" | undefined;
        endCap?: "circle" | "arrow" | undefined;
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
export declare class VerticalLineAnnotation extends VerticalLineAnnotation_base {
    readonly direction = "vertical";
    static is(value: unknown): value is VerticalLineAnnotation;
    type: AnnotationType.VerticalLine;
    isValidWithContext(context: AnnotationContext, warningPrefix: string): boolean;
}
export type CrossLineAnnotation = HorizontalLineAnnotation | VerticalLineAnnotation;
export {};
