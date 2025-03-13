import { _ModuleSupport } from 'ag-charts-community';
import type { RequireOptional } from 'ag-charts-core';
import type {
    AgChartLabelFormatterParams,
    AgGradientFillMode,
    AgLinearGaugeItemStylerParams,
    AgLinearGaugeLabelFormatterParams,
    AgLinearGaugeLabelPlacement,
    AgLinearGaugeMarkerShape,
    AgLinearGaugeOptions,
    AgLinearGaugeStyle,
    AgLinearGaugeTargetPlacement,
    AgLinearGaugeTooltipRendererParams,
    FontStyle,
    FontWeight,
    Formatter,
    OverflowStrategy,
    Styler,
    TextWrap,
} from 'ag-charts-types';

import { CORNER_MODE, FILL_MODE, TARGET_MARKER_SHAPE } from '../gauge-util/properties';
import { GaugeSegmentationProperties } from '../gauge-util/segmentation';
import { AutoSizedLabel } from '../util/autoSizedLabel';

const {
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    PropertiesArray,
    TempValidate,
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    NUMBER,
    OBJECT_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    NUMBER_ARRAY,
    UNION,
    AND,
    LESS_THAN,
    GREATER_THAN,
    Label,
    AxisLabel,
} = _ModuleSupport;

const TARGET_PLACEMENT = UNION(['before', 'after', 'middle'], 'a placement');
const LABEL_PLACEMENT = UNION(
    [
        'inside-start',
        'outside-start',
        'inside-end',
        'outside-end',
        'inside-center',
        'bar-inside',
        'bar-inside-end',
        'bar-outside-end',
        'bar-end',
    ],
    'an placement'
);
const DIRECTION = UNION(['horizontal', 'vertical'], 'an orientation');

export enum NodeDataType {
    Node,
    Target,
}

export type LinearGaugeNodeDatumIndex = { type: NodeDataType.Node } | { type: NodeDataType.Target; index: number };

export interface LinearGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum<LinearGaugeNodeDatumIndex> {
    type: NodeDataType.Node;
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
    fill: string | _ModuleSupport.Gradient | undefined;
    horizontalInset: number;
    verticalInset: number;
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
    value: number;
    text: string | undefined;
    x: number;
    y: number;
    shape: AgLinearGaugeMarkerShape;
    size: number;
    rotation: number;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
    lineDashOffset: number;
    label: LinearGaugeTargetDatumLabel;
}
export type LinearGaugeLabelDatum = {
    placement: AgLinearGaugeLabelPlacement;
    avoidCollisions: boolean;
    spacing: number;
    text: string | undefined;
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
    formatter:
        | Formatter<AgChartLabelFormatterParams<any> & RequireOptional<AgLinearGaugeLabelFormatterParams>>
        | undefined;
};

const PLACEMENT = UNION(['before', 'after'], 'a placement');

class LinearGaugeDefaultTargetLabelProperties extends Label<never> {
    @TempValidate(NUMBER, { optional: true })
    spacing: number | undefined;
}

export class LinearGaugeTargetProperties extends BaseProperties {
    @TempValidate(STRING, { optional: true })
    text: string | undefined;

    @TempValidate(NUMBER)
    value: number = 0;

    @TempValidate(TARGET_MARKER_SHAPE, { optional: true })
    shape: AgLinearGaugeMarkerShape | undefined;

    @TempValidate(TARGET_PLACEMENT, { optional: true })
    placement: AgLinearGaugeTargetPlacement | undefined;

    @TempValidate(NUMBER, { optional: true })
    spacing: number | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    size: number | undefined;

    @TempValidate(NUMBER, { optional: true })
    rotation: number | undefined;

    @TempValidate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @TempValidate(RATIO, { optional: true })
    fillOpacity: number | undefined;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke: string | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number | undefined;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity: number | undefined;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash: number[] | undefined;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset: number | undefined;

    @TempValidate(OBJECT)
    readonly label = new LinearGaugeDefaultTargetLabelProperties();
}

class LinearGaugeBarProperties extends BaseProperties {
    @TempValidate(BOOLEAN)
    enabled = true;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    thickness: number | undefined;

    @TempValidate(RATIO)
    thicknessRatio: number = 1;

    @TempValidate(OBJECT_ARRAY)
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @TempValidate(FILL_MODE)
    fillMode: AgGradientFillMode = 'continuous';

    @TempValidate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

class LinearGaugeScaleIntervalProperties extends BaseProperties {
    @TempValidate(NUMBER_ARRAY, { optional: true })
    values?: number[] = undefined;

    @TempValidate(NUMBER, { optional: true })
    step?: number = undefined;

    @TempValidate(NUMBER)
    minSpacing: number = 0;

    @TempValidate(NUMBER)
    maxSpacing: number = 1000;
}

class LinearGaugeScaleLabelProperties extends AxisLabel {
    @TempValidate(PLACEMENT, { optional: true })
    placement?: 'before' | 'after' = undefined;
}

class LinearGaugeScaleProperties extends BaseProperties {
    @TempValidate(AND(NUMBER, LESS_THAN('max')))
    min: number = 0;

    @TempValidate(AND(NUMBER, GREATER_THAN('min')))
    max: number = 1;

    @TempValidate(OBJECT_ARRAY)
    fills = new PropertiesArray<_ModuleSupport.StopProperties>(_ModuleSupport.StopProperties);

    @TempValidate(FILL_MODE)
    fillMode: AgGradientFillMode = 'continuous';

    @TempValidate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = 'black';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(COLOR_STRING)
    defaultFill: string = 'black';

    @TempValidate(OBJECT)
    readonly interval = new LinearGaugeScaleIntervalProperties();

    @TempValidate(OBJECT)
    readonly label = new LinearGaugeScaleLabelProperties();
}

export class LinearGaugeLabelProperties extends AutoSizedLabel<AgLinearGaugeLabelFormatterParams> {
    @TempValidate(STRING, { optional: true })
    text?: string;

    @TempValidate(LABEL_PLACEMENT)
    placement: AgLinearGaugeLabelPlacement = 'inside-center';

    @TempValidate(BOOLEAN)
    avoidCollisions: boolean = true;
}

export class LinearGaugeSeriesProperties extends SeriesProperties<AgLinearGaugeOptions> {
    @TempValidate(NUMBER)
    value: number = 0;

    @TempValidate(OBJECT)
    readonly segmentation = new GaugeSegmentationProperties();

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OBJECT_ARRAY)
    targets = new PropertiesArray<LinearGaugeTargetProperties>(LinearGaugeTargetProperties);

    @TempValidate(OBJECT)
    defaultTarget = new LinearGaugeTargetProperties();

    @TempValidate(OBJECT)
    defaultScale = new LinearGaugeScaleProperties();

    @TempValidate(DIRECTION)
    direction: 'horizontal' | 'vertical' = 'vertical';

    @TempValidate(POSITIVE_NUMBER)
    thickness: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(CORNER_MODE)
    cornerMode: 'container' | 'item' = 'container';

    @TempValidate(NUMBER)
    margin: number = 0;

    @TempValidate(OBJECT)
    readonly scale = new LinearGaugeScaleProperties();

    @TempValidate(OBJECT)
    readonly bar = new LinearGaugeBarProperties();

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgLinearGaugeItemStylerParams, AgLinearGaugeStyle>;

    @TempValidate(OBJECT)
    readonly label = new LinearGaugeLabelProperties();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgLinearGaugeTooltipRendererParams>();
}
