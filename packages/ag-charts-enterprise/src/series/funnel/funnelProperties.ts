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
    FillImageDefaults,
    Label,
    DropShadow,
    AbstractBarSeriesProperties,
    BaseProperties,
    SeriesTooltip,
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
    readonly tooltip = new SeriesTooltip<AgFunnelSeriesTooltipRendererParams<unknown>>();
}
