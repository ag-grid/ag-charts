import type {
    AgColorType,
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesOptions,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

import type { BaseFunnelProperties } from './baseFunnelSeriesProperties';

const {
    FillGradientDefaults,
    FillPatternDefaults,
    Label,
    DropShadow,
    AbstractBarSeriesProperties,
    BaseProperties,
    SeriesTooltip,
    AxisLabel,
    TempValidate,
    UNION,
    BOOLEAN,
    ARRAY_OF,
    OR,
    COLOR_GRADIENT,
    COLOR_STRING_ARRAY,
    COLOR_PATTERN,
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

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN), { optional: true })
    fill: InternalAgColorType | undefined = undefined;

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

    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_PATTERN, COLOR_STRING)))
    fills: AgColorType[] = [];

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(OBJECT)
    readonly fillPatternDefaults = new FillPatternDefaults();

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
