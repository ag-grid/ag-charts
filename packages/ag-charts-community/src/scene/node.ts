import { createId } from '../util/id';
import { toIterable } from '../util/iterator';
import { BBox } from './bbox';
import { RedrawType, SceneChangeDetection } from './changeDetectable';
import type { LayersManager, ZIndexSubOrder } from './layersManager';

export { SceneChangeDetection, RedrawType };

export enum PointerEvents {
    All,
    None,
}

export type RenderContext = {
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    devicePixelRatio: number;
    forceRender: boolean | 'dirtyTransform';
    resized: boolean;
    clipBBox?: BBox;
    stats?: {
        nodesRendered: number;
        nodesSkipped: number;
        layersRendered: number;
        layersSkipped: number;
    };
    debugNodeSearch?: (string | RegExp)[];
    debugNodes: Record<string, Node>;
};

export interface NodeOptions {
    name?: string;
    isVirtual?: boolean;
    tag?: number;
    zIndex?: number;
}

export type NodeWithOpacity = Node & { opacity: number };

export type ChildNodeCounts = {
    groups: number;
    nonGroups: number;
};

/**
 * Abstract scene graph node.
 * Each node can have zero or one parent and belong to zero or one scene.
 */
export abstract class Node {
    static _nextSerialNumber = 0;

    /** Unique number to allow creation order to be easily determined. */
    readonly serialNumber = Node._nextSerialNumber++;

    protected _dirty: RedrawType = RedrawType.MAJOR;

    /**
     * Unique node ID in the form `ClassName-NaturalNumber`.
     */
    readonly id = createId(this);
    readonly name?: string;

    protected _datum?: any;
    protected _previousDatum?: any;

    public transitionOut?: boolean;

    /**
     * Some arbitrary data bound to the node.
     */
    get datum() {
        return this._datum ?? this.parentNode?.datum;
    }
    set datum(datum: any) {
        if (this._datum !== datum) {
            this._previousDatum = this._datum;
            this._datum = datum;
        }
    }
    get previousDatum(): any {
        return this._previousDatum;
    }

    /**
     * Some number to identify this node, typically within a `Group` node.
     * Usually this will be some enum value used as a selector.
     */
    tag: number;

    /**
     * To simplify the type system (especially in Selections) we don't have the `Parent` node
     * (one that has children). Instead, we mimic HTML DOM, where any node can have children.
     * But we still need to distinguish regular leaf nodes from container leafs somehow.
     */
    protected isContainerNode: boolean = false;

    /**
     * Indicates if this node should be substituted for its children when traversing the scene
     * graph. This allows intermingling of child-nodes that are managed by different chart classes
     * without breaking scene-graph encapsulation.
     */
    readonly isVirtual: boolean;

    // Note: _setScene and _setParent methods are not meant for end users,
    // but they are not quite private either, rather, they have package level visibility.

    protected _debug?: (...args: any[]) => void;
    protected _layerManager?: LayersManager;
    _setLayerManager(value?: LayersManager) {
        this._layerManager = value;
        this._debug = value?.debug;

        for (const child of this.children(false)) {
            child._setLayerManager(value);
        }
    }
    get layerManager(): LayersManager | undefined {
        return this._layerManager;
    }

