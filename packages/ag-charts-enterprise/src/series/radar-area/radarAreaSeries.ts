import { _ModuleSupport } from 'ag-charts-community';

import { type RadarPathPoint, RadarSeries } from '../radar/radarSeries';
import { RadarAreaSeriesProperties } from './radarAreaSeriesProperties';

const { Group, Path, PointerEvents, Selection, ChartAxisDirection, applyShapeStyle, getShapeFill, getShapeStyle } =
    _ModuleSupport;

export class RadarAreaSeries extends RadarSeries {
    static override readonly className = 'RadarAreaSeries';
    static readonly type = 'radar-area' as const;

    override properties = new RadarAreaSeriesProperties();

    private readonly areaGroup = this.contentGroup.appendChild(new Group({ name: 'radar-area' }));
    protected areaSelection: _ModuleSupport.Selection<_ModuleSupport.Path, boolean> = Selection.select(
        this.areaGroup,
        Path
    );

    override resetInvalidToZero = true;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx);
        this.areaGroup.zIndex = -1;
    }

    protected override updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.areaSelection.update(pathData);
        super.updatePathSelections();
    }

    protected getAreaNode() {
        return this.areaSelection.at(0)!;
    }

    protected override getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle) {
        return highlightedStyle?.fill ?? this.properties.marker.fill ?? this.properties.fill;
    }

    protected override beforePathAnimation() {
        super.beforePathAnimation();

        const areaNode = this.getAreaNode();

        const { fillOpacity, fill } = this.properties;
        const style = getShapeStyle(
            { fill, fillOpacity },
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );

        applyShapeStyle(areaNode, style, undefined, this.getShapeFillBBox());
        areaNode.pointerEvents = PointerEvents.None;
        areaNode.stroke = undefined;
    }

    protected override animatePaths(ratio: number) {
        super.animatePaths(ratio);
        this.animateSinglePath(this.getAreaNode(), this.getAreaPoints(), ratio);
    }

    private getAreaPoints(): RadarPathPoint[] {
        const points: RadarPathPoint[] = this.getLinePoints();

        const getPolarAxis = (direction: _ModuleSupport.ChartAxisDirection): _ModuleSupport.PolarAxis | undefined => {
            const axis = this.axes[direction];
            return axis instanceof _ModuleSupport.PolarAxis ? axis : undefined;
        };

        const radiusAxis = getPolarAxis(ChartAxisDirection.Radius);
        const angleAxis = getPolarAxis(ChartAxisDirection.Angle);

        const reversedRadiusAxis = radiusAxis?.isReversed();

        if (!reversedRadiusAxis) {
            return points;
        }

        const zeroLinePoints = angleAxis?.getAxisLinePoints()?.points ?? [];

        return points.concat(...zeroLinePoints);
    }

    protected override resetPaths() {
        super.resetPaths();
        const areaNode = this.getAreaNode();

        if (areaNode) {
            const { path: areaPath } = areaNode;
            const areaPoints = this.getAreaPoints();

            areaNode.fill = getShapeFill(
                this.properties.fill,
                this.properties.fillGradientDefaults,
                this.properties.fillPatternDefaults,
                this.properties.fillImageDefaults
            );
            areaNode.fillOpacity = this.properties.fillOpacity;
            areaNode.stroke = undefined;

            areaNode.lineDash = this.properties.lineDash;
            areaNode.lineDashOffset = this.properties.lineDashOffset;
            areaNode.lineJoin = areaNode.lineCap = 'round';

            areaPath.clear(true);

            areaPoints.forEach(({ x, y, moveTo, arc, radius = 0, startAngle = 0, endAngle = 0 }) => {
                if (arc) {
                    areaPath.arc(x, y, radius, startAngle, endAngle);
                } else if (moveTo) {
                    areaPath.moveTo(x, y);
                } else {
                    areaPath.lineTo(x, y);
                }
            });
            areaPath.closePath();

            areaNode.checkPathDirty();
        }
    }
}
