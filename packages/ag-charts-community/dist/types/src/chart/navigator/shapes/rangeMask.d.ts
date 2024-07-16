import { BBox } from '../../../scene/bbox';
import { Path } from '../../../scene/shape/path';
export declare class RangeMask extends Path {
    static readonly className = "RangeMask";
    zIndex: number;
    private x;
    private y;
    private width;
    private height;
    private min;
    private max;
    layout(x: number, y: number, width: number, height: number): void;
    update(min: number, max: number): void;
    computeBBox(): BBox;
    computeVisibleRangeBBox(): BBox;
    updatePath(): void;
}
