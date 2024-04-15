import { deepClone } from '../../util/json';
import { StateTracker } from '../../util/stateTracker';
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
    callerId: string;
    axes: Record<string, ZoomState | undefined>;
}

export interface ZoomPanStartEvent {
    type: 'zoom-pan-start';
    callerId: string;
}

export type ChartAxisLike = {
    id: string;
    direction: ChartAxisDirection;
    visibleRange: [number, number];
};

type ZoomEvents = ZoomChangeEvent | ZoomPanStartEvent;

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager<ZoomEvents['type'], ZoomEvents> {
    private axisZoomManagers = new Map<string, AxisZoomManager>();
    private state = new StateTracker<AxisZoomState>(undefined, 'initial');
    private rejectCallbacks = new Map<string, (stateId: string) => void>();

    public updateAxes(axes: Array<ChartAxisLike>) {
        const zoomManagers = new Map(axes.map((axis) => [axis.id, this.axisZoomManagers.get(axis.id)]));

        this.axisZoomManagers.clear();

        for (const axis of axes) {
            this.axisZoomManagers.set(axis.id, zoomManagers.get(axis.id) ?? new AxisZoomManager(axis));
        }

        if (this.state.size > 0 && axes.length > 0) {
            this.updateZoom(this.state.stateId()!, this.state.stateValue());
        }
    }

    public updateZoom(
        callerId: string,
        newZoom?: AxisZoomState,
        canChangeInitial = true,
        rejectCallback?: (stateId: string) => void
    ) {
        if (rejectCallback) {
            this.rejectCallbacks.set(callerId, rejectCallback);
        }

        if (this.axisZoomManagers.size === 0) {
            // Only update the initial zoom state if no other modules have tried or permitted. This allows us to give
            // priority to the 'zoom' module over 'navigator' if they both attempt to set the initial zoom state.
            const stateId = this.state.stateId()!;
            if (stateId === 'initial' || stateId === callerId || canChangeInitial) {
                this.state.set(callerId, newZoom);
                if (stateId !== callerId) {
                    this.rejectCallbacks.get(stateId)?.(callerId);
                }
            } else {
                rejectCallback?.(stateId);
            }
            return;
        }

        this.state.set(callerId, newZoom);

        this.axisZoomManagers.forEach((axis) => {
            axis.updateZoom(callerId, newZoom?.[axis.getDirection()]);
        });

        this.applyChanges(callerId);
    }

    public updateAxisZoom(callerId: string, axisId: string, newZoom?: ZoomState) {
        this.axisZoomManagers.get(axisId)?.updateZoom(callerId, newZoom);
        this.applyChanges(callerId);
    }

    // Fire this event to signal to listeners that the view is changing through a zoom and/or pan change.
    public fireZoomPanStartEvent(callerId: string) {
        this.listeners.dispatch('zoom-pan-start', { type: 'zoom-pan-start', callerId });
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

    private applyChanges(callerId: string) {
        const changed = Array.from(this.axisZoomManagers.values(), (axis) => axis.applyChanges()).some(Boolean);

        if (!changed) {
            return;
        }

        const axes: Record<string, ZoomState | undefined> = {};
        for (const [axisId, axis] of this.axisZoomManagers.entries()) {
            axes[axisId] = axis.getZoom();
        }

        this.listeners.dispatch('zoom-change', { type: 'zoom-change', ...this.getZoom(), axes, callerId });
    }
}

class AxisZoomManager {
    private axis: ChartAxisLike;
    private currentZoom: ZoomState;
    private state: StateTracker<ZoomState>;

    constructor(axis: ChartAxisLike) {
        this.axis = axis;

        const [min = 0, max = 1] = axis.visibleRange;
        this.state = new StateTracker({ min, max });
        this.currentZoom = this.state.stateValue()!;
    }

    getDirection(): ChartAxisDirection {
        return this.axis.direction;
    }

    public updateZoom(callerId: string, newZoom?: ZoomState) {
        this.state.set(callerId, newZoom);
    }

    public getZoom() {
        return deepClone(this.state.stateValue()!);
    }

    public applyChanges(): boolean {
        const prevZoom = this.currentZoom;
        this.currentZoom = this.state.stateValue()!;
        return prevZoom.min !== this.currentZoom.min || prevZoom.max !== this.currentZoom.max;
    }
}
