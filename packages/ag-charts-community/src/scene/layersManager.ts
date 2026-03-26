import { Debug } from 'ag-charts-core';

import { HdpiCanvas } from './canvas/hdpiCanvas';
import { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';

interface SceneLayer {
    id: number;
    name?: string;
    canvas: HdpiOffscreenCanvas;
}

export class LayersManager {
    readonly debug = Debug.create(true, 'scene');

    private readonly layersMap = new Map<HdpiOffscreenCanvas, SceneLayer>();

    private nextLayerId = 0;

    constructor(public readonly canvas: HdpiCanvas) {}

    get size() {
        return this.layersMap.size;
    }

    resize(width: number, height: number, pixelRatio: number) {
        this.canvas.resize(width, height, pixelRatio);
        for (const { canvas } of this.layersMap.values()) {
            canvas.resize(width, height, pixelRatio);
        }
    }

    addLayer(opts: { name?: string }) {
        const { width, height, pixelRatio } = this.canvas;
        const { name } = opts;
        const canvas = new HdpiOffscreenCanvas({ width, height, pixelRatio });

        this.layersMap.set(canvas, {
            id: this.nextLayerId++,
            name,
            canvas,
        });

        this.debug('Scene.addLayer() - layers', this.layersMap);

        return canvas;
    }

    removeLayer(canvas: HdpiOffscreenCanvas) {
        if (this.layersMap.has(canvas)) {
            this.layersMap.delete(canvas);
            canvas.destroy();

            this.debug('Scene.removeLayer() -  layers', this.layersMap);
        }
    }

    clear() {
        for (const layer of this.layersMap.values()) {
            layer.canvas.destroy();
        }
        this.layersMap.clear();
    }
}
