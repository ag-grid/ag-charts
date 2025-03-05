import type { BBox } from '../bbox';
import { type ColorSpace, Gradient } from './gradient';
import type { GradientColorStop } from './stops';

export class RadialGradient extends Gradient {
    constructor(colorSpace: ColorSpace, stops: GradientColorStop[], bbox?: BBox) {
        super(colorSpace, stops, bbox);
    }

    protected override createCanvasGradient(ctx: CanvasRenderingContext2D, bbox: BBox): CanvasGradient | undefined {
        const cx = bbox.x + bbox.width * 0.5;
        const cy = bbox.y + bbox.height * 0.5;
        return ctx.createRadialGradient(
            cx,
            cy,
            0,
            cx,
            cy,
            Math.hypot(bbox.width * 0.5, bbox.height * 0.5) / Math.SQRT2
        );
    }
}
