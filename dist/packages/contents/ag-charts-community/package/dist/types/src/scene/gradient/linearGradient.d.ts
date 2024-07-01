import type { BBox } from '../bbox';
import { Gradient, type GradientColorStop } from './gradient';
export declare class LinearGradient extends Gradient {
    angle: number;
    constructor(stops: GradientColorStop[], angle?: number);
    createGradient(ctx: CanvasFillStrokeStyles, bbox: BBox): CanvasGradient | string;
}
