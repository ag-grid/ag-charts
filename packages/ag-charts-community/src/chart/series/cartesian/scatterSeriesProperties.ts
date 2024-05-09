import type {
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptions,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesTooltipRendererParams,
} from '../../../options/agChartOptions';
import type { SizedPoint } from '../../../scene/point';
import type { LabelPlacement, MeasuredLabel } from '../../../scene/util/labelPlacement';
import { COLOR_STRING_ARRAY, LABEL_PLACEMENT, NUMBER_ARRAY, OBJECT, STRING, Validate } from '../../../util/validation';
import { Label } from '../../label';
import type { MarkerConstructor } from '../../marker/util';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface ScatterNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly marker: MarkerConstructor;
    readonly fill: string | undefined;
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
    colorKey?: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

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

    @Validate(OBJECT)
    readonly marker = new SeriesMarker<AgScatterSeriesOptionsKeys, ScatterNodeDatum>();

    @Validate(OBJECT)
    readonly label = new ScatterSeriesLabel();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgScatterSeriesTooltipRendererParams>();
}
