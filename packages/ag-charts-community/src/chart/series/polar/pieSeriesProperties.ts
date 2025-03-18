import type {
    AgColorType,
    AgPieSeriesItemStylerParams,
    AgPieSeriesLabelFormatterParams,
    AgPieSeriesOptions,
    AgPieSeriesStyle,
    AgPieSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { BaseProperties } from '../../../util/properties';
import {
    ARRAY_OF,
    BOOLEAN,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    OR,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TempValidate,
} from '../../../util/validation';
import { Caption } from '../../caption';
import { Label } from '../../label';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class PieTitle extends Caption {
    @TempValidate(BOOLEAN)
    showInLegend = false;
}

class PieSeriesCalloutLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @TempValidate(POSITIVE_NUMBER)
    offset = 3; // from the callout line

    @TempValidate(NUMBER.restrict({ min: 0, max: 360 }))
    minAngle = 0;

    @TempValidate(POSITIVE_NUMBER)
    minSpacing = 4;

    @TempValidate(POSITIVE_NUMBER)
    maxCollisionOffset = 50;

    @TempValidate(BOOLEAN)
    avoidCollisions = true;
}

class PieSeriesSectorLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @TempValidate(NUMBER)
    positionOffset = 0;

    @TempValidate(RATIO)
    positionRatio = 0.5;
}

class PieSeriesCalloutLine extends BaseProperties {
    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN)), { optional: true })
    colors?: AgColorType[];

    @TempValidate(POSITIVE_NUMBER)
    length: number = 10;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;
}

export class PieSeriesProperties extends SeriesProperties<AgPieSeriesOptions> {
    @TempValidate(STRING)
    angleKey!: string;

    @TempValidate(STRING, { optional: true })
    angleName?: string;

    @TempValidate(STRING, { optional: true })
    angleFilterKey?: string;

    @TempValidate(STRING, { optional: true })
    radiusKey?: string;

    @TempValidate(STRING, { optional: true })
    radiusName?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    radiusMin?: number;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    radiusMax?: number;

    @TempValidate(STRING, { optional: true })
    calloutLabelKey?: string;

    @TempValidate(STRING, { optional: true })
    calloutLabelName?: string;

    @TempValidate(STRING, { optional: true })
    sectorLabelKey?: string;

    @TempValidate(STRING, { optional: true })
    sectorLabelName?: string;

    @TempValidate(STRING, { optional: true })
    legendItemKey?: string;

    @TempValidate(ARRAY_OF(COLOR_STRING_ARRAY))
    defaultColorRange: string[][] = [];

    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN)))
    fills: AgColorType[] = Object.values(DEFAULT_FILLS);

    @TempValidate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @TempValidate(RATIO)
    fillOpacity = 1;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgPieSeriesItemStylerParams<unknown>, AgPieSeriesStyle>;

    @TempValidate(NUMBER)
    rotation: number = 0;

    @TempValidate(NUMBER)
    outerRadiusOffset: number = 0;

    @TempValidate(RATIO)
    outerRadiusRatio: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(NUMBER)
    sectorSpacing: number = 0;

    @TempValidate(BOOLEAN)
    hideZeroValueSectorsInLegend = false;

    @TempValidate(OBJECT)
    readonly title = new PieTitle();

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow();

    @TempValidate(OBJECT)
    readonly calloutLabel = new PieSeriesCalloutLabel();

    @TempValidate(OBJECT)
    readonly sectorLabel = new PieSeriesSectorLabel();

    @TempValidate(OBJECT)
    readonly calloutLine = new PieSeriesCalloutLine();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgPieSeriesTooltipRendererParams<any>>();
}
