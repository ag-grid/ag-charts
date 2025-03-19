import type { InternalAgColorType } from 'ag-charts-core';
import type {
    AgBubbleSeriesLabelFormatterParams,
    AgBubbleSeriesOptions,
    AgBubbleSeriesOptionsKeys,
    AgBubbleSeriesStyle,
    AgBubbleSeriesTooltipRendererParams,
    AgGradientColor,
    AgMarkerShape,
    BubbleSeriesItemStylerParams,
    LabelPlacement,
    Styler,
} from 'ag-charts-types';

import { SceneChangeDetection } from '../../../scene/changeDetectable';
import type { Point, SizedPoint } from '../../../scene/point';
import type { MeasuredLabel } from '../../../scene/util/labelPlacement';
import { ProxyProperty } from '../../../util/proxy';
import { LABEL_PLACEMENT, NUMBER_ARRAY, OBJECT, POSITIVE_NUMBER, STRING, TempValidate } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface BubbleNodeDatum extends CartesianSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly sizeValue: any;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly anchor: Point;
    readonly selected: boolean | undefined;
}

class BubbleSeriesMarker extends SeriesMarker<AgBubbleSeriesOptionsKeys> {
    /**
     * The series `sizeKey` values along with the `size` and `maxSize` configs will be used to
     * determine the size of the marker. All values will be mapped to a marker size within the
     * `[size, maxSize]` range, where the largest values will correspond to the `maxSize` and the
     * lowest to the `size`.
     */
    @TempValidate(POSITIVE_NUMBER)
    @SceneChangeDetection()
    maxSize = 30;

    @TempValidate(NUMBER_ARRAY, { optional: true })
    @SceneChangeDetection()
    domain?: [number, number];
}

class BubbleSeriesLabel extends Label<AgBubbleSeriesLabelFormatterParams> {
    @TempValidate(LABEL_PLACEMENT)
    placement: LabelPlacement = 'top';
}

export class BubbleSeriesProperties extends CartesianSeriesProperties<AgBubbleSeriesOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    yKey!: string;

    @TempValidate(STRING)
    sizeKey!: string;

    @TempValidate(STRING, { optional: true })
    labelKey?: string;

    @TempValidate(STRING, { optional: true })
    xFilterKey: string | undefined;

    @TempValidate(STRING, { optional: true })
    yFilterKey: string | undefined;

    @TempValidate(STRING, { optional: true })
    sizeFilterKey: string | undefined;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    sizeName?: string;

    @TempValidate(STRING, { optional: true })
    labelName?: string;

    @TempValidate(STRING, { optional: true })
    title?: string;

    @ProxyProperty('marker.shape')
    shape!: AgMarkerShape;

    @ProxyProperty('marker.size')
    size!: number;

    @ProxyProperty('marker.maxSize')
    maxSize!: number;

    @ProxyProperty('marker.domain', { optional: true })
    domain?: [number, number];

    @ProxyProperty('marker.fillGradientDefaults')
    fillGradientDefaults!: Required<AgGradientColor>;

    @ProxyProperty('marker.fill', { optional: true })
    fill?: InternalAgColorType;

    @ProxyProperty('marker.fillOpacity')
    fillOpacity!: number;

    @ProxyProperty('marker.stroke', { optional: true })
    stroke?: string;

    @ProxyProperty('marker.strokeWidth')
    strokeWidth!: number;

    @ProxyProperty('marker.strokeOpacity')
    strokeOpacity!: number;

    @ProxyProperty('marker.lineDash')
    lineDash!: number[];

    @ProxyProperty('marker.lineDashOffset')
    lineDashOffset!: number;

    @ProxyProperty('marker.itemStyler', { optional: true })
    itemStyler?: Styler<BubbleSeriesItemStylerParams<unknown>, AgBubbleSeriesStyle>;

    @TempValidate(OBJECT)
    readonly label = new BubbleSeriesLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBubbleSeriesTooltipRendererParams>();

    // No validation. Not a part of the options contract.
    readonly marker = new BubbleSeriesMarker();
}
