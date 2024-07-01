import { type FontStyle, type FontWeight, type Formatter, type TextAlign, _ModuleSupport } from 'ag-charts-community';
import type { AnnotationContext } from './annotationTypes';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
type Constructor<T = {}> = new (...args: any[]) => T;
export declare class AnnotationPoint extends BaseProperties {
    x?: string | number | Date;
    y?: number;
}
declare const ChannelAnnotationBackground_base: {
    new (...args: any[]): {
        fill?: string | undefined;
        fillOpacity?: number | undefined;
    };
} & typeof _ModuleSupport.BaseProperties;
export declare class ChannelAnnotationBackground extends ChannelAnnotationBackground_base {
}
declare const ChannelAnnotationMiddle_base: {
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
} & {
    new (...args: any[]): {
        visible?: boolean | undefined;
    };
} & typeof _ModuleSupport.BaseProperties;
export declare class ChannelAnnotationMiddle extends ChannelAnnotationMiddle_base {
}
declare const AnnotationHandleProperties_base: {
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
} & {
    new (...args: any[]): {
        fill?: string | undefined;
        fillOpacity?: number | undefined;
    };
} & typeof _ModuleSupport.BaseProperties;
export declare class AnnotationHandleProperties extends AnnotationHandleProperties_base {
}
declare const AnnotationAxisLabelProperties_base: {
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
} & {
    new (...args: any[]): {
        fill?: string | undefined;
        fillOpacity?: number | undefined;
    };
} & {
    new (...args: any[]): {
        padding?: number | undefined;
        textAlign: TextAlign;
        fontStyle?: FontStyle | undefined;
        fontWeight?: FontWeight | undefined;
        fontSize: number;
        fontFamily: string;
        color?: string | undefined;
        formatter?: Formatter<AnnotationAxisLabelFormatterParams> | undefined;
    };
} & typeof _ModuleSupport.BaseProperties;
export declare class AnnotationAxisLabelProperties extends AnnotationAxisLabelProperties_base {
    enabled?: boolean;
    cornerRadius: number;
}
export declare function Annotation<T extends string, U extends Constructor<_ModuleSupport.BaseProperties>>(_type: T, Parent: U): {
    new (...args: any[]): {
        id: string;
        isValidWithContext(_context: AnnotationContext, warningPrefix: string): boolean;
        locked?: boolean | undefined;
        visible?: boolean | undefined;
        set(properties: object): any;
        isValid<TContext = Omit<object, "type">>(this: TContext, warningPrefix?: string | undefined): boolean;
        toJson<J>(this: J): object;
    };
} & U;
export declare function AnnotationLine<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        start: AnnotationPoint;
        end: AnnotationPoint;
    };
} & T;
export declare function AnnotationCrossLine<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        value?: string | number | Date | undefined;
    };
} & T;
export declare function ChannelAnnotation<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        background: ChannelAnnotationBackground;
    };
} & T;
export declare function AnnotationHandle<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        handle: AnnotationHandleProperties;
    };
} & T;
export declare function AnnotationAxisLabel<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        axisLabel: AnnotationAxisLabelProperties;
    };
} & T;
export declare function Cappable<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        startCap?: "circle" | "arrow" | undefined;
        endCap?: "circle" | "arrow" | undefined;
    };
} & T;
export declare function Extendable<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        extendLeft?: boolean | undefined;
        extendRight?: boolean | undefined;
    };
} & T;
export declare function Visible<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        visible?: boolean | undefined;
    };
} & T;
export declare function Fill<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        fill?: string | undefined;
        fillOpacity?: number | undefined;
    };
} & T;
export declare function Stroke<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        stroke?: string | undefined;
        strokeOpacity?: number | undefined;
        strokeWidth?: number | undefined;
    };
} & T;
export interface AnnotationAxisLabelFormatterParams {
    readonly value: any;
}
export declare function Label<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        padding?: number | undefined;
        textAlign: TextAlign;
        fontStyle?: FontStyle | undefined;
        fontWeight?: FontWeight | undefined;
        fontSize: number;
        fontFamily: string;
        color?: string | undefined;
        formatter?: Formatter<AnnotationAxisLabelFormatterParams> | undefined;
    };
} & T;
export declare function LineDash<T extends Constructor>(Parent: T): {
    new (...args: any[]): {
        lineDash?: number[] | undefined;
        lineDashOffset?: number | undefined;
    };
} & T;
export {};
