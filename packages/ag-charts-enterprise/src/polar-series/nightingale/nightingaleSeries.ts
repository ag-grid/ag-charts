import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';

const { Sector, Selection } = _Scene;

export class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static className = 'NightingaleSeries';

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }

    protected createPathSelection(parent: _Scene.Group): _Scene.Selection<_Scene.Sector, RadialColumnNodeDatum> {
        return Selection.select(parent, Sector);
    }

    protected updateItemPath(node: _Scene.Sector, datum: RadialColumnNodeDatum) {
        node.centerX = 0;
        node.centerY = 0;
        node.innerRadius = datum.innerRadius;
        node.outerRadius = datum.outerRadius;
        node.startAngle = datum.startAngle;
        node.endAngle = datum.endAngle;
    }

    protected animateItemsShapes() {
        const { itemSelection } = this;
        const duration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;

        const axisInnerRadius = this.getAxisInnerRadius();

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
                        node.innerRadius = innerRadius;
                        node.outerRadius = outerRadius;
                    },
                }
            );
        });
    }
}
