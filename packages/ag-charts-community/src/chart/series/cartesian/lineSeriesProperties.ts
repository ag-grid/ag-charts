import type {
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesOptions,
    AgLineSeriesOptionsKeys,
    AgLineSeriesTooltipRendererParams,
} from 'ag-charts-types';

import {
    BOOLEAN,
    COLOR_STRING,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
import { InterpolationProperties } from './interpolationProperties';

export class LineSeriesProperties extends CartesianSeriesProperties<AgLineSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    yFilterKey: string | undefined;

    @Validate(STRING, { optional: true })
    stackGroup?: string;

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
    interpolation: InterpolationProperties = new InterpolationProperties();

    @Validate(OBJECT)
    readonly marker = new SeriesMarker<AgLineSeriesOptionsKeys>();

    @Validate(OBJECT)
    readonly label = new Label<AgLineSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgLineSeriesTooltipRendererParams>();

    @Validate(BOOLEAN)
    connectMissingData: boolean = false;

    @Validate(BOOLEAN)
    sparklineMode: boolean = false;
}
