import type { AgBaseCrossLineLabelOptions, FontStyle, FontWeight } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, ChartAxisDirection, FONT_SIZE, Property, type Scale, createId } from 'ag-charts-core';

const { Group } = _ModuleSupport;
export class PolarCrossLineLabel extends BaseProperties implements AgBaseCrossLineLabelOptions {
    @Property
    enabled?: boolean;

    @Property
    text?: string;

    @Property
    fontStyle?: FontStyle;

    @Property
    fontWeight?: FontWeight;

    @Property
    fontSize: number = FONT_SIZE.LARGE;

    @Property
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the label and the line.
     */
    @Property
    padding: number = 5;

    /**
     * The color of the labels.
     */
    @Property
    color?: string = 'rgba(87, 87, 87, 1)';

    @Property
    parallel?: boolean;
}

export abstract class PolarCrossLine extends BaseProperties implements _ModuleSupport.PolarCrossLine {
    readonly id = createId(this);

    @Property
    enabled?: boolean;

    @Property
    type!: _ModuleSupport.CrossLineType;

    @Property
    range?: [unknown, unknown];

    @Property
    value?: unknown;

    @Property
    defaultColorRange: string[] = [];

    @Property
    fill?: string;

    @Property
    fillOpacity?: number;

    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;

    @Property
    lineDash?: [];

    @Property
    shape: 'polygon' | 'circle' = 'polygon';

    @Property
    label = new PolarCrossLineLabel();

    scale?: Scale<any, number> = undefined;
    clippedRange: [number, number] = [-Infinity, Infinity];
    gridLength: number = 0;
    sideFlag: 1 | -1 = -1;
    parallelFlipRotation: number = 0;
    regularFlipRotation: number = 0;
    direction = ChartAxisDirection.Angle;

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
