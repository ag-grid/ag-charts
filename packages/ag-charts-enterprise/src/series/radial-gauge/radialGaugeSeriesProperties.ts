import { _ModuleSupport } from 'ag-charts-community';
import { Logger, type RequireOptional } from 'ag-charts-core';
import type {
    AgChartLabelFormatterParams,
    AgGradientColorMode,
    AgRadialGaugeItemStylerParams,
    AgRadialGaugeLabelFormatterParams,
    AgRadialGaugeMarkerShape,
    AgRadialGaugeOptions,
    AgRadialGaugeStyle,
    AgRadialGaugeTargetPlacement,
    AgRadialGaugeTooltipRendererParams,
    FontStyle,
    FontWeight,
    Formatter,
    Styler,
} from 'ag-charts-types';

import { CORNER_MODE, FILL_MODE, TARGET_MARKER_SHAPE } from '../gauge-util/properties';
import { GaugeSegmentationProperties } from '../gauge-util/segmentation';
import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const {
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    PropertiesArray,
    AxisLabel,
    TempValidate,
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    NUMBER_ARRAY,
    OBJECT_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    AND,
    LESS_THAN,
    GREATER_THAN,
    Label,
} = _ModuleSupport;

const TARGET_PLACEMENT = UNION(['inside', 'outside', 'middle'], 'a placement');

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
    @TempValidate(NUMBER, { optional: true })
    spacing: number | undefined;
}

export class RadialGaugeTargetProperties extends BaseProperties {
    @TempValidate(STRING, { optional: true })
    text: string | undefined;

    @TempValidate(NUMBER, { optional: true })
    value: number | undefined;

    @TempValidate(TARGET_MARKER_SHAPE, { optional: true })
    shape: AgRadialGaugeMarkerShape | undefined;

    @TempValidate(TARGET_PLACEMENT, { optional: true })
    placement: AgRadialGaugeTargetPlacement | undefined;

    @TempValidate(NUMBER, { optional: true })
    spacing: number | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    size: number | undefined;

    @TempValidate(NUMBER, { optional: true })
    rotation: number | undefined;

    @TempValidate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @TempValidate(RATIO, { optional: true })
    fillOpacity: number | undefined;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke: string | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number | undefined;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity: number | undefined;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash: number[] | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset: number | undefined;

    @TempValidate(OBJECT)
    readonly label = new RadialGaugeDefaultTargetLabelProperties();
}

class RadialGaugeBarProperties extends BaseProperties {
    @TempValidate(BOOLEAN)
    enabled = true;

    @TempValidate(OBJECT_ARRAY)
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @TempValidate(FILL_MODE)
    fillMode: AgGradientColorMode = 'continuous';

    @TempValidate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number = 0;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

class RadialGaugeScaleIntervalProperties extends BaseProperties {
    @TempValidate(NUMBER_ARRAY, { optional: true })
    values?: number[] = undefined;

    @TempValidate(NUMBER, { optional: true })
    step?: number = undefined;

    @TempValidate(NUMBER)
    minSpacing: number = 0;

    @TempValidate(NUMBER)
    maxSpacing: number = 1000;
}

class RadialGaugeScaleLabelProperties extends AxisLabel {}

class RadialGaugeScaleProperties extends BaseProperties {
    @TempValidate(AND(NUMBER, LESS_THAN('max')))
    min: number = 0;

    @TempValidate(AND(NUMBER, GREATER_THAN('min')))
    max: number = 1;

    @TempValidate(OBJECT_ARRAY)
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @TempValidate(FILL_MODE)
    fillMode: AgGradientColorMode = 'continuous';

    @TempValidate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(COLOR_STRING)
    defaultFill: string = 'black';

    @TempValidate(OBJECT)
    readonly interval = new RadialGaugeScaleIntervalProperties();

    @TempValidate(OBJECT)
    readonly label = new RadialGaugeScaleLabelProperties();
}

class RadialGaugeNeedleProperties extends BaseProperties {
    @TempValidate(BOOLEAN)
    enabled = true;

    @TempValidate(RATIO, { optional: true })
    radiusRatio?: number;

    @TempValidate(NUMBER)
    spacing: number = 0;

    @TempValidate(COLOR_STRING)
    fill: string = 'black';

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

class RadialGaugeLabelProperties extends AutoSizedLabel<AgRadialGaugeLabelFormatterParams> {
    @TempValidate(STRING, { optional: true })
    text?: string;
}

class RadialGaugeSecondaryLabelProperties extends AutoSizedSecondaryLabel<AgRadialGaugeLabelFormatterParams> {
    @TempValidate(STRING, { optional: true })
    text?: string;
}

export class RadialGaugeSeriesProperties extends SeriesProperties<AgRadialGaugeOptions> {
    @TempValidate(NUMBER)
    value!: number;

    @TempValidate(NUMBER)
    startAngle: number = 0;

    @TempValidate(NUMBER)
    endAngle: number = 0;

    @TempValidate(OBJECT)
    readonly segmentation = new GaugeSegmentationProperties();

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OBJECT_ARRAY)
    targets = new PropertiesArray<RadialGaugeTargetProperties>(RadialGaugeTargetProperties);

    @TempValidate(OBJECT)
    readonly defaultTarget = new RadialGaugeTargetProperties();

    @TempValidate(RATIO)
    outerRadiusRatio: number = 1;

    @TempValidate(RATIO)
    innerRadiusRatio: number = 1;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    outerRadius: number | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    innerRadius: number | undefined;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(CORNER_MODE)
    cornerMode: 'container' | 'item' = 'container';

    @TempValidate(NUMBER)
    spacing: number = 0;

    @TempValidate(OBJECT)
    readonly scale = new RadialGaugeScaleProperties();

    @TempValidate(OBJECT)
    readonly bar = new RadialGaugeBarProperties();

    @TempValidate(OBJECT)
    readonly needle = new RadialGaugeNeedleProperties();

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRadialGaugeItemStylerParams, AgRadialGaugeStyle>;

    @TempValidate(OBJECT)
    readonly label = new RadialGaugeLabelProperties();

    @TempValidate(OBJECT)
    readonly secondaryLabel = new RadialGaugeSecondaryLabelProperties();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRadialGaugeTooltipRendererParams>();

    override isValid(warningPrefix?: string): boolean {
        if (!super.isValid(warningPrefix)) return false;

        const { outerRadius, innerRadius } = this;
        if ((outerRadius == null) !== (innerRadius == null)) {
            Logger.warnOnce('Either [innerRadius] and [outerRadius] must both be set, or neither can be set.');
            return false;
        }

        return true;
    }
}
