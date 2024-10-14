import type { AxisContext } from '../../module/axisContext';
import { Group } from '../../scene/group';
import { Layer } from '../../scene/layer';
import { Node } from '../../scene/node';
import type { ChartAxisDirection } from '../chartAxisDirection';
import { ZIndexMap } from '../zIndexMap';

interface AxisNodes {
    axisNode: Node;
    gridNode: Node;
    crossLineRangeNode: Node;
    crossLineLineNode: Node;
    crossLineLabelNode: Node;
    labelNode: Node;
}

interface Axis {
    createAxisContext(): AxisContext;
    attachAxis(nodes: AxisNodes): void;
    detachAxis(nodes: AxisNodes): void;

    destroy(): void;
}

export class AxisManager {
    private readonly axes: Map<ChartAxisDirection, AxisContext[]> = new Map();

    readonly axisGridGroup = new Layer({ name: 'Axes-Grids', zIndex: ZIndexMap.AXIS_GRID });
    readonly axisGroup = new Layer({ name: 'Axes', zIndex: ZIndexMap.AXIS });
    readonly axisLabelGroup = new Layer({ name: 'Axes-Labels', zIndex: ZIndexMap.SERIES_LABEL });
    readonly axisCrosslineRangeGroup = new Layer({
        name: 'Axes-Crosslines-Range',
        zIndex: ZIndexMap.SERIES_CROSSLINE_RANGE,
    });
    readonly axisCrosslineLineGroup = new Layer({
        name: 'Axes-Crosslines-Line',
        zIndex: ZIndexMap.SERIES_CROSSLINE_LINE,
    });
    readonly axisCrosslineLabelGroup = new Layer({
        name: 'Axes-Crosslines-Label',
        zIndex: ZIndexMap.SERIES_LABEL,
    });

    public constructor(private readonly sceneRoot: Group) {
        this.sceneRoot.appendChild(this.axisGroup);
        this.sceneRoot.appendChild(this.axisGridGroup);
        this.sceneRoot.appendChild(this.axisLabelGroup);
        this.sceneRoot.appendChild(this.axisCrosslineRangeGroup);
        this.sceneRoot.appendChild(this.axisCrosslineLineGroup);
        this.sceneRoot.appendChild(this.axisCrosslineLabelGroup);
    }

    updateAxes(oldAxes: Axis[], newAxes: Axis[]) {
        const axisNodes: AxisNodes = {
            axisNode: this.axisGroup,
            gridNode: this.axisGridGroup,
            labelNode: this.axisLabelGroup,
            crossLineLineNode: this.axisCrosslineLineGroup,
            crossLineRangeNode: this.axisCrosslineRangeGroup,
            crossLineLabelNode: this.axisCrosslineLabelGroup,
        };

        for (const axis of oldAxes) {
            if (newAxes.includes(axis)) continue;
            axis.detachAxis(axisNodes);
            axis.destroy();
        }

        for (const axis of newAxes) {
            if (oldAxes?.includes(axis)) continue;
            axis.attachAxis(axisNodes);
        }

        this.axes.clear();
        for (const axis of newAxes) {
            const ctx = axis.createAxisContext();
            if (this.axes.has(ctx.direction)) {
                this.axes.get(ctx.direction)?.push(ctx);
            } else {
                this.axes.set(ctx.direction, [ctx]);
            }
        }
    }

    getAxisContext(direction: ChartAxisDirection) {
        return this.axes.get(direction) ?? [];
    }

    destroy() {
        this.axes.clear();
        this.sceneRoot.removeChild(this.axisGroup);
        this.sceneRoot.removeChild(this.axisGridGroup);
    }
}
