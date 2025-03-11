import type {
    AgConeFunnelSeriesLabelFormatterParams,
    AgConeFunnelSeriesOptions,
    AgConeFunnelSeriesTooltipRendererParams,
    AgFillType,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import type { BaseFunnelProperties } from '../funnel/baseFunnelSeriesProperties';

const {
    Label,
    AbstractBarSeriesProperties,
    SeriesTooltip,
    AxisLabel,
    TempValidate,
    UNION,
    ARRAY_OF,
    OR,
    COLOR_GRADIENT,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class ConeFunnelSeriesLabel extends Label<AgConeFunnelSeriesLabelFormatterParams> {
    @TempValidate(UNION(['before', 'middle', 'after'], 'a placement'))
    placement: string | undefined;

    @TempValidate(POSITIVE_NUMBER)
    spacing: number = 0;
}

class ConeFunnelSeriesStageLabel extends AxisLabel {
    @TempValidate(UNION(['before', 'after'], 'a placement'))
    placement?: string;
}

export class ConeFunnelProperties
    extends AbstractBarSeriesProperties<AgConeFunnelSeriesOptions>
    implements BaseFunnelProperties<AgConeFunnelSeriesOptions>
{
    @TempValidate(STRING)
    stageKey!: string;

    @TempValidate(STRING)
    valueKey!: string;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_STRING)))
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

    @TempValidate(OBJECT)
    readonly label = new ConeFunnelSeriesLabel();

    @TempValidate(OBJECT)
    readonly stageLabel = new ConeFunnelSeriesStageLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgConeFunnelSeriesTooltipRendererParams<unknown>>();
}
