import type { AgAnnotationLineStyleType, _ModuleSupport, _Scene } from 'ag-charts-community';

export type Constructor<T = object> = new (...args: any[]) => T;

export enum AnnotationType {
    // Lines
    Line = 'line',
    HorizontalLine = 'horizontal-line',
    VerticalLine = 'vertical-line',

    // Channels
    DisjointChannel = 'disjoint-channel',
    ParallelChannel = 'parallel-channel',

    // Texts
    Callout = 'callout',
    Comment = 'comment',
    Note = 'note',
    Text = 'text',

    // Shapes
    Arrow = 'arrow',
    ArrowUp = 'arrow-up',
    ArrowDown = 'arrow-down',

    // Measurers
    DateRange = 'date-range',
    PriceRange = 'price-range',
    DatePriceRange = 'date-price-range',
    QuickDatePriceRange = 'quick-date-price-range',
}

export type TextualAnnotationType =
    | AnnotationType.Callout
    | AnnotationType.Comment
    | AnnotationType.Note
    | AnnotationType.Text;

export type LineAnnotationType =
    | AnnotationType.Line
    | AnnotationType.HorizontalLine
    | AnnotationType.VerticalLine
    | AnnotationType.Arrow;

export type ChannelAnnotationType = AnnotationType.DisjointChannel | AnnotationType.ParallelChannel;

export type MeasurerAnnotationType =
    | AnnotationType.DateRange
    | AnnotationType.PriceRange
    | AnnotationType.DatePriceRange
    | AnnotationType.QuickDatePriceRange;

export type EphemeralAnnotationType = AnnotationType.QuickDatePriceRange;

export type HasColorAnnotationType = AnnotationType;
export type HasLineStyleAnnotationType = Exclude<
    LineAnnotationType | ChannelAnnotationType | MeasurerAnnotationType,
    EphemeralAnnotationType
>;
export type HasLineTextAnnotationType = Exclude<
    LineAnnotationType | ChannelAnnotationType | MeasurerAnnotationType,
    EphemeralAnnotationType
>;
export type HasFontSizeAnnotationType = Exclude<
    | Exclude<TextualAnnotationType, AnnotationType.Note>
    | LineAnnotationType
    | ChannelAnnotationType
    | MeasurerAnnotationType,
    EphemeralAnnotationType
>;

export const ANNOTATION_TYPES = Object.values(AnnotationType);
export const ANNOTATION_BUTTONS = [
    // Lines
    AnnotationType.Line,
    AnnotationType.HorizontalLine,
    AnnotationType.VerticalLine,

    // Channels
    AnnotationType.DisjointChannel,
    AnnotationType.ParallelChannel,

    // Texts
    AnnotationType.Callout,
    AnnotationType.Comment,
    AnnotationType.Note,
    AnnotationType.Text,

    // Shapes
    AnnotationType.Arrow,
    AnnotationType.ArrowUp,
    AnnotationType.ArrowDown,
] as const;
export const ANNOTATION_BUTTON_GROUPS = ['line-menu', 'text-menu', 'shape-menu', 'measurer-menu'] as const;

export function stringToAnnotationType(value: string) {
    for (const t of ANNOTATION_TYPES) {
        if (t === value) return t;
    }
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x?: number | string | Date;
    y?: number;
}

export interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface AnnotationAxisContext
    extends Pick<
        _ModuleSupport.AxisContext,
        | 'continuous'
        | 'direction'
        | 'position'
        | 'scale'
        | 'scaleInvert'
        | 'scaleInvertNearest'
        | 'scaleValueFormatter'
        | 'attachLabel'
        | 'inRange'
    > {
    bounds: _Scene.BBox;
    labelPadding: number;
}

export type AnnotationContext = {
    seriesRect: _Scene.BBox;
    xAxis: AnnotationAxisContext;
    yAxis: AnnotationAxisContext;
};

export type AnnotationOptionsColorPickerType = 'line-color' | 'fill-color' | 'text-color';

export type AnnotationLineStyle = {
    type?: AgAnnotationLineStyleType;
    strokeWidth?: number;
};

export type LineTextAlignment = 'left' | 'center' | 'right';
export type LineTextPosition = 'top' | 'center' | 'bottom';
export type ChannelTextPosition = 'top' | 'inside' | 'bottom';
