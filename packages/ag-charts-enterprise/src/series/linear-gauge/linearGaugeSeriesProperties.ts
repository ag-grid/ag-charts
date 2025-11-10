import { type RichFormatter, type TextOrSegments, _ModuleSupport } from 'ag-charts-community';
import { Property, BaseProperties, PropertiesArray} from 'ag-charts-core';
import type { InternalAgGradientColor, RequireOptional } from 'ag-charts-core';
import type {
    AgChartLabelFormatterParams,
    AgGradientColorMode,
    AgLinearGaugeLabelPlacement,
    AgLinearGaugeMarkerShape,
    AgLinearGaugeOptions,
    AgLinearGaugeSeriesStyle,
    AgLinearGaugeTargetPlacement,
    AgLinearGaugeTooltipRendererParams,
    FontStyle,
    FontWeight,
    OverflowStrategy,
    TextWrap,
} from 'ag-charts-types';

import { GaugeSegmentationProperties } from '../gauge-util/segmentation';
import { AutoSizedLabel } from '../util/autoSizedLabel';

const {
    makeSeriesTooltip,
    SeriesProperties,
    Label,
    AxisLabel,
    getColorStops,
} = _ModuleSupport;

export enum NodeDataType {
    Node,
    Target,
}

export type LinearGaugeNodeDatumIndex = { type: NodeDataType.Node } | { type: NodeDataType.Target; index: number };

export interface LinearGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum<LinearGaugeNodeDatumIndex> {
    type: NodeDataType.Node;
    readonly itemId: 'value' | 'scale' | `value-${number}` | `scale-${number}`;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    clipX0: number | undefined;
    clipY0: number | undefined;
    clipX1: number | undefined;
    clipY1: number | undefined;
    topLeftCornerRadius: number;
    topRightCornerRadius: number;
    bottomRightCornerRadius: number;
    bottomLeftCornerRadius: number;
    horizontalInset: number;
    verticalInset: number;
    style: AgLinearGaugeSeriesStyle;
}

export interface LinearGaugeTargetDatumLabel {
    offsetX: number;
    offsetY: number;
    fill: string | undefined;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    fontFamily: string;
    lineHeight: number | undefined;
}

export interface LinearGaugeTargetDatum extends _ModuleSupport.SeriesNodeDatum<LinearGaugeNodeDatumIndex> {
    type: NodeDataType.Target;
    readonly itemId: `target-${number}`;
    value: number;
    text: string | undefined;
    x: number;
    y: number;
    shape: AgLinearGaugeMarkerShape;
    size: number;
    rotation: number;
    label: LinearGaugeTargetDatumLabel;
    style: AgLinearGaugeSeriesStyle;
}
export type LinearGaugeLabelDatum = {
    placement: AgLinearGaugeLabelPlacement;
    avoidCollisions: boolean;
    spacing: number;
    text: TextOrSegments | undefined;
    value: number;
    fill: string | undefined;
    fontStyle: FontStyle | undefined;
    fontWeight: FontWeight | undefined;
    fontSize: number;
    minimumFontSize: number | undefined;
    fontFamily: string;
    lineHeight: number | undefined;
    wrapping: TextWrap;
    overflowStrategy: OverflowStrategy;
    formatter: RichFormatter<AgChartLabelFormatterParams<any>> | undefined;
};

class LinearGaugeDefaultTargetLabelProperties extends Label<never> {
    @Property
    spacing: number | undefined;
}

export class LinearGaugeTargetProperties extends BaseProperties {
    @Property
    text: string | undefined;

    @Property
    value: number = 0;

    @Property
    shape: AgLinearGaugeMarkerShape | undefined;

    @Property
    placement: AgLinearGaugeTargetPlacement | undefined;

    @Property
    spacing: number | undefined;

    @Property
    size: number | undefined;

    @Property
    rotation: number | undefined;

    @Property
    fill: string | undefined;

    @Property
    fillOpacity: number | undefined;

    @Property
    stroke: string | undefined;

    @Property
    strokeWidth: number | undefined;

    @Property
    strokeOpacity: number | undefined;

    @Property
    lineDash: number[] | undefined;

    @Property
    lineDashOffset: number | undefined;

    @Property
    readonly label = new LinearGaugeDefaultTargetLabelProperties();

