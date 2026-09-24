import type { _ModuleSupport } from 'ag-charts-community';
import type {
    NormalisedGaugeSeriesStyle,
    NormalisedLinearGaugeLabelOptions,
    NormalisedTextOrSegments,
} from 'ag-charts-core';
import type {
    AgLinearGaugeLabelPlacement,
    AgLinearGaugeMarkerShape,
    AgNumericValue,
    FontStyle,
    FontWeight,
    OverflowStrategy,
    TextWrap,
} from 'ag-charts-types';

export enum NodeDataType {
    Node,
    Target,
}

export interface LinearGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    type: NodeDataType.Node;
    readonly itemId: 'value' | 'scale' | `value-${number}` | `scale-${number}`;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    clipX0: number | undefined;
    clipY0: number | undefined;
    clipX1: number | undefined;
    clipY1: number | undefined;
    topLeftCornerRadius: number;
    topRightCornerRadius: number;
    bottomRightCornerRadius: number;
    bottomLeftCornerRadius: number;
    horizontalInset: number;
    verticalInset: number;
    style: NormalisedGaugeSeriesStyle;
}

export interface LinearGaugeTargetDatumLabel {
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

export interface LinearGaugeTargetDatum extends _ModuleSupport.SeriesNodeDatum {
    type: NodeDataType.Target;
    readonly itemId: `target-${number}`;
    value: AgNumericValue;
    text: string | undefined;
    x: number;
    y: number;
    shape: AgLinearGaugeMarkerShape;
    size: number;
    rotation: number;
    label: LinearGaugeTargetDatumLabel;
    style: NormalisedGaugeSeriesStyle;
}

export interface LinearGaugeLabelDatum extends _ModuleSupport.SeriesNodeDatum {
    placement: AgLinearGaugeLabelPlacement;
    avoidCollisions: boolean;
    spacing: number;
    text: NormalisedTextOrSegments | undefined;
    value: AgNumericValue;
    fill: string | undefined;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    minimumFontSize: number | undefined;
    fontFamily: string;
    lineHeight: number | undefined;
    wrapping: TextWrap;
    overflowStrategy: OverflowStrategy;
    formatter: NormalisedLinearGaugeLabelOptions['formatter'];
}
