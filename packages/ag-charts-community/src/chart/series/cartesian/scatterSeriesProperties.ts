import type { InternalAgColorType, InternalAgGradientColor, InternalAgPatternColor } from 'ag-charts-core';
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
import { ProxyProperty } from '../../../util/proxy';
import { LABEL_PLACEMENT, OBJECT, STRING, TempValidate } from '../../../util/validation';
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
    @TempValidate(LABEL_PLACEMENT)
    placement: LabelPlacement = 'top';
}

export class ScatterSeriesProperties extends CartesianSeriesProperties<AgScatterSeriesOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    yKey!: string;

    @TempValidate(STRING, { optional: true })
    labelKey?: string;

    @TempValidate(STRING, { optional: true })
    xFilterKey: string | undefined;

    @TempValidate(STRING, { optional: true })
    yFilterKey: string | undefined;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    labelName?: string;

    @TempValidate(STRING, { optional: true })
    title?: string;

    @ProxyProperty('marker.shape')
    shape!: AgMarkerShape;

    @ProxyProperty('marker.size')
    size!: number;

    @ProxyProperty('marker.fill', { optional: true })
    fill?: InternalAgColorType;

    @ProxyProperty('marker.fillGradientDefaults')
    fillGradientDefaults!: Required<InternalAgGradientColor>;

    @ProxyProperty('marker.fillPatternDefaults')
    fillPatternDefaults!: Required<InternalAgPatternColor>;

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

    @ProxyProperty('marker.itemStyler', { optional: true })
    itemStyler?: Styler<AgScatterSeriesItemStylerParams<unknown>, AgSeriesMarkerStyle>;

    @TempValidate(OBJECT)
    readonly label = new ScatterSeriesLabel();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgScatterSeriesTooltipRendererParams>();

    // No validation. Not a part of the options contract.
    readonly marker = new SeriesMarker<AgScatterSeriesOptionsKeys>();
}