    getStyle(defaultTarget: LinearGaugeTargetProperties): Required<AgLinearGaugeSeriesStyle> {
        const {
            fill = defaultTarget.fill ?? 'black',
            fillOpacity = defaultTarget.fillOpacity ?? 1,
            stroke = defaultTarget.stroke ?? 'black',
            strokeWidth = defaultTarget.strokeWidth ?? 0,
            strokeOpacity = defaultTarget.strokeOpacity ?? 1,
            lineDash = defaultTarget.lineDash ?? [0],
            lineDashOffset = defaultTarget.lineDashOffset ?? 0,
        } = this;

        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }
}

class LinearGaugeBarProperties extends BaseProperties {
    @Property
    enabled = true;

    @Property
    thickness: number | undefined;

    @Property
    thicknessRatio: number = 1;

    @Property
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @Property
    fillMode: AgGradientColorMode = 'continuous';

    @Property
    fill: string | undefined;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string = 'black';

    @Property
    strokeWidth: number = 0;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    getStyle(
        defaultColorRange: string[],
        horizontal: boolean,
        scale: _ModuleSupport.LinearScale
    ): RequireOptional<AgLinearGaugeSeriesStyle> {
        const { fill, fills, fillMode, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } =
            this;

        const barFill = fill ?? createLinearGradient(fills, fillMode, defaultColorRange, scale, horizontal);

        return {
            fill: barFill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }
}

class LinearGaugeScaleIntervalProperties extends BaseProperties {
    @Property
    values?: number[] = undefined;

    @Property
    step?: number = undefined;

    @Property
    minSpacing: number = 0;

    @Property
    maxSpacing: number = 1000;
}

class LinearGaugeScaleLabelProperties extends AxisLabel {
    @Property
    placement?: 'before' | 'after' = undefined;
}

class LinearGaugeScaleProperties extends BaseProperties {
    @Property
    min: number = 0;

    @Property
    max: number = 1;

    @Property
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @Property
    fillMode: AgGradientColorMode = 'continuous';

    @Property
    fill: _ModuleSupport.ShapeColor | undefined;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string = 'black';

    @Property
    strokeWidth: number = 0;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    defaultFill: string = 'black';

    @Property
    readonly interval = new LinearGaugeScaleIntervalProperties();

    @Property
    readonly label = new LinearGaugeScaleLabelProperties();

    getStyle(
        barEnabled: boolean,
        defaultColorRange: string[],
        horizontal: boolean,
        scale: _ModuleSupport.LinearScale
    ): RequireOptional<AgLinearGaugeSeriesStyle> {
        const {
            fill,
            fills,
            defaultFill,
            fillMode,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        } = this;

        const scaleFill =
            fill ??
            (barEnabled && fills.length === 0 ? defaultFill : undefined) ??
            createLinearGradient(fills, fillMode, defaultColorRange, scale, horizontal);

        return {
            fill: scaleFill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }
}

export class LinearGaugeLabelProperties extends AutoSizedLabel<unknown> {
    @Property
    text?: string;

    @Property
    placement: AgLinearGaugeLabelPlacement = 'inside-center';

    @Property
    avoidCollisions: boolean = true;
}

export class LinearGaugeSeriesProperties extends SeriesProperties<AgLinearGaugeOptions> {
    @Property
    value: number = 0;

    @Property
    readonly segmentation = new GaugeSegmentationProperties();

    @Property
    defaultColorRange: string[] = [];

    @Property
    targets = new PropertiesArray<LinearGaugeTargetProperties>(LinearGaugeTargetProperties);

    @Property
    defaultTarget = new LinearGaugeTargetProperties();

    @Property
    defaultScale = new LinearGaugeScaleProperties();

    @Property
    direction: 'horizontal' | 'vertical' = 'vertical';

    @Property
    thickness: number = 1;

    @Property
    cornerRadius: number = 0;

    @Property
    cornerMode: 'container' | 'item' = 'container';

    @Property
    margin: number = 0;

    @Property
    readonly scale = new LinearGaugeScaleProperties();

    @Property
    readonly bar = new LinearGaugeBarProperties();

    @Property
    readonly label = new LinearGaugeLabelProperties();

    @Property
    readonly tooltip = makeSeriesTooltip<AgLinearGaugeTooltipRendererParams>();
}

export function createLinearGradient(
    fills: _ModuleSupport.StopProperties[],
    fillMode: AgGradientColorMode,
    defaultColorRange: string[],
    scale: _ModuleSupport.LinearScale,
    horizontal: boolean
): InternalAgGradientColor {
    const colorStops = getColorStops(fills, defaultColorRange, scale.domain, fillMode);
    return {
        type: 'gradient',
        gradient: 'linear',
        colorSpace: 'oklch',
        colorStops,
        rotation: horizontal ? 90 : 0,
        bounds: 'series',
    };
}
