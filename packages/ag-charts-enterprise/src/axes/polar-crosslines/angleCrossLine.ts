import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { PolarCrossLine } from './polarCrossLine';

const { ChartAxisDirection } = _ModuleSupport;
const { Path, Sector, Text } = _Scene;
const { normalizeAngle360, isNumberEqual } = _Util;
export class AngleCrossLine extends PolarCrossLine {
    static className = 'AngleCrossLine';

    override direction: _ModuleSupport.ChartAxisDirection = ChartAxisDirection.X;

    private polygonNode = new Path();
    private sectorNode = new Sector();
    private lineNode = new Path();
    private labelNode = new Text();

    constructor() {
        super();

        this.group.append(this.polygonNode);
        this.group.append(this.sectorNode);
        this.group.append(this.lineNode);
        this.group.append(this.labelNode);
    }

    update(visible: boolean) {
        this.updateLineNode(visible);
        this.updatePolygonNode(visible);
        this.updateSectorNode(visible);
        this.updateLabelNode(visible);
    }

    private updateLineNode(visible: boolean) {
        const { scale, type, value, lineNode: line } = this;
        let angle: number;
        if (!visible || type !== 'line' || !scale || isNaN((angle = scale.convert(value)))) {
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
        line.path.clear({ trackChanges: true });
        line.path.moveTo(x0, y0);
        line.path.lineTo(x, y);

        this.group.zIndex = AngleCrossLine.LINE_LAYER_ZINDEX;
    }

    private updateFill(area: _Scene.Path | _Scene.Sector) {
        area.fill = this.fill;
        area.fillOpacity = this.fillOpacity ?? 1;
        area.stroke = this.stroke;
        area.strokeOpacity = this.strokeOpacity ?? 1;
        area.strokeWidth = this.strokeWidth ?? 1;
        area.lineDash = this.lineDash;
    }

    private updatePolygonNode(visible: boolean) {
        const { polygonNode: polygon, range, scale, shape, type } = this;
        let ticks: any[] | undefined;
        if (!visible || type !== 'range' || shape !== 'polygon' || !scale || !range || !(ticks = scale.ticks?.())) {
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
        const angles = stops.map((value) => scale.convert(value));

        polygon.visible = true;
        this.updateFill(polygon);

        const { path } = polygon;
        path.clear({ trackChanges: true });
        angles.forEach((angle, index) => {
            const x = axisOuterRadius * Math.cos(angle);
            const y = axisOuterRadius * Math.sin(angle);
            if (index === 0) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        });
        if (axisInnerRadius === 0) {
            path.lineTo(0, 0);
        } else {
            angles
                .slice()
                .reverse()
                .forEach((angle) => {
                    const x = axisInnerRadius * Math.cos(angle);
                    const y = axisInnerRadius * Math.sin(angle);
                    path.lineTo(x, y);
                });
        }
        polygon.path.closePath();

        this.group.zIndex = AngleCrossLine.RANGE_LAYER_ZINDEX;
    }

    private updateSectorNode(visible: boolean) {
        const { sectorNode: sector, range, scale, shape, type } = this;
        if (!visible || type !== 'range' || shape !== 'circle' || !scale || !range) {
            sector.visible = false;
            return;
        }

        const { axisInnerRadius, axisOuterRadius } = this;
        const angles = range.map((value) => scale.convert(value));

        sector.visible = true;
        this.updateFill(sector);

        sector.centerX = 0;
        sector.centerY = 0;
        sector.innerRadius = axisInnerRadius;
        sector.outerRadius = axisOuterRadius;
        sector.startAngle = angles[0];
        sector.endAngle = angles[1];

        this.group.zIndex = AngleCrossLine.RANGE_LAYER_ZINDEX;
    }

    private updateLabelNode(visible: boolean) {
        const { label, labelNode: node, range, scale, type } = this;
        if (!visible || label.enabled === false || !label.text || !scale || (type === 'range' && !range)) {
            node.visible = true;
            return;
        }

        const { axisInnerRadius, axisOuterRadius } = this;

        let labelX: number;
        let labelY: number;
        let rotation: number;
        let textBaseline: CanvasTextBaseline;

        if (type === 'line') {
            const angle = normalizeAngle360(scale.convert(this.value));
            const angle270 = (3 * Math.PI) / 2;
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
            const ticks = scale.ticks?.() ?? [];
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
}
