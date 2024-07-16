import { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { Path } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';
export type MarkerPathMove = {
    x: number;
    y: number;
    t?: 'move';
};
export declare class Marker extends Path {
    static center: Point;
    x: number;
    y: number;
    size: number;
    repeat?: {
        x: number;
        y: number;
    }[];
    computeBBox(): BBox;
    protected applyPath(s: number, moves: MarkerPathMove[]): void;
    protected executeFill(ctx: CanvasContext, path?: Path2D | undefined): void;
    protected executeStroke(ctx: CanvasContext, path?: Path2D | undefined): void;
}
