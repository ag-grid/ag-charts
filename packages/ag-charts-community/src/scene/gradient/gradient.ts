import { type ColorSpace, type GradientColorStop, createSvgElement } from 'ag-charts-core';

import { ColorScale } from '../../scale/colorScale';
import type { BBox } from '../bbox';

export interface GradientParams {
    centerX?: number;
    centerY?: number;
    innerRadius?: number;
    outerRadius?: number;
}

export abstract class Gradient {
    constructor(
        public colorSpace: ColorSpace,
        public stops: GradientColorStop[] = [],
        private readonly bbox?: BBox
    ) {}

    protected abstract createCanvasGradient(
        ctx: CanvasRenderingContext2D,
        bbox: BBox,
        params?: GradientParams
    ): CanvasGradient | undefined;

    private _cache:
        | { ctx: CanvasRenderingContext2D; bbox: BBox; gradient: CanvasGradient | string | undefined }
        | undefined = undefined;
    createGradient(
        ctx: CanvasRenderingContext2D,
        shapeBbox: BBox,
        params?: GradientParams
    ): CanvasGradient | string | undefined {
        const bbox = this.bbox ?? shapeBbox;

        if (!bbox.isFinite()) {
            return;
        }

        if (this._cache?.ctx === ctx && this._cache.bbox.equals(bbox)) {
            return this._cache.gradient;
        }

        const { stops, colorSpace } = this;

        if (stops.length === 0) return;
        if (stops.length === 1) return stops[0].color;

        let gradient = this.createCanvasGradient(ctx, bbox, params);
        if (gradient == null) return;

        const isOkLch = colorSpace === 'oklch';

        const step = 0.05;
        let c0 = stops[0];
        gradient.addColorStop(c0.stop, c0.color);
        for (let i = 1; i < stops.length; i += 1) {
            const c1 = stops[i];

            if (isOkLch) {
                const scale = new ColorScale();
                scale.domain = [c0.stop, c1.stop];
                scale.range = [c0.color, c1.color];
                for (let stop = c0.stop + step; stop < c1.stop; stop += step) {
                    gradient.addColorStop(stop, scale.convert(stop) ?? 'transparent');
                }
            }

            gradient.addColorStop(c1.stop, c1.color);

            c0 = c1;
        }

        if ('createPattern' in gradient) {
            // Node-canvas stubs
            gradient = (gradient as { createPattern(): CanvasGradient }).createPattern();
        }

        this._cache = { ctx, bbox, gradient };

        return gradient;
    }

    protected abstract createSvgGradient(bbox: BBox): SVGElement;
    toSvg(shapeBbox: BBox): SVGElement {
        const bbox = this.bbox ?? shapeBbox;

        const gradient = this.createSvgGradient(bbox);
        for (const { stop: offset, color } of this.stops) {
            const stop = createSvgElement('stop');

            stop.setAttribute('offset', `${offset}`);
            stop.setAttribute('stop-color', `${color}`);

            gradient.appendChild(stop);
        }
        return gradient;
    }
}
