import { ChartAxisDirection } from '../chartAxisDirection';
import { BaseManager } from './baseManager';

export interface ZoomState {
    min: number;
    max: number;
}

export interface AxisZoomState {
    x?: ZoomState;
    y?: ZoomState;
}

export interface ZoomChangeEvent extends AxisZoomState {
    type: 'zoom-change';
    axes: Record<string, ZoomState | undefined>;
}

type ChartAxisLike = {
    id: string;
    direction: ChartAxisDirection;
    visibleRange: [number, number];
};

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager<'zoom-change', ZoomChangeEvent> {
    private axisZoomManagers = new Map<string, AxisZoomManager>();
    private initialZoom?: AxisZoomState;

    public updateAxes(axes: Array<ChartAxisLike>) {
        const zoomManagers = new Map(axes.map((axis) => [axis.id, this.axisZoomManagers.get(axis.id)]));

        this.axisZoomManagers.clear();

        for (const axis of axes) {
            this.axisZoomManagers.set(axis.id, zoomManagers.get(axis.id) ?? new AxisZoomManager(axis));
        }

        if (this.initialZoom) {
            this.updateZoom(this.initialZoom);
        }
        this.initialZoom = undefined;
    }

    public updateZoom(newZoom?: AxisZoomState) {
        if (this.axisZoomManagers.size === 0) {
            this.initialZoom = newZoom;
            return;
        }

        this.axisZoomManagers.forEach((axis) => {
            axis.updateZoom(newZoom?.[axis.getDirection()]);
        });

        this.applyChanges();
    }

    public updateAxisZoom(axisId: string, newZoom?: ZoomState) {
        this.axisZoomManagers.get(axisId)?.updateZoom(newZoom);
        this.applyChanges();
    }

    public getZoom(): AxisZoomState | undefined {
        let x: ZoomState | undefined;
        let y: ZoomState | undefined;

        // Use the zoom on the primary (first) axis in each direction
        this.axisZoomManagers.forEach((axis) => {
            if (axis.getDirection() === ChartAxisDirection.X) {
                x ??= axis.getZoom();
            } else if (axis.getDirection() === ChartAxisDirection.Y) {
                y ??= axis.getZoom();
            }
        });

        if (x || y) {
            return { x, y };
        }
    }

    public getAxisZoom(axisId: string): ZoomState {
        return this.axisZoomManagers.get(axisId)?.getZoom() ?? { min: 0, max: 1 };
    }

    public getAxisZooms(): Record<string, { direction: ChartAxisDirection; zoom: ZoomState | undefined }> {
        const axes: Record<string, { direction: ChartAxisDirection; zoom: ZoomState | undefined }> = {};
        for (const [axisId, axis] of this.axisZoomManagers.entries()) {
            axes[axisId] = {
                direction: axis.getDirection(),
                zoom: axis.getZoom(),
            };
        }
        return axes;
    }

    private applyChanges() {
        const changed = Array.from(this.axisZoomManagers.values())
            .map((axis) => axis.applyChanges())
            .some(Boolean);

        if (!changed) {
            return;
        }

        const axes: Record<string, ZoomState | undefined> = {};
        for (const [axisId, axis] of this.axisZoomManagers.entries()) {
            axes[axisId] = axis.getZoom();
        }

        this.listeners.dispatch('zoom-change', { type: 'zoom-change', ...this.getZoom(), axes });
    }
}

class AxisZoomManager {
    private currentZoom: ZoomState;
    private pendingZoom?: ZoomState;
    private axis: ChartAxisLike;

    constructor(axis: ChartAxisLike) {
        this.axis = axis;

        const [min = 0, max = 1] = axis.visibleRange;
        this.currentZoom = { min, max };
    }

    getDirection(): ChartAxisDirection {
        return this.axis.direction;
    }

    public updateZoom(newZoom?: ZoomState) {
        if (newZoom != null) {
            this.pendingZoom = { ...newZoom };
        }
    }

    public getZoom() {
        return this.currentZoom;
    }

    public applyChanges(): boolean {
        const prevZoom = this.currentZoom;
        this.currentZoom = this.pendingZoom ?? this.currentZoom;
        return prevZoom?.min !== this.currentZoom?.min || prevZoom?.max !== this.currentZoom?.max;
    }
}
