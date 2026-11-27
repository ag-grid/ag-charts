import type { FontStyle, FontWeight, Formatter, TextAlign } from 'ag-charts-community';
import type { AgAnnotationAxisVisibility, AgLineDashName, Padding, PixelSize } from 'ag-charts-types';

// Field groups that datums are built from, apart from `annotationDatum` so that `annotationTypes` can use them.

export interface FillFields {
    fill?: string;
    fillOpacity?: number;
}

export interface StrokeFields {
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
}

export interface LineStyleFields {
    lineDash?: PixelSize[] | AgLineDashName;
    lineDashOffset?: number;
}

export interface FontFields {
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize: number;
    fontFamily: string;
    lineHeight?: number;
    color?: string;
}

export interface AxisLabelFormatterParams {
    readonly value: any;
}

export interface AxisLabelDatum extends StrokeFields, LineStyleFields, FillFields, FontFields {
    enabled?: boolean;
    cornerRadius: number;
    textAlign: TextAlign;
    formatter?: Formatter<AxisLabelFormatterParams>;
    padding?: Padding;
}

/** The styles of the axis labels at an annotation's points. */
export type SelectionAxisLabelStyles = Omit<AxisLabelDatum, 'enabled'>;

export type SelectionAxisShadingStyles = FillFields;

/** When an annotation type shows axis labels and shading, and their styles, which are not saved in its state. */
export interface SelectionAxisStyles {
    visible: AgAnnotationAxisVisibility;
    axisLabel: SelectionAxisLabelStyles;
    axisShading: SelectionAxisShadingStyles;
}
