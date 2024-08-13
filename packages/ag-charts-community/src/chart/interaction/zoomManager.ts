import type { AgZoomRange, AgZoomRatio } from 'ag-charts-types';

import type { MementoOriginator } from '../../api/state/memento';
import { deepClone } from '../../util/json';
import { StateTracker } from '../../util/stateTracker';
import { isFiniteNumber, isObject } from '../../util/type-guards';
import { BaseManager } from '../baseManager';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';

export interface ZoomState {
    min: number;
    max: number;
}

export interface AxisZoomState {
    x?: ZoomState;
    y?: ZoomState;
}

export interface DefinedZoomState {
    x: ZoomState;
    y: ZoomState;
}

export type ZoomMemento = {
    rangeX?: AgZoomRange;
    rangeY?: AgZoomRange;
    ratioX?: AgZoomRatio;
    ratioY?: AgZoomRatio;
};

export interface ZoomChangeEvent extends AxisZoomState {
    type: 'zoom-change';
    callerId: string;
    axes: Record<string, ZoomState | undefined>;
}

export interface ZoomPanStartEvent {
    type: 'zoom-pan-start';
    callerId: string;
}

export interface ZoomRestoreEvent extends ZoomMemento {
    type: 'restore-zoom';
}

export type ChartAxisLike = {
    id: string;
    direction: ChartAxisDirection;
    visibleRange: [number, number];
};

type ZoomEvents = ZoomChangeEvent | ZoomPanStartEvent | ZoomRestoreEvent;

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager<ZoomEvents['type'], ZoomEvents> implements MementoOriginator<ZoomMemento> {
    public mementoOriginatorKey = 'zoom' as const;

    private readonly axisZoomManagers = new Map<string, AxisZoomManager>();
    private readonly state = new StateTracker<AxisZoomState>(undefined, 'initial');
    private readonly rejectCallbacks = new Map<string, (stateId: string) => void>();

    private axes?: LayoutCompleteEvent['axes'];

    public addLayoutService(layoutService: LayoutService) {
        this.destroyFns.push(
            layoutService.addListener('layout:complete', (event) => {
                this.axes = event.axes;
            })
        );
    }

    public createMemento() {
        const zoom = this.getDefinedZoom();
        return {
            rangeX: this.getRangeDirection(zoom, ChartAxisDirection.X),
            rangeY: this.getRangeDirection(zoom, ChartAxisDirection.Y),
            ratioX: { start: zoom.x.min, end: zoom.x.max },
            ratioY: { start: zoom.y.min, end: zoom.y.max },
        };
    }

    public guardMemento(blob: unknown): blob is ZoomMemento {
        return (
            isObject(blob) && (blob.ratioX != null || blob.ratioY != null || blob.rangeX != null || blob.rangeY != null)
        );
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: ZoomMemento) {
        // Migration from older versions can be implemented here.

        this.listeners.dispatch('restore-zoom', { ...memento, type: 'restore-zoom' });
    }

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

    private getRangeDirection(zoom: DefinedZoomState, direction: ChartAxisDirection) {
        for (const axis of this.axes ?? []) {
            if (axis.direction !== direction) continue;

            const domain = axis.scale.getDomain?.();
            const d0 = axis.scale.convert?.(domain?.at(0));
            const d1 = axis.scale.convert?.(domain?.at(-1));

            if (!isFiniteNumber(d0) || !isFiniteNumber(d1)) return;

            let start;
            let end;

            if (d0 <= d1) {
                const diff = d1 - d0;
                start = axis.scale.invert?.(0);
                end = axis.scale.invert?.(d0 + diff * zoom[direction].max);
            } else {
                const diff = d0 - d1;
                start = axis.scale.invert?.(d0 - diff * zoom[direction].min);
                end = axis.scale.invert?.(0);
            }

            return { start, end };
        }
    }

    private getDefinedZoom(): DefinedZoomState {
        const zoom = this.getZoom();
        return {
            x: { min: zoom?.x?.min ?? 0, max: zoom?.x?.max ?? 1 },
            y: { min: zoom?.y?.min ?? 0, max: zoom?.y?.max ?? 1 },
        };
    }
}

class AxisZoomManager {
    private readonly axis: ChartAxisLike;
    private currentZoom: ZoomState;
    private readonly state: StateTracker<ZoomState>;

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
