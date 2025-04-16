import type {
    InternalAgColorType,
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';
import type {
    AgMarkerShape,
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptions,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesTooltipRendererParams,
    AgSeriesMarkerStyle,
    Styler,
} from 'ag-charts-types';

import type { Point, SizedPoint } from '../../../scene/point';
import type { LabelPlacement, MeasuredLabel } from '../../../scene/util/labelPlacement';
import { Property } from '../../../util/properties';
import { ProxyProperty } from '../../../util/proxy';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface ScatterNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly anchor: Point;
    readonly selected: boolean | undefined;
}

class ScatterSeriesLabel extends Label<AgScatterSeriesLabelFormatterParams> {
    @Property
    placement: LabelPlacement = 'top';
}

export class ScatterSeriesProperties extends CartesianSeriesProperties<AgScatterSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yKey!: string;

    @Property
    labelKey?: string;

    @Property
    xFilterKey: string | undefined;

    @Property
    yFilterKey: string | undefined;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    labelName?: string;

    @Property
    title?: string;

    @ProxyProperty('marker.shape')
    shape!: AgMarkerShape;

    @ProxyProperty('marker.size')
    size!: number;

    @ProxyProperty('marker.fill')
    fill?: InternalAgColorType;

    @ProxyProperty('marker.fillGradientDefaults')
    fillGradientDefaults!: RequiredInternalAgGradientColor;

    @ProxyProperty('marker.fillPatternDefaults')
    fillPatternDefaults!: RequiredInternalAgPatternColor;

    @ProxyProperty('marker.fillImageDefaults')
    fillImageDefaults!: RequiredInternalAgImageFill;

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
    itemStyler?: Styler<AgScatterSeriesItemStylerParams<unknown>, AgSeriesMarkerStyle>;

    @Property
    readonly label = new ScatterSeriesLabel();

    @Property
    readonly tooltip = new SeriesTooltip<AgScatterSeriesTooltipRendererParams>();

    // No validation. Not a part of the options contract.
    readonly marker = new SeriesMarker<AgScatterSeriesOptionsKeys>();
}
