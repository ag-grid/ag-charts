import type {
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptions,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesTooltipRendererParams,
} from '../../../options/agChartOptions';
import type { MeasuredLabel } from '../../../scene/util/labelPlacement';
import { COLOR_STRING_ARRAY, NUMBER_ARRAY, OBJECT, STRING, Validate } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface ScatterNodeDatum extends Required<CartesianSeriesNodeDatum>, ErrorBoundSeriesNodeDatum {
    readonly label: MeasuredLabel;
    readonly fill: string | undefined;
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
    readonly label = new Label<AgScatterSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgScatterSeriesTooltipRendererParams>();
}
