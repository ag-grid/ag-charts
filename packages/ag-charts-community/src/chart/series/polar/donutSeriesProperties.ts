import type {
    AgDonutSeriesItemStylerParams,
    AgDonutSeriesLabelFormatterParams,
    AgDonutSeriesOptions,
    AgDonutSeriesStyle,
    AgDonutSeriesTooltipRendererParams,
    AgFillType,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { BaseProperties, PropertiesArray } from '../../../util/properties';
import {
    ARRAY_OF,
    BOOLEAN,
    COLOR_GRADIENT,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    OBJECT_ARRAY,
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

export class DonutTitle extends Caption {
    @TempValidate(BOOLEAN)
    showInLegend = false;
}

export class DonutInnerLabel<T extends object = any> extends Label<AgDonutSeriesLabelFormatterParams> {
    @TempValidate(STRING)
    text!: string;

    @TempValidate(NUMBER)
    spacing: number = 2;

    override set(properties: T, _reset?: boolean) {
        return super.set(properties);
    }
}

class DonutInnerCircle extends BaseProperties {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING))
    fill: AgFillType = 'transparent';

    @TempValidate(RATIO)
    fillOpacity: number = 1;
}

class DonutSeriesCalloutLabel extends Label<AgDonutSeriesLabelFormatterParams> {
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

class DonutSeriesSectorLabel extends Label<AgDonutSeriesLabelFormatterParams> {
    @TempValidate(NUMBER)
    positionOffset = 0;

    @TempValidate(RATIO)
    positionRatio = 0.5;
}

class DonutSeriesCalloutLine extends BaseProperties {
    @TempValidate(OR(ARRAY_OF(COLOR_GRADIENT), COLOR_STRING_ARRAY), { optional: true })
    colors?: AgFillType[];

    @TempValidate(POSITIVE_NUMBER)
    length: number = 10;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;
}

export class DonutSeriesProperties extends SeriesProperties<AgDonutSeriesOptions> {
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

    @TempValidate(OR(ARRAY_OF(COLOR_GRADIENT), COLOR_STRING_ARRAY))
    fills: AgFillType[] = Object.values(DEFAULT_FILLS);

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
    itemStyler?: Styler<AgDonutSeriesItemStylerParams<unknown>, AgDonutSeriesStyle>;

    @TempValidate(NUMBER)
    rotation: number = 0;

    @TempValidate(NUMBER)
    outerRadiusOffset: number = 0;

    @TempValidate(RATIO)
    outerRadiusRatio: number = 1;

    @TempValidate(NUMBER, { optional: true })
    innerRadiusOffset?: number;

    @TempValidate(RATIO, { optional: true })
    innerRadiusRatio?: number;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(NUMBER)
    sectorSpacing: number = 0;

    @TempValidate(BOOLEAN)
    hideZeroValueSectorsInLegend = false;

    @TempValidate(OBJECT_ARRAY)
    readonly innerLabels = new PropertiesArray(DonutInnerLabel);

    @TempValidate(OBJECT)
    readonly title = new DonutTitle();

    @TempValidate(OBJECT)
    readonly innerCircle = new DonutInnerCircle();

    @TempValidate(OBJECT)
    readonly shadow = new DropShadow();

    @TempValidate(OBJECT)
    readonly calloutLabel = new DonutSeriesCalloutLabel();

    @TempValidate(OBJECT)
    readonly sectorLabel = new DonutSeriesSectorLabel();

    @TempValidate(OBJECT)
    readonly calloutLine = new DonutSeriesCalloutLine();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgDonutSeriesTooltipRendererParams<any>>();
}
