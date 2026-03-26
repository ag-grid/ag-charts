import type { AgBaseCrossLineLabelOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, ChartAxisDirection, Property, type Scale, createId } from 'ag-charts-core';

const { Group, LabelStyle } = _ModuleSupport;
export class PolarCrossLineLabel extends LabelStyle implements AgBaseCrossLineLabelOptions {
    @Property
    enabled?: boolean;

    @Property
    override padding: number = 5;

    @Property
    text?: string;

    @Property
    parallel?: boolean;
}

export abstract class PolarCrossLine extends BaseProperties implements _ModuleSupport.PolarCrossLine {
    static readonly className: string = 'PolarCrossLine';
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
    gridPadding: number = 0;
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

        node.setFont(label);
        node.setBoxing(label);

        node.visible = true;
    }
}
