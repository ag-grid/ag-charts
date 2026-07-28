import type { AgBaseCrossLineLabelOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    BaseProperties,
    ChartAxisDirection,
    Property,
    type Scale,
    clamp,
    createId,
    isNumberEqual,
    normalizeAngle360,
    normalizeAngle360FromDegrees,
} from 'ag-charts-core';

const {
    getCrossLineValue,
    validateCrossLineValue,
    BandScale,
    ContinuousScale,
    Group,
    LabelStyle,
    Path,
    RotatableText,
    Sector,
} = _ModuleSupport;

export class PolarCrossLineLabel extends LabelStyle implements AgBaseCrossLineLabelOptions {
    @Property
    enabled?: boolean;

    @Property
    override padding: number = 5;

    @Property
    text?: string;

    @Property
    parallel?: boolean;

    /** Used by radius cross-lines only; ignored on angle cross-lines. */
    @Property
    positionAngle?: number = undefined;
}

/**
 * Unified polar cross-line. Branches on `direction` to render either an angle-axis or
 * radius-axis cross-line; the merged class replaces the previous abstract base + `AngleCrossLine`
 * / `RadiusCrossLine` subclass split. The factory in `PolarCrossLinesModule` constructs with the
 * appropriate direction; `applyPolarLayout` populates whichever fields the active direction
 * consumes (`ticks` for angle, `gridAngles` for radius).
 */
export class PolarCrossLine extends BaseProperties implements _ModuleSupport.PolarCrossLine {
    static readonly className = 'PolarCrossLine';
    readonly internalId = createId(this);

    @Property
    id?: string;

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
    direction: ChartAxisDirection;

    axisInnerRadius: number = 0;
    axisOuterRadius: number = 0;

    /** Populated by `applyPolarLayout` for angle cross-lines (axis tick values). */
    ticks: any[] = [];
    /** Populated by `applyPolarLayout` for radius cross-lines (radial grid angles). */
    gridAngles?: number[];

    readonly lineGroup = new Group({ name: this.internalId });
    readonly rangeGroup = new Group({ name: this.internalId });
    readonly labelGroup = new Group({ name: this.internalId });

    private readonly polygonNode = new Path();
    private readonly sectorNode = new Sector();
    private readonly lineNode = new Path();
    private readonly crossLineRange = new Group();
    private readonly labelNode = new RotatableText();

    private outerRadius = 0;
    private innerRadius = 0;

    private _isRange: boolean | undefined = undefined;

    constructor(direction: ChartAxisDirection) {
        super();
        this.direction = direction;

        this.crossLineRange.append(this.polygonNode);
        this.crossLineRange.append(this.sectorNode);
        if (direction === ChartAxisDirection.Angle) {
            this.crossLineRange.append(this.lineNode);
        }
        this.labelGroup.append(this.labelNode);
    }

    applyPolarLayout(layout: _ModuleSupport.PolarAxisLayout): void {
        this.shape = layout.shape;
        this.axisOuterRadius = layout.axisOuterRadius;
        this.axisInnerRadius = layout.axisInnerRadius;
        this.ticks = layout.ticks ?? [];
        this.gridAngles = layout.gridAngles;
    }

    update(visible: boolean) {
        if (this.direction === ChartAxisDirection.Angle) {
            this.updateAngle(visible);
        } else {
            this.updateRadius(visible);
        }
    }

