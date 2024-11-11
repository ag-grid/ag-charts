import { normalizeAngle360, toRadians } from '../../util/angle';
import type { BBox } from '../bbox';
import { type ColorSpace, Gradient, type GradientColorStop } from './gradient';

export class ConicGradient extends Gradient {
    constructor(
        colorSpace: ColorSpace,
        stops: GradientColorStop[],
        public angle = 0,
        bbox?: BBox
    ) {
        super(colorSpace, stops, bbox);
    }

    protected override createCanvasGradient(ctx: CanvasRenderingContext2D, bbox: BBox): CanvasGradient | undefined {
        // Gradient 0° angle starts at top according to CSS spec
        const angleOffset = 90;
        const { angle } = this;
        const radians = normalizeAngle360(toRadians(angle + angleOffset));

        const cx = bbox.x + bbox.width * 0.5;
        const cy = bbox.y + bbox.height * 0.5;
        return ctx.createConicGradient(radians, cx, cy);
    }
}
