import type { InternalAgColorType } from 'ag-charts-core';
import { InterpolationProperties, Property } from 'ag-charts-core';
import type {
    AgAreaSeriesLabelFormatterParams,
    AgAreaSeriesMarkerItemStylerParams,
    AgAreaSeriesOptions,
    AgAreaSeriesStylerParams,
    AgAreaSeriesStylerResult,
    AgAreaSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { Label } from '../../label';
import { SeriesMarker } from '../seriesMarker';
import { makeSeriesTooltip } from '../seriesTooltip';
import { CartesianSeriesProperties } from './cartesianSeries';

export class AreaSeriesProperties extends CartesianSeriesProperties<AgAreaSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    xName?: string = undefined;

    @Property
    yKey!: string;

    @Property
    yName?: string;

    @Property
    selectedKey: string | undefined;

    @Property
    stackGroup?: string;

    @Property
    normalizedTo?: number;

    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    fillOpacity = 1;

    @Property
    stroke: string = '#874349';

    @Property
    strokeWidth = 2;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    interpolation: InterpolationProperties = new InterpolationProperties();

    @Property
    styler?: Styler<AgAreaSeriesStylerParams<unknown, unknown>, AgAreaSeriesStylerResult>;

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly marker = new SeriesMarker<AgAreaSeriesMarkerItemStylerParams>();

    @Property
    readonly label = new Label<AgAreaSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgAreaSeriesTooltipRendererParams>();

    @Property
    connectMissingData: boolean = false;
}
