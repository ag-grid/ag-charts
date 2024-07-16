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
export declare class ZoomManager extends BaseManager<ZoomEvents['type'], ZoomEvents> {
    private axisZoomManagers;
    private state;
    private rejectCallbacks;
    updateAxes(axes: Array<ChartAxisLike>): void;
    updateZoom(callerId: string, newZoom?: AxisZoomState, canChangeInitial?: boolean, rejectCallback?: (stateId: string) => void): void;
    updateAxisZoom(callerId: string, axisId: string, newZoom?: ZoomState): void;
    fireZoomPanStartEvent(callerId: string): void;
    getZoom(): AxisZoomState | undefined;
    getAxisZoom(axisId: string): ZoomState;
    getAxisZooms(): Record<string, {
        direction: ChartAxisDirection;
        zoom: ZoomState | undefined;
    }>;
    private applyChanges;
}
export {};
