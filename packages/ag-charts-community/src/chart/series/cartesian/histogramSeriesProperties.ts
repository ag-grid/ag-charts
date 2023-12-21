import type {
    AgHistogramSeriesLabelFormatterParams,
    AgHistogramSeriesOptions,
    AgHistogramSeriesTooltipRendererParams,
} from '../../../options/agChartOptions';
import { DropShadow } from '../../../scene/dropShadow';
import {
    ARRAY,
    BOOLEAN,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    Validate,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
import type { HistogramNodeDatum } from './histogramSeries';

export class HistogramSeriesProperties extends CartesianSeriesProperties<AgHistogramSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING, { optional: true })
    yKey?: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(COLOR_STRING, { optional: true })
    fill?: string;

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(BOOLEAN)
    areaPlot: boolean = false;

    @Validate(ARRAY, { optional: true })
    bins?: [number, number][];

    @Validate(UNION(['count', 'sum', 'mean'], 'a histogram aggregation'))
    aggregation: NonNullable<AgHistogramSeriesOptions['aggregation']> = 'sum';

    @Validate(POSITIVE_NUMBER, { optional: true })
    binCount?: number;

    @Validate(OBJECT)
    readonly shadow = new DropShadow();

    @Validate(OBJECT)
    readonly label = new Label<AgHistogramSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgHistogramSeriesTooltipRendererParams<HistogramNodeDatum>>();
}
