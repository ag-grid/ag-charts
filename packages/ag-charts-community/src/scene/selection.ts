import { Debug } from 'ag-charts-core';

import { Group } from './group';
import { Node } from './node';

type ValidId = string | number;
type NodeConstructor<TNode extends Node> = new () => TNode;
type NodeFactory<TDatum, TNode extends Node<TDatum>> = (datum: TDatum) => TNode;
type NodeConstructorOrFactory<TDatum, TNode extends Node<TDatum>> = NodeConstructor<TNode> | NodeFactory<TDatum, TNode>;

/**
 * `Selection['nodeFactory']` causes some Selections to unintuitively become unassignable to something that looks like
 * it should be.
 *
 * Example:
 *
 *     type A = { opacity: number, yValue: number };
 *     type B = { opacity: number };
 *     type U = unknown;
 *     const myA = new Selection<A, Node<A>>(new Group, Rect<A>);
 *     const myB: Selection<B, Node<B>> = myA;            // error.
 *     const myU: Selection<U, Node<U>> = myA;            // also an error (same reason).
 *     const myI: SelectionInterface<B, Node<B>> = myA;   // OK
 *
 * Error for `myB` assignment
 *
 *     Type 'Selection<A, Node<A>>' is not assignable to type 'Selection<B, Node<B>>'.
 *      Types of property 'nodeFactory' are incompatible.
 *        Type 'NodeFactory<A, Node<A>>' is not assignable to type 'NodeFactory<B, Node<B>>'.
 *          Type 'B' is not assignable to type 'A'.
 *
 * Which basically mean: this is unsafe, because `myB` might end up in a situation where you create a `TDatum` that does
 * not include the `yValue` property, which would break the assumptions that you can make about `myA`.
 *
 * However, assignments like `myB` and `myU` are genuine cases that we want to support:
 *
 * 1.   `myB` Animation: Partially update a scene-node
 * 2.   `myU` Highlight: Call `Node.getBBox()` (we do not intend to access `Node.datum`).
 *
 * Using `SelectionInterface` works because you are telling Typescript that you only care about the methods `Selection`
 * (interface) and not about the properties used internally (implementation).
 */
export interface SelectionInterface<TDatum, TChild extends Node<TDatum>> {
    [Symbol.iterator](): IterableIterator<{ node: TChild }>;
    readonly length: number;
    nodes(): TChild[];
    cleanup(): void;
    isGarbage(node: TChild): boolean;
    batchedUpdate(fn: () => void): void;
}

export class Selection<TDatum, TChild extends Node<TDatum>> implements SelectionInterface<TDatum, TChild> {
    static select<N extends Node<any>>(
        parent: Group,
        classOrFactory: NodeConstructorOrFactory<any, N>,
        garbageCollection: boolean = true
    ) {
        type DImplicit = N extends Node<infer Datum> ? Datum : never;
        return new Selection<DImplicit, N>(parent, classOrFactory, garbageCollection);
    }

    static selectNoInference<DExplicit, N extends Node<DExplicit>>(
        parent: Group,
        classOrFactory: NodeConstructorOrFactory<DExplicit, N>,
        garbageCollection: boolean = true
    ) {
        return new Selection<DExplicit, N>(parent, classOrFactory, garbageCollection);
    }

    static selectAll<TChild extends Node = Node>(parent: Node, predicate: (node: Node) => node is TChild) {
        const results: TChild[] = [];
        const traverse = (node: Node) => {
            if (predicate(node)) {
                results.push(node);
            }
            if (node instanceof Group) {
                for (const child of node.children()) {
                    traverse(child);
                }
            }
        };
        traverse(parent);
        return results;
    }

    static selectByClass<TChild extends Node = Node>(node: Node, ...Classes: Array<new () => TChild>): TChild[] {
        return Selection.selectAll(node, (n: Node): n is TChild => Classes.some((C) => n instanceof C));
    }

    static selectByTag<TChild extends Node = Node>(node: Node, tag: number): TChild[] {
        return Selection.selectAll(node, (n: Node): n is TChild => n.tag === tag);
    }

    private readonly nodeFactory: NodeFactory<TDatum, TChild>;
    private readonly garbageBin = new Set<TChild>();

