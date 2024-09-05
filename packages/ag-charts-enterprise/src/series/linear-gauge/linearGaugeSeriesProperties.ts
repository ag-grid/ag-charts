import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type {
    AgLinearGaugeMarkerShape,
    AgLinearGaugeSeriesItemStylerParams,
    AgLinearGaugeSeriesLabelFormatterParams,
    AgLinearGaugeSeriesOptions,
    AgLinearGaugeSeriesStyle,
    AgLinearGaugeSeriesTooltipRendererParams,
    AgLinearGaugeTargetPlacement,
    FontStyle,
    FontWeight,
    MarkerShape,
    Styler,
} from 'ag-charts-types';

import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const {
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    PropertiesArray,
    Validate,
    BOOLEAN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    MARKER_SHAPE,
    NUMBER,
    NUMBER_ARRAY,
    OBJECT_ARRAY,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    OR,
} = _ModuleSupport;
const { Label } = _Scene;

const TARGET_MARKER_SHAPE = OR(MARKER_SHAPE, UNION(['line'], 'a marker shape'));
const TARGET_PLACEMENT = UNION(['before', 'after', 'middle'], 'a placement');

export enum NodeDataType {
    Node,
    Target,
}

export interface LinearGaugeNodeDatum extends _ModuleSupport.SeriesNodeDatum {
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
    fill: string | _Scene.Gradient | undefined;
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

export interface LinearGaugeTargetDatum extends _ModuleSupport.SeriesNodeDatum {
    type: NodeDataType.Target;
    value: number;
    text: string | undefined;
    x: number;
    y: number;
    shape: MarkerShape;
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

class LinearGaugeDefaultTargetLabelProperties extends Label<never> {
    @Validate(NUMBER, { optional: true })
    spacing: number | undefined;
}

export class LinearGaugeTargetProperties extends BaseProperties {
    @Validate(STRING, { optional: true })
    text: string | undefined;

    @Validate(NUMBER)
    value: number = 0;

    @Validate(TARGET_MARKER_SHAPE, { optional: true })
    shape: AgLinearGaugeMarkerShape | undefined;

    @Validate(TARGET_PLACEMENT, { optional: true })
    placement: AgLinearGaugeTargetPlacement | undefined;

    @Validate(NUMBER, { optional: true })
    spacing: number | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    size: number | undefined;

    @Validate(NUMBER, { optional: true })
    rotation: number | undefined;

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @Validate(RATIO, { optional: true })
    fillOpacity: number | undefined;

    @Validate(COLOR_STRING, { optional: true })
    stroke: string | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number | undefined;

    @Validate(RATIO, { optional: true })
    strokeOpacity: number | undefined;

    @Validate(LINE_DASH, { optional: true })
    lineDash: number[] | undefined;

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset: number | undefined;

    @Validate(OBJECT)
    readonly label = new LinearGaugeDefaultTargetLabelProperties();
}

export class LinearGaugeBarProperties extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(POSITIVE_NUMBER, { optional: true })
    thickness: number | undefined;

    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colorRange: string[] | undefined;

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class LinearGaugeScaleProperties extends BaseProperties {
    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colorRange: string[] | undefined;

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined;

    @Validate(RATIO)
    fillOpacity: number = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @Validate(RATIO)
    strokeOpacity: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(COLOR_STRING)
    defaultFill: string = 'black';
}

export class LinearGaugeLabelProperties extends AutoSizedLabel<AgLinearGaugeSeriesLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;
}

export class LinearGaugeSecondaryLabelProperties extends AutoSizedSecondaryLabel<AgLinearGaugeSeriesLabelFormatterParams> {
    @Validate(STRING, { optional: true })
    text?: string;
}

export class LinearGaugeSeriesProperties extends SeriesProperties<AgLinearGaugeSeriesOptions> {
    @Validate(NUMBER)
    value: number = 0;

    @Validate(OR(NUMBER, NUMBER_ARRAY), { optional: true })
    segments: number[] | number | undefined;

    @Validate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @Validate(OBJECT_ARRAY)
    targets = new PropertiesArray<LinearGaugeTargetProperties>(LinearGaugeTargetProperties);

    @Validate(OBJECT)
    defaultTarget = new LinearGaugeTargetProperties();

    @Validate(BOOLEAN)
    horizontal: boolean = false;

    @Validate(POSITIVE_NUMBER)
    thickness: number = 1;

    @Validate(POSITIVE_NUMBER)
    barSpacing: number = 0;

    @Validate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @Validate(UNION(['container', 'item'], 'a corner mode'))
    cornerMode: 'container' | 'item' = 'container';

    @Validate(NUMBER)
    margin: number = 0;

    @Validate(OBJECT)
    readonly scale = new LinearGaugeScaleProperties();

    @Validate(OBJECT)
    readonly bar = new LinearGaugeBarProperties();

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgLinearGaugeSeriesItemStylerParams<unknown>, AgLinearGaugeSeriesStyle>;

    @Validate(OBJECT)
    readonly label = new LinearGaugeLabelProperties();

    @Validate(OBJECT)
    readonly secondaryLabel = new LinearGaugeSecondaryLabelProperties();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgLinearGaugeSeriesTooltipRendererParams<any>>();
}
