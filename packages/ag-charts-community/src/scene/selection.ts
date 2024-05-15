import { Debug } from '../util/debug';
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

    static selectAll<TChild extends Node = Node>(parent: Node, predicate: (node: Node) => node is TChild) {
        const results: TChild[] = [];
        const traverse = (node: Node) => {
            if (predicate(node)) {
                results.push(node);
            }
            node.children.forEach(traverse);
        };
        traverse(parent);
        return results;
    }

    static selectByClass<TChild extends Node = Node>(
        node: Node,
        Class: new () => TChild,
        ...ExtraClasses: Array<new () => TChild>
    ): TChild[] {
        return Selection.selectAll(node, (n: Node): n is TChild => {
            return n instanceof Class || ExtraClasses.some((C) => n instanceof C);
        });
    }

    static selectByTag<TChild extends Node = Node>(node: Node, tag: number): TChild[] {
        return Selection.selectAll(node, (n: Node): n is TChild => n.tag === tag);
    }

    private readonly nodeFactory: NodeFactory<TChild, TDatum>;
    private readonly garbageBin = new Set<TChild>();

    protected _nodesMap = new Map<TChild, string | number>();
    protected _nodes: TChild[] = [];
    protected data: TDatum[] = [];

    private readonly debug = Debug.create(true, 'scene', 'scene:selections');

    constructor(
        private readonly parentNode: Node,
        classOrFactory: NodeConstructorOrFactory<TChild, TDatum>,
        private readonly autoCleanup: boolean = true
    ) {
        this.nodeFactory = Object.prototype.isPrototypeOf.call(Node, classOrFactory)
            ? () => new (classOrFactory as NodeConstructor<TChild>)()
            : (classOrFactory as NodeFactory<TChild, TDatum>);
    }

    private createNode(datum: TDatum, initializer?: (node: TChild) => void, idx?: number) {
        const node = this.nodeFactory(datum);
        node.datum = datum;
        initializer?.(node);
        if (idx == null) {
            this._nodes.push(node);
        } else {
            this._nodes.splice(idx, 0, node);
        }
        this.parentNode.appendChild(node);
        return node;
    }

    /**
     * Update the data in a selection. If an `getDatumId()` function is provided, maintain a list of ids related to
     * the nodes. Otherwise, take the more efficient route of simply creating and destroying nodes at the end
     * of the array.
     */
    update(data: TDatum[], initializer?: (node: TChild) => void, getDatumId?: (datum: TDatum) => string | number) {
        if (this.garbageBin.size > 0) {
            this.debug(`Selection - update() called with pending garbage: ${data}`);
        }

        if (getDatumId) {
            const dataMap = new Map<string | number, [TDatum, number]>(
                data.map((datum, idx) => [getDatumId(datum), [datum, idx]])
            );
            for (const [node, datumId] of this._nodesMap.entries()) {
                if (dataMap.has(datumId)) {
                    const [newDatum] = dataMap.get(datumId)!;
                    node.datum = newDatum;
                    this.garbageBin.delete(node);
                    dataMap.delete(datumId);
                } else {
                    this.garbageBin.add(node);
                }
            }
            for (const [datumId, [datum, idx]] of dataMap.entries()) {
                this._nodesMap.set(this.createNode(datum, initializer, idx), datumId);
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
                    this.garbageBin.delete(this._nodes[i]);
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
                node.destroy();
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

    isGarbage(node: TChild) {
        return this.garbageBin.has(node);
    }

    hasGarbage() {
        return this.garbageBin.size > 0;
    }

    each(iterate: (node: TChild, datum: TDatum, index: number) => void) {
        for (const entry of this._nodes.entries()) {
            iterate(entry[1], entry[1].datum, entry[0]);
        }
        return this;
    }

    *[Symbol.iterator](): IterableIterator<{ node: TChild; datum: TDatum; index: number }> {
        for (let index = 0; index < this._nodes.length; index++) {
            const node = this._nodes[index];
            const datum = this._nodes[index].datum;
            yield { node, datum, index };
        }
    }

    select<TChild2 extends Node = Node>(predicate: (node: Node) => node is TChild2): TChild2[] {
        return Selection.selectAll(this.parentNode, predicate);
    }

    selectByClass<TChild2 extends Node = Node>(Class: new () => TChild2): TChild2[] {
        return Selection.selectByClass(this.parentNode, Class);
    }

    selectByTag<TChild2 extends Node = Node>(tag: number): TChild2[] {
        return Selection.selectByTag(this.parentNode, tag);
    }

    nodes() {
        return this._nodes;
    }
}
