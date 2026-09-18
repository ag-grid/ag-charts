import type { _ModuleSupport } from 'ag-charts-community';
import type { NormalisedGaugeSeriesStyle, NormalisedRadialGaugeLabelOptions } from 'ag-charts-core';
import type { AgNumericValue, AgRadialGaugeMarkerShape, FontStyle, FontWeight } from 'ag-charts-types';

export enum NodeDataType {
    Node,
    Target,
}

export enum LabelType {
    Primary = 'primary',
    Secondary = 'secondary',
}

export interface RadialGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    type: NodeDataType.Node;
    readonly itemId: 'value' | 'scale' | `value-${number}` | `scale-${number}`;
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipStartAngle: number | undefined;
    clipEndAngle: number | undefined;
    startCornerRadius: number;
    endCornerRadius: number;
    style: NormalisedGaugeSeriesStyle;
}

export interface RadialGaugeTargetDatumLabel {
    offsetX: number;
    offsetY: number;
    fill: string | undefined;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    fontFamily: string;
    lineHeight: number | undefined;
}

export interface RadialGaugeTargetDatum extends _ModuleSupport.SeriesNodeDatum {
    type: NodeDataType.Target;
    readonly itemId: `target-${number}`;
    value: AgNumericValue;
    text: string | undefined;
    centerX: number;
    centerY: number;
    shape: AgRadialGaugeMarkerShape;
    radius: number;
    angle: number;
    size: number;
    rotation: number;
    label: RadialGaugeTargetDatumLabel;
    style: NormalisedGaugeSeriesStyle;
}

export type RadialGaugeLabelDatum = {
    label: LabelType;
    centerX: number;
    centerY: number;
    text: string | undefined;
    value: AgNumericValue;
    fill: string | undefined;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    minimumFontSize: number | undefined;
    fontFamily: string;
    lineHeight: number | undefined;
    formatter: NormalisedRadialGaugeLabelOptions['formatter'];
};
