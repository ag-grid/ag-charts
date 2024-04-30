import { _ModuleSupport } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class LineAnnotationStylesProperties extends BaseProperties {
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
    lineDash?: number[];
    lineDashOffset?: number;
}
export declare class ChannelAnnotationStylesProperties extends LineAnnotationStylesProperties {
    middle: LineAnnotationStylesProperties;
    background: AnnotationFillProperties;
}
export declare class AnnotationProperties extends LineAnnotationStylesProperties {
    type: 'line' | 'parallel-channel';
    locked?: boolean;
    visible?: boolean;
    handle: AnnotationHandleProperties;
    start: AnnotationPointProperties;
    end: AnnotationPointProperties;
    top: AnnotationLinePointsProperties;
    bottom: AnnotationLinePointsProperties;
    middle: LineAnnotationStylesProperties;
    background: AnnotationFillProperties;
}
export declare class AnnotationLinePointsProperties extends BaseProperties {
    start: AnnotationPointProperties;
    end: AnnotationPointProperties;
}
export declare class AnnotationHandleProperties extends BaseProperties {
    fill?: string;
    stroke?: string;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
}
export declare class AnnotationPointProperties extends BaseProperties {
    x?: string | number | Date;
    y?: string | number | Date;
}
export declare class AnnotationFillProperties extends BaseProperties {
    fill?: string;
    fillOpacity?: number;
}
export {};
