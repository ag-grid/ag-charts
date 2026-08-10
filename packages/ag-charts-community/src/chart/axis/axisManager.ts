import type { AxisID, ChartAxisDirection } from 'ag-charts-core';
import { ZIndexMap } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';
import type { AxisContext } from '../../module/axisContext';
import { Group } from '../../scene/group';
import { Node } from '../../scene/node';

interface AxisNodes {
    axisNode: Node;
    gridNode: Node;
    labelNode: Node;
    overlayLowNode: Node;
    overlayMidNode: Node;
    overlayHighNode: Node;
}

interface Axis {
    createAxisContext(): AxisContext;
    attachAxis(nodes: AxisNodes): void;
    detachAxis(nodes: AxisNodes): void;

    destroy(): void;
}

export class AxisManager {
    private readonly axes: Map<ChartAxisDirection, AxisContext[]> = new Map();

    readonly axisGridGroup = new Group({ name: 'Axes-Grids', zIndex: ZIndexMap.AXIS_GRID });
    readonly axisGroup = new Group({ name: 'Axes', zIndex: ZIndexMap.AXIS });
    readonly axisLabelGroup = new Group({ name: 'Axes-Labels', zIndex: ZIndexMap.SERIES_LABEL });
    readonly axisOverlayLowGroup = new Group({
        name: 'Axes-Overlay-Low',
        zIndex: ZIndexMap.SERIES_CROSSLINE_RANGE,
    });
    readonly axisOverlayMidGroup = new Group({
        name: 'Axes-Overlay-Mid',
        zIndex: ZIndexMap.SERIES_CROSSLINE_LINE,
    });
    readonly axisOverlayHighGroup = new Group({
        name: 'Axes-Overlay-High',
        zIndex: ZIndexMap.SERIES_LABEL,
    });

    private remappedAxisKeys?: Map<string, AxisID>;

    public constructor(
        private readonly eventsHub: EventsHub,
        private readonly sceneRoot: Group
    ) {
        this.sceneRoot.appendChild(this.axisGroup);
        this.sceneRoot.appendChild(this.axisGridGroup);
        this.sceneRoot.appendChild(this.axisLabelGroup);
        this.sceneRoot.appendChild(this.axisOverlayLowGroup);
        this.sceneRoot.appendChild(this.axisOverlayMidGroup);
        this.sceneRoot.appendChild(this.axisOverlayHighGroup);
    }

    updateAxes(oldAxes: Axis[], newAxes: Axis[]) {
        const axisNodes: AxisNodes = {
            axisNode: this.axisGroup,
            gridNode: this.axisGridGroup,
            labelNode: this.axisLabelGroup,
            overlayLowNode: this.axisOverlayLowGroup,
            overlayMidNode: this.axisOverlayMidGroup,
            overlayHighNode: this.axisOverlayHighGroup,
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

        this.eventsHub.emit('axis:change', null);
    }

    getAxisIdContext(id: AxisID): AxisContext | undefined {
        for (const [, contextsInThisDir] of this.axes) {
            for (const ctx of contextsInThisDir) {
                if (ctx.axisId === id) return ctx;
            }
        }
    }

    getAxisContext(direction: ChartAxisDirection) {
        return this.axes.get(direction) ?? [];
    }

    setRemappedAxisKeys(remappedAxisKeys: Map<string, AxisID>) {
        this.remappedAxisKeys = remappedAxisKeys;
    }

    getRemappedAxisId(id: string): AxisID | undefined {
        return this.remappedAxisKeys?.get(id);
    }

    destroy() {
        this.axes.clear();
        this.axisGroup.remove();
        this.axisGridGroup.remove();
    }
}
