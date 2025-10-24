import { type ColorSpace, createSvgElement } from 'ag-charts-core';

import { normalizeAngle360FromDegrees } from 'ag-charts-core/utils/angle';
import type { BBox } from '../bbox';
import { Gradient, type GradientParams } from './gradient';
import type { GradientColorStop } from './stops';

export class ConicGradient extends Gradient {
    constructor(
        colorSpace: ColorSpace,
        stops: GradientColorStop[],
        public angle = 0,
        bbox?: BBox
    ) {
        super(colorSpace, stops, bbox);
    }

    protected override createCanvasGradient(
        ctx: CanvasRenderingContext2D,
        bbox: BBox,
        params?: GradientParams
    ): CanvasGradient | undefined {
        // Gradient 0° angle starts at top according to CSS spec
        const angleOffset = -90;
        const { angle } = this;
        const radians = normalizeAngle360FromDegrees(angle + angleOffset);
        const cx = params?.centerX ?? bbox.x + bbox.width * 0.5;
        const cy = params?.centerY ?? bbox.y + bbox.height * 0.5;

        return ctx.createConicGradient(radians, cx, cy);
    }

    createSvgGradient(_bbox: BBox) {
        // SVG doesn't support conic gradients
        return createSvgElement('linearGradient');
    }
}
