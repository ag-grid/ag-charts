import type {
    AgBaseRadialColumnSeriesOptions,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
    AgRadialSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

const { SeriesProperties, makeSeriesTooltip, Property, Label } = _ModuleSupport;

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
    angleKeyAxis: string = 'angle';

    @Property
    radiusKeyAxis: string = 'radius';

    @Property
    legendItemName?: string;

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
    cornerRadius: number = 0;

    @Property
    styler?: Styler<AgRadialSeriesStylerParams<unknown, unknown>, AgRadialSeriesStyle>;

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

    getStyle(): Required<AgRadialSeriesStyle> & { opacity: number } {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cornerRadius } = this;
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
            opacity: 1,
        };
    }
}
