import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import { RadarSeries } from '../radar/radarSeries';

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

    protected updatePathAnimation(points: Array<{ x: number; y: number }>, totalDuration: number, timePassed: number) {
        super.updatePathAnimation(points, totalDuration, timePassed);

        const areaNode = this.getAreaNode();
        const { path: areaPath } = areaNode;

        areaPath.clear({ trackChanges: true });

        const axisInnerRadius = this.getAxisInnerRadius();

        const startFromCenter = timePassed < totalDuration;
        if (startFromCenter) {
            areaPath.moveTo(0, 0);
        }
        points.forEach((point, index) => {
            const { x: x1, y: y1 } = point;
            const angle = Math.atan2(y1, x1);
            const x0 = axisInnerRadius * Math.cos(angle);
            const y0 = axisInnerRadius * Math.sin(angle);
            const t = timePassed / totalDuration;
            const x = x0 * (1 - t) + x1 * t;
            const y = y0 * (1 - t) + y1 * t;

            if (index === 0) {
                areaPath.moveTo(x, y);
            } else {
                areaPath.lineTo(x, y);
            }
        });

        areaPath.closePath();
        areaNode.checkPathDirty();
    }

    protected resetMarkersAndPaths() {
        super.resetMarkersAndPaths();
        const { nodeData } = this;
        const areaNode = this.getAreaNode();

        if (areaNode) {
            const { path: areaPath } = areaNode;

            areaNode.fill = this.fill;
            areaNode.fillOpacity = this.fillOpacity;
            areaNode.stroke = this.stroke;
            areaNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
            areaNode.strokeOpacity = this.strokeOpacity;

            areaNode.lineDash = this.lineDash;
            areaNode.lineDashOffset = this.lineDashOffset;
            areaNode.lineJoin = areaNode.lineCap = 'round';

            areaPath.clear({ trackChanges: true });

            nodeData.forEach((datum, index) => {
                const { x, y } = datum.point!;
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
