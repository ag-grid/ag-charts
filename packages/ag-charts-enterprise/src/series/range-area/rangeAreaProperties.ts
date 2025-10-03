import type {
    AgMarkerShape,
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
import type { DeepRequired, InternalAgColorType } from 'ag-charts-core';

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
    CartesianSeriesProperties,
    InterpolationProperties,
    SeriesMarker,
    makeSeriesTooltip,
    Property,
    DropShadow,
    Label,
    Deprecated,
} = _ModuleSupport;

function DeprecatedMessage(alt: string): string {
    return `Use item.low.${alt} and item.high.${alt} instead`;
}

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

class RangeAreaLineStyle {
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

class RangeAreaItemProperties {
    @Property
    low = new RangeAreaLineStyle();

    @Property
    high = new RangeAreaLineStyle();
}

class DeprecatedRangeAreaMarker implements DeepRequired<AgSeriesMarkerOptions<unknown, unknown, unknown>, 'fill'> {
    @Deprecated(DeprecatedMessage('marker.enabled'))
    @Property
    set enabled(_: boolean) {}

    @Deprecated(DeprecatedMessage('marker.shape'))
    @Property
    set shape(_: AgMarkerShape) {}

    @Deprecated(DeprecatedMessage('marker.size'))
    @Property
    set size(_: number) {}

    @Deprecated(DeprecatedMessage('marker.fill'))
    @Property
    set fill(_: InternalAgColorType) {}

    @Deprecated(DeprecatedMessage('marker.fillOpacity'))
    @Property
    set fillOpacity(_: number) {}

    @Deprecated(DeprecatedMessage('marker.stroke'))
    @Property
    set stroke(_: string) {}

    @Deprecated(DeprecatedMessage('marker.strokeWidth'))
    @Property
    set strokeWidth(_: number) {}

    @Deprecated(DeprecatedMessage('marker.strokeOpacity'))
    @Property
    set strokeOpacity(_: number) {}

    @Deprecated(DeprecatedMessage('marker.lineDash'))
    @Property
    set lineDash(_: number[]) {}

    @Deprecated(DeprecatedMessage('marker.lineDashOffset'))
    @Property
    set lineDashOffset(_: number) {}

    @Deprecated(DeprecatedMessage('marker.itemStyler'))
    @Property
    set itemStyler(_: NonNullable<AgSeriesMarkerOptions<unknown, unknown, unknown>['itemStyler']>) {}
}

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
    @Property
    set stroke(_: string) {}

    @Deprecated(DeprecatedMessage('strokeWidth'))
    @Property
    set strokeWidth(_: number) {}

    @Deprecated(DeprecatedMessage('strokeOpacity'))
    @Property
    set strokeOpacity(_: number) {}

    @Deprecated(DeprecatedMessage('lineDash'))
    @Property
    set lineDash(_: number[]) {}

    @Deprecated(DeprecatedMessage('lineDashOffset'))
    @Property
    set lineDashOffset(_: number) {}

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
    @Property
    readonly marker = new DeprecatedRangeAreaMarker();

    @Property
    readonly label = new RangeAreaSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRangeAreaSeriesTooltipRendererParams>();

    @Property
    connectMissingData: boolean = false;
}
