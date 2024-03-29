import type { BBoxProvider } from '../util/bboxset';
import { createId } from '../util/id';
import { BBox } from './bbox';
import { ChangeDetectable, RedrawType, SceneChangeDetection } from './changeDetectable';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import { Matrix } from './matrix';

export { SceneChangeDetection, RedrawType };

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;

export enum PointerEvents {
    All,
    None,
}

export type RenderContext = {
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
    debugNodes: Record<string, Node>;
};

export interface NodeOptions {
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
export abstract class Node extends ChangeDetectable implements BBoxProvider {
    static _nextSerialNumber = 0;

    /** Unique number to allow creation order to be easily determined. */
    readonly serialNumber = Node._nextSerialNumber++;

    /**
     * Unique node ID in the form `ClassName-NaturalNumber`.
     */
    readonly id = createId(this);

    protected _datum?: any;
    protected _previousDatum?: any;

    /**
     * Some arbitrary data bound to the node.
     */
    get datum() {
        return this._datum ?? this._parent?.datum;
    }
    get previousDatum(): any {
        return this._previousDatum;
    }
    set datum(datum: any) {
        if (this._datum !== datum) {
            this._previousDatum = this._datum;
        }
        this._datum = datum;
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
     * Indicates if this node should be substituted for it's children when traversing the scene
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

        for (const child of this._children) {
            child._setLayerManager(value);
        }
        for (const child of this._virtualChildren) {
            child._setLayerManager(value);
        }
    }
    get layerManager(): LayersManager | undefined {
        return this._layerManager;
    }

    *ancestors() {
        let node: Node | undefined = this;
        while ((node = node.parent)) {
            yield node;
        }
    }

    *traverseUp() {
        yield this;
        yield* this.ancestors();
    }

    private _parent?: Node;
    get parent(): Node | undefined {
        return this._parent;
    }

    private _virtualChildren: Node[] = [];
    private _children: Node[] = [];
    get children(): Node[] {
        return this._virtualChildren.length
            ? this._children.concat(this._virtualChildren.flatMap((next) => next.children))
            : this._children;
    }

    protected get virtualChildren(): Node[] {
        return this._virtualChildren;
    }

    hasVirtualChildren() {
        return this._virtualChildren.length > 0;
    }

    // Used to check for duplicate nodes.
    private childSet: { [id: string]: boolean } = {}; // new Set<Node>()

