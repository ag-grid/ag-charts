import { ColorScale } from '../../scale/colorScale';
import type { BBox } from '../bbox';

export interface GradientColorStop {
    offset: number;
    color: string;
}

export type ColorSpace = 'rgb' | 'oklch';

export abstract class Gradient {
    constructor(
        public colorSpace: ColorSpace,
        public stops: GradientColorStop[] = [],
        private readonly bbox?: BBox
    ) {}

    protected abstract createCanvasGradient(ctx: CanvasRenderingContext2D, bbox: BBox): CanvasGradient | undefined;

    private _cache:
        | { ctx: CanvasRenderingContext2D; bbox: BBox; gradient: CanvasGradient | string | undefined }
        | undefined = undefined;
    createGradient(ctx: CanvasRenderingContext2D, shapeBbox: BBox): CanvasGradient | string | undefined {
        const bbox = this.bbox ?? shapeBbox;

        if (this._cache != null && this._cache.ctx === ctx && this._cache.bbox.equals(bbox)) {
            return this._cache.gradient;
        }

        const { stops, colorSpace } = this;

        if (stops.length === 0) return;
        if (stops.length === 1) return stops[0].color;

        const gradient = this.createCanvasGradient(ctx, bbox);
        if (gradient == null) return;

        const isOkLch = colorSpace === 'oklch';

        const step = 0.05;
        let c0 = stops[0];
        gradient.addColorStop(c0.offset, c0.color);
        for (let i = 1; i < stops.length; i += 1) {
            const c1 = stops[i];

            if (isOkLch) {
                const scale = new ColorScale();
                scale.domain = [c0.offset, c1.offset];
                scale.range = [c0.color, c1.color];
                for (let offset = c0.offset + step; offset < c1.offset; offset += step) {
                    gradient.addColorStop(offset, scale.convert(offset));
                }
            }

            gradient.addColorStop(c1.offset, c1.color);

            c0 = c1;
        }

        this._cache = { ctx, bbox, gradient };

        return gradient;
    }
}
