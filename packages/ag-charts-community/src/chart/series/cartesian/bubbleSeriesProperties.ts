import type { InternalAgColorType } from 'ag-charts-core';
import { Property, ProxyProperty, SceneArrayChangeDetection, SceneChangeDetection } from 'ag-charts-core';
import type {
    AgBubbleSeriesLabelFormatterParams,
    AgBubbleSeriesOptions,
    AgBubbleSeriesOptionsKeys,
    AgBubbleSeriesStyle,
    AgBubbleSeriesStylerParams,
    AgBubbleSeriesStylerResult,
    AgBubbleSeriesTooltipRendererParams,
    AgMarkerShape,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesStylerParams,
    AgScatterSeriesStylerResult,
    BubbleSeriesItemStylerParams,
    LabelPlacement,
    Styler,
} from 'ag-charts-types';

import { ColorScaleProperties } from '../../../scene/gradient/stops';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { makeSeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';

class BubbleSeriesMarker extends SeriesMarker<AgBubbleSeriesOptionsKeys | AgScatterSeriesOptionsKeys> {
    /**
     * The series `sizeKey` values along with the `size` and `maxSize` configs will be used to
     * determine the size of the marker. All values will be mapped to a marker size within the
     * `[size, maxSize]` range, where the largest values will correspond to the `maxSize` and the
     * lowest to the `size`.
     */
    @Property
    @SceneChangeDetection()
    maxSize = 30;

    @Property
    @SceneArrayChangeDetection()
    domain?: readonly [number, number];
}

class BubbleSeriesLabel extends Label<AgBubbleSeriesLabelFormatterParams> {
    @Property
    placement: LabelPlacement = 'top';
}

export class BubbleSeriesProperties extends CartesianSeriesProperties<AgBubbleSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yKey!: string;

    @Property
    sizeKey!: string;

    @Property
    labelKey?: string;

    @Property
    colorKey?: string;

    @Property
    selectedKey: string | undefined;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    sizeName?: string;

    @Property
    labelName?: string;

    @Property
    colorName?: string;

    @Property
    readonly colorScale = new ColorScaleProperties();

    /**
     * Fallback palette used by {@link BubbleSeries.processData} when the resolved
     * {@link colorScale}.fills array is empty. This exists because the options graph treats any
     * user-supplied partial object (e.g. `colorScale: {}` or `colorScale: { mode: 'discrete' }`)
     * as "user-supplied" for every descendant path, which wipes the theme's
     * `colorScale.fills` default wholesale. Without a separate fallback the scale would collapse
     * to the raw `ColorScale` constructor defaults (red→blue over [0,1]) and every data point
     * would render as a single colour.
     *
     * Populated by the series theme template from the active palette's `divergingColors` so the
     * fallback tracks palette switches (light/dark/financial/etc.) rather than hard-coding the
     * default chart theme's orange→yellow→green. Same mechanism heatmap uses via its own
     * `colorRange` option.
     *
     * Undocumented: users who want an explicit gradient should supply `colorScale.fills`. This
     * field exists purely so an omitted or empty `colorScale` still produces the heatmap-style
     * default palette instead of red→blue.
     */
    @Property
    colorRange: string[] = ['black', 'black'];

    @Property
    title?: string;

    @ProxyProperty('marker.shape')
    shape!: AgMarkerShape;

    @ProxyProperty('marker.size')
    size!: number;

    @ProxyProperty('marker.maxSize')
    maxSize!: number;

    @ProxyProperty('marker.domain')
    domain?: [number, number];

    @ProxyProperty('marker.fill')
    fill?: InternalAgColorType;

    @ProxyProperty('marker.fillOpacity')
    fillOpacity!: number;

    @ProxyProperty('marker.stroke')
    stroke?: string;

    @ProxyProperty('marker.strokeWidth')
    strokeWidth!: number;

    @ProxyProperty('marker.strokeOpacity')
    strokeOpacity!: number;

    @ProxyProperty('marker.lineDash')
    lineDash!: number[];

    @ProxyProperty('marker.lineDashOffset')
    lineDashOffset!: number;

    @ProxyProperty('marker.itemStyler')
    itemStyler?: Styler<
        BubbleSeriesItemStylerParams<unknown> | AgScatterSeriesItemStylerParams<unknown>,
        AgBubbleSeriesStyle
    >;

    @Property
    styler?: Styler<
        AgBubbleSeriesStylerParams<unknown, unknown> | AgScatterSeriesStylerParams<unknown, unknown>,
        AgBubbleSeriesStylerResult | AgScatterSeriesStylerResult
    >;

    @Property
    readonly label = new BubbleSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgBubbleSeriesTooltipRendererParams>();

    @Property
    maxRenderedItems: number = Infinity;

    // No validation. Not a part of the options contract.
    readonly marker = new BubbleSeriesMarker();
}
