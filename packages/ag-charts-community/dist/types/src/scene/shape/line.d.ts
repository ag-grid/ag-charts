import { BBox } from '../bbox';
import type { DistantObject } from '../nearest';
import type { NodeOptions, RenderContext } from '../node';
import { Shape } from './shape';
export declare class Line extends Shape implements DistantObject {
    static readonly className = "Line";
    protected static defaultStyles: never;
    constructor(opts?: NodeOptions);
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    set x(value: number);
    set y(value: number);
    computeBBox(): BBox;
    isPointInPath(px: number, py: number): boolean;
    distanceSquared(px: number, py: number): number;
    render(renderCtx: RenderContext): void;
}
