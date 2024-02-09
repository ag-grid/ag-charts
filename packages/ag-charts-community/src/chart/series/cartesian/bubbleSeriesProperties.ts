import type {
    AgBubbleSeriesLabelFormatterParams,
    AgBubbleSeriesOptions,
    AgBubbleSeriesOptionsKeys,
    AgBubbleSeriesTooltipRendererParams,
} from '../../../options/agChartOptions';
import { RedrawType, SceneChangeDetection } from '../../../scene/changeDetectable';
import type { MeasuredLabel } from '../../../scene/util/labelPlacement';
import { COLOR_STRING_ARRAY, NUMBER_ARRAY, OBJECT, POSITIVE_NUMBER, STRING, Validate } from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface BubbleNodeDatum extends Required<CartesianSeriesNodeDatum> {
    readonly sizeValue: any;
    readonly label: MeasuredLabel;
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

    @Validate(OBJECT)
    readonly marker = new BubbleSeriesMarker();

    @Validate(OBJECT)
    readonly label = new Label<AgBubbleSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBubbleSeriesTooltipRendererParams>();
}
