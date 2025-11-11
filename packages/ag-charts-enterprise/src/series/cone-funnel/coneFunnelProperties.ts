import type {
    AgColorType,
    AgConeFunnelSeriesLabelFormatterParams,
    AgConeFunnelSeriesOptions,
    AgConeFunnelSeriesStyle,
    AgConeFunnelSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Property } from 'ag-charts-core';

import type { BaseFunnelProperties } from '../funnel/baseFunnelSeriesProperties';

const { Label, AbstractBarSeriesProperties, makeSeriesTooltip, AxisLabel } = _ModuleSupport;
class ConeFunnelSeriesLabel extends Label<AgConeFunnelSeriesLabelFormatterParams> {
    @Property
    placement: string | undefined;

    @Property
    spacing: number = 0;
}

class ConeFunnelSeriesStageLabel extends AxisLabel {
    @Property
    placement?: string;
}

export class ConeFunnelProperties
    extends AbstractBarSeriesProperties<AgConeFunnelSeriesOptions>
    implements BaseFunnelProperties<AgConeFunnelSeriesOptions>
{
    @Property
    stageKey!: string;

    @Property
    valueKey!: string;

    @Property
    fills: AgColorType[] = [];

    @Property
    fillOpacity: number = 1;

    @Property
    strokes: string[] = [];

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    readonly label = new ConeFunnelSeriesLabel();

    @Property
    readonly stageLabel = new ConeFunnelSeriesStageLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgConeFunnelSeriesTooltipRendererParams<unknown>>();

    getStyle(index: number): Required<AgConeFunnelSeriesStyle> & { opacity: number } {
        const { fills, strokes, fillOpacity, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        return {
            fill: fills[index],
            fillOpacity,
            stroke: strokes[index],
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            opacity: 1,
        };
    }
}
