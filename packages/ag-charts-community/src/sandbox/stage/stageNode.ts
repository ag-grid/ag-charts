interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class StageNode {
    private childNodes?: Set<StageNode>;

    public parentNode?: StageNode;
    public zIndex?: number;

    abstract getBoundingBox(): BoundingBox;

    get size() {
        return this.childNodes?.size ?? 0;
    }

    children() {
        return this.childNodes?.values() ?? [].values();
    }

    addChild(node: StageNode) {
        node.parentNode?.removeChild(node);
        node.parentNode = this;
        this.childNodes ??= new Set();
        this.childNodes.add(node);
        return node;
    }

    removeChild(node: StageNode) {
        if (this.childNodes?.delete(node)) {
            delete node.parentNode;
            return true;
        }
        return false;
    }

    remove() {
        return this.parentNode?.removeChild(this) ?? false;
    }

    empty() {
        for (const child of this.children()) {
            this.removeChild(child);
        }
    }

    *traverseUp(includeSelf?: boolean) {
        let node: StageNode | undefined = this;
        if (includeSelf) {
            yield node;
        }
        while ((node = node.parentNode)) {
            yield node;
        }
    }
}
