import type {
    AgColorType,
    AgPyramidSeriesItemStylerParams,
    AgPyramidSeriesLabelFormatterParams,
    AgPyramidSeriesOptions,
    AgPyramidSeriesStyle,
    AgPyramidSeriesTooltipRendererParams,
    Direction,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const { SeriesProperties, FillGradientDefaults, FillPatternDefaults, SeriesTooltip, Property, Label, DropShadow } =
    _ModuleSupport;

class PyramidSeriesLabel extends Label<AgPyramidSeriesLabelFormatterParams> {}

class PyramidSeriesStageLabel extends Label<AgPyramidSeriesLabelFormatterParams> {
    @Property
    spacing: number = 0;

    @Property
    placement?: string;
}

export class PyramidProperties extends SeriesProperties<AgPyramidSeriesOptions> {
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
    direction: Direction = 'vertical';

    @Property
    reverse?: boolean = undefined;

    @Property
    spacing: number = 0;

    @Property
    aspectRatio?: number = undefined;

    @Property
    itemStyler?: Styler<AgPyramidSeriesItemStylerParams<unknown>, AgPyramidSeriesStyle>;

    @Property
    readonly shadow = new DropShadow().set({ enabled: false });

    @Property
    readonly label = new PyramidSeriesLabel();

    @Property
    readonly stageLabel = new PyramidSeriesStageLabel();

    @Property
    readonly tooltip = new SeriesTooltip<AgPyramidSeriesTooltipRendererParams<unknown>>();
}
