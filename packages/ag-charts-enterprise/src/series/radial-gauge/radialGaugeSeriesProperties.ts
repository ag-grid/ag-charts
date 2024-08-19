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
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    NUMBER_ARRAY,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} = _ModuleSupport;

export class RadialGaugeForegroundProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

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

    @Validate(NUMBER)
    startAngle: number = 0.75 * Math.PI;

    @Validate(NUMBER)
    endAngle: number = 2.25 * Math.PI;

    @Validate(RATIO)
    innerRadiusRatio: number = 0.8;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(STRING) // FIXME
    cornerRadiusMode: 'container' | 'item' = 'container';

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
