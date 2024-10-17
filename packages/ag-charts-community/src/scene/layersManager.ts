import { Debug } from '../util/debug';
import { HdpiCanvas } from './canvas/hdpiCanvas';

interface SceneLayer {
    id: number;
    name?: string;
    canvas: HdpiCanvas;
}

export class LayersManager {
    readonly debug = Debug.create(true, 'scene');

    private readonly layersMap = new Map<HdpiCanvas, SceneLayer>();

    private nextLayerId = 0;

    constructor(public readonly canvas: HdpiCanvas) {}

    get size() {
        return this.layersMap.size;
    }

    resize(width: number, height: number) {
        this.canvas.resize(width, height);
        this.layersMap.forEach(({ canvas }) => canvas.resize(width, height));
    }

    addLayer(opts: { name?: string }) {
        const { width, height, pixelRatio } = this.canvas;
        const { name } = opts;
        const canvas = new HdpiCanvas({ width, height, pixelRatio });

        this.layersMap.set(canvas, {
            id: this.nextLayerId++,
            name,
            canvas,
        });

        this.debug('Scene.addLayer() - layers', this.layersMap);

        return canvas;
    }

    removeLayer(canvas: HdpiCanvas) {
        if (this.layersMap.has(canvas)) {
            this.layersMap.delete(canvas);
            canvas.destroy();

            this.debug('Scene.removeLayer() -  layers', this.layersMap);
        }
    }

    clear() {
        this.layersMap.clear();
    }
}
