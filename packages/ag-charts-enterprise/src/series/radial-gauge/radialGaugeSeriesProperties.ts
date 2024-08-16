import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type {
    AgRadialGaugeSeriesItemStylerParams,
    AgRadialGaugeSeriesLabelFormatterParams,
    AgRadialGaugeSeriesOptions,
    AgRadialGaugeSeriesStyle,
    AgRadialGaugeSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

const {
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    NUMBER_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} = _ModuleSupport;
const { Label } = _Scene;

export class RadialGaugeBackgroundProperties extends BaseProperties {
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

// TODO: Use AutoSized Label
export class RadialGaugeLabelProperties extends Label<AgRadialGaugeSeriesLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineHeight?: number;
}

export class RadialGaugeSecondaryLabelProperties extends Label<AgRadialGaugeSeriesLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineHeight?: number;
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

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(STRING) // FIXME
    cornerRadiusMode: 'container' | 'item' = 'container';

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
