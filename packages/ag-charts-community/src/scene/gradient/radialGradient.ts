import { type ColorSpace, type GradientColorStop, createSvgElement } from 'ag-charts-core';

import type { BBox } from '../bbox';
import { Gradient, type GradientParams } from './gradient';

export class RadialGradient extends Gradient {
    constructor(colorSpace: ColorSpace, stops: GradientColorStop[], bbox?: BBox) {
        super(colorSpace, stops, bbox);
    }

    protected override createCanvasGradient(
        ctx: CanvasRenderingContext2D,
        bbox: BBox,
        params?: GradientParams
    ): CanvasGradient | undefined {
        const cx = params?.centerX ?? bbox.x + bbox.width * 0.5;
        const cy = params?.centerY ?? bbox.y + bbox.height * 0.5;
        const innerRadius = params?.innerRadius ?? 0;
        const outerRadius = params?.outerRadius ?? Math.hypot(bbox.width * 0.5, bbox.height * 0.5) / Math.SQRT2;
        return ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    }

    createSvgGradient(bbox: BBox) {
        const cx = bbox.x + bbox.width * 0.5;
        const cy = bbox.y + bbox.height * 0.5;
        const gradient = createSvgElement('radialGradient');
        gradient.setAttribute('cx', String(cx));
        gradient.setAttribute('cy', String(cy));
        gradient.setAttribute('r', String(Math.hypot(bbox.width * 0.5, bbox.height * 0.5) / Math.SQRT2));
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
        return gradient;
    }
}
