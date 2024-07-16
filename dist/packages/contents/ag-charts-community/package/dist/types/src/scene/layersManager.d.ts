import { type LiteralOrFn } from '../util/compare';
import { HdpiCanvas } from './canvas/hdpiCanvas';
export type ZIndexSubOrder = [LiteralOrFn<string | number>, LiteralOrFn<number>];
interface SceneLayer {
    id: number;
    name?: string;
    zIndex: number;
    zIndexSubOrder?: ZIndexSubOrder;
    canvas: HdpiCanvas;
    getComputedOpacity: () => number;
    getVisibility: () => boolean;
}
export declare class LayersManager {
    readonly canvas: HdpiCanvas;
    readonly markDirty: () => void;
    protected static sortLayers(a: SceneLayer, b: SceneLayer): number;
    readonly debug: import("../util/debug").DebugLogger;
    private readonly layersMap;
    private nextZIndex;
    private nextLayerId;
    constructor(canvas: HdpiCanvas, markDirty: () => void);
    get size(): number;
    forEach(callback: (layer: SceneLayer, index: number, array: SceneLayer[]) => void): void;
    resize(width: number, height: number): void;
    addLayer(opts: {
        zIndex?: number;
        zIndexSubOrder?: ZIndexSubOrder;
        name?: string;
        getComputedOpacity: () => number;
        getVisibility: () => boolean;
    }): HdpiCanvas;
    removeLayer(canvas: HdpiCanvas): void;
    moveLayer(canvas: HdpiCanvas, newZIndex: number, newZIndexSubOrder?: ZIndexSubOrder): void;
    clear(): void;
}
export {};
