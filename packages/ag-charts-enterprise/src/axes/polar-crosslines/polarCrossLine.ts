import type { AgBaseCrossLineLabelOptions, AgFillType, FontStyle, FontWeight } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const {
    BaseProperties,
    ChartAxisDirection,
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
    OR,
    COLOR_GRADIENT,
    COLOR_STRING_ARRAY,
    TempValidate,
    MATCHING_CROSSLINE_TYPE,
    createId,
    Group,
} = _ModuleSupport;

export class PolarCrossLineLabel extends BaseProperties implements AgBaseCrossLineLabelOptions {
    @TempValidate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @TempValidate(STRING, { optional: true })
    text?: string;

    @TempValidate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @TempValidate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @TempValidate(POSITIVE_NUMBER)
    fontSize: number = 14;

    @TempValidate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the label and the line.
     */
    @TempValidate(NUMBER)
    padding: number = 5;

    /**
     * The color of the labels.
     */
    @TempValidate(COLOR_STRING, { optional: true })
    color?: string = 'rgba(87, 87, 87, 1)';

    @TempValidate(BOOLEAN, { optional: true })
    parallel?: boolean;
}

export abstract class PolarCrossLine extends BaseProperties implements _ModuleSupport.CrossLine {
    readonly id = createId(this);

    @TempValidate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @TempValidate(UNION(['range', 'line'], 'a crossLine type'))
    type!: _ModuleSupport.CrossLineType;

    @TempValidate(AND(MATCHING_CROSSLINE_TYPE('range'), ARRAY.restrict({ length: 2 })), {
        optional: true,
    })
    range?: [unknown, unknown];

    @TempValidate(MATCHING_CROSSLINE_TYPE('value'), { optional: true })
    value?: unknown;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING), { optional: true })
    fill?: AgFillType;

    @TempValidate(RATIO, { optional: true })
    fillOpacity?: number;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(NUMBER, { optional: true })
    strokeWidth?: number;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash?: [];

    @TempValidate(UNION(['polygon', 'circle'], 'a shape'))
    shape: 'polygon' | 'circle' = 'polygon';

    @TempValidate(OBJECT)
    label = new PolarCrossLineLabel();

    scale?: _ModuleSupport.Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction: _ModuleSupport.ChartAxisDirection = ChartAxisDirection.X;

    axisInnerRadius: number = 0;
    axisOuterRadius: number = 0;

    readonly lineGroup = new Group({ name: this.id });
    readonly rangeGroup = new Group({ name: this.id });
    readonly labelGroup = new Group({ name: this.id });

    private _isRange: boolean | undefined = undefined;
    protected assignCrossLineGroup(isRange: boolean, crossLineRange: _ModuleSupport.Node) {
        if (isRange !== this._isRange) {
            if (isRange) {
                this.rangeGroup.appendChild(crossLineRange);
            } else {
                this.lineGroup.appendChild(crossLineRange);
            }
        }
        this._isRange = isRange;
    }

    abstract update(visible: boolean): void;

    protected setSectorNodeProps(node: _ModuleSupport.Path | _ModuleSupport.Sector) {
        node.fill = this.fill;
        node.fillOpacity = this.fillOpacity ?? 1;
        node.stroke = this.stroke;
        node.strokeOpacity = this.strokeOpacity ?? 1;
        node.strokeWidth = this.strokeWidth ?? 1;
        node.lineDash = this.lineDash;
    }

    protected setLabelNodeProps(
        node: _ModuleSupport.RotatableText,
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