    setProperties<T>(this: T, styles: { [K in keyof T]?: T[K] }, pickKeys?: (keyof T)[]) {
        const keys = pickKeys ?? (Object.keys(styles) as (keyof T)[]);
        for (const key of keys) {
            (this as any)[key] = styles[key];
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
    append(nodes: Node[] | Node) {
        // Passing a single parameter to an open-ended version of `append`
        // would be 30-35% slower than this.
        if (!Array.isArray(nodes)) {
            nodes = [nodes];
        }

        for (const node of nodes) {
            if (node.parent) {
                throw new Error(`${node} already belongs to another parent: ${node.parent}.`);
            }
            if (node.layerManager) {
                throw new Error(`${node} already belongs to a scene: ${node.layerManager}.`);
            }
            if (this.childSet[node.id]) {
                // Cast to `any` to avoid `Property 'name' does not exist on type 'Function'`.
                throw new Error(`Duplicate ${(node.constructor as any).name} node: ${node}`);
            }

            if (node.isVirtual) {
                this._virtualChildren.push(node);
            } else {
                this._children.push(node);
            }
            this.childSet[node.id] = true;

            node._parent = this;
            node._setLayerManager(this.layerManager);
        }

        this.dirtyZIndex = true;
        this.markDirty(this, RedrawType.MAJOR);
    }

    appendChild<T extends Node>(node: T): T {
        this.append(node);
        return node;
    }

    removeChild<T extends Node>(node: T): T {
        const error = () => {
            throw new Error(`The node to be removed is not a child of this node.`);
        };
        if (node.parent !== this) {
            error();
        }

        if (node.isVirtual) {
            const i = this._virtualChildren.indexOf(node);
            if (i < 0) error();
            this._virtualChildren.splice(i, 1);
        } else {
            const i = this._children.indexOf(node);
            if (i < 0) error();
            this._children.splice(i, 1);
        }

        delete this.childSet[node.id];
        node._parent = undefined;
        node._setLayerManager();

        this.dirtyZIndex = true;
        this.markDirty(node, RedrawType.MAJOR);

        return node;
    }

    // These matrices may need to have package level visibility
    // for performance optimization purposes.
    matrix = new Matrix();

    private calculateCumulativeMatrix() {
        this.computeTransformMatrix();
        const matrix = Matrix.flyweight(this.matrix);

        let parent = this.parent;
        while (parent) {
            parent.computeTransformMatrix();
            matrix.preMultiplySelf(parent.matrix);
            parent = parent.parent;
        }

        return matrix;
    }

    transformPoint(x: number, y: number) {
        const matrix = this.calculateCumulativeMatrix();
        return matrix.invertSelf().transformPoint(x, y);
    }

    inverseTransformPoint(x: number, y: number) {
        const matrix = this.calculateCumulativeMatrix();
        return matrix.transformPoint(x, y);
    }

    transformBBox(bbox: BBox): BBox {
        const matrix = this.calculateCumulativeMatrix();
        return matrix.invertSelf().transformBBox(bbox);
    }

    inverseTransformBBox(bbox: BBox): BBox {
        const matrix = this.calculateCumulativeMatrix();
        return matrix.transformBBox(bbox);
    }

    protected dirtyTransform = false;
    markDirtyTransform() {
        this.dirtyTransform = true;
        this.markDirty(this, RedrawType.MAJOR);
    }

    @SceneChangeDetection({ type: 'transform' })
    scalingX: number = 1;

    @SceneChangeDetection({ type: 'transform' })
    scalingY: number = 1;

    /**
     * The center of scaling.
     * The default value of `null` means the scaling center will be
     * determined automatically, as the center of the bounding box
     * of a node.
     */
    @SceneChangeDetection({ type: 'transform' })
    scalingCenterX: number | null = null;

    @SceneChangeDetection({ type: 'transform' })
    scalingCenterY: number | null = null;

    @SceneChangeDetection({ type: 'transform' })
    rotationCenterX: number | null = null;

    @SceneChangeDetection({ type: 'transform' })
    rotationCenterY: number | null = null;

    /**
     * Rotation angle in radians.
     * The value is set as is. No normalization to the [-180, 180) or [0, 360)
     * interval is performed.
     */
    @SceneChangeDetection({ type: 'transform' })
    rotation: number = 0;

    @SceneChangeDetection({ type: 'transform' })
    translationX: number = 0;

    @SceneChangeDetection({ type: 'transform' })
    translationY: number = 0;

    constructor({ isVirtual, tag, zIndex }: NodeOptions = {}) {
        super();
        this.isVirtual = isVirtual ?? false;
        this.tag = tag ?? NaN;
        this.zIndex = zIndex ?? 0;
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
    pickNode(x: number, y: number): Node | undefined {
        if (!this.visible || this.pointerEvents === PointerEvents.None || !this.containsPoint(x, y)) {
            return;
        }

        const { children } = this;

        if (children.length > 1_000) {
            // Try to optimise which children to interrogate; BBox calculation is an approximation
            // for more complex shapes, so discarding items based on this will save a lot of
            // processing when the point is nowhere near the child.
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                const containsPoint = child.computeTransformedBBox()?.containsPoint(x, y);
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

    findNodes(predicate: (node: Node) => boolean): Node[] {
        return this.children.flatMap((child) => child.findNodes(predicate));
    }

    private cachedBBox?: BBox;

    getCachedBBox(): BBox {
        return this.cachedBBox ?? BBox.zero;
    }

    computeBBox(): BBox | undefined {
        return;
    }

    computeTransformedBBox(): BBox | undefined {
        const bbox = this.computeBBox();

        if (!bbox) {
            return;
        }

        this.computeTransformMatrix();
        const matrix = Matrix.flyweight(this.matrix);
        for (const parent of this.ancestors()) {
            parent.computeTransformMatrix();
            matrix.preMultiplySelf(parent.matrix);
        }
        matrix.transformBBox(bbox, bbox);

        return bbox;
    }

    computeTransformMatrix() {
        if (!this.dirtyTransform) {
            return;
        }

        const {
            matrix,
            scalingX,
            scalingY,
            rotation,
            translationX,
            translationY,
            scalingCenterX,
            scalingCenterY,
            rotationCenterX,
            rotationCenterY,
        } = this;

        Matrix.updateTransformMatrix(matrix, scalingX, scalingY, rotation, translationX, translationY, {
            scalingCenterX,
            scalingCenterY,
            rotationCenterX,
            rotationCenterY,
        });

        this.dirtyTransform = false;
    }

    readonly _childNodeCounts: ChildNodeCounts = {
        groups: 0,
        nonGroups: 0,
    };
    /** Perform any pre-rendering initialization. */
    preRender(): ChildNodeCounts {
        this._childNodeCounts.groups = 0;
        this._childNodeCounts.nonGroups = 1; // Assume this node isn't a group.

        for (const child of this.children) {
            const childCounts = child.preRender();
            this._childNodeCounts.groups += childCounts.groups;
            this._childNodeCounts.nonGroups += childCounts.nonGroups;
        }

        return this._childNodeCounts;
    }

    render(renderCtx: RenderContext): void {
        const { stats } = renderCtx;

        this._dirty = RedrawType.NONE;
        this.cachedBBox = this.computeBBox();

        if (stats) {
            stats.nodesRendered++;
        }
    }

    clearBBox(ctx: CanvasRenderingContext2D) {
        const bbox = this.computeBBox();
        if (bbox == null) {
            return;
        }

        const { x, y, width, height } = bbox;
        const topLeft = this.transformPoint(x, y);
        const bottomRight = this.transformPoint(x + width, y + height);
        ctx.clearRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    }

    override markDirty(_source: Node, type = RedrawType.TRIVIAL, parentType = type) {
        if (this._dirty > type || (this._dirty === type && type === parentType)) {
            return;
        }

        this._dirty = type;
        if (this.parent) {
            this.parent.markDirty(this, parentType);
        } else if (this.layerManager) {
            this.layerManager.markDirty();
        }
    }
    get dirty() {
        return this._dirty;
    }

    override markClean(opts?: { force?: boolean; recursive?: boolean | 'virtual' }) {
        const { force = false, recursive = true } = opts ?? {};

        if (this._dirty === RedrawType.NONE && !force) {
            return;
        }

        this._dirty = RedrawType.NONE;

        if (recursive !== false) {
            for (const child of this._virtualChildren) {
                child.markClean({ force });
            }
        }
        if (recursive === true) {
            for (const child of this._children) {
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
        let dirtyCount = this._dirty >= RedrawType.NONE || this.dirtyTransform ? 1 : 0;
        let visibleCount = this.visible ? 1 : 0;

        const countChild = (child: Node) => {
            const { count: childCount, visibleCount: childVisibleCount, dirtyCount: childDirtyCount } = child.nodeCount;
            count += childCount;
            visibleCount += childVisibleCount;
            dirtyCount += childDirtyCount;
        };

        for (const child of this._children) {
            countChild(child);
        }
        for (const child of this._virtualChildren) {
            countChild(child);
        }

        return { count, visibleCount, dirtyCount };
    }

    protected onZIndexChange() {
        if (this.parent) {
            this.parent.dirtyZIndex = true;
        }
    }
}
