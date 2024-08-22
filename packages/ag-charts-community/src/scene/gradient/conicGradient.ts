import { ColorScale } from '../../scale/colorScale';
import { normalizeAngle360, toRadians } from '../../util/angle';
import type { BBox } from '../bbox';
import { Gradient, type GradientColorStop } from './gradient';
import { LinearGradient } from './linearGradient';

export class ConicGradient extends Gradient {
    constructor(
        stops: GradientColorStop[],
        public angle = 0
    ) {
        super(stops);
    }

    createGradient(ctx: CanvasFillStrokeStyles, bbox: BBox): CanvasGradient | string | undefined {
        // Gradient 0° angle starts at top according to CSS spec
        const angleOffset = 90;
        const { stops, angle } = this;
        const radians = normalizeAngle360(toRadians(angle + angleOffset));

        if (stops.length === 0) return;
        if (stops.length === 1) return stops[0].color;
        if (!('createConicGradient' in ctx)) {
            // Fallback for Safari 16.0 and below - and not a good fallback either
            const linearGradient = new LinearGradient(this.stops, this.angle);
            return linearGradient.createGradient(ctx, bbox);
        }

        const cx = bbox.x + bbox.width * 0.5;
        const cy = bbox.y + bbox.height * 0.5;
        const gradient = ctx.createConicGradient(radians, cx, cy);

        const step = 0.05;
        let c0 = stops[0];
        gradient.addColorStop(c0.offset, c0.color);
        for (let i = 1; i < stops.length; i += 1) {
            const c1 = stops[i];

            const scale = new ColorScale();
            scale.domain = [c0.offset, c1.offset];
            scale.range = [c0.color, c1.color];
            for (let offset = c0.offset + step; offset < c1.offset; offset += 1) {
                gradient.addColorStop(offset, scale.convert(offset));
            }

            gradient.addColorStop(c1.offset, c1.color);

            c0 = c1;
        }

        return gradient;
    }
}
