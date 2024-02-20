import type { AgBaseCrossLineLabelOptions, FontStyle, FontWeight, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const {
    ChartAxisDirection,
    Layers,
    ARRAY,
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    LINE_DASH,
    NUMBER,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    UNION,
    AND,
    Validate,
    MATCHING_CROSSLINE_TYPE,
} = _ModuleSupport;

const { Group } = _Scene;
const { createId } = _Util;

export class PolarCrossLineLabel implements AgBaseCrossLineLabelOptions {
    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean = undefined;

    @Validate(STRING, { optional: true })
    text?: string = undefined;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle = undefined;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight = undefined;

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
    parallel?: boolean = undefined;
}

export abstract class PolarCrossLine implements _ModuleSupport.CrossLine {
    protected static readonly LINE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_LINE_ZINDEX;
    protected static readonly RANGE_LAYER_ZINDEX = Layers.SERIES_CROSSLINE_RANGE_ZINDEX;
    protected static readonly LABEL_LAYER_ZINDEX = Layers.SERIES_LABEL_ZINDEX;
    readonly id = createId(this);

    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean = undefined;

    @Validate(UNION(['range', 'line'], 'a crossLine type'), { optional: true })
    type?: _ModuleSupport.CrossLineType = undefined;

    @Validate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
    range?: [any, any] = undefined;

    @Validate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
    value?: any = undefined;

    @Validate(COLOR_STRING, { optional: true })
    fill?: string = undefined;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number = undefined;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = undefined;

    @Validate(NUMBER, { optional: true })
    strokeWidth?: number = undefined;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number = undefined;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: [] = undefined;

    shape: 'polygon' | 'circle' = 'polygon';

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

    readonly group = new Group({ name: `${this.id}`, layer: true, zIndex: PolarCrossLine.LINE_LAYER_ZINDEX });
    readonly labelGroup = new Group({ name: `${this.id}`, layer: true, zIndex: PolarCrossLine.LABEL_LAYER_ZINDEX });

    abstract update(visible: boolean): void;

    calculatePadding() {}

    protected setSectorNodeProps(node: _Scene.Path | _Scene.Sector) {
        node.fill = this.fill;
        node.fillOpacity = this.fillOpacity ?? 1;
        node.stroke = this.stroke;
        node.strokeOpacity = this.strokeOpacity ?? 1;
        node.strokeWidth = this.strokeWidth ?? 1;
        node.lineDash = this.lineDash;
    }

    protected setLabelNodeProps(
        node: _Scene.Text,
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

    calculateLayout(_visible: boolean): _Scene.BBox | undefined {
        return;
    }
}
