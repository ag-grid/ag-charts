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
import type { InternalAgColorType, RequireOptional } from 'ag-charts-core';

import type { BaseFunnelProperties } from './baseFunnelSeriesProperties';

const {
    FillGradientDefaults,
    FillPatternDefaults,
    FillImageDefaults,
    Label,
    DropShadow,
    AbstractBarSeriesProperties,
    BaseProperties,
    makeSeriesTooltip,
    AxisLabel,
    Property,
} = _ModuleSupport;

class FunnelSeriesLabel extends Label<AgFunnelSeriesLabelFormatterParams> {}

class FunnelSeriesStageLabel extends AxisLabel {
    @Property
    placement?: string;
}

class FunnelDropOff extends BaseProperties {
    @Property
    enabled: boolean = true;

    @Property
    fill: InternalAgColorType | undefined = undefined;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string | undefined;

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    getStyle(): RequireOptional<AgFunnelSeriesStyle> & { opacity: number } {
        const { fill, stroke, fillOpacity, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            opacity: 1,
        };
    }
}

export class FunnelProperties
    extends AbstractBarSeriesProperties<AgFunnelSeriesOptions>
    implements BaseFunnelProperties<AgFunnelSeriesOptions>
{
    @Property
    stageKey!: string;

    @Property
    valueKey!: string;

    @Property
    fills: AgColorType[] = [];

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

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
    spacingRatio: number = 0;

    @Property
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;

    @Property
    readonly dropOff = new FunnelDropOff();

    @Property
    readonly shadow = new DropShadow().set({ enabled: false });

    @Property
    readonly label = new FunnelSeriesLabel();

    @Property
    readonly stageLabel = new FunnelSeriesStageLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>();

    getStyle(index: number): Required<AgFunnelSeriesStyle> & { opacity: number } {
        const { fills, strokes, fillOpacity, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        return {
            fill: fills[index % fills.length],
            fillOpacity,
            stroke: strokes[index % strokes.length],
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            opacity: 1,
        };
    }
}
