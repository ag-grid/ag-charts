import type {
    AgMapLineSeriesItemStylerParams,
    AgMapLineSeriesLabelFormatterParams,
    AgMapLineSeriesOptions,
    AgMapLineSeriesStyle,
    AgMapLineSeriesTooltipRendererParams,
    Opacity,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { FeatureCollection, Geometry, PointLabelDatum } from 'ag-charts-core';
import { Property } from 'ag-charts-core';

const { SeriesProperties, makeSeriesTooltip, Label } = _ModuleSupport;
export interface MapLineNodeLabelDatum extends PointLabelDatum {
    readonly datumIndex: number;
    readonly idValue: string;
}

export interface MapLineNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly idValue: string;
    readonly labelValue: string | undefined;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly legendItemName: string | undefined;
    readonly projectedGeometry: Geometry | undefined;
    style: AgMapLineSeriesStyle;
}

export class MapLineSeriesProperties extends SeriesProperties<AgMapLineSeriesOptions> {
    @Property
    topology?: FeatureCollection = undefined;

    @Property
    title?: string;

    @Property
    legendItemName?: string;

    @Property
    idKey: string = '';

    @Property
    topologyIdKey: string = 'name';

    @Property
    idName?: string = undefined;

    @Property
    labelKey?: string = undefined;

    @Property
    labelName?: string = undefined;

    @Property
    sizeKey?: string;

    @Property
    sizeName?: string;

    @Property
    colorKey?: string;

    @Property
    colorName?: string;

    @Property
    sizeDomain?: [number, number];

    @Property
    colorRange: string[] | undefined = undefined;

    @Property
    maxStrokeWidth?: number = undefined;

    @Property
    stroke: string = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 0;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    itemStyler?: Styler<AgMapLineSeriesItemStylerParams<unknown>, AgMapLineSeriesStyle>;

    @Property
    readonly label = new Label<AgMapLineSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgMapLineSeriesTooltipRendererParams<any>>();

    getStyle(): Required<AgMapLineSeriesStyle> & { opacity: Opacity } {
        const { stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = this;
        return {
            stroke,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
            opacity: 1,
        };
    }
}
