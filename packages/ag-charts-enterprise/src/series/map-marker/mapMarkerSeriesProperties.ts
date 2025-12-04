import type {
    AgMapMarkerSeriesItemStylerParams,
    AgMapMarkerSeriesLabelFormatterParams,
    AgMapMarkerSeriesOptions,
    AgMapMarkerSeriesStyle,
    AgMapMarkerSeriesTooltipRendererParams,
    AgMarkerShape,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type {
    FeatureCollection,
    InternalAgColorType,
    LabelPlacement,
    PointLabelDatum,
    SizedPoint,
} from 'ag-charts-core';
import { Property } from 'ag-charts-core';

const { SeriesProperties, makeSeriesTooltip, Label } = _ModuleSupport;
export interface MapMarkerNodeLabelDatum extends PointLabelDatum {
    readonly datumIndex: number;
    readonly datumId: string | number | boolean;
}

export interface MapMarkerNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly index: number;
    readonly itemId: string | undefined;
    readonly idValue: string | undefined;
    readonly lonValue: number | undefined;
    readonly latValue: number | undefined;
    readonly labelValue: string | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly legendItemName: string | undefined;
    readonly point: Readonly<SizedPoint>;
    style: AgMapMarkerSeriesStyle;
}

class MapMarkerSeriesLabel extends Label<AgMapMarkerSeriesLabelFormatterParams> {
    @Property
    placement: LabelPlacement = 'bottom';
}

export class MapMarkerSeriesProperties extends SeriesProperties<AgMapMarkerSeriesOptions> {
    @Property
    topology: FeatureCollection | undefined = undefined;

    @Property
    title?: string;

    @Property
    legendItemName?: string;

    @Property
    idKey: string | undefined = undefined;

    @Property
    topologyIdKey: string = 'name';

    @Property
    idName: string | undefined = undefined;

    @Property
    latitudeKey: string | undefined = undefined;

    @Property
    latitudeName: string | undefined = undefined;

    @Property
    longitudeKey: string | undefined = undefined;

    @Property
    longitudeName: string | undefined = undefined;

    @Property
    labelKey: string | undefined = undefined;

    @Property
    labelName: string | undefined = undefined;

    @Property
    sizeKey?: string;

    @Property
    sizeName?: string;

    @Property
    colorKey?: string;

    @Property
    colorName?: string;

    @Property
    colorRange: string[] | undefined = undefined;

    /** One of the predefined marker names, or a marker shape function (for user-defined markers). */
    @Property
    shape: AgMarkerShape = 'circle';

    @Property
    size: number = 6;

    @Property
    maxSize: number | undefined;

    @Property
    sizeDomain?: [number, number];

    @Property
    fill: InternalAgColorType = 'black';

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
    itemStyler?: Styler<AgMapMarkerSeriesItemStylerParams<unknown>, AgMapMarkerSeriesStyle>;

    @Property
    readonly label = new MapMarkerSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<any>>();

    getStyle(): Required<AgMapMarkerSeriesStyle> & { opacity: number } {
        const { size, shape, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        return {
            size,
            shape,
            fill,
            fillOpacity,
            opacity: 1,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }
}
