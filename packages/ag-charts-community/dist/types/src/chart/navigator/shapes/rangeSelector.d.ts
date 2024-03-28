import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
export declare class RangeSelector extends Group {
    private background;
    private x;
    private y;
    private width;
    private height;
    private lOffset;
    private rOffset;
    constructor(children: Node[]);
    layout(x: number, y: number, width: number, height: number, lOffset: number, rOffset: number): void;
    updateBackground(oldGroup?: Group, newGroup?: Group): void;
    computeBBox(): BBox;
}
