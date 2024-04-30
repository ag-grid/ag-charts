import type { BBox, Size } from '../../types/commonTypes';
import type { TransformMatrix } from '../../util/transformMatrix';
import { TreeNode } from './treeNode';

export abstract class SpatialNode extends TreeNode {
    transform?: TransformMatrix = undefined;
    visible?: boolean = undefined;
    zIndex?: number = undefined;

    abstract getBBox(): BBox;
    abstract getSize(): Size;
}
