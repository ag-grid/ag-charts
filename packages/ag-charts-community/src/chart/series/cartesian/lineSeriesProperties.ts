import type {
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesMarkerItemStylerParams,
    AgLineSeriesOptions,
    AgLineSeriesTooltipRendererParams,
} from 'ag-charts-types';

import { Property } from '../../../util/properties';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';
import { InterpolationProperties } from './interpolationProperties';

export class LineSeriesProperties extends CartesianSeriesProperties<AgLineSeriesOptions<unknown>> {
    @Property
    xKey!: string;

    @Property
    yKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    yFilterKey: string | undefined;

    @Property
    stackGroup?: string;

    @Property
    normalizedTo?: number;

    @Property
    title?: string;

    @Property
    stroke: string = '#874349';

    @Property
    strokeWidth: number = 2;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    interpolation: InterpolationProperties = new InterpolationProperties();

    @Property
    readonly marker = new SeriesMarker<AgLineSeriesMarkerItemStylerParams>();

    @Property
    readonly label = new Label<AgLineSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = new SeriesTooltip<AgLineSeriesTooltipRendererParams<unknown>>();

    @Property
    connectMissingData: boolean = false;

    @Property
    sparklineMode: boolean = false;
}
