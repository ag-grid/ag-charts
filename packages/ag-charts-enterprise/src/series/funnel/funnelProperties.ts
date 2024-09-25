import type {
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesOptions,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { Label } = _Scene;
const {
    AbstractBarSeriesProperties,
    BaseProperties,
    SeriesTooltip,
    Validate,
    BOOLEAN,
    COLOR_STRING_ARRAY,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class FunnelSeriesLabel extends Label<AgFunnelSeriesLabelFormatterParams> {}

export class FunnelConnector extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke: string | undefined;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class FunnelProperties extends AbstractBarSeriesProperties<AgFunnelSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = [];

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = [];

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;

    @Validate(OBJECT)
    readonly connector = new FunnelConnector();

    @Validate(OBJECT)
    readonly label = new FunnelSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>();
}
