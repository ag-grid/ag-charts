import type {
    AgRangeAreaSeriesItemType,
    AgRangeAreaSeriesLabelFormatterParams,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesOptionsKeys,
    AgRangeAreaSeriesTooltipRendererParams,
    AgSeriesMarkerOptions,
    AgSeriesMarkerStyle,
    PixelSize,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

export interface RangeAreaMarkerDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly itemId: AgRangeAreaSeriesItemType;
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly point: Readonly<_ModuleSupport.SizedPoint>;
    readonly enabled: boolean;
    style?: AgSeriesMarkerStyle;
}

const {
    BaseProperties,
    CartesianSeriesProperties,
    InterpolationProperties,
    SeriesMarker,
    makeSeriesTooltip,
    Property,
    DropShadow,
    Label,
    Deprecated,
} = _ModuleSupport;

type RangeAreaSeriesItemOptions = NonNullable<AgRangeAreaSeriesOptions['item']>;
type RangeAreaSeriesLineOptions = NonNullable<RangeAreaSeriesItemOptions[AgRangeAreaSeriesItemType]>;

class RangeAreaSeriesLabel extends Label<AgRangeAreaSeriesLabelFormatterParams> {
    @Property
    placement: AgRangeAreaSeriesLabelPlacement = 'outside';

    @Property
    spacing: PixelSize = 0;
}

class RangeAreaInvertedStyle {
    @Property
    enabled: boolean = false;

    @Property
    fill?: InternalAgColorType;

    @Property
    fillOpacity: number = 1;
}

class RangeAreaLineStyle extends BaseProperties<RangeAreaSeriesLineOptions> {
    @Property
    stroke: string = '#99CCFF';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    readonly marker = new SeriesMarker<AgRangeAreaSeriesOptionsKeys>();
}

class RangeAreaItemProperties extends BaseProperties<RangeAreaSeriesItemOptions> {
    @Property
    low = new RangeAreaLineStyle();

    @Property
    high = new RangeAreaLineStyle();
}

const DeprecatedMessage = (alt: string) => `Use item.low.${alt} and item.high.${alt} instead`;

export class RangeAreaProperties extends CartesianSeriesProperties<AgRangeAreaSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yLowKey!: string;

    @Property
    yHighKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    yLowName?: string;

    @Property
    yHighName?: string;

    @Property
    fill: InternalAgColorType = '#99CCFF';

    @Property
    fillOpacity: number = 1;

    @Deprecated(DeprecatedMessage('stroke'))
    stroke?: string;

    @Deprecated(DeprecatedMessage('strokeWidth'))
    strokeWidth?: number;

    @Deprecated(DeprecatedMessage('strokeOpacity'))
    strokeOpacity?: number;

    @Deprecated(DeprecatedMessage('lineDash'))
    lineDash?: number[];

    @Deprecated(DeprecatedMessage('lineDashOffset'))
    lineDashOffset?: number;

    @Property
    interpolation: _ModuleSupport.InterpolationProperties = new InterpolationProperties();

    @Property
    styler?: Styler<unknown, undefined>;

    @Property
    item = new RangeAreaItemProperties();

    @Property
    readonly invertedStyle = new RangeAreaInvertedStyle();

    @Property
    readonly shadow = new DropShadow().set({ enabled: false });

    @Deprecated(DeprecatedMessage('marker'))
    readonly marker?: AgSeriesMarkerOptions<unknown, unknown, unknown>;

    @Property
    readonly label = new RangeAreaSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>();

    @Property
    connectMissingData: boolean = false;
}
