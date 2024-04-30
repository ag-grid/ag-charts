import { TreeNode } from './treeNode';

export class GroupNode extends TreeNode {
    appendChildren(...children: TreeNode[]) {
        for (const child of children) {
            this.appendChild(child);
        }
        return this;
    }

    removeChildren(...children: TreeNode[]) {
        for (const child of children) {
            this.removeChild(child);
        }
        return this;
    }
}
