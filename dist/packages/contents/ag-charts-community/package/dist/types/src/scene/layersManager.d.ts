import { type LiteralOrFn } from '../util/compare';
import { HdpiCanvas } from './canvas/hdpiCanvas';
import { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';
type Canvas = HdpiCanvas | HdpiOffscreenCanvas;
export type ZIndexSubOrder = [LiteralOrFn<string | number>, LiteralOrFn<number>];
interface SceneLayer {
    id: number;
    name?: string;
    zIndex: number;
    zIndexSubOrder?: ZIndexSubOrder;
    canvas: HdpiOffscreenCanvas | HdpiCanvas;
    getComputedOpacity: () => number;
    getVisibility: () => boolean;
}
export declare class LayersManager {
    readonly canvas: Canvas;
    readonly markDirty: () => void;
    protected static sortLayers(a: SceneLayer, b: SceneLayer): number;
    readonly debug: import("../util/debug").DebugLogger;
    private readonly layersMap;
    private nextZIndex;
    private nextLayerId;
    constructor(canvas: Canvas, markDirty: () => void);
    get size(): number;
    forEach(callback: (layer: SceneLayer, index: number, array: SceneLayer[]) => void): void;
    resize(width: number, height: number): void;
    addLayer(opts: {
        zIndex?: number;
        zIndexSubOrder?: ZIndexSubOrder;
        name?: string;
        getComputedOpacity: () => number;
        getVisibility: () => boolean;
    }): HdpiCanvas | HdpiOffscreenCanvas | undefined;
    removeLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas): void;
    moveLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas, newZIndex: number, newZIndexSubOrder?: ZIndexSubOrder): void;
    clear(): void;
}
export {};
