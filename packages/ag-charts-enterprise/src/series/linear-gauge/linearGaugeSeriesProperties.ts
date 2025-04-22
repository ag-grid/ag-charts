import { _ModuleSupport } from 'ag-charts-community';
import type {
    AgChartLabelFormatterParams,
    AgGradientColorMode,
    AgLinearGaugeLabelPlacement,
    AgLinearGaugeMarkerShape,
    AgLinearGaugeOptions,
    AgLinearGaugeTargetPlacement,
    AgLinearGaugeTooltipRendererParams,
    FontStyle,
    FontWeight,
    Formatter,
    OverflowStrategy,
    TextWrap,
} from 'ag-charts-types';

import { GaugeSegmentationProperties } from '../gauge-util/segmentation';
import { AutoSizedLabel } from '../util/autoSizedLabel';

const { BaseProperties, SeriesTooltip, SeriesProperties, PropertiesArray, Property, Label, AxisLabel } = _ModuleSupport;

export enum NodeDataType {
    Node,
    Target,
}

export type LinearGaugeNodeDatumIndex = { type: NodeDataType.Node } | { type: NodeDataType.Target; index: number };

export interface LinearGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum<LinearGaugeNodeDatumIndex> {
    type: NodeDataType.Node;
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
    fill: string | _ModuleSupport.ShapeColor | undefined;
    horizontalInset: number;
    verticalInset: number;
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

export interface LinearGaugeTargetDatum extends _ModuleSupport.SeriesNodeDatum<LinearGaugeNodeDatumIndex> {
    type: NodeDataType.Target;
    value: number;
    text: string | undefined;
    x: number;
    y: number;
    shape: AgLinearGaugeMarkerShape;
    size: number;
    rotation: number;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    label: LinearGaugeTargetDatumLabel;
}
export type LinearGaugeLabelDatum = {
    placement: AgLinearGaugeLabelPlacement;
    avoidCollisions: boolean;
    spacing: number;
    text: string | undefined;
    value: number;
    fill: string | undefined;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    minimumFontSize: number | undefined;
    fontFamily: string;
    lineHeight: number | undefined;
    wrapping: TextWrap;
    overflowStrategy: OverflowStrategy;
    formatter: Formatter<AgChartLabelFormatterParams<any>> | undefined;
};

class LinearGaugeDefaultTargetLabelProperties extends Label<never> {
    @Property
    spacing: number | undefined;
}

export class LinearGaugeTargetProperties extends BaseProperties {
    @Property
    text: string | undefined;

    @Property
    value: number = 0;

    @Property
    shape: AgLinearGaugeMarkerShape | undefined;

    @Property
    placement: AgLinearGaugeTargetPlacement | undefined;

    @Property
    spacing: number | undefined;

    @Property
    size: number | undefined;

    @Property
    rotation: number | undefined;

    @Property
    fill: string | undefined;

    @Property
    fillOpacity: number | undefined;

    @Property
    stroke: string | undefined;

    @Property
    strokeWidth: number | undefined;

    @Property
    strokeOpacity: number | undefined;

    @Property
    lineDash: number[] | undefined;

    @Property
    lineDashOffset: number | undefined;

    @Property
    readonly label = new LinearGaugeDefaultTargetLabelProperties();
}

class LinearGaugeBarProperties extends BaseProperties {
    @Property
    enabled = true;

    @Property
    thickness: number | undefined;

    @Property
    thicknessRatio: number = 1;

    @Property
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @Property
    fillMode: AgGradientColorMode = 'continuous';

    @Property
    fill: string | undefined;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string = 'black';

    @Property
    strokeWidth: number = 0;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;
}

class LinearGaugeScaleIntervalProperties extends BaseProperties {
    @Property
    values?: number[] = undefined;

    @Property
    step?: number = undefined;

    @Property
    minSpacing: number = 0;

    @Property
    maxSpacing: number = 1000;
}

class LinearGaugeScaleLabelProperties extends AxisLabel {
    @Property
    placement?: 'before' | 'after' = undefined;
}

class LinearGaugeScaleProperties extends BaseProperties {
    @Property
    min: number = 0;

    @Property
    max: number = 1;

    @Property
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @Property
    fillMode: AgGradientColorMode = 'continuous';

    @Property
    fill: string | undefined;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string = 'black';

    @Property
    strokeWidth: number = 0;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    defaultFill: string = 'black';

    @Property
    readonly interval = new LinearGaugeScaleIntervalProperties();

    @Property
    readonly label = new LinearGaugeScaleLabelProperties();
}

export class LinearGaugeLabelProperties extends AutoSizedLabel<unknown> {
    @Property
    text?: string;

    @Property
    placement: AgLinearGaugeLabelPlacement = 'inside-center';

    @Property
    avoidCollisions: boolean = true;
}

export class LinearGaugeSeriesProperties extends SeriesProperties<AgLinearGaugeOptions> {
    @Property
    value: number = 0;

    @Property
    readonly segmentation = new GaugeSegmentationProperties();

    @Property
    defaultColorRange: string[] = [];

    @Property
    targets = new PropertiesArray<LinearGaugeTargetProperties>(LinearGaugeTargetProperties);

    @Property
    defaultTarget = new LinearGaugeTargetProperties();

    @Property
    defaultScale = new LinearGaugeScaleProperties();

    @Property
    direction: 'horizontal' | 'vertical' = 'vertical';

    @Property
    thickness: number = 1;

    @Property
    cornerRadius: number = 0;

    @Property
    cornerMode: 'container' | 'item' = 'container';

    @Property
    margin: number = 0;

    @Property
    readonly scale = new LinearGaugeScaleProperties();

    @Property
    readonly bar = new LinearGaugeBarProperties();

    @Property
    readonly label = new LinearGaugeLabelProperties();

    @Property
    readonly tooltip = new SeriesTooltip<AgLinearGaugeTooltipRendererParams>();
}
