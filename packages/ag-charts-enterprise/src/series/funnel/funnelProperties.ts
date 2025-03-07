import type {
    AgFillType,
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesOptions,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import type { BaseFunnelProperties } from './baseFunnelSeriesProperties';

const {
    Label,
    DropShadow,
    AbstractBarSeriesProperties,
    BaseProperties,
    SeriesTooltip,
    AxisLabel,
    TempValidate,
    UNION,
    BOOLEAN,
    OR,
    ARRAY_OF,
    COLOR_GRADIENT,
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

class FunnelSeriesStageLabel extends AxisLabel {
    @TempValidate(UNION(['before', 'after'], 'a placement'))
    placement?: string;
}

class FunnelDropOff extends BaseProperties {
    @TempValidate(BOOLEAN)
    enabled: boolean = true;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING), { optional: true })
    fill: AgFillType | undefined = undefined;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke: string | undefined;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class FunnelProperties
    extends AbstractBarSeriesProperties<AgFunnelSeriesOptions>
    implements BaseFunnelProperties<AgFunnelSeriesOptions>
{
    @TempValidate(STRING)
    stageKey!: string;

    @TempValidate(STRING)
    valueKey!: string;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OR(ARRAY_OF(COLOR_GRADIENT), COLOR_STRING_ARRAY))
    fills: AgFillType[] = [];

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING_ARRAY)
    strokes: string[] = [];

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(RATIO)
    spacingRatio: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;

    @TempValidate(OBJECT)
    readonly dropOff = new FunnelDropOff();

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow().set({ enabled: false });

    @TempValidate(OBJECT)
    readonly label = new FunnelSeriesLabel();

    @TempValidate(OBJECT)
    readonly stageLabel = new FunnelSeriesStageLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>();
}
