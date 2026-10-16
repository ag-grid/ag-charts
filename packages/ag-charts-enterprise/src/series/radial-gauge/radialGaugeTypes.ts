import type { _ModuleSupport } from 'ag-charts-community';
import type {
    NormalisedGaugeSeriesStyle,
    NormalisedRadialGaugeLabelOptions,
    TextBoxingProperties,
} from 'ag-charts-core';
import type {
    AgChartLabelCollisionOptions,
    AgNumericValue,
    AgRadialGaugeMarkerShape,
    FontStyle,
    FontWeight,
    PaddingOptions,
} from 'ag-charts-types';

import type { GaugeTargetDatumLabel } from '../gauge-util/labelPlacement';

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
    label: GaugeTargetDatumLabel;
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
    truncate: boolean;
    collision: AgChartLabelCollisionOptions | undefined;
    maxWidth?: number;
    maxHeight?: number;
    formatter: NormalisedRadialGaugeLabelOptions['formatter'];
    box: TextBoxingProperties;
    boxExtent: Required<PaddingOptions>;
};
