import { Debug } from '../util/debug';
import { HdpiCanvas } from './canvas/hdpiCanvas';

interface SceneLayer {
    id: number;
    name?: string;
    canvas: HdpiCanvas;
    getComputedOpacity: () => number;
    getVisibility: () => boolean;
}

export class LayersManager {
    readonly debug = Debug.create(true, 'scene');

    private readonly layersMap = new Map<HdpiCanvas, SceneLayer>();

    private nextLayerId = 0;

    constructor(
        public readonly canvas: HdpiCanvas,
        public readonly markDirty: () => void
    ) {}

    get size() {
        return this.layersMap.size;
    }

    resize(width: number, height: number) {
        this.canvas.resize(width, height);
        this.layersMap.forEach(({ canvas }) => canvas.resize(width, height));
    }

    addLayer(opts: {
        zIndex?: number | number[];
        name?: string;
        getComputedOpacity: () => number;
        getVisibility: () => boolean;
    }) {
        const { width, height, pixelRatio } = this.canvas;
        const { name, getComputedOpacity, getVisibility } = opts;
        const canvas = new HdpiCanvas({ width, height, pixelRatio });

        this.layersMap.set(canvas, {
            id: this.nextLayerId++,
            name,
            canvas,
            getComputedOpacity,
            getVisibility,
        });

        this.debug('Scene.addLayer() - layers', this.layersMap);

        return canvas;
    }

    removeLayer(canvas: HdpiCanvas) {
        if (this.layersMap.has(canvas)) {
            this.layersMap.delete(canvas);
            canvas.destroy();
            this.markDirty();

            this.debug('Scene.removeLayer() -  layers', this.layersMap);
        }
    }

    clear() {
        this.layersMap.clear();
    }
}
