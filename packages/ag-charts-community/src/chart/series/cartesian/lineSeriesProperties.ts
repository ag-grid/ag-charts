import { InterpolationProperties, Property } from 'ag-charts-core';
import type {
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesMarkerItemStylerParams,
    AgLineSeriesOptions,
    AgLineSeriesStylerParams,
    AgLineSeriesStylerResult,
    AgLineSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { makeSeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';

export class LineSeriesProperties extends CartesianSeriesProperties<AgLineSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    // WARNING! This selectedKey is related to cross-filtering which is not an officially documented or supported
    // feature. It has nothing to do with the official data selection API in the options contract. Do not use, or use
    // with extreme caution.
    @Property
    selectedKey: string | undefined;

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
    styler?: Styler<AgLineSeriesStylerParams<unknown, unknown>, AgLineSeriesStylerResult>;

    @Property
    readonly marker = new SeriesMarker<AgLineSeriesMarkerItemStylerParams>();

    @Property
    readonly label = new Label<AgLineSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgLineSeriesTooltipRendererParams>();

    @Property
    connectMissingData: boolean = false;

    @Property
    sparklineMode: boolean = false;
}