    private updateAngle(visible: boolean) {
        const { scale } = this;

        // TODO support clipping if only end is out-of-bounds
        if (!scale || !validateCrossLineValue(this, scale) || !this.angleVisibilityCheck()) {
            this.rangeGroup.visible = false;
            this.lineGroup.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        this.rangeGroup.visible = visible;
        this.lineGroup.visible = visible;
        this.labelGroup.visible = visible;

        this.updateAngleLineNode(visible);
        this.updateAnglePolygonNode(visible);
        this.updateAngleSectorNode(visible);
        this.updateAngleLabelNode(visible);
    }

    private angleVisibilityCheck() {
        if (!ContinuousScale.is(this.scale)) {
            return true;
        }

        const [d0, d1] = this.scale.domain;
        const value: any = getCrossLineValue(this);

        if (this.type === 'range') {
            const [start, end] = value;
            return start >= d0 && start <= d1 && end >= start && end <= d1;
        } else {
            return value >= d0 && value <= d1;
        }
    }

    private updateAngleLineNode(visible: boolean) {
        const { scale, type, value, lineNode: line } = this;

        if (!visible || type !== 'line' || !scale) {
            line.visible = false;
            return;
        }

        const angle = scale.convert(value);
        if (Number.isNaN(angle)) {
            line.visible = false;
            return;
        }

        const { axisInnerRadius, axisOuterRadius } = this;

        line.visible = true;
        line.stroke = this.stroke;
        line.strokeOpacity = this.strokeOpacity ?? 1;
        line.strokeWidth = this.strokeWidth ?? 1;
        line.fill = undefined;
        line.lineDash = this.lineDash;

        const x = axisOuterRadius * Math.cos(angle);
        const y = axisOuterRadius * Math.sin(angle);
        const x0 = axisInnerRadius * Math.cos(angle);
        const y0 = axisInnerRadius * Math.sin(angle);
        line.path.clear(true);
        line.path.moveTo(x0, y0);
        line.path.lineTo(x, y);

        this.assignCrossLineGroup(false, this.crossLineRange);
    }

    private updateAnglePolygonNode(visible: boolean) {
        const { polygonNode: polygon, range, scale, shape, type, ticks } = this;
        if (!visible || type !== 'range' || shape !== 'polygon' || !scale || !range) {
            polygon.visible = false;
            return;
        }

        const { axisInnerRadius, axisOuterRadius } = this;
        const startIndex = ticks.indexOf(range[0]);
        const endIndex = ticks.indexOf(range[1]);
        const stops =
            startIndex <= endIndex
                ? ticks.slice(startIndex, endIndex + 1)
                : ticks.slice(startIndex).concat(ticks.slice(0, endIndex + 1));
        const angles = stops.map((value: unknown) => scale.convert(value));

        polygon.visible = true;
        this.setSectorNodeProps(polygon);

        const { path } = polygon;
        path.clear(true);
        for (const [index, angle] of angles.entries()) {
            const x = axisOuterRadius * Math.cos(angle);
            const y = axisOuterRadius * Math.sin(angle);
            if (index === 0) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        }
        if (axisInnerRadius === 0) {
            path.lineTo(0, 0);
        } else {
            const reversedAngles = angles.slice().reverse();
            for (const angle of reversedAngles) {
                const x = axisInnerRadius * Math.cos(angle);
                const y = axisInnerRadius * Math.sin(angle);
                path.lineTo(x, y);
            }
        }
        polygon.path.closePath();

        this.assignCrossLineGroup(true, this.crossLineRange);
    }

    private updateAngleSectorNode(visible: boolean) {
        const { sectorNode: sector, range, scale, shape, type } = this;
        if (!visible || type !== 'range' || shape !== 'circle' || !scale || !range) {
            sector.visible = false;
            return;
        }

        const { axisInnerRadius, axisOuterRadius } = this;
        const angles = range.map((value) => scale.convert(value));

        const step = scale.step ?? 0;
        const padding = scale instanceof BandScale ? step / 2 : 0;

        sector.visible = true;
        this.setSectorNodeProps(sector);

        sector.centerX = 0;
        sector.centerY = 0;
        sector.innerRadius = axisInnerRadius;
        sector.outerRadius = axisOuterRadius;
        sector.startAngle = angles[0] - padding;
        sector.endAngle = angles[1] + padding;

        this.assignCrossLineGroup(true, this.crossLineRange);
    }

    private updateAngleLabelNode(visible: boolean) {
        const { label, labelNode: node, range, scale, type, ticks } = this;
        if (!visible || label.enabled === false || !label.text || !scale || (type === 'range' && !range)) {
            node.visible = false;
            return;
        }

        node.visible = true;

        const { axisInnerRadius, axisOuterRadius } = this;

        let labelX: number;
        let labelY: number;
        let rotation: number;
        let textBaseline: CanvasTextBaseline;

        if (type === 'line') {
            const angle = normalizeAngle360(scale.convert(this.value));
            const angle270 = 1.5 * Math.PI;
            const isRightSide = isNumberEqual(angle, angle270) || angle > angle270 || angle < Math.PI / 2;
            const midX = ((axisInnerRadius + axisOuterRadius) / 2) * Math.cos(angle);
            const midY = ((axisInnerRadius + axisOuterRadius) / 2) * Math.sin(angle);

            labelX = midX + label.padding * Math.cos(angle + Math.PI / 2);
            labelY = midY + label.padding * Math.sin(angle + Math.PI / 2);
            textBaseline = isRightSide ? 'top' : 'bottom';
            rotation = isRightSide ? angle : angle - Math.PI;
        } else {
            const [startAngle, endAngle] = range!.map((value) => normalizeAngle360(scale.convert(value)));
            let angle = (startAngle + endAngle) / 2;
            if (startAngle > endAngle) {
                angle -= Math.PI;
            }
            angle = normalizeAngle360(angle);
            const isBottomSide = (isNumberEqual(angle, 0) || angle > 0) && angle < Math.PI;

            let distance: number;
            if (this.shape === 'circle' || ticks.length < 3) {
                distance = axisOuterRadius - label.padding;
            } else {
                distance = axisOuterRadius * Math.cos(Math.PI / ticks.length) - label.padding;
            }

            labelX = distance * Math.cos(angle);
            labelY = distance * Math.sin(angle);
            textBaseline = isBottomSide ? 'bottom' : 'top';
            rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;
        }

        this.setLabelNodeProps(node, labelX, labelY, textBaseline, rotation);
    }

    private updateRadius(visible: boolean) {
        const { scale } = this;
        if (!scale || !validateCrossLineValue(this, scale)) {
            this.rangeGroup.visible = false;
            this.lineGroup.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        this.updateRadii();

        const { innerRadius, outerRadius } = this;
        visible &&= innerRadius >= this.axisInnerRadius && outerRadius <= this.axisOuterRadius;

        this.rangeGroup.visible = visible;
        this.lineGroup.visible = visible;
        this.labelGroup.visible = visible;

        this.updateRadiusPolygonNode(visible);
        this.updateRadiusSectorNode(visible);
        this.updateRadiusLabelNode(visible);

        this.assignCrossLineGroup(this.type === 'range', this.crossLineRange);
    }

    private updateRadii() {
        const { range, scale, type, axisInnerRadius, axisOuterRadius } = this;

        if (!scale) return { innerRadius: 0, outerRadius: 0 };

        const getRadius = (value: number) => axisOuterRadius + axisInnerRadius - value;

        let outerRadius, innerRadius;

        if (type === 'line') {
            // On a band scale `convert` returns the band's leading edge; offset to the band centre.
            const bandwidth = Math.abs(scale.bandwidth ?? 0);
            outerRadius = getRadius(scale.convert(this.value)) + bandwidth / 2;
            innerRadius = outerRadius;
        } else {
            const bandwidth = Math.abs(scale?.bandwidth ?? 0);
            const convertedRange = range!.map((r) => scale.convert(r));
            outerRadius = getRadius(Math.max(...convertedRange));
            innerRadius = getRadius(Math.min(...convertedRange)) + bandwidth;
        }

        this.outerRadius = outerRadius;
        this.innerRadius = innerRadius;
    }

    private drawRadiusPolygon(radius: number, angles: number[], polygon: _ModuleSupport.Path) {
        for (const [index, angle] of angles.entries()) {
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (index === 0) {
                polygon.path.moveTo(x, y);
            } else {
                polygon.path.lineTo(x, y);
            }
        }
        polygon.path.closePath();
    }

    private updateRadiusPolygonNode(visible: boolean) {
        const { gridAngles, polygonNode: polygon, scale, shape, type, innerRadius, outerRadius } = this;
        if (!visible || shape !== 'polygon' || !scale || !gridAngles) {
            polygon.visible = false;
            return;
        }

        polygon.visible = true;

        const padding = this.getRadiusPadding();

        polygon.path.clear(true);
        this.drawRadiusPolygon(outerRadius - padding, gridAngles, polygon);

        const reversedAngles = gridAngles.slice().reverse();
        const innerPolygonRadius = type === 'line' ? outerRadius - padding : innerRadius + padding;
        this.drawRadiusPolygon(innerPolygonRadius, reversedAngles, polygon);

        this.setSectorNodeProps(polygon);
    }

    private updateRadiusSectorNode(visible: boolean) {
        const {
            axisInnerRadius,
            axisOuterRadius,
            scale,
            sectorNode: sector,
            shape,
            innerRadius,
            outerRadius,
            type,
        } = this;
        if (!visible || shape !== 'circle' || !scale) {
            sector.visible = false;
            return;
        }

        sector.visible = true;

        sector.startAngle = 0;
        sector.endAngle = 2 * Math.PI;

        if (type === 'line') {
            // A radius line is a single ring stroke at its converted radius, not a filled band.
            const r = clamp(axisInnerRadius, outerRadius, axisOuterRadius);
            sector.innerRadius = r;
            sector.outerRadius = r;
        } else {
            const padding = this.getRadiusPadding();
            const r0 = clamp(axisInnerRadius, innerRadius + padding, axisOuterRadius);
            const r1 = clamp(axisInnerRadius, outerRadius - padding, axisOuterRadius);
            sector.innerRadius = Math.min(r0, r1);
            sector.outerRadius = Math.max(r0, r1);
        }

        this.setSectorNodeProps(sector);
    }

    private updateRadiusLabelNode(visible: boolean) {
        const { innerRadius, label, labelNode: node, scale, shape, type } = this;
        if (!visible || label.enabled === false || !label.text || !scale) {
            node.visible = false;
            return;
        }

        const angle = normalizeAngle360FromDegrees((label.positionAngle ?? 0) - 90);
        const isBottomSide = (isNumberEqual(angle, 0) || angle > 0) && angle < Math.PI;
        const rotation = isBottomSide ? angle - Math.PI / 2 : angle + Math.PI / 2;

        let distance: number;
        const angles = this.gridAngles ?? [];
        if (type === 'line') {
            distance = innerRadius + label.padding;
        } else if (shape === 'circle' || angles.length < 3) {
            distance = innerRadius - label.padding;
        } else {
            distance = innerRadius * Math.cos(Math.PI / angles.length) - label.padding;
        }

        const labelX = distance * Math.cos(angle);
        const labelY = distance * Math.sin(angle);

        let textBaseline: CanvasTextBaseline;
        if (type === 'line') {
            textBaseline = isBottomSide ? 'top' : 'bottom';
        } else {
            textBaseline = isBottomSide ? 'bottom' : 'top';
        }

        this.setLabelNodeProps(node, labelX, labelY, textBaseline, rotation);
    }

    private getRadiusPadding() {
        const { scale } = this;

        if (!scale) return 0;

        const bandwidth = Math.abs(scale.bandwidth ?? 0);
        const step = Math.abs(scale.step ?? 0);
        return scale instanceof BandScale ? (step - bandwidth) / 2 : 0;
    }

    private assignCrossLineGroup(isRange: boolean, crossLineRange: _ModuleSupport.Node) {
        if (isRange !== this._isRange) {
            if (isRange) {
                this.rangeGroup.appendChild(crossLineRange);
            } else {
                this.lineGroup.appendChild(crossLineRange);
            }
        }
        this._isRange = isRange;
    }

    private setSectorNodeProps(node: _ModuleSupport.Path | _ModuleSupport.Sector) {
        // A `line` cross-line is a single stroke; only the `range` variant is filled.
        node.fill = this.type === 'range' ? this.fill : undefined;
        node.fillOpacity = this.fillOpacity ?? 1;
        node.stroke = this.stroke;
        node.strokeOpacity = this.strokeOpacity ?? 1;
        node.strokeWidth = this.strokeWidth ?? 1;
        node.lineDash = this.lineDash;
    }

    private setLabelNodeProps(
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
