import type {
    AgBubbleSeriesLabelFormatterParams,
    AgBubbleSeriesOptions,
    AgBubbleSeriesOptionsKeys,
    AgBubbleSeriesTooltipRendererParams,
    AgSeriesMarkerStyle,
    LabelPlacement,
} from '../../../options/agChartOptions';
import { RedrawType, SceneChangeDetection } from '../../../scene/changeDetectable';
import type { SizedPoint } from '../../../scene/point';
import type { MeasuredLabel } from '../../../scene/util/labelPlacement';
import { ProxyProperty } from '../../../util/proxy';
import {
    COLOR_STRING_ARRAY,
    LABEL_PLACEMENT,
    NUMBER_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    STRING,
    Validate,
} from '../../../util/validation';
import { Label } from '../../label';
import type { MarkerConstructor, MarkerShape } from '../../marker/util';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface BubbleNodeDatum extends CartesianSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly sizeValue: any;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly marker: MarkerConstructor;
    readonly fill: string | undefined;
}

class BubbleSeriesMarker extends SeriesMarker<AgBubbleSeriesOptionsKeys, BubbleNodeDatum> {
    /**
     * The series `sizeKey` values along with the `size` and `maxSize` configs will be used to
     * determine the size of the marker. All values will be mapped to a marker size within the
     * `[size, maxSize]` range, where the largest values will correspond to the `maxSize` and the
     * lowest to the `size`.
     */
    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    maxSize = 30;

    @Validate(NUMBER_ARRAY, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    domain?: [number, number];
}

class BubbleSeriesLabel extends Label<AgBubbleSeriesLabelFormatterParams> {
    @Validate(LABEL_PLACEMENT)
    placement: LabelPlacement = 'top';
}

export class BubbleSeriesProperties extends CartesianSeriesProperties<AgBubbleSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING)
    sizeKey!: string;

    @Validate(STRING, { optional: true })
    labelKey?: string;

    @Validate(STRING, { optional: true })
    colorKey?: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    sizeName?: string;

    @Validate(STRING, { optional: true })
    labelName?: string;

    @Validate(STRING, { optional: true })
    colorName?: string;

    @Validate(NUMBER_ARRAY, { optional: true })
    colorDomain?: number[];

    @Validate(COLOR_STRING_ARRAY)
    colorRange: string[] = ['#ffff00', '#00ff00', '#0000ff'];

    @Validate(STRING, { optional: true })
    title?: string;

    @ProxyProperty('marker.shape')
    shape!: MarkerShape;

    @ProxyProperty('marker.size')
    size!: number;

    @ProxyProperty('marker.maxSize')
    maxSize!: number;

    @ProxyProperty('marker.domain', { optional: true })
    domain?: [number, number];

    @ProxyProperty('marker.fill', { optional: true })
    fill?: string;

    @ProxyProperty('marker.fillOpacity')
    fillOpacity!: number;

    @ProxyProperty('marker.stroke', { optional: true })
    stroke?: string;

    @ProxyProperty('marker.strokeWidth')
    strokeWidth!: number;

    @ProxyProperty('marker.strokeOpacity')
    strokeOpacity!: number;

    @ProxyProperty('marker.formatter', { optional: true })
    itemStyler?: (params: any) => AgSeriesMarkerStyle | undefined;

    @Validate(OBJECT)
    readonly label = new BubbleSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBubbleSeriesTooltipRendererParams>();

    // No validation. Not a part of the options contract.
    readonly marker = new BubbleSeriesMarker();
}