    *traverseUp(includeSelf?: boolean) {
        let node: Node | undefined = this;
        if (includeSelf) {
            yield node;
        }
        while ((node = node.parentNode)) {
            yield node;
        }
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

    private childNodes?: Set<Node>;
    private parentNode?: Node;
    private virtualChildrenCount: number = 0;

    *children(flattenVirtual = true): Generator<Node, void, undefined> {
        if (!this.childNodes) return;
        const virtualChildren = [];
        for (const child of this.childNodes) {
            if (flattenVirtual && child.isVirtual) {
                virtualChildren.push(child.children());
            } else {
                yield child;
            }
        }
        for (const vChildren of virtualChildren) {
            yield* vChildren;
        }
    }

    *virtualChildren(): Generator<Node, void, undefined> {
        if (!this.childNodes || !this.virtualChildrenCount) return;
        for (const child of this.childNodes) {
            if (child.isVirtual) {
                yield child;
            }
        }
    }

    hasVirtualChildren() {
        return this.virtualChildrenCount > 0;
    }

    setProperties<T>(this: T, styles: { [K in keyof T]?: T[K] }, pickKeys?: (keyof T)[]) {
        if (pickKeys) {
            for (const key of pickKeys) {
                (this as any)[key] = styles[key];
            }
        } else {
            Object.assign(this as any, styles);
        }
        return this;
    }

    /**
     * Appends one or more new node instances to this parent.
     * If one needs to:
     * - move a child to the end of the list of children
     * - move a child from one parent to another (including parents in other scenes)
     * one should use the {@link insertBefore} method instead.
     * @param nodes A node or nodes to append.
     */
    append(nodes: Iterable<Node> | Node) {
        this.childNodes ??= new Set();
        for (const node of toIterable(nodes)) {
            node.parentNode?.removeChild(node);
            this.childNodes.add(node);

            node.parentNode = this;
            node._setLayerManager(this.layerManager);

            if (node.isVirtual) {
                this.virtualChildrenCount++;
            }
        }

        this.cachedBBox = undefined;
        this.dirtyZIndex = true;
        this.markDirty(RedrawType.MAJOR);
    }

    appendChild<T extends Node>(node: T): T {
        this.append(node);
        return node;
    }

    removeChild(node: Node): boolean {
        if (!this.childNodes?.delete(node)) {
            return false;
        }

        delete node.parentNode;
        node._setLayerManager();

        if (node.isVirtual) {
            this.virtualChildrenCount--;
        }

        this.cachedBBox = undefined;
        this.dirtyZIndex = true;
        this.markDirty(RedrawType.MAJOR);

        return true;
    }

    remove() {
        return this.parentNode?.removeChild(this) ?? false;
    }

    clear() {
        for (const child of this.children(false)) {
            delete child.parentNode;
            child._setLayerManager();
        }
        this.childNodes?.clear();
        this.cachedBBox = undefined;
        this.virtualChildrenCount = 0;
    }

    constructor({ isVirtual, tag, zIndex, name }: NodeOptions = {}) {
        this.name = name;
        this.isVirtual = isVirtual ?? false;
        this.tag = tag ?? NaN;
        this.zIndex = zIndex ?? 0;
    }

    destroy(): void {
        this.parentNode?.removeChild(this);
    }

    containsPoint(_x: number, _y: number): boolean {
        return false;
    }

    /**
     * Hit testing method.
     * Recursively checks if the given point is inside this node or any of its children.
     * Returns the first matching node or `undefined`.
     * Nodes that render later (show on top) are hit tested first.
     */
    pickNode(x: number, y: number, _localCoords = false): Node | undefined {
        if (!this.visible || this.pointerEvents === PointerEvents.None || !this.containsPoint(x, y)) {
            return;
        }

        const children = [...this.children()];

        if (children.length > 1_000) {
            // Try to optimise which children to interrogate; BBox calculation is an approximation
            // for more complex shapes, so discarding items based on this will save a lot of
            // processing when the point is nowhere near the child.
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                const containsPoint = child.containsPoint(x, y);
                const hit = containsPoint ? child.pickNode(x, y) : undefined;

                if (hit) {
                    return hit;
                }
            }
        } else if (children.length) {
            // Nodes added later should be hit-tested first,
            // as they are rendered on top of the previously added nodes.
            for (let i = children.length - 1; i >= 0; i--) {
                const hit = children[i].pickNode(x, y);
                if (hit) {
                    return hit;
                }
            }
        } else if (!this.isContainerNode) {
            // a leaf node, but not a container leaf
            return this;
        }
    }

    private cachedBBox?: BBox;

    getBBox(): BBox {
        if (this.cachedBBox == null) {
            this.cachedBBox = Object.freeze(this.computeBBox());
        }

        return this.cachedBBox!;
    }

