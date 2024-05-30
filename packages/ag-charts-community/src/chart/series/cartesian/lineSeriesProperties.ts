import type {
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesOptions,
    AgLineSeriesOptionsKeys,
    AgLineSeriesTooltipRendererParams,
    FontStyle,
    FontWeight,
} from '../../../options/agChartOptions';
import { BaseProperties } from '../../../util/properties';
import {
    BOOLEAN,
    COLOR_STRING,
    LINE_DASH,
    LINE_STEP_POSITION,
    LINE_STYLE,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { type CartesianSeriesNodeDatum, CartesianSeriesProperties } from './cartesianSeries';

export interface LineNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: CartesianSeriesNodeDatum['point'] & {
        readonly moveTo: boolean;
    };
    readonly label?: {
        readonly text: string;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        readonly fill?: string;
    };
}

export class LineSeriesLine extends BaseProperties {
    @Validate(LINE_STYLE)
    style: 'linear' | 'smooth' | 'step' = 'linear';

    @Validate(RATIO)
    tension: number = 1;

    @Validate(LINE_STEP_POSITION)
    position: 'start' | 'middle' | 'end' = 'end';
}

export class LineSeriesProperties extends CartesianSeriesProperties<AgLineSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    normalizedTo?: number;

    @Validate(STRING, { optional: true })
    title?: string;

    @Validate(COLOR_STRING)
    stroke: string = '#874349';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 2;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(OBJECT)
    line?: LineSeriesLine = new LineSeriesLine();

    @Validate(OBJECT)
    readonly marker = new SeriesMarker<AgLineSeriesOptionsKeys, LineNodeDatum>();

    @Validate(OBJECT)
    readonly label = new Label<AgLineSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgLineSeriesTooltipRendererParams>();

    @Validate(BOOLEAN)
    connectMissingData: boolean = false;
}
