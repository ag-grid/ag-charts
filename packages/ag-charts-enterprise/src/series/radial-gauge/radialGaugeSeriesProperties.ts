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
    fill: string;
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
    COLOR_STRING_ARRAY,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    MARKER_SHAPE,
    NUMBER_ARRAY,
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

    @Validate(RATIO, { optional: true })
    radiusRatio: number | undefined;

    @Validate(RATIO)
    sizeRatio: number = 0.2;

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

    @Validate(COLOR_STRING, { optional: true })
    color?: string;
}

export class RadialGaugeForegroundProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colorRange?: string[];

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

export class RadialGaugeBackgroundProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colorRange?: string[];

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

    @Validate(NUMBER_ARRAY)
    range: number[] = [0, 1];

    @Validate(OBJECT_ARRAY)
    colorStops = new PropertiesArray<RadialGaugeStopProperties>(RadialGaugeStopProperties);

    @Validate(OBJECT_ARRAY)
    targets = new PropertiesArray<RadialGaugeTargetProperties>(RadialGaugeTargetProperties);

    @Validate(NUMBER)
    startAngle: number = 0.75 * Math.PI;

    @Validate(NUMBER)
    endAngle: number = 2.25 * Math.PI;

    @Validate(RATIO)
    outerRadiusRatio: number = 1;

    @Validate(RATIO)
    innerRadiusRatio: number = 1;

    @Validate(POSITIVE_NUMBER)
    sectorSpacing: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(STRING) // FIXME
    itemMode: 'continuous' | 'segmented' = 'continuous';

    @Validate(STRING) // FIXME
    cornerMode: 'container' | 'item' = 'container';

    @Validate(NUMBER)
    padding: number = 0;

    @Validate(OBJECT)
    readonly needle = new RadialGaugeNeedleProperties();

    @Validate(OBJECT)
    readonly foreground = new RadialGaugeForegroundProperties();

    @Validate(OBJECT)
    readonly background = new RadialGaugeBackgroundProperties();

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgRadialGaugeSeriesItemStylerParams<unknown>, AgRadialGaugeSeriesStyle>;

    @Validate(OBJECT)
    readonly label = new RadialGaugeLabelProperties();

    @Validate(OBJECT)
    readonly secondaryLabel = new RadialGaugeSecondaryLabelProperties();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgRadialGaugeSeriesTooltipRendererParams<any>>();
}