    private readonly _nodesMap = new Map<TChild, ValidId>();
    private _nodes: TChild[] = [];
    private data: TDatum[] = [];

    private readonly debug = Debug.create(true, 'scene', 'scene:selections');

    constructor(
        private readonly parentNode: Group,
        classOrFactory: NodeConstructorOrFactory<TDatum, TChild>,
        private readonly autoCleanup: boolean = true
    ) {
        this.nodeFactory = Object.prototype.isPrototypeOf.call(Node, classOrFactory)
            ? () => new (classOrFactory as NodeConstructor<TChild>)()
            : (classOrFactory as NodeFactory<TDatum, TChild>);
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
    update(data: TDatum[], initializer?: (node: TChild) => void, getDatumId?: (datum: TDatum) => ValidId) {
        if (this.garbageBin.size > 0) {
            this.debug(`Selection - update() called with pending garbage`, data);
        }

        // Handle transition: switching TO ID mode with existing untracked nodes.
        if (getDatumId && this._nodesMap.size === 0 && this._nodes.length > 0) {
            for (const node of this._nodes) {
                this.garbageBin.add(node);
            }
        }

        // Handle transition: switching FROM ID mode to index-based mode.
        if (!getDatumId && this._nodesMap.size > 0) {
            this._nodesMap.clear();
        }

        if (getDatumId) {
            const dataMap = new Map<ValidId, number>();
            const duplicateMap = new Map<ValidId, number>();
            for (let idx = 0; idx < data.length; idx++) {
                const datum = data[idx];
                let id = getDatumId(datum);
                if (dataMap.has(id)) {
                    const index = (duplicateMap.get(id) ?? 0) + 1;
                    duplicateMap.set(id, index);

                    id = `${id}:${index}`;
                }
                dataMap.set(id, idx);
            }

            for (const [node, datumId] of this._nodesMap.entries()) {
                const idx = dataMap.get(datumId);
                if (idx == null) {
                    this.garbageBin.add(node);
                } else {
                    node.datum = data[idx];
                    this.garbageBin.delete(node);
                    dataMap.delete(datumId);
                }
            }
            for (const [datumId, idx] of dataMap.entries()) {
                const datum = data[idx];
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

        const selection = this;

        function removeGarbage(node: TChild): boolean {
            if (selection.garbageBin.has(node)) {
                selection._nodesMap.delete(node);
                selection.garbageBin.delete(node);
                node.destroy();
                return false;
            }
            return true;
        }

        this._nodes = this._nodes.filter(removeGarbage);

        return this;
    }

    clear() {
        this.update([]);
        for (const node of this._nodesMap.keys()) {
            this.garbageBin.add(node);
        }
        this._nodesMap.clear();
        return this;
    }

    isGarbage(node: TChild) {
        return this.garbageBin.has(node);
    }

    each(iterate: (node: TChild, datum: TDatum, index: number) => void) {
        const nodes = this._nodes;
        this.parentNode.batchedUpdate(function selectionEach() {
            for (const entry of nodes.entries()) {
                const datum = entry[1].datum!;
                iterate(entry[1], datum, entry[0]);
            }
        });
        return this;
    }

    *[Symbol.iterator](): IterableIterator<{ node: TChild; datum: TDatum; index: number }> {
        for (let index = 0; index < this._nodes.length; index++) {
            const node = this._nodes[index];
            const datum = node.datum!;
            yield { node, datum, index };
        }
    }

    select<TChild2 extends Node>(predicate: (node: Node) => node is TChild2): TChild2[] {
        return Selection.selectAll(this.parentNode, predicate);
    }

    selectByClass<TChild2 extends Node>(Class: new () => TChild2): TChild2[] {
        return Selection.selectByClass(this.parentNode, Class);
    }

    selectByTag<TChild2 extends Node>(tag: number): TChild2[] {
        return Selection.selectByTag(this.parentNode, tag);
    }

    nodes() {
        return this._nodes;
    }

    at(index: number) {
        return this._nodes.at(index);
    }

    get length() {
        return this._nodes.length;
    }

    batchedUpdate(fn: () => void) {
        this.parentNode.batchedUpdate(fn);
    }
}
