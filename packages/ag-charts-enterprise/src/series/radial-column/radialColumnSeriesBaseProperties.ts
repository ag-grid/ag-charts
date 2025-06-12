import type {
    AgBaseRadialColumnSeriesOptions,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesStyle,
    AgRadialSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

const {
    SeriesProperties,
    FillGradientDefaults,
    FillPatternDefaults,
    FillImageDefaults,
    makeSeriesTooltip,
    Property,
    Label,
} = _ModuleSupport;

export class RadialColumnSeriesBaseProperties<T extends AgBaseRadialColumnSeriesOptions> extends SeriesProperties<T> {
    @Property
    angleKey!: string;

    @Property
    angleName?: string;

    @Property
    radiusKey!: string;

    @Property
    radiusName?: string;

    @Property
    fill: InternalAgColorType = 'black';

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string = 'black';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    itemStyler?: Styler<AgRadialSeriesItemStylerParams<unknown>, AgRadialSeriesStyle>;

    @Property
    rotation: number = 0;

    @Property
    stackGroup?: string;

    @Property
    normalizedTo?: number;

    @Property
    readonly label = new Label<AgRadialSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRadialSeriesTooltipRendererParams<any>>();
}
