import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type RadarPathPoint, RadarSeries } from '../radar/radarSeries';

const { RATIO, COLOR_STRING, Validate, ChartAxisDirection } = _ModuleSupport;

const { Group, Path, PointerEvents, Selection } = _Scene;

export class RadarAreaSeries extends RadarSeries {
    static override className = 'RadarAreaSeries';
    static type = 'radar-area' as const;

    protected areaSelection: _Scene.Selection<_Scene.Path, boolean>;

    @Validate(COLOR_STRING, { optional: true })
    fill?: string = 'black';

    @Validate(RATIO)
    fillOpacity = 1;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx);
        const areaGroup = new Group();
        areaGroup.zIndexSubOrder = [() => this._declarationOrder, 0];
        this.contentGroup.append(areaGroup);
        this.areaSelection = Selection.select(areaGroup, Path);
    }

    protected override updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.areaSelection.update(pathData);
        super.updatePathSelections();
    }

    protected getAreaNode() {
        return this.areaSelection.nodes()[0];
    }

    protected override getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle) {
        return highlightedStyle?.fill ?? this.marker.fill ?? this.fill;
    }

    protected override beforePathAnimation() {
        super.beforePathAnimation();

        const areaNode = this.getAreaNode();
        areaNode.fill = this.fill;
        areaNode.fillOpacity = this.fillOpacity;
        areaNode.pointerEvents = PointerEvents.None;
        areaNode.stroke = undefined;
    }

    protected override animatePaths(ratio: number) {
        super.animatePaths(ratio);
        const areaPoints = this.getAreaPoints({ breakMissingPoints: false });
        this.animateSinglePath(this.getAreaNode(), areaPoints, ratio);
    }

    private getAreaPoints(options: { breakMissingPoints: boolean }): RadarPathPoint[] {
        const points: RadarPathPoint[] = this.getLinePoints(options);

        const getPolarAxis = (direction: _ModuleSupport.ChartAxisDirection): _ModuleSupport.PolarAxis | undefined => {
            const axis = this.axes[direction];
            return axis instanceof _ModuleSupport.PolarAxis ? axis : undefined;
        };

        const radiusAxis = getPolarAxis(ChartAxisDirection.Y);
        const angleAxis = getPolarAxis(ChartAxisDirection.X);

        const reversedRadiusAxis = radiusAxis?.isReversed();

        if (!reversedRadiusAxis) {
            return points;
        }

        const { points: zeroLinePoints = [] } = angleAxis?.getAxisLinePoints?.() ?? {};

        return points.concat(...zeroLinePoints);
    }

    protected override resetPaths() {
        super.resetPaths();
        const areaNode = this.getAreaNode();

        if (areaNode) {
            const { path: areaPath } = areaNode;
            const areaPoints = this.getAreaPoints({ breakMissingPoints: false });

            areaNode.fill = this.fill;
            areaNode.fillOpacity = this.fillOpacity;
            areaNode.stroke = undefined;

            areaNode.lineDash = this.lineDash;
            areaNode.lineDashOffset = this.lineDashOffset;
            areaNode.lineJoin = areaNode.lineCap = 'round';

            areaPath.clear({ trackChanges: true });

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
