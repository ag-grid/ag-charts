import type { AxisContext } from '../../module/axisContext';
import { Group } from '../../scene/group';
import { Layer } from '../../scene/layer';
import type { ChartAxisDirection } from '../chartAxisDirection';
import { ZIndexMap } from '../zIndexMap';

type Axis = {
    createAxisContext(): AxisContext;
    attachAxis(axisGroup: Group, axisGridGroup: Group): void;
    detachAxis(axisGroup: Group, axisGridGroup: Group): void;

    destroy(): void;
};

export class AxisManager {
    private readonly axes: Map<ChartAxisDirection, AxisContext[]> = new Map();

    readonly axisGridGroup: Layer;
    readonly axisGroup: Layer;

    public constructor(private readonly sceneRoot: Group) {
        this.axisGridGroup = new Layer({ name: 'Axes-Grids', zIndex: ZIndexMap.AXIS_GRID, mode: 'next' });
        this.axisGroup = new Layer({ name: 'Axes', zIndex: ZIndexMap.AXIS });

        this.sceneRoot.appendChild(this.axisGroup);
        this.sceneRoot.appendChild(this.axisGridGroup);
    }

    updateAxes(oldAxes: Axis[], newAxes: Axis[]) {
        for (const axis of oldAxes) {
            if (newAxes.includes(axis)) continue;
            axis.detachAxis(this.axisGroup, this.axisGridGroup);
            axis.destroy();
        }

        for (const axis of newAxes) {
            if (oldAxes?.includes(axis)) continue;
            axis.attachAxis(this.axisGroup, this.axisGridGroup);
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
