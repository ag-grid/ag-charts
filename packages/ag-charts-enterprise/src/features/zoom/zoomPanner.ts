import { _ModuleSupport } from 'ag-charts-community';
import {
    type BoxBounds,
    ChartAxisDirection,
    UNIT_MAX,
    UNIT_MIN,
    definedZoomState,
    entries,
    getWindow,
} from 'ag-charts-core';

import type { ZoomCoords } from './zoomTypes';
import { constrainZoom, dx, dy, pointToRatio, translateZoom } from './zoomUtils';

type State = _ModuleSupport.CoreZoomState;
type StateRetrieval = _ModuleSupport.CoreZoomStateSafeRetrieval;

export interface ZoomPanUpdate {
    type: 'update';
    deltaX: number;
    deltaY: number;
}

interface ZoomCoordHistory {
    x: number;
    y: number;
    t: number;
}

const maxZoomCoords = 16;

const decelerationValues = {
    off: 1,
    short: 0.01,
    long: 0.002,
};

export class ZoomPanner {
    deceleration: number | keyof typeof decelerationValues = 1;
    private get decelerationValue(): number {
        const { deceleration } = this;
        return Math.max(
            typeof deceleration === 'number' ? deceleration : decelerationValues[deceleration] ?? 1,
            0.0001
        );
    }

    private onUpdate: ((e: ZoomPanUpdate) => void) | undefined;

    private coords?: ZoomCoords;
    private direction?: ChartAxisDirection;

    private coordsMonitorTimeout: NodeJS.Timeout | undefined;
    private zoomCoordsHistoryIndex = 0;
    private readonly coordsHistory: ZoomCoordHistory[] = [];

    private inertiaHandle: number | undefined;

    addListener(_type: 'update', fn: (e: ZoomPanUpdate) => void) {
        this.onUpdate = fn;
        return () => {
            this.onUpdate = undefined;
        };
    }

    stopInteractions() {
        if (this.inertiaHandle != null) {
            cancelAnimationFrame(this.inertiaHandle);
            this.inertiaHandle = undefined;
        }
    }

    update(event: { currentX: number; currentY: number }) {
        this.updateCoords(event.currentX, event.currentY);
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};
        this.onUpdate?.({
            type: 'update',
            deltaX: this.isPanningX() ? x1 - x2 : 0,
            deltaY: this.isPanningY() ? y1 - y2 : 0,
        });
    }

    start(direction?: ChartAxisDirection) {
        this.direction = direction;
        this.coordsMonitorTimeout = setInterval(this.recordCurrentZoomCoords.bind(this), 16);
    }

    stop() {
        const { coordsHistory } = this;

        let deltaX = 0;
        let deltaY = 0;
        let deltaT = 0;
        if (coordsHistory.length > 0) {
            const arrayIndex = this.zoomCoordsHistoryIndex % maxZoomCoords;
            let index1 = arrayIndex - 1;
            if (index1 < 0) index1 = coordsHistory.length - 1;
            let index0 = arrayIndex;
            if (index0 >= coordsHistory.length) index0 = 0;

            const coords1 = coordsHistory[index1];
            const coords0 = coordsHistory[index0];

            deltaX = this.isPanningX() ? coords1.x - coords0.x : 0;
            deltaY = this.isPanningY() ? coords1.y - coords0.y : 0;
            deltaT = coords1.t - coords0.t;
        }

        this.coords = undefined;
        this.direction = undefined;
        clearInterval(this.coordsMonitorTimeout);
        this.coordsMonitorTimeout = undefined;
        this.zoomCoordsHistoryIndex = 0;
        this.coordsHistory.length = 0;

        if (deltaT > 0 && this.decelerationValue < 1) {
            const xVelocity = deltaX / deltaT;
            const yVelocity = deltaY / deltaT;
            const velocity = Math.hypot(xVelocity, yVelocity);
            const angle = Math.atan2(yVelocity, xVelocity);
            const t0 = performance.now();
            this.inertiaHandle = getWindow().requestAnimationFrame((t) => {
                this.animateInertia(t, t, t0, velocity, angle);
            });
        }
    }

    private recordCurrentZoomCoords() {
        const { coords, coordsHistory, zoomCoordsHistoryIndex } = this;
        if (!coords) return;
        const { x2: x, y2: y } = coords;
        const t = Date.now();

        coordsHistory[zoomCoordsHistoryIndex % maxZoomCoords] = { x, y, t };
        this.zoomCoordsHistoryIndex += 1;
    }

    private animateInertia(t: number, prevT: number, t0: number, velocity: number, angle: number) {
        const friction = 1 - this.decelerationValue;

        // Displacement at t = infinity
        const maxS = -velocity / Math.log(friction);

        const s0 = (velocity * (friction ** (prevT - t0) - 1)) / Math.log(friction);
        const s1 = (velocity * (friction ** (t - t0) - 1)) / Math.log(friction);

        this.onUpdate?.({
            type: 'update',
            deltaX: this.isPanningX() ? -Math.cos(angle) * (s1 - s0) : 0,
            deltaY: this.isPanningY() ? -Math.sin(angle) * (s1 - s0) : 0,
        });

        // If we won't advance more than one pixel, stop inertial panning
        if (s1 >= maxS - 1) return;

        this.inertiaHandle = requestAnimationFrame((nextT) => {
            this.animateInertia(nextT, t, t0, velocity, angle);
        });
    }

    private updateCoords(x: number, y: number) {
        if (this.coords) {
            this.coords = { x1: this.coords.x2, y1: this.coords.y2, x2: x, y2: y };
        } else {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        }
    }

    private isPanningX() {
        return this.direction == null || this.direction === ChartAxisDirection.X;
    }

    private isPanningY() {
        return this.direction == null || this.direction === ChartAxisDirection.Y;
    }

    translateZooms(bbox: BoxBounds, currentZooms: StateRetrieval, deltaX: number, deltaY: number) {
        const offset = pointToRatio(bbox, bbox.x + Math.abs(deltaX), bbox.y + bbox.height - Math.abs(deltaY));

        const offsetX = Math.sign(deltaX) * offset.x;
        const offsetY = -Math.sign(deltaY) * offset.y;

        const newZooms: State = {};

        for (const [axisId, currentZoom] of entries(currentZooms)) {
            if (currentZoom == null) continue;
            // Skip panning axes that are fully zoomed out to prevent floating point issues
            if (currentZoom.min === UNIT_MIN && currentZoom.max === UNIT_MAX) {
                continue;
            }
            const { direction } = currentZoom;

            let zoom = definedZoomState({ [direction]: currentZoom });
            zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), offsetY * dy(zoom)));

            const { min, max } = zoom[direction];
            newZooms[axisId] = { direction, min, max };
        }

        return newZooms;
    }
}
