import type {
    AgMapShapeSeriesItemStylerParams,
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesOptions,
    AgMapShapeSeriesStyle,
    AgMapShapeSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type {
    FeatureCollection,
    Geometry,
    InternalAgColorType,
    NormalisedPaddingOptions,
    NormalisedTextOrSegments,
} from 'ag-charts-core';
import { Property } from 'ag-charts-core';

import { AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const { ColorScaleProperties, SeriesProperties, makeSeriesTooltip } = _ModuleSupport;
export interface MapShapeNodeLabelDatum {
    readonly x: number;
    readonly y: number;
    readonly text: NormalisedTextOrSegments;
    readonly fontSize: number;
    readonly lineHeight: number;
    readonly datumIndex: number;
    readonly idValue: string;
    readonly datumId: string | number | boolean;
}

export interface MapShapeNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly labelValue: string | undefined;
    readonly legendItemName: string | undefined;
    readonly projectedGeometry: Geometry | undefined;
    style: AgMapShapeSeriesStyle;
}

export class MapShapeSeriesProperties extends SeriesProperties<AgMapShapeSeriesOptions> {
    @Property
    topology?: FeatureCollection = undefined;

    @Property
    title?: string;

    @Property
    legendItemName?: string;

    @Property
    idKey: string = '';

    @Property
    idName: string | undefined = undefined;

    @Property
    topologyIdKey: string = 'name';

    @Property
    labelKey: string | undefined = undefined;

    @Property
    labelName: string | undefined = undefined;

    @Property
    colorKey?: string;

    @Property
    colorName?: string;

    @Property
    readonly colorScale = new ColorScaleProperties();

    @Property
    fill: InternalAgColorType = 'black';

    @Property
    fillOpacity: number = 1;

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
    padding: NormalisedPaddingOptions = { top: 0, right: 0, bottom: 0, left: 0 };

    @Property
    itemStyler?: Styler<AgMapShapeSeriesItemStylerParams<unknown>, AgMapShapeSeriesStyle>;

    @Property
    readonly label = new AutoSizedSecondaryLabel<AgMapShapeSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgMapShapeSeriesTooltipRendererParams<any>>();

    getStyle(): Required<AgMapShapeSeriesStyle> & { opacity: number } {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
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
