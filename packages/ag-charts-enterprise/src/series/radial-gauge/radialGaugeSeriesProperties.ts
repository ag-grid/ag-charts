import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import type {
    AgChartLabelFormatterParams,
    AgGaugeFillMode,
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
    MarkerShape,
    Styler,
} from 'ag-charts-types';

import { CORNER_MODE, FILL_MODE, TARGET_MARKER_SHAPE } from '../gauge-util/properties';
import { GaugeSegmentationProperties } from '../gauge-util/segmentation';
import { GaugeStopProperties } from '../gauge-util/stops';
import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const {
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    PropertiesArray,
    Validate,
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
} = _ModuleSupport;
const { Label } = _Scene;
const { Logger } = _Util;

const TARGET_PLACEMENT = UNION(['inside', 'outside', 'middle'], 'a placement');

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
    fill: string | _Scene.Gradient | undefined;
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
    value: number;
    text: string | undefined;
    centerX: number;
    centerY: number;
    shape: MarkerShape;
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
    fontFamily: string;
    lineHeight: number | undefined;
    formatter:
        | Formatter<
              AgChartLabelFormatterParams<any> & _ModuleSupport.RequireOptional<AgRadialGaugeLabelFormatterParams>
          >
        | undefined;
};

export class RadialGaugeDefaultTargetLabelProperties extends Label<never> {
    @Validate(NUMBER, { optional: true })
    spacing: number | undefined;
}

export class RadialGaugeTargetProperties extends BaseProperties {
    @Validate(STRING, { optional: true })
    text: string | undefined;

    @Validate(NUMBER, { optional: true })
    value: number | undefined;

    @Validate(TARGET_MARKER_SHAPE, { optional: true })
    shape: AgRadialGaugeMarkerShape | undefined;

    @Validate(TARGET_PLACEMENT, { optional: true })
    placement: AgRadialGaugeTargetPlacement | undefined;

    @Validate(NUMBER, { optional: true })
    spacing: number | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    size: number | undefined;

    @Validate(NUMBER, { optional: true })
    rotation: number | undefined;

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @Validate(RATIO, { optional: true })
    fillOpacity: number | undefined;

    @Validate(COLOR_STRING, { optional: true })
    stroke: string | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number | undefined;

    @Validate(RATIO, { optional: true })
    strokeOpacity: number | undefined;

    @Validate(LINE_DASH, { optional: true })
    lineDash: number[] | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset: number | undefined;

    @Validate(OBJECT)
    readonly label = new RadialGaugeDefaultTargetLabelProperties();
}

export class RadialGaugeBarProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(OBJECT_ARRAY)
    fills = new PropertiesArray<GaugeStopProperties>(GaugeStopProperties);

    @Validate(FILL_MODE)
    fillMode: AgGaugeFillMode = 'continuous';

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number = 0;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class RadialGaugeScaleProperties extends BaseProperties {
    @Validate(OBJECT_ARRAY)
    fills = new PropertiesArray<GaugeStopProperties>(GaugeStopProperties);

    @Validate(FILL_MODE)
    fillMode: AgGaugeFillMode = 'continuous';

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(COLOR_STRING)
    defaultFill: string = 'black';
}

export class RadialGaugeNeedleProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(RATIO, { optional: true })
    radiusRatio?: number | undefined;

    @Validate(NUMBER)
    spacing: number = 0;

    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class RadialGaugeLabelProperties extends AutoSizedLabel<AgRadialGaugeLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;
}

export class RadialGaugeSecondaryLabelProperties extends AutoSizedSecondaryLabel<AgRadialGaugeLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;
}

export class RadialGaugeSeriesProperties extends SeriesProperties<AgRadialGaugeOptions> {
    @Validate(NUMBER)
    value!: number;

    @Validate(OBJECT)
    readonly segmentation = new GaugeSegmentationProperties();

    @Validate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @Validate(OBJECT_ARRAY)
    targets = new PropertiesArray<RadialGaugeTargetProperties>(RadialGaugeTargetProperties);

    @Validate(OBJECT)
    readonly defaultTarget = new RadialGaugeTargetProperties();

    @Validate(RATIO)
    outerRadiusRatio: number = 1;

    @Validate(RATIO)
    innerRadiusRatio: number = 1;

    @Validate(POSITIVE_NUMBER, { optional: true })
    outerRadius: number | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    innerRadius: number | undefined;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(CORNER_MODE)
    cornerMode: 'container' | 'item' = 'container';

    @Validate(NUMBER)
    spacing: number = 0;

    @Validate(OBJECT)
    readonly scale = new RadialGaugeScaleProperties();

    @Validate(OBJECT)
    readonly bar = new RadialGaugeBarProperties();

    @Validate(OBJECT)
    readonly needle = new RadialGaugeNeedleProperties();

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRadialGaugeItemStylerParams<unknown>, AgRadialGaugeStyle>;

    @Validate(OBJECT)
    readonly label = new RadialGaugeLabelProperties();

    @Validate(OBJECT)
    readonly secondaryLabel = new RadialGaugeSecondaryLabelProperties();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRadialGaugeTooltipRendererParams<any>>();

    override isValid(warningPrefix?: string | undefined): boolean {
        if (!super.isValid(warningPrefix)) return false;

        const { outerRadius, innerRadius } = this;
        if ((outerRadius == null) !== (innerRadius == null)) {
            Logger.warnOnce('Either [innerRadius] and [outerRadius] must both be set, or neither can be set.');
            return false;
        }

        return true;
    }
}
