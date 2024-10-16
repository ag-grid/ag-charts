import { createId } from '../util/id';
import { toIterable } from '../util/iterator';
import { BBox } from './bbox';
import { SceneChangeDetection } from './changeDetectable';
import type { LayersManager } from './layersManager';
import type { ZIndex } from './zIndex';

export { SceneChangeDetection };

export enum PointerEvents {
    All,
    None,
}

export type RenderContext = {
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    devicePixelRatio: number;
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
    tag?: number;
    zIndex?: ZIndex;
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
    private static _nextSerialNumber = 0;

    static *extractBBoxes(nodes: Iterable<Node>, skipInvisible?: boolean) {
        for (const n of nodes) {
            if (!skipInvisible || (n.visible && !n.transitionOut)) {
                const bbox = n.getBBox();
                if (bbox) yield bbox;
            }
        }
    }

    /** Unique number to allow creation order to be easily determined. */
    readonly serialNumber = Node._nextSerialNumber++;
    readonly childNodeCounts: ChildNodeCounts = { groups: 0, nonGroups: 0 };

    /** Unique node ID in the form `ClassName-NaturalNumber`. */
    readonly id = createId(this);
    readonly name?: string;

    /**
     * Some number to identify this node, typically within a `Group` node.
     * Usually this will be some enum value used as a selector.
     */
    tag: number;
    transitionOut?: boolean;
    pointerEvents: PointerEvents = PointerEvents.All;

    protected _datum?: any;
    protected _previousDatum?: any;

    protected _debug?: (...args: any[]) => void;
    protected _layerManager?: LayersManager;

    protected _dirty: boolean = true;
    protected dirtyZIndex: boolean = false;

    private parentNode?: Node;
    private childNodes?: Set<Node>;

    private cachedBBox?: BBox;

    /**
     * To simplify the type system (especially in Selections) we don't have the `Parent` node
     * (one that has children). Instead, we mimic HTML DOM, where any node can have children.
     * But we still need to distinguish regular leaf nodes from container leafs somehow.
     */
    protected isContainerNode: boolean = false;

    @SceneChangeDetection<Node>({
        changeCb: (target) => target.onVisibleChange(),
    })
    visible: boolean = true;

    @SceneChangeDetection<Node>({
        changeCb: (target) => target.onZIndexChange(),
    })
    zIndex: ZIndex = 0;

    constructor(options?: NodeOptions) {
        this.name = options?.name;
        this.tag = options?.tag ?? NaN;
        this.zIndex = options?.zIndex ?? 0;
    }

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

    get layerManager(): LayersManager | undefined {
        return this._layerManager;
    }

    get dirty() {
        return this._dirty;
    }

    /** Perform any pre-rendering initialization. */
    preRender(): ChildNodeCounts {
        this.childNodeCounts.groups = 0;
        this.childNodeCounts.nonGroups = 1; // Assume this node isn't a group.

        for (const child of this.children()) {
            const childCounts = child.preRender();
            this.childNodeCounts.groups += childCounts.groups;
            this.childNodeCounts.nonGroups += childCounts.nonGroups;
        }

        return this.childNodeCounts;
    }

    render(renderCtx: RenderContext): void {
        const { stats } = renderCtx;

        this._dirty = false;

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

    _setLayerManager(value?: LayersManager) {
        this._layerManager = value;
        this._debug = value?.debug;

        for (const child of this.children()) {
            child._setLayerManager(value);
        }
    }

    protected sortChildren(compareFn?: (a: Node, b: Node) => number) {
        this.dirtyZIndex = false;
        if (!this.childNodes) return;

        // Sort children, and re-add in new order (Set preserves insertion order).
        const sortedChildren = [...this.childNodes].sort(compareFn);
        this.childNodes.clear();
        for (const child of sortedChildren) {
            this.childNodes.add(child);
        }
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

    *children(): Generator<Node, void, undefined> {
        if (!this.childNodes) return;
        for (const child of this.childNodes) {
            yield child;
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
        }

        this.invalidateCachedBBox();
        this.dirtyZIndex = true;
        this.markDirty();
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

        this.invalidateCachedBBox();
        this.dirtyZIndex = true;
        this.markDirty();

        return true;
    }

    remove() {
        return this.parentNode?.removeChild(this) ?? false;
    }

    clear() {
        for (const child of this.children()) {
            delete child.parentNode;
            child._setLayerManager();
        }
        this.childNodes?.clear();
        this.invalidateCachedBBox();
    }

    destroy(): void {
        this.parentNode?.removeChild(this);
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

    private invalidateCachedBBox() {
        this.cachedBBox = undefined;
        this.parentNode?.invalidateCachedBBox();
    }

    getBBox(): BBox {
        if (this.cachedBBox == null) {
            this.cachedBBox = Object.freeze(this.computeBBox());
        }

        return this.cachedBBox!;
    }

    protected computeBBox(): BBox | undefined {
        return;
    }

    markDirty() {
        const { _dirty } = this;

        const noParentCachedBBox = this.cachedBBox == null;
        if (noParentCachedBBox && _dirty) return;

        this.invalidateCachedBBox();
        this._dirty = true;
        if (this.parentNode) {
            this.parentNode.markDirty();
        }
    }

    markClean(opts?: { force?: boolean; recursive?: boolean | 'virtual' }) {
        const { force = false, recursive = true } = opts ?? {};

        if (!this._dirty && !force) return;

        this._dirty = false;

        if (recursive === true) {
            for (const child of this.children()) {
                child.markClean({ force });
            }
        }
    }

    protected onVisibleChange() {
        // Override point for subclasses to react to visibility changes.
    }

    protected onZIndexChange() {
        const { parentNode } = this;

        if (parentNode) {
            parentNode.dirtyZIndex = true;
        }
    }

    toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        return;
    }
}
