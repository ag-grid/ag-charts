import { _ModuleSupport } from 'ag-charts-community';

import { type RadarPathPoint, RadarSeries } from '../radar/radarSeries';
import { RadarAreaSeriesProperties } from './radarAreaSeriesProperties';

const { Group, Path, PointerEvents, Selection, ChartAxisDirection, applyShapeStyle, mergeDefaults } = _ModuleSupport;

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
        return this.areaSelection.at(0);
    }

    protected override getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle) {
        return highlightedStyle?.fill ?? this.properties.marker.fill ?? this.properties.fill;
    }

    protected override updatePathNodes() {
        super.updatePathNodes();

        const { fill, fillOpacity, opacity } = mergeDefaults(this.getHighlightStyle(), this.properties);

        const areaNode = this.getAreaNode();
        if (areaNode) {
            applyShapeStyle(areaNode, { fill, fillOpacity, stroke: undefined }, this.getShapeFillBBox());

            areaNode.setProperties({
                lineJoin: 'round',
                pointerEvents: PointerEvents.None,
                opacity,
            });
        }
    }

    protected override animatePaths(ratio: number) {
        super.animatePaths(ratio);

        const areaNode = this.getAreaNode();
        if (areaNode) {
            this.animateSinglePath(areaNode, this.getAreaPoints(), ratio);
        }
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

    protected override hasItemStylers(): boolean {
        return this.properties.marker.itemStyler != null || this.properties.label.itemStyler != null;
    }

    protected override resetPaths() {
        super.resetPaths();
        const areaNode = this.getAreaNode();

        if (areaNode) {
            const { path: areaPath } = areaNode;
            const areaPoints = this.getAreaPoints();
            const fillBBox = this.getShapeFillBBox();

            applyShapeStyle(
                areaNode,
                {
                    fill: this.properties.fill,
                    stroke: undefined,
                    fillOpacity: this.properties.fillOpacity,
                    lineDash: this.properties.lineDash,
                    lineDashOffset: this.properties.lineDashOffset,
                },
                fillBBox
            );

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
