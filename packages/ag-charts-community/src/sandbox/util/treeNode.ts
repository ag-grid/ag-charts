export interface ITreeNode {
    readonly size: number;
    isLeaf(): boolean;
    isRoot(): boolean;
    addChild<T extends ITreeNode>(node: T): T;
    addChildren(...node: ITreeNode[]): void;
    removeChild(node: ITreeNode): boolean;
    removeChildren(...node: ITreeNode[]): void;
    remove(): any;
    empty(): void;
    children(): Generator<ITreeNode, void>;
    traverseUp(includeSelf?: boolean): Generator<ITreeNode, void>;
}

export abstract class TreeNode implements ITreeNode {
    private childNodes?: Set<TreeNode>;
    private parentNode?: TreeNode;

    /**
     * Gets the number of child nodes.
     */
    get size() {
        return this.childNodes?.size ?? 0;
    }

    /**
     * Checks if the node is a leaf (has no children).
     */
    isLeaf() {
        return !this.childNodes?.size;
    }

    /**
     * Checks if the node is the root (has no parent).
     */
    isRoot() {
        return !this.parentNode;
    }

    /**
     * Adds a child node, removing it from its current parent if necessary.
     * @param node The child node to add.
     * @returns The added child node.
     */
    addChild<T extends TreeNode>(node: T) {
        node.parentNode?.removeChild(node);
        node.parentNode = this;
        this.childNodes ??= new Set();
        this.childNodes.add(node);
        return node;
    }

    /**
     * Adds multiple child nodes.
     * @param nodes The child nodes to add.
     */
    addChildren(...nodes: TreeNode[]) {
        for (const node of nodes) {
            this.addChild(node);
        }
    }

    /**
     * Removes a child node.
     * @param node The child node to remove.
     * @returns `true` if the node was removed, `false` otherwise.
     */
    removeChild(node: TreeNode) {
        if (this.childNodes?.delete(node)) {
            delete node.parentNode;
            return true;
        }
        return false;
    }

    /**
     * Removes multiple child nodes.
     * @param nodes The child nodes to remove.
     */
    removeChildren(...nodes: TreeNode[]) {
        for (const node of nodes) {
            this.removeChild(node);
        }
    }

    /**
     * Removes this node from its parent.
     * @returns `true` if the node was removed, `false` otherwise.
     */
    remove() {
        return this.parentNode?.removeChild(this) ?? false;
    }

    /**
     * Removes all child nodes.
     */
    empty() {
        for (const child of this.children()) {
            this.removeChild(child);
        }
    }

    /**
     * Returns an iterator for the child nodes.
     */
    *children() {
        if (this.childNodes) {
            yield* this.childNodes;
        }
    }

    /**
     * Traverses up the tree, yielding nodes from this node up to the root.
     * @param includeSelf Whether to include the current node in the traversal.
     */
    *traverseUp(includeSelf?: boolean) {
        let node: TreeNode | undefined = this;
        if (includeSelf) {
            yield node;
        }
        while ((node = node.parentNode)) {
            yield node;
        }
    }
}
