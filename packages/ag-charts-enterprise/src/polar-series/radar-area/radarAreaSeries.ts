import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import { RadarSeries } from '../radar/radarSeries';
import type { RadarLinePoint } from '../radar/radarSeries';

const { NUMBER, OPT_COLOR_STRING, Validate } = _ModuleSupport;

const { Group, Path, PointerEvents, Selection } = _Scene;

export class RadarAreaSeries extends RadarSeries {
    static className = 'RadarAreaSeries';
    static type = 'radar-area' as const;

    protected areaSelection: _Scene.Selection<_Scene.Path, boolean>;

    @Validate(OPT_COLOR_STRING)
    fill?: string = 'black';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    protected get breakMissingPoints() {
        return false;
    }

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx);
        const areaGroup = new Group();
        areaGroup.zIndexSubOrder = [() => this._declarationOrder, 0];
        this.contentGroup.append(areaGroup);
        this.areaSelection = Selection.select(areaGroup, Path);
    }

    protected updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.areaSelection.update(pathData);
        super.updatePathSelections();
    }

    protected getAreaNode() {
        return this.areaSelection.nodes()[0];
    }

    protected getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle) {
        return highlightedStyle?.fill ?? this.marker.fill ?? this.fill;
    }

    protected beforePathAnimation() {
        super.beforePathAnimation();

        const areaNode = this.getAreaNode();
        areaNode.fill = this.fill;
        areaNode.fillOpacity = this.fillOpacity;
        areaNode.pointerEvents = PointerEvents.None;
        areaNode.stroke = undefined;
    }

    protected animatePaths(points: RadarLinePoint[], totalDuration: number, timePassed: number) {
        super.animatePaths(points, totalDuration, timePassed);
        this.animateSinglePath(this.getAreaNode(), points, totalDuration, timePassed);
    }

    protected resetMarkersAndPaths() {
        super.resetMarkersAndPaths();
        const areaNode = this.getAreaNode();

        if (areaNode) {
            const { path: areaPath } = areaNode;
            const areaPoints = this.getLinePoints();

            areaNode.fill = this.fill;
            areaNode.fillOpacity = this.fillOpacity;
            areaNode.stroke = this.stroke;
            areaNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
            areaNode.strokeOpacity = this.strokeOpacity;

            areaNode.lineDash = this.lineDash;
            areaNode.lineDashOffset = this.lineDashOffset;
            areaNode.lineJoin = areaNode.lineCap = 'round';

            areaPath.clear({ trackChanges: true });

            areaPoints.forEach(({ x, y }, index) => {
                if (index === 0) {
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
