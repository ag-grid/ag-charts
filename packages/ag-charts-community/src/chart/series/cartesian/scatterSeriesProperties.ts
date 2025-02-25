import type {
    AgFillType,
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
import { LABEL_PLACEMENT, OBJECT, STRING, Validate } from '../../../util/validation';
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
    @Validate(LABEL_PLACEMENT)
    placement: LabelPlacement = 'top';
}

export class ScatterSeriesProperties extends CartesianSeriesProperties<AgScatterSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    labelKey?: string;

    @Validate(STRING, { optional: true })
    xFilterKey: string | undefined;

    @Validate(STRING, { optional: true })
    yFilterKey: string | undefined;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    labelName?: string;

    @Validate(STRING, { optional: true })
    title?: string;

    @ProxyProperty('marker.shape')
    shape!: AgMarkerShape;

    @ProxyProperty('marker.size')
    size!: number;

    @ProxyProperty('marker.defaultColorRange')
    defaultColorRange?: string[];

    @ProxyProperty('marker.fill', { optional: true })
    fill?: AgFillType;

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

    @Validate(OBJECT)
    readonly label = new ScatterSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgScatterSeriesTooltipRendererParams>();

    // No validation. Not a part of the options contract.
    readonly marker = new SeriesMarker<AgScatterSeriesOptionsKeys>();
}
