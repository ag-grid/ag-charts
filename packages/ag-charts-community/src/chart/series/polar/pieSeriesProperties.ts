import type { InternalAgColorType } from 'ag-charts-core';
import type {
    AgPieSeriesItemStylerParams,
    AgPieSeriesLabelFormatterParams,
    AgPieSeriesOptions,
    AgPieSeriesStyle,
    AgPieSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { BaseProperties } from '../../../util/properties';
import { Property } from '../../../util/properties';
import { Caption } from '../../caption';
import { Label } from '../../label';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class PieTitle extends Caption {
    @Property
    showInLegend = false;
}

class PieSeriesCalloutLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @Property
    offset = 3; // from the callout line

    @Property
    minAngle = 0;

    @Property
    minSpacing = 4;

    @Property
    maxCollisionOffset = 50;

    @Property
    avoidCollisions = true;
}

class PieSeriesSectorLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @Property
    positionOffset = 0;

    @Property
    positionRatio = 0.5;
}

class PieSeriesCalloutLine extends BaseProperties {
    @Property
    colors?: InternalAgColorType[];

    @Property
    length: number = 10;

    @Property
    strokeWidth: number = 1;
}

export class PieSeriesProperties extends SeriesProperties<AgPieSeriesOptions<unknown>> {
    @Property
    angleKey!: string;

    @Property
    angleName?: string;

    @Property
    angleFilterKey?: string;

    @Property
    radiusKey?: string;

    @Property
    radiusName?: string;

    @Property
    radiusMin?: number;

    @Property
    radiusMax?: number;

    @Property
    calloutLabelKey?: string;

    @Property
    calloutLabelName?: string;

    @Property
    sectorLabelKey?: string;

    @Property
    sectorLabelName?: string;

    @Property
    legendItemKey?: string;

    @Property
    defaultColorRange: string[][] = [];

    @Property
    defaultPatternFills: string[] = [];

    @Property
    fills: InternalAgColorType[] = Object.values(DEFAULT_FILLS);

    @Property
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Property
    fillOpacity = 1;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    itemStyler?: Styler<AgPieSeriesItemStylerParams<unknown>, AgPieSeriesStyle>;

    @Property
    rotation: number = 0;

    @Property
    outerRadiusOffset: number = 0;

    @Property
    outerRadiusRatio: number = 1;

    @Property
    strokeWidth: number = 1;

    @Property
    sectorSpacing: number = 0;

    @Property
    hideZeroValueSectorsInLegend = false;

    @Property
    readonly title = new PieTitle();

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly calloutLabel = new PieSeriesCalloutLabel();

    @Property
    readonly sectorLabel = new PieSeriesSectorLabel();

    @Property
    readonly calloutLine = new PieSeriesCalloutLine();

    @Property
    readonly tooltip = new SeriesTooltip<AgPieSeriesTooltipRendererParams<any>>();
}
