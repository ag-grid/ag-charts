import type {
    AgDonutSeriesFormat,
    AgDonutSeriesFormatterParams,
    AgDonutSeriesLabelFormatterParams,
    AgDonutSeriesOptions,
    AgDonutSeriesTooltipRendererParams,
} from '../../../options/series/polar/donutOptions';
import { DropShadow } from '../../../scene/dropShadow';
import { Logger } from '../../../util/logger';
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

export class DonutTitle extends Caption {
    @Validate(BOOLEAN)
    showInLegend = false;
}

export class DonutInnerLabel<T extends object = any> extends Label<AgDonutSeriesLabelFormatterParams> {
    @Validate(STRING)
    text!: string;

    @Validate(NUMBER)
    margin: number = 2;

    override set(properties: T, _reset?: boolean) {
        return super.set(properties);
    }
}

export class DonutInnerCircle extends BaseProperties {
    @Validate(COLOR_STRING)
    fill: string = 'transparent';

    @Validate(RATIO)
    fillOpacity: number = 1;
}

class DonutSeriesCalloutLabel extends Label<AgDonutSeriesLabelFormatterParams> {
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

class DonutSeriesSectorLabel extends Label<AgDonutSeriesLabelFormatterParams> {
    @Validate(NUMBER)
    positionOffset = 0;

    @Validate(RATIO)
    positionRatio = 0.5;
}

class DonutSeriesCalloutLine extends BaseProperties {
    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colors?: string[];

    @Validate(POSITIVE_NUMBER)
    length: number = 10;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;
}

export class DonutSeriesProperties extends SeriesProperties<AgDonutSeriesOptions> {
    override isValid(): boolean {
        const superIsValid = super.isValid();

        if (this.innerRadiusRatio == null && this.innerRadiusOffset == null) {
            Logger.warnOnce(
                'Either an [innerRadiusRatio] or an [innerRadiusOffset] must be set to render a donut series.'
            );

            return false;
        }

        return superIsValid;
    }

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

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgDonutSeriesFormatterParams<any>) => AgDonutSeriesFormat;

    @Validate(DEGREE)
    rotation: number = 0;

    @Validate(NUMBER)
    outerRadiusOffset: number = 0;

    @Validate(RATIO)
    outerRadiusRatio: number = 1;

    @Validate(NUMBER, { optional: true })
    innerRadiusOffset?: number;

    @Validate(RATIO, { optional: true })
    innerRadiusRatio?: number;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(POSITIVE_NUMBER, { optional: true })
    sectorSpacing?: number = undefined;

    @Validate(OBJECT_ARRAY)
    readonly innerLabels = new PropertiesArray(DonutInnerLabel);

    @Validate(OBJECT)
    readonly title = new DonutTitle();

    @Validate(OBJECT)
    readonly innerCircle = new DonutInnerCircle();

    @Validate(OBJECT)
    readonly shadow = new DropShadow();

    @Validate(OBJECT)
    readonly calloutLabel = new DonutSeriesCalloutLabel();

    @Validate(OBJECT)
    readonly sectorLabel = new DonutSeriesSectorLabel();

    @Validate(OBJECT)
    readonly calloutLine = new DonutSeriesCalloutLine();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgDonutSeriesTooltipRendererParams>();

    // @todo(AG-10275) Remove this
    @Validate(STRING, { optional: true })
    __BACKGROUND_COLOR_DO_NOT_USE?: string = undefined;
}
