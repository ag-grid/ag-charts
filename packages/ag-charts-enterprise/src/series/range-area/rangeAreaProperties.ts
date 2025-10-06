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

class DeprecatedRangeAreaMarker implements AgSeriesMarkerOptions<unknown, unknown, unknown> {
    @Deprecated(DeprecatedMessage('marker.enabled'))
    @Property
    enabled: boolean = false;

    @Deprecated(DeprecatedMessage('marker.shape'))
    @Property
    shape: AgMarkerShape = 'circle';

    @Deprecated(DeprecatedMessage('marker.size'))
    @Property
    size: number = 8;

    @Deprecated(DeprecatedMessage('marker.fill'))
    @Property
    fill: InternalAgColorType = 'black';

    @Deprecated(DeprecatedMessage('marker.fillOpacity'))
    @Property
    fillOpacity: number = 1;

    @Deprecated(DeprecatedMessage('marker.stroke'))
    @Property
    stroke: string = 'black';

    @Deprecated(DeprecatedMessage('marker.strokeWidth'))
    @Property
    strokeWidth: number = 2;

    @Deprecated(DeprecatedMessage('marker.strokeOpacity'))
    @Property
    strokeOpacity: number = 1;

    @Deprecated(DeprecatedMessage('marker.lineDash'))
    @Property
    lineDash: number[] = [];

    @Deprecated(DeprecatedMessage('marker.lineDashOffset'))
    @Property
    lineDashOffset: number = 0;

    @Deprecated(DeprecatedMessage('marker.itemStyler'))
    @Property
    itemStyler: AgSeriesMarkerOptions<unknown, unknown, unknown>['itemStyler'] = undefined;
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
    stroke: string = '#99CCFF';

    @Deprecated(DeprecatedMessage('strokeWidth'))
    @Property
    strokeWidth: number = 1;

    @Deprecated(DeprecatedMessage('strokeOpacity'))
    @Property
    strokeOpacity: number = 1;

    @Deprecated(DeprecatedMessage('lineDash'))
    @Property
    lineDash: number[] = [0];

    @Deprecated(DeprecatedMessage('lineDashOffset'))
    @Property
    lineDashOffset: number = 0;

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
