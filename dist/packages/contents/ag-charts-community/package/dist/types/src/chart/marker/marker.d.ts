import { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { Path } from '../../scene/shape/path';
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
    computeBBox(): BBox;
    protected applyPath(s: number, moves: MarkerPathMove[]): void;
}
