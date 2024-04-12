// Abstract class representing a node in a tree structure, capable of having children and a parent.
export abstract class TreeNode {
    // Children nodes are lazily initialized to conserve memory in prevalent leaf nodes.
    children?: Set<TreeNode>;
    parent: TreeNode | null = null;

    // Determines if this node is the root of a tree (i.e., has no parent but is not a leaf).
    get isRoot() {
        return this.parent === null && !this.isLeaf;
    }

    // Determines if this node is a leaf (i.e., has no children).
    get isLeaf() {
        return !this.children?.size;
    }

    // Appends a child node to this node, automatically removing it from its previous parent if necessary.
    appendChild(child: TreeNode) {
        child.parent?.children?.delete(child);
        child.parent = this;
        this.children ??= new Set();
        this.children.add(child);
    }

    // Removes a child node from this node. If the node is successfully removed, its parent reference is cleared.
    removeChild(child: TreeNode) {
        if (this.children?.delete(child)) {
            child.parent = null;
        }
    }

    // Clears all children from this node, removing their parent references.
    clearChildren() {
        if (this.children == null) return;
        for (const child of this.children) {
            child.parent = null;
        }
        this.children.clear();
    }

    // Generator function to iterate over the ancestors of this node, optionally including this node itself.
    *ancestors(includeSelf?: boolean): Generator<TreeNode> {
        let node: TreeNode | null = this;
        if (includeSelf) {
            yield node;
        }
        while ((node = node.parent)) {
            yield node;
        }
    }
}
