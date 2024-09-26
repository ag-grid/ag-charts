import type {
    AgConeFunnelSeriesLabelFormatterParams,
    AgConeFunnelSeriesOptions,
    AgConeFunnelSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { BaseFunnelProperties } from '../funnel/baseFunnelSeriesProperties';

const { Label } = _Scene;
const {
    AbstractBarSeriesProperties,
    SeriesTooltip,
    Validate,
    COLOR_STRING_ARRAY,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class ConeFunnelSeriesLabel extends Label<AgConeFunnelSeriesLabelFormatterParams> {
    @Validate(STRING)
    placement: string | undefined;

    @Validate(POSITIVE_NUMBER)
    spacing: number = 0;
}

export class ConeFunnelProperties
    extends AbstractBarSeriesProperties<AgConeFunnelSeriesOptions>
    implements BaseFunnelProperties<AgConeFunnelSeriesOptions>
{
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    xName: string | undefined;

    @Validate(STRING, { optional: true })
    yName: string | undefined;

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

    @Validate(OBJECT)
    readonly label = new ConeFunnelSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgConeFunnelSeriesTooltipRendererParams<unknown>>();
}
