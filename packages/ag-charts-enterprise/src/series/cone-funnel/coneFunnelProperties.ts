import type {
    AgConeFunnelSeriesLabelFormatterParams,
    AgConeFunnelSeriesLabelPlacement,
    AgConeFunnelSeriesLabelPlacementAlias,
    AgConeFunnelSeriesOptions,
    AgConeFunnelSeriesStyle,
    AgConeFunnelSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';
import { Property } from 'ag-charts-core';

import type { BaseFunnelProperties } from '../funnel/baseFunnelSeriesProperties';

const { Label, LabelPlacementStyle, AbstractBarSeriesProperties, makeSeriesTooltip, SeriesLabelProperties } =
    _ModuleSupport;
class ConeFunnelSeriesLabel extends Label<AgConeFunnelSeriesLabelFormatterParams> {
    @Property
    placement:
        | AgConeFunnelSeriesLabelPlacement
        | AgConeFunnelSeriesLabelPlacementAlias
        | (AgConeFunnelSeriesLabelPlacement | AgConeFunnelSeriesLabelPlacementAlias)[]
        | undefined;

    @Property
    spacing: number = 0;

    // Every cone funnel placement is outside the divider, so no placement styles are exposed; the
    // empty defaults leave the shared bar-label helpers on the label's own style.
    readonly insideStyle = new LabelPlacementStyle();

    readonly outsideStyle = new LabelPlacementStyle();
}

class ConeFunnelSeriesStageLabel extends SeriesLabelProperties {
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
    fills: InternalAgColorType[] = [];

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
