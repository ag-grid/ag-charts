import type { AgBaseCrossLineLabelOptions, FontStyle, FontWeight, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const {
    BaseProperties,
    ChartAxisDirection,
    zIndexMap,
    ARRAY,
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    LINE_DASH,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    AND,
    Validate,
    MATCHING_CROSSLINE_TYPE,
} = _ModuleSupport;

const { Layer } = _Scene;
const { createId } = _Util;

export class PolarCrossLineLabel extends BaseProperties implements AgBaseCrossLineLabelOptions {
    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @Validate(POSITIVE_NUMBER)
    fontSize: number = 14;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the label and the line.
     */
    @Validate(NUMBER)
    padding: number = 5;

    /**
     * The color of the labels.
     */
    @Validate(COLOR_STRING, { optional: true })
    color?: string = 'rgba(87, 87, 87, 1)';

    @Validate(BOOLEAN, { optional: true })
    parallel?: boolean;
}

export abstract class PolarCrossLine extends BaseProperties implements _ModuleSupport.CrossLine {
    protected static readonly LINE_LAYER_ZINDEX = zIndexMap.SERIES_CROSSLINE_LINE;
    protected static readonly RANGE_LAYER_ZINDEX = zIndexMap.SERIES_CROSSLINE_RANGE;
    protected static readonly LABEL_LAYER_ZINDEX = zIndexMap.SERIES_LABEL;
    readonly id = createId(this);

    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @Validate(UNION(['range', 'line'], 'a crossLine type'), { optional: true })
    type?: _ModuleSupport.CrossLineType;

    @Validate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
    range?: [any, any];

    @Validate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
    value?: any;

    @Validate(COLOR_STRING, { optional: true })
    fill?: string;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: [];

    @Validate(UNION(['polygon', 'circle'], 'a shape'))
    shape: 'polygon' | 'circle' = 'polygon';

    @Validate(OBJECT)
    label = new PolarCrossLineLabel();

    scale?: _Scale.Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction: _ModuleSupport.ChartAxisDirection = ChartAxisDirection.X;

    axisInnerRadius: number = 0;
    axisOuterRadius: number = 0;

    readonly group = new Layer({ name: this.id, zIndex: PolarCrossLine.LINE_LAYER_ZINDEX });
    readonly labelGroup = new Layer({ name: this.id, zIndex: PolarCrossLine.LABEL_LAYER_ZINDEX });

    abstract update(visible: boolean): void;

    protected setSectorNodeProps(node: _Scene.Path | _Scene.Sector) {
        node.fill = this.fill;
        node.fillOpacity = this.fillOpacity ?? 1;
        node.stroke = this.stroke;
        node.strokeOpacity = this.strokeOpacity ?? 1;
        node.strokeWidth = this.strokeWidth ?? 1;
        node.lineDash = this.lineDash;
    }

    protected setLabelNodeProps(
        node: _Scene.RotatableText,
        x: number,
        y: number,
        baseline: CanvasTextBaseline,
        rotation: number
    ) {
        const { label } = this;

        node.x = x;
        node.y = y;
        node.text = label.text;
        node.textAlign = 'center';
        node.textBaseline = baseline;

        node.rotation = rotation;
        node.rotationCenterX = x;
        node.rotationCenterY = y;

        node.fill = label.color;
        node.fontFamily = label.fontFamily;
        node.fontSize = label.fontSize;
        node.fontStyle = label.fontStyle;

        node.visible = true;
    }
}
