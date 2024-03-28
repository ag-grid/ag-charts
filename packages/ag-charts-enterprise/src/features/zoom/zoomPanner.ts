import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { AxisZoomStates, ZoomCoords } from './zoomTypes';
import { constrainZoom, definedZoomState, dx, dy, pointToRatio, translateZoom } from './zoomUtils';

const { RATIO, Validate } = _ModuleSupport;
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

export class ZoomPanner {
    @Validate(RATIO)
    deceleration: number = 0.01;

    private animationManager: _ModuleSupport.AnimationManager;

    private onUpdate: ((e: ZoomPanUpdate) => void) | undefined;

    private coords?: ZoomCoords;

    private coordsMonitorTimeout: NodeJS.Timeout | undefined;
    private zoomCoordsHistoryIndex = 0;
    private coordsHistory: ZoomCoordHistory[] = [];

    private animation: _ModuleSupport.Animation<number> | undefined;

    constructor(ctx: _ModuleSupport.ModuleContext) {
        this.animationManager = ctx.animationManager;
    }

    addListener(_type: 'update', fn: (e: ZoomPanUpdate) => void) {
        this.onUpdate = fn;
        return () => {
            this.onUpdate = undefined;
        };
    }

    stopInteractions() {
        this.animation?.stop();
        this.animation = undefined;
    }

    update(event: _ModuleSupport.InteractionEvent<'drag'>) {
        this.updateCoords(event.offsetX, event.offsetY);
        const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = this.coords ?? {};
        this.onUpdate?.({
            type: 'update',
            deltaX: x1 - x2,
            deltaY: y1 - y2,
        });
    }

    start() {
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

            deltaX = coords1.x - coords0.x;
            deltaY = coords1.y - coords0.y;
            deltaT = coords1.t - coords0.t;
        }

        this.coords = undefined;
        clearInterval(this.coordsMonitorTimeout);
        this.coordsMonitorTimeout = undefined;
        this.zoomCoordsHistoryIndex = 0;
        this.coordsHistory.length = 0;

        if (deltaT <= 0 || this.deceleration >= 1) return;

        const xVelocity = deltaX / deltaT;
        const yVelocity = deltaY / deltaT;
        const velocity = Math.hypot(xVelocity, yVelocity);
        const angle = Math.atan2(yVelocity, xVelocity);

        const friction = 1 - this.deceleration;
        // Displacement at t = infinity
        const maxS = -velocity / Math.log(friction);
        const maxObservableS = maxS - 1;
        const maxT = Math.log((maxObservableS * Math.log(friction)) / velocity + 1) / Math.log(friction);

        let s0 = 0;
        this.animation = this.animationManager.animate({
            id: 'momentum-panning',
            groupId: 'zoom',
            phase: 'update',
            from: 0,
            to: maxT,
            // TODO: Set duration to maxT
            collapsable: false,
            onUpdate: (t) => {
                console.log('t', t);

                const s1 = (velocity * (friction ** t - 1)) / Math.log(friction);

                this.onUpdate?.({
                    type: 'update',
                    deltaX: -Math.cos(angle) * (s1 - s0),
                    deltaY: -Math.sin(angle) * (s1 - s0),
                });

                s0 = s1;
            },
            onStop() {
                console.log('STOP');
            },
        });
        this.animation?.play();
    }

    private recordCurrentZoomCoords() {
        const { coords, coordsHistory, zoomCoordsHistoryIndex } = this;
        if (!coords) return;
        const { x2: x, y2: y } = coords;
        const t = Date.now();

        coordsHistory[zoomCoordsHistoryIndex % maxZoomCoords] = { x, y, t };
        this.zoomCoordsHistoryIndex += 1;
    }

    private updateCoords(x: number, y: number) {
        if (!this.coords) {
            this.coords = { x1: x, y1: y, x2: x, y2: y };
        } else {
            this.coords = { x1: this.coords.x2, y1: this.coords.y2, x2: x, y2: y };
        }
    }

    translateZooms(bbox: _Scene.BBox, currentZooms: AxisZoomStates, deltaX: number, deltaY: number) {
        const offset = pointToRatio(bbox, bbox.x + Math.abs(deltaX), bbox.y + bbox.height - Math.abs(deltaY));

        const offsetX = Math.sign(deltaX) * offset.x;
        const offsetY = -Math.sign(deltaY) * offset.y;

        const newZooms: AxisZoomStates = {};

        for (const [axisId, { direction, zoom: currentZoom }] of Object.entries(currentZooms)) {
            let zoom;
            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                zoom = definedZoomState({ x: currentZoom });
            } else {
                zoom = definedZoomState({ y: currentZoom });
            }

            zoom = constrainZoom(translateZoom(zoom, offsetX * dx(zoom), offsetY * dy(zoom)));

            if (direction === _ModuleSupport.ChartAxisDirection.X) {
                newZooms[axisId] = { direction, zoom: zoom.x };
            } else {
                newZooms[axisId] = { direction, zoom: zoom.y };
            }
        }

        return newZooms;
    }
}
