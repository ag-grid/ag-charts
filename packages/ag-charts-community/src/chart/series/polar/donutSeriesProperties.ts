import type { InternalAgColorType } from 'ag-charts-core';
import { BaseProperties, PropertiesArray, Property } from 'ag-charts-core';
import type {
    AgDonutCalloutLineItemStylerParams,
    AgDonutCalloutLineItemStylerResult,
    AgDonutSeriesItemStylerParams,
    AgDonutSeriesLabelFormatterParams,
    AgDonutSeriesOptions,
    AgDonutSeriesStyle,
    AgDonutSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-types';

import { DropShadow } from '../../../scene/dropShadow';
import { Caption } from '../../caption';
import { Label } from '../../label';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
import { makeSeriesTooltip } from '../seriesTooltip';

export class DonutTitle extends Caption {
    @Property
    showInLegend = false;
}

export class DonutInnerLabel<T extends object = any> extends Label<AgDonutSeriesLabelFormatterParams> {
    @Property
    text!: string;

    @Property
    spacing: number = 2;

    override set(properties: T, _reset?: boolean) {
        return super.set(properties);
    }
}

class DonutInnerCircle extends BaseProperties {
    @Property
    fill: string = 'transparent';

    @Property
    fillOpacity: number = 1;
}

class DonutSeriesCalloutLabel extends Label<AgDonutSeriesLabelFormatterParams> {
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

class DonutSeriesSectorLabel extends Label<AgDonutSeriesLabelFormatterParams> {
    @Property
    positionOffset = 0;

    @Property
    positionRatio = 0.5;
}

class DonutSeriesCalloutLine extends BaseProperties {
    @Property
    colors?: Exclude<InternalAgColorType, object>[];

    @Property
    length: number = 10;

    @Property
    strokeWidth: number = 1;

    @Property
    itemStyler?: Styler<AgDonutCalloutLineItemStylerParams<unknown, unknown>, AgDonutCalloutLineItemStylerResult>;
}

export class DonutSeriesProperties extends SeriesProperties<AgDonutSeriesOptions> {
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
    itemStyler?: Styler<AgDonutSeriesItemStylerParams<unknown>, AgDonutSeriesStyle>;

    @Property
    rotation: number = 0;

    @Property
    outerRadiusOffset: number = 0;

    @Property
    outerRadiusRatio: number = 1;

    @Property
    innerRadiusOffset?: number;

    @Property
    innerRadiusRatio?: number;

    @Property
    strokeWidth: number = 1;

    @Property
    sectorSpacing: number = 0;

    @Property
    hideZeroValueSectorsInLegend = false;

    @Property
    readonly innerLabels = new PropertiesArray(DonutInnerLabel);

    @Property
    readonly title = new DonutTitle();

    @Property
    readonly innerCircle = new DonutInnerCircle();

    @Property
    readonly shadow = new DropShadow();

    @Property
    readonly calloutLabel = new DonutSeriesCalloutLabel();

    @Property
    readonly sectorLabel = new DonutSeriesSectorLabel();

    @Property
    readonly calloutLine = new DonutSeriesCalloutLine();

    @Property
    readonly tooltip = makeSeriesTooltip<AgDonutSeriesTooltipRendererParams<any>>();
}
