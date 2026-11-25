import type { FontStyle, FontWeight, Formatter, TextAlign } from 'ag-charts-community';
import type { AgAnnotationAxisVisibility, AgLineDashName, Padding, PixelSize } from 'ag-charts-types';

// The field groups that datums are built from. They live apart from `annotationDatum` so that `annotationTypes` can
// refer to them without a cycle.

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

/** The axis labels of an annotation's points, which `annotations.axisLabel` and its per-axis overrides configure. */
export interface SelectionAxisLabelStyles extends Omit<AxisLabelDatum, 'enabled'> {
    visible: AgAnnotationAxisVisibility;
}

export interface SelectionAxisShadingStyles extends FillFields {
    visible: AgAnnotationAxisVisibility;
}

/** The labels and shading that annotations show on one axis. */
export interface SelectionAxisStyles {
    axisLabel: SelectionAxisLabelStyles;
    axisShading: SelectionAxisShadingStyles;
}

/** The labels and shading that annotations show on each axis, which are not options of the annotations themselves. */
export interface SelectionAxesStyles {
    x: SelectionAxisStyles;
    y: SelectionAxisStyles;
}
