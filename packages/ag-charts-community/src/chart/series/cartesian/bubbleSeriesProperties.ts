import type { InternalAgColorType } from 'ag-charts-core';
import {
    Property,
    ProxyProperty,
    SceneArrayChangeDetection,
    SceneChangeDetection,
    addTransformToInstanceProperty,
} from 'ag-charts-core';
import type {
    AgBubbleSeriesLabelFormatterParams,
    AgBubbleSeriesOptions,
    AgBubbleSeriesOptionsKeys,
    AgBubbleSeriesStyle,
    AgBubbleSeriesStylerParams,
    AgBubbleSeriesStylerResult,
    AgBubbleSeriesTooltipRendererParams,
    AgChartLabelCollisionPlacement,
    AgMarkerShape,
    AgNumericValue,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesStylerParams,
    AgScatterSeriesStylerResult,
    BubbleSeriesItemStylerParams,
    Styler,
} from 'ag-charts-types';

import { ColorScaleProperties } from '../../../scene/gradient/stops';
import { PlacedSeriesLabel } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { makeSeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';

const EmptyStringAsUndefined = addTransformToInstanceProperty((_target, _key, value) =>
    value === '' ? undefined : value
);

class BubbleSeriesMarker extends SeriesMarker<AgBubbleSeriesOptionsKeys | AgScatterSeriesOptionsKeys> {
    /**
     * When `sizeKey` is present, `sizeKey` values are mapped onto the `[minSize, maxSize]` pixel range,
     * with the lowest values corresponding to `minSize` (the inherited `size` field) and the highest to
     * `maxSize`. Without a `sizeKey`, `size` is used as the fixed marker size.
     */
    @Property
    @SceneChangeDetection()
    maxSize = 30;

    @Property
    @SceneArrayChangeDetection()
    sizeDomain?: readonly [AgNumericValue, AgNumericValue];
}

class BubbleSeriesLabel extends PlacedSeriesLabel<AgBubbleSeriesLabelFormatterParams> {
    @Property
    override placement: AgChartLabelCollisionPlacement | AgChartLabelCollisionPlacement[] = 'top';
}

export class BubbleScatterSeriesProperties extends CartesianSeriesProperties<AgBubbleSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yKey!: string;

    @Property
    @EmptyStringAsUndefined
    sizeKey!: string;

    @Property
    @EmptyStringAsUndefined
    labelKey?: string;

    @Property
    @EmptyStringAsUndefined
    colorKey?: string;

    // WARNING! Cross-filtering only, which is neither documented nor supported, and is unrelated to the
    // data selection API in the options contract.
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

    @Property
    title?: string;

    @ProxyProperty('marker.shape')
    shape!: AgMarkerShape;

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

export class BubbleSeriesProperties extends BubbleScatterSeriesProperties {
    @ProxyProperty('marker.size')
    minSize!: number;

    @ProxyProperty('marker.maxSize')
    maxSize!: number;

    @ProxyProperty('marker.sizeDomain')
    sizeDomain?: [number, number];
}

export class ScatterSeriesProperties extends BubbleScatterSeriesProperties {
    @ProxyProperty('marker.size')
    size!: number;
}
