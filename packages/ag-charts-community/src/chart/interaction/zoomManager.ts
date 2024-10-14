import type { AgZoomRange, AgZoomRatio } from 'ag-charts-types';

import type { MementoOriginator } from '../../api/state/memento';
import type { BBox } from '../../scene/bbox';
import { Logger, clamp } from '../../sparklines-util';
import type { BBoxValues } from '../../util/bboxinterface';
import { deepClone } from '../../util/json';
import { StateTracker } from '../../util/stateTracker';
import { isFiniteNumber, isObject } from '../../util/type-guards';
import { BaseManager } from '../baseManager';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { LayoutCompleteEvent, LayoutManager } from '../layout/layoutManager';

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

function normalize(screenMin: number, min: number, screenMax: number, max: number, target: number): number {
    return min + (max - min) * ((target - screenMin) / (screenMax - screenMin));
}

function unnormalize(screenMin: number, min: number, screenMax: number, max: number, ratio: number): number {
    return screenMin + (ratio - min) * ((screenMax - screenMin) / (max - min));
}
function calcWorld(viewportMin: number, viewportMax: number, ratio: ZoomState): [number, number] {
    return [
        unnormalize(viewportMin, ratio.min, viewportMax, ratio.max, 0),
        unnormalize(viewportMin, ratio.min, viewportMax, ratio.max, 1),
    ];
}
/* Pan viewport min (unnormalised, i.e. pixel coords.) by the smallest amount
   such that the viewport range includes the input target range but clamped at
   the world range. The function assumes:
   1)  worldMin <= viewportMin <= viewportMax <= worldMax
   2)  (viewportMax - viewportMin) >= (targetMax - targetMin)
*/
function panAxesUnnormalized(
    worldMin: number,
    worldMax: number,
    viewportMin: number,
    viewportMax: number,
    targetMin: number,
    targetMax: number
): number {
    if (viewportMin <= targetMin && targetMax <= viewportMax) return viewportMin;
    const mindiff = targetMin - viewportMin;
    const maxdiff = targetMax - viewportMax;
    const diff = Math.abs(mindiff) < Math.abs(maxdiff) ? mindiff : maxdiff;
    return clamp(worldMin, viewportMin + diff, worldMax);
}

// The calculations of the new desired viewport (i.e. ZoomState) is done in pixel coords (unnormalised).
// The desired (x, y) for the new viewport is found, the pixel coords are converted into normalized values
export function calcPanToBBoxRatios(viewport: BBoxValues, ratioX: ZoomState, ratioY: ZoomState, target: BBoxValues): AxisZoomState {
    const [targetXMin, targetXMax] = [target.x, target.x + target.width];
    const [targetYMin, targetYMax] = [target.y, target.y + target.height];
    const [viewportXMin, viewportXMax] = [viewport.x, viewport.x + viewport.width];
    const [viewportYMin, viewportYMax] = [viewport.y, viewport.y + viewport.height];
    const [worldXMin, worldXMax] = calcWorld(viewportXMin, viewportXMax, ratioX);
    const [worldYMin, worldYMax] = calcWorld(viewportYMin, viewportYMax, ratioY);

    const x = panAxesUnnormalized(worldXMin, worldXMax, viewportXMin, viewportXMax, targetXMin, targetXMax);
    const y = panAxesUnnormalized(worldYMin, worldYMax, viewportYMin, viewportYMax, targetYMin, targetYMax);

    return {
        x: {
            min: normalize(viewportXMin, ratioX.min, viewportXMax, ratioX.max, x),
            max: normalize(viewportXMin, ratioX.min, viewportXMax, ratioX.max, x + viewport.width),
        },
        y: {
            min: normalize(viewportYMin, ratioY.min, viewportYMax, ratioY.max, y),
            max: normalize(viewportYMin, ratioY.min, viewportYMax, ratioY.max, y + viewport.height),
        },
    };
}
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

    public addLayoutListeners(layoutManager: LayoutManager) {
        this.destroyFns.push(
            layoutManager.addListener('layout:complete', (event) => {
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

    panToBBox(callerId: string, seriesRect: BBox, target: BBoxValues) {
        const { x: zoomX, y: zoomY } = this.getZoom() ?? {};
        if (!zoomX || !zoomY) return;
        if (target.width > seriesRect.width || target.height > seriesRect.height) {
            Logger.errorOnce(`cannot pan to target BBox`);
            return;
        }

        const newZoom: AxisZoomState = calcPanToBBoxRatios(seriesRect, zoomX, zoomY, target);
        this.updateZoom(callerId, newZoom);
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
