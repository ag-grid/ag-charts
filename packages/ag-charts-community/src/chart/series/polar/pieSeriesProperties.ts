/* eslint-disable sonarjs/no-duplicate-string */
import type {
    AgPieSeriesFormat,
    AgPieSeriesFormatterParams,
    AgPieSeriesLabelFormatterParams,
    AgPieSeriesOptions,
    AgPieSeriesTooltipRendererParams,
} from '../../../options/series/polar/pieOptions';
import { DropShadow } from '../../../scene/dropShadow';
import { Deprecated } from '../../../util/deprecation';
import { BaseProperties, PropertiesArray } from '../../../util/properties';
import {
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    DEGREE,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT,
    OBJECT_ARRAY,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../../util/validation';
import { Caption } from '../../caption';
import { Label } from '../../label';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';

export class PieTitle extends Caption {
    @Validate(BOOLEAN)
    showInLegend = false;
}

export class DonutInnerLabel<T extends object = any> extends Label<AgPieSeriesLabelFormatterParams> {
    @Deprecated('Use a Donut Series instead')
    @Validate(STRING, { optional: true })
    text?: string;

    @Deprecated('Use a Donut Series instead')
    @Validate(NUMBER, { optional: true })
    margin?: number;

    override set(properties: T, _reset?: boolean) {
        return super.set(properties);
    }
}

export class DonutInnerCircle extends BaseProperties {
    @Deprecated('Use a Donut Series instead')
    @Validate(COLOR_STRING, { optional: true })
    fill?: string;

    @Deprecated('Use a Donut Series instead')
    @Validate(RATIO, { optional: true })
    fillOpacity?: number;
}

class PieSeriesCalloutLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @Validate(POSITIVE_NUMBER)
    offset = 3; // from the callout line

    @Validate(DEGREE)
    minAngle = 0;

    @Validate(POSITIVE_NUMBER)
    minSpacing = 4;

    @Validate(POSITIVE_NUMBER)
    maxCollisionOffset = 50;

    @Validate(BOOLEAN)
    avoidCollisions = true;
}

class PieSeriesSectorLabel extends Label<AgPieSeriesLabelFormatterParams> {
    @Validate(NUMBER)
    positionOffset = 0;

    @Validate(RATIO)
    positionRatio = 0.5;
}

class PieSeriesCalloutLine extends BaseProperties {
    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colors?: string[];

    @Validate(POSITIVE_NUMBER)
    length: number = 10;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;
}

export class PieSeriesProperties extends SeriesProperties<AgPieSeriesOptions> {
    @Validate(STRING)
    angleKey!: string;

    @Validate(STRING, { optional: true })
    angleName?: string;

    @Validate(STRING, { optional: true })
    radiusKey?: string;

    @Validate(STRING, { optional: true })
    radiusName?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    radiusMin?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    radiusMax?: number;

    @Validate(STRING, { optional: true })
    calloutLabelKey?: string;

    @Validate(STRING, { optional: true })
    calloutLabelName?: string;

    @Validate(STRING, { optional: true })
    sectorLabelKey?: string;

    @Validate(STRING, { optional: true })
    sectorLabelName?: string;

    @Validate(STRING, { optional: true })
    legendItemKey?: string;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = Object.values(DEFAULT_FILLS);

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat;

    @Validate(DEGREE)
    rotation: number = 0;

    @Validate(NUMBER)
    outerRadiusOffset: number = 0;

    @Validate(RATIO)
    outerRadiusRatio: number = 1;

    @Deprecated('Use a Donut Series instead')
    @Validate(NUMBER, { optional: true })
    innerRadiusOffset?: number;

    @Deprecated('Use a Donut Series instead')
    @Validate(RATIO, { optional: true })
    innerRadiusRatio?: number;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    // @todo(AG-10275) remove optionality, set default
    @Validate(POSITIVE_NUMBER, { optional: true })
    sectorSpacing?: number = undefined;

    @Validate(OBJECT_ARRAY)
    readonly innerLabels = new PropertiesArray(DonutInnerLabel);

    @Validate(OBJECT)
    readonly title = new PieTitle();

    @Validate(OBJECT)
    readonly innerCircle = new DonutInnerCircle();

    @Validate(OBJECT)
    readonly shadow = new DropShadow();

    @Validate(OBJECT)
    readonly calloutLabel = new PieSeriesCalloutLabel();

    @Validate(OBJECT)
    readonly sectorLabel = new PieSeriesSectorLabel();

    @Validate(OBJECT)
    readonly calloutLine = new PieSeriesCalloutLine();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgPieSeriesTooltipRendererParams>();

    // @todo(AG-10275) Remove this
    @Validate(STRING, { optional: true })
    __BACKGROUND_COLOR_DO_NOT_USE?: string = undefined;
}
