import { _Scene, _ModuleSupport } from 'ag-charts-community';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';

const { Rect, Selection } = _Scene;

const { ChartAxisDirection, PolarAxis, Validate, OPT_NUMBER } = _ModuleSupport;

export class RadialColumnSeries extends RadialColumnSeriesBase<_Scene.Rect> {
    static className = 'RadialColumnSeries';

    @Validate(OPT_NUMBER(0))
    columnWidth: number | undefined = undefined;

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radarColumn-stack-${groupIndex}-yValues`;
    }

    protected createPathSelection(parent: _Scene.Group): _Scene.Selection<_Scene.Rect, RadialColumnNodeDatum> {
        return Selection.select(parent, Rect);
    }

    protected updateItemPath(node: _Scene.Rect, datum: RadialColumnNodeDatum) {
        const angle = (datum.startAngle + datum.endAngle) / 2;
        let { columnWidth } = this;
        if (columnWidth == undefined) {
            const axisInnerRadius = this.getAxisInnerRadius();
            const startX = axisInnerRadius * Math.cos(datum.startAngle);
            const startY = axisInnerRadius * Math.sin(datum.startAngle);
            const endX = axisInnerRadius * Math.cos(datum.endAngle);
            const endY = axisInnerRadius * Math.sin(datum.endAngle);
            columnWidth = Math.max(
                1,
                Math.min(axisInnerRadius * 2, Math.floor(Math.sqrt((startX - endX) ** 2 + (startY - endY) ** 2)))
            );
        }

        node.x = -columnWidth / 2;
        node.y = -datum.outerRadius;
        node.width = columnWidth;
        node.height = datum.outerRadius - datum.innerRadius;
        node.rotation = angle + Math.PI / 2;
        node.rotationCenterX = 0;
        node.rotationCenterY = 0;
    }

    protected animateItemsShapes() {
        const { itemSelection } = this;
        const duration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;

        const radiusAxis = this.axes[ChartAxisDirection.Y];
        const axisInnerRadius = radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;

        itemSelection.each((node, datum) => {
            this.ctx.animationManager?.animateMany<number>(
                `${this.id}_empty-update-ready_${node.id}`,
                [
                    { from: axisInnerRadius, to: datum.innerRadius },
                    { from: axisInnerRadius, to: datum.outerRadius },
                ],
                {
                    duration,
                    onUpdate: ([innerRadius, outerRadius]) => {
                        node.y = -outerRadius;
                        node.height = outerRadius - innerRadius;
                    },
                }
            );
        });
    }
}
