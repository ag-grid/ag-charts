import type { BBox } from '../bbox';
export interface GradientColorStop {
    offset: number;
    color: string;
}
export declare abstract class Gradient {
    stops: GradientColorStop[];
    constructor(stops?: GradientColorStop[]);
    abstract createGradient(ctx: CanvasRenderingContext2D, bbox: BBox): CanvasGradient | string;
}
