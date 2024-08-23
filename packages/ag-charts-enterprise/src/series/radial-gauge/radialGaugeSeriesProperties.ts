import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type {
    AgChartLabelFormatterParams,
    AgRadialGaugeSeriesItemStylerParams,
    AgRadialGaugeSeriesLabelFormatterParams,
    AgRadialGaugeSeriesOptions,
    AgRadialGaugeSeriesStyle,
    AgRadialGaugeSeriesTooltipRendererParams,
    FontStyle,
    FontWeight,
    Formatter,
    MarkerShape,
    Styler,
} from 'ag-charts-types';

import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

export enum LabelType {
    Primary = 'primary',
    Secondary = 'secondary',
}

export interface AgRadialGaugeColorStopDatum {
    stop: number;
    color: string;
}

export interface RadialGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum {
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

export interface RadialGaugeTargetDatum {
    index: number;
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
              AgChartLabelFormatterParams<any> & _ModuleSupport.RequireOptional<AgRadialGaugeSeriesLabelFormatterParams>
          >
        | undefined;
};

const {
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    PropertiesArray,
    Validate,
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    MARKER_SHAPE,
    NUMBER,
    OBJECT_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

export class RadialGaugeTargetProperties extends BaseProperties {
    @Validate(NUMBER)
    value: number = 0;

    @Validate(MARKER_SHAPE, { optional: true })
    shape: MarkerShape | undefined;

    @Validate(STRING)
    placement: 'inner' | 'outer' | 'middle' = 'middle';

    @Validate(NUMBER)
    spacing: number = 0;

    @Validate(POSITIVE_NUMBER)
    size: number = 10;

    @Validate(NUMBER)
    rotation: number = 0;

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

export class RadialGaugeStopProperties extends BaseProperties {
    @Validate(NUMBER, { optional: true })
    stop?: number;

    @Validate(COLOR_STRING)
    color: string = 'black';
}

export class RadialGaugeBarProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

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
}

export class RadialGaugeBackgroundProperties extends BaseProperties {
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

export class RadialGaugeLabelProperties extends AutoSizedLabel<AgRadialGaugeSeriesLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;
}

export class RadialGaugeSecondaryLabelProperties extends AutoSizedSecondaryLabel<AgRadialGaugeSeriesLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;
}

export class RadialGaugeSeriesProperties extends SeriesProperties<AgRadialGaugeSeriesOptions> {
    @Validate(NUMBER)
    value: number = 0;

    @Validate(OBJECT_ARRAY)
    colorStops = new PropertiesArray<RadialGaugeStopProperties>(RadialGaugeStopProperties);

    @Validate(OBJECT_ARRAY)
    targets = new PropertiesArray<RadialGaugeTargetProperties>(RadialGaugeTargetProperties);

    @Validate(RATIO)
    outerRadiusRatio: number = 1;

    @Validate(RATIO)
    innerRadiusRatio: number = 1;

    @Validate(POSITIVE_NUMBER)
    sectorSpacing: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(STRING) // FIXME
    appearance: 'continuous' | 'segmented' = 'continuous';

    @Validate(STRING) // FIXME
    cornerMode: 'container' | 'item' = 'container';

    @Validate(NUMBER)
    margin: number = 0;

    @Validate(OBJECT)
    readonly background = new RadialGaugeBackgroundProperties();

    @Validate(OBJECT)
    readonly bar = new RadialGaugeBarProperties();

    @Validate(OBJECT)
    readonly needle = new RadialGaugeNeedleProperties();

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRadialGaugeSeriesItemStylerParams<unknown>, AgRadialGaugeSeriesStyle>;

    @Validate(OBJECT)
    readonly label = new RadialGaugeLabelProperties();

    @Validate(OBJECT)
    readonly secondaryLabel = new RadialGaugeSecondaryLabelProperties();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRadialGaugeSeriesTooltipRendererParams<any>>();
}
