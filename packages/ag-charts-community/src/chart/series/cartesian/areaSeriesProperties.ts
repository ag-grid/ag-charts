import type {
    AgAreaSeriesLabelFormatterParams,
    AgAreaSeriesOptionsKeys,
    AgCartesianSeriesTooltipRendererParams,
    AgSeriesAreaOptions,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
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

export class AreaSeriesProperties extends CartesianSeriesProperties<AgSeriesAreaOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string = undefined;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    yFilterKey: string | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    normalizedTo?: number;

    @Validate(COLOR_STRING)
    fill: string = '#c16068';

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string = '#874349';

    @Validate(POSITIVE_NUMBER)
    strokeWidth = 2;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(OBJECT)
    interpolation: InterpolationProperties = new InterpolationProperties();

    @Validate(OBJECT)
    readonly shadow = new DropShadow();

    @Validate(OBJECT)
    readonly marker = new SeriesMarker<AgAreaSeriesOptionsKeys>();

    @Validate(OBJECT)
    readonly label = new Label<AgAreaSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgCartesianSeriesTooltipRendererParams>();

    @Validate(BOOLEAN)
    connectMissingData: boolean = false;
}
