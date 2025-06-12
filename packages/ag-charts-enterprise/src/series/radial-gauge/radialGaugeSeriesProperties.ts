import { _ModuleSupport } from 'ag-charts-community';
import { type RequireOptional } from 'ag-charts-core';
import type {
    AgChartLabelFormatterParams,
    AgGradientColorMode,
    AgRadialGaugeLabelFormatterParams,
    AgRadialGaugeMarkerShape,
    AgRadialGaugeOptions,
    AgRadialGaugeTargetPlacement,
    AgRadialGaugeTooltipRendererParams,
    FontStyle,
    FontWeight,
    Formatter,
} from 'ag-charts-types';

import { GaugeSegmentationProperties } from '../gauge-util/segmentation';
import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const { BaseProperties, makeSeriesTooltip, SeriesProperties, PropertiesArray, AxisLabel, Property, Label } =
    _ModuleSupport;

export enum NodeDataType {
    Node,
    Target,
}

export enum LabelType {
    Primary = 'primary',
    Secondary = 'secondary',
}

export type RadialGaugeNodeDatumIndex = { type: NodeDataType.Node } | { type: NodeDataType.Target; index: number };

export interface RadialGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum<RadialGaugeNodeDatumIndex> {
    type: NodeDataType.Node;
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
    fill: string | _ModuleSupport.ShapeColor | undefined;
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

export interface RadialGaugeTargetDatum extends _ModuleSupport.SeriesNodeDatum<RadialGaugeNodeDatumIndex> {
    type: NodeDataType.Target;
    value: number;
    text: string | undefined;
    centerX: number;
    centerY: number;
    shape: AgRadialGaugeMarkerShape;
    radius: number;
    angle: number;
    size: number;
    rotation: number;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    label: RadialGaugeTargetDatumLabel;
}

export type RadialGaugeLabelDatum = {
    label: LabelType;
    centerX: number;
    centerY: number;
    text: string | undefined;
    value: number;
    fill: string | undefined;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    minimumFontSize: number | undefined;
    fontFamily: string;
    lineHeight: number | undefined;
    formatter:
        | Formatter<AgChartLabelFormatterParams<any> & RequireOptional<AgRadialGaugeLabelFormatterParams>>
        | undefined;
};

class RadialGaugeDefaultTargetLabelProperties extends Label<never> {
    @Property
    spacing: number | undefined;
}

export class RadialGaugeTargetProperties extends BaseProperties {
    @Property
    text: string | undefined;

    @Property
    value: number | undefined;

    @Property
    shape: AgRadialGaugeMarkerShape | undefined;

    @Property
    placement: AgRadialGaugeTargetPlacement | undefined;

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
    readonly label = new RadialGaugeDefaultTargetLabelProperties();
}

class RadialGaugeBarProperties extends BaseProperties {
    @Property
    enabled = true;

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

class RadialGaugeScaleIntervalProperties extends BaseProperties {
    @Property
    values?: number[] = undefined;

    @Property
    step?: number = undefined;

    @Property
    minSpacing: number = 0;

    @Property
    maxSpacing: number = 1000;
}

class RadialGaugeScaleLabelProperties extends AxisLabel {}

class RadialGaugeScaleProperties extends BaseProperties {
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
    readonly interval = new RadialGaugeScaleIntervalProperties();

    @Property
    readonly label = new RadialGaugeScaleLabelProperties();
}

class RadialGaugeNeedleProperties extends BaseProperties {
    @Property
    enabled = true;

    @Property
    radiusRatio?: number;

    @Property
    spacing: number = 0;

    @Property
    fill: string = 'black';

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

class RadialGaugeLabelProperties extends AutoSizedLabel<AgRadialGaugeLabelFormatterParams> {
    @Property
    text?: string;
}

class RadialGaugeSecondaryLabelProperties extends AutoSizedSecondaryLabel<AgRadialGaugeLabelFormatterParams> {
    @Property
    text?: string;
}

export class RadialGaugeSeriesProperties extends SeriesProperties<AgRadialGaugeOptions> {
    @Property
    value!: number;

    @Property
    startAngle: number = 0;

    @Property
    endAngle: number = 0;

    @Property
    readonly segmentation = new GaugeSegmentationProperties();

    @Property
    defaultColorRange: string[] = [];

    @Property
    targets = new PropertiesArray<RadialGaugeTargetProperties>(RadialGaugeTargetProperties);

    @Property
    readonly defaultTarget = new RadialGaugeTargetProperties();

    @Property
    outerRadiusRatio: number = 1;

    @Property
    innerRadiusRatio: number = 1;

    @Property
    outerRadius: number | undefined;

    @Property
    innerRadius: number | undefined;

    @Property
    cornerRadius: number = 0;

    @Property
    cornerMode: 'container' | 'item' = 'container';

    @Property
    spacing: number = 0;

    @Property
    readonly scale = new RadialGaugeScaleProperties();

    @Property
    readonly bar = new RadialGaugeBarProperties();

    @Property
    readonly needle = new RadialGaugeNeedleProperties();

    @Property
    readonly label = new RadialGaugeLabelProperties();

    @Property
    readonly secondaryLabel = new RadialGaugeSecondaryLabelProperties();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRadialGaugeTooltipRendererParams>();
}
