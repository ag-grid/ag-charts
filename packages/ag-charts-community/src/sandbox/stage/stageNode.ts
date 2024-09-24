import { TreeNode } from '../util/treeNode';

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class StageNode extends TreeNode {
    public zIndex?: number;

    abstract getBoundingBox(): BoundingBox;
}

export class GroupNode extends StageNode {
    override getBoundingBox(): BoundingBox {
        throw new Error('Method not implemented.');
    }
}
