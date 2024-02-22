import { type LiteralOrFn, ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { Debug } from '../util/debug';
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

export class LayersManager {
    protected static sortLayers(a: SceneLayer, b: SceneLayer) {
        return compoundAscending(
            [a.zIndex, ...(a.zIndexSubOrder ?? [undefined, undefined]), a.id],
            [b.zIndex, ...(b.zIndexSubOrder ?? [undefined, undefined]), b.id],
            ascendingStringNumberUndefined
        );
    }

    readonly debug = Debug.create(true, 'scene');

    private readonly layersMap = new Map<Canvas, SceneLayer>();

    private nextZIndex = 0;
    private nextLayerId = 0;

    constructor(
        public readonly canvas: Canvas,
        public readonly markDirty: () => void
    ) {}

    get size() {
        return this.layersMap.size;
    }

    forEach(callback: (layer: SceneLayer, index: number, array: SceneLayer[]) => void) {
        Array.from(this.layersMap.values()).sort(LayersManager.sortLayers).forEach(callback);
    }

    resize(width: number, height: number) {
        this.canvas.resize(width, height);
        this.layersMap.forEach(({ canvas }) => canvas.resize(width, height));
    }

    addLayer(opts: {
        zIndex?: number;
        zIndexSubOrder?: ZIndexSubOrder;
        name?: string;
        getComputedOpacity: () => number;
        getVisibility: () => boolean;
    }): HdpiCanvas | HdpiOffscreenCanvas | undefined {
        const { width, height, pixelRatio } = this.canvas;
        const { zIndex = this.nextZIndex++, name, zIndexSubOrder, getComputedOpacity, getVisibility } = opts;
        const CanvasConstructor = HdpiOffscreenCanvas.isSupported() ? HdpiOffscreenCanvas : HdpiCanvas;
        const canvas = new CanvasConstructor({ width, height, pixelRatio });

        const newLayer: SceneLayer = {
            id: this.nextLayerId++,
            name,
            canvas,
            zIndex,
            zIndexSubOrder,
            getComputedOpacity,
            getVisibility,
        };

        if (zIndex >= this.nextZIndex) {
            this.nextZIndex = zIndex + 1;
        }

        this.layersMap.set(canvas, newLayer);

        this.debug('Scene.addLayer() - layers', this.layersMap);

        return newLayer.canvas;
    }

    removeLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas) {
        if (this.layersMap.has(canvas)) {
            this.layersMap.delete(canvas);
            canvas.destroy();
            this.markDirty();

            this.debug('Scene.removeLayer() -  layers', this.layersMap);
        }
    }

    moveLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas, newZIndex: number, newZIndexSubOrder?: ZIndexSubOrder) {
        const layer = this.layersMap.get(canvas);

        if (layer) {
            layer.zIndex = newZIndex;
            layer.zIndexSubOrder = newZIndexSubOrder;
            this.markDirty();

            this.debug('Scene.moveLayer() -  layers', this.layersMap);
        }
    }

    clear() {
        this.layersMap.clear();
    }
}
