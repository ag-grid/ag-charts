import { Node } from './node';

type NodeConstructor<TNode extends Node> = new () => TNode;
type NodeFactory<TNode extends Node, TDatum> = (datum: TDatum) => TNode;
type NodeConstructorOrFactory<TNode extends Node, TDatum> = NodeConstructor<TNode> | NodeFactory<TNode, TDatum>;

export class Selection<TChild extends Node = Node, TDatum = any> {
    static select<TChild extends Node = Node, TDatum = any>(
        parent: Node,
        classOrFactory: NodeConstructorOrFactory<TChild, TDatum>,
        garbageCollection: boolean = true
    ) {
        return new Selection(parent, classOrFactory, garbageCollection);
    }

    static selectAll<T extends Node = Node>(parent: Node, predicate: (node: Node) => boolean): T[] {
        const results: T[] = [];
        const traverse = (node: Node) => {
            if (predicate(node)) {
                results.push(node as T);
            }
            node.children.forEach(traverse);
        };
        traverse(parent);
        return results;
    }

    static selectByClass<T extends Node = Node>(node: Node, Class: new () => T): T[] {
        return Selection.selectAll(node, (node) => node instanceof Class);
    }

    static selectByTag<T extends Node = Node>(node: Node, tag: number): T[] {
        return Selection.selectAll(node, (node) => node.tag === tag);
    }

    private readonly nodeFactory: NodeFactory<TChild, TDatum>;
    private readonly garbageBin = new Set<TChild>();

    protected _nodesMap = new Map<TChild, string | number>();
    protected _nodes: TChild[] = [];
    protected data: TDatum[] = [];

    constructor(
        private readonly parentNode: Node,
        classOrFactory: NodeConstructorOrFactory<TChild, TDatum>,
        private readonly autoCleanup: boolean = true
    ) {
        this.nodeFactory = Object.prototype.isPrototypeOf.call(Node, classOrFactory)
            ? () => new (classOrFactory as NodeConstructor<TChild>)()
            : (classOrFactory as NodeFactory<TChild, TDatum>);
    }

    private createNode(datum: TDatum, initializer?: (node: TChild) => void) {
        const node = this.nodeFactory(datum);
        node.datum = datum;
        initializer?.(node);
        this._nodes.push(node);
        this.parentNode.appendChild(node);
        return node;
    }

    /**
     * Update the data in a selection. If an `getDatumId()` function is provided, maintain a list of ids related to
     * the nodes. Otherwise, take the more efficient route of simply creating and destroying nodes at the end
     * of the array.
     */
    update(data: TDatum[], initializer?: (node: TChild) => void, getDatumId?: (datum: TDatum) => string | number) {
        if (getDatumId) {
            const dataMap = new Map<string | number, TDatum>(data.map((datum) => [getDatumId(datum), datum]));
            for (const [node, datumId] of this._nodesMap.entries()) {
                if (dataMap.has(datumId)) {
                    node.datum = dataMap.get(datumId);
                    this.garbageBin.delete(node);
                    dataMap.delete(datumId);
                } else {
                    this.garbageBin.add(node);
                }
            }
            for (const [datumId, datum] of dataMap.entries()) {
                this._nodesMap.set(this.createNode(datum, initializer), datumId);
            }
        } else {
            const maxLength = Math.max(data.length, this.data.length);
            for (let i = 0; i < maxLength; i++) {
                if (i >= data.length) {
                    this.garbageBin.add(this._nodes[i]);
                } else if (i >= this._nodes.length) {
                    this.createNode(data[i], initializer);
                } else {
                    this._nodes[i].datum = data[i];
                }
            }
        }

        this.data = data.slice();

        if (this.autoCleanup) {
            this.cleanup();
        }

        return this;
    }

    cleanup() {
        if (this.garbageBin.size === 0) {
            return this;
        }

        this._nodes = this._nodes.filter((node) => {
            if (this.garbageBin.has(node)) {
                this._nodesMap.delete(node);
                this.garbageBin.delete(node);
                this.parentNode.removeChild(node);
                return false;
            }
            return true;
        });

        return this;
    }

    clear() {
        this.update([]);
        return this;
    }

    each(iterate: (node: TChild, datum: TDatum, index: number) => void) {
        this._nodes.forEach((node, i) => iterate(node, node.datum, i));
        return this;
    }

    select<T extends Node = Node>(predicate: (node: Node) => boolean): T[] {
        return Selection.selectAll(this.parentNode, predicate);
    }

    selectByClass<T extends Node = Node>(Class: new () => T): T[] {
        return Selection.selectByClass(this.parentNode, Class);
    }

    selectByTag<T extends Node = Node>(tag: number): T[] {
        return Selection.selectByTag(this.parentNode, tag);
    }

    nodes() {
        return this._nodes;
    }
}