    protected computeBBox(): BBox | undefined {
        return;
    }

    readonly _childNodeCounts: ChildNodeCounts = {
        groups: 0,
        nonGroups: 0,
    };
    /** Perform any pre-rendering initialization. */
    preRender(): ChildNodeCounts {
        this._childNodeCounts.groups = 0;
        this._childNodeCounts.nonGroups = 1; // Assume this node isn't a group.

        for (const child of this.children()) {
            const childCounts = child.preRender();
            this._childNodeCounts.groups += childCounts.groups;
            this._childNodeCounts.nonGroups += childCounts.nonGroups;
        }

        return this._childNodeCounts;
    }

    render(renderCtx: RenderContext): void {
        const { stats } = renderCtx;

        this._dirty = RedrawType.NONE;

        if (renderCtx.debugNodeSearch) {
            const idOrName = this.name ?? this.id;
            if (renderCtx.debugNodeSearch.some((v) => (typeof v === 'string' ? v === idOrName : v.test(idOrName)))) {
                renderCtx.debugNodes[this.name ?? this.id] = this;
            }
        }

        if (stats) {
            stats.nodesRendered++;
        }
    }

    markDirty(type = RedrawType.TRIVIAL, parentType = type) {
        const { _dirty } = this;
        // Short-circuit case to avoid needing to percolate all dirty flag changes if redundant.
        const dirtyTypeBelowHighWatermark = _dirty > type || (_dirty === type && type === parentType);
        // If parent node cached a bbox previously, this node will have a cached bbox too. Therefore,
        // if this node has no cached bbox, we don't need to force clearing of parents cached bbox.
        const noParentCachedBBox = this.cachedBBox == null;
        if (noParentCachedBBox && dirtyTypeBelowHighWatermark) return;

        this.cachedBBox = undefined;
        this._dirty = Math.max(_dirty, type);
        if (this.parentNode) {
            this.parentNode.markDirty(parentType);
        } else if (this.layerManager) {
            this.layerManager.markDirty();
        }
    }
    get dirty() {
        return this._dirty;
    }

    markClean(opts?: { force?: boolean; recursive?: boolean | 'virtual' }) {
        const { force = false, recursive = true } = opts ?? {};

        if (this._dirty === RedrawType.NONE && !force) return;

        this._dirty = RedrawType.NONE;

        for (const child of this.children(false)) {
            if (child.isVirtual ? recursive !== false : recursive === true) {
                child.markClean({ force });
            }
        }
    }

    @SceneChangeDetection<Node>({
        redraw: RedrawType.MAJOR,
        changeCb: (target) => target.onVisibleChange(),
    })
    visible: boolean = true;

    protected onVisibleChange() {
        // Override point for subclasses to react to visibility changes.
    }

    protected dirtyZIndex: boolean = false;

    @SceneChangeDetection<Node>({
        redraw: RedrawType.TRIVIAL,
        changeCb: (target) => target.onZIndexChange(),
    })
    zIndex: number = 0;

    @SceneChangeDetection<Node>({
        redraw: RedrawType.TRIVIAL,
        changeCb: (target) => target.onZIndexChange(),
    })
    /** Discriminators for render order within a zIndex. */
    zIndexSubOrder?: ZIndexSubOrder = undefined;

    pointerEvents: PointerEvents = PointerEvents.All;

    get nodeCount() {
        let count = 1;
        let visibleCount = this.visible ? 1 : 0;
        let dirtyCount = this._dirty >= RedrawType.NONE ? 1 : 0;

        for (const child of this.children(false)) {
            count += child.nodeCount.count;
            dirtyCount += child.nodeCount.dirtyCount;
            visibleCount += child.nodeCount.visibleCount;
        }

        return { count, visibleCount, dirtyCount };
    }

    protected onZIndexChange() {
        if (this.parentNode) {
            this.parentNode.dirtyZIndex = true;
        }
    }
}
