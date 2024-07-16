import { BBox } from './bbox';
import { ChangeDetectable, RedrawType, SceneChangeDetection } from './changeDetectable';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import { Matrix } from './matrix';
export { SceneChangeDetection, RedrawType };
export declare enum PointerEvents {
    All = 0,
    None = 1
}
export type RenderContext = {
    ctx: CanvasRenderingContext2D;
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
export type NodeWithOpacity = Node & {
    opacity: number;
};
export type ChildNodeCounts = {
    groups: number;
    nonGroups: number;
};
/**
 * Abstract scene graph node.
 * Each node can have zero or one parent and belong to zero or one scene.
 */
export declare abstract class Node extends ChangeDetectable {
    static _nextSerialNumber: number;
    /** Unique number to allow creation order to be easily determined. */
    readonly serialNumber: number;
    /**
     * Unique node ID in the form `ClassName-NaturalNumber`.
     */
    readonly id: string;
    protected _datum?: any;
    protected _previousDatum?: any;
    /**
     * Some arbitrary data bound to the node.
     */
    get datum(): any;
    get previousDatum(): any;
    set datum(datum: any);
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
    protected isContainerNode: boolean;
    /**
     * Indicates if this node should be substituted for it's children when traversing the scene
     * graph. This allows intermingling of child-nodes that are managed by different chart classes
     * without breaking scene-graph encapsulation.
     */
    readonly isVirtual: boolean;
    protected _debug?: (...args: any[]) => void;
    protected _layerManager?: LayersManager;
    _setLayerManager(value?: LayersManager): void;
    get layerManager(): LayersManager | undefined;
    ancestors(): Generator<Node, void, unknown>;
    traverseUp(): Generator<Node, void, unknown>;
    private _parent?;
    get parent(): Node | undefined;
    private _virtualChildren;
    private _children;
    get children(): Node[];
    protected get virtualChildren(): Node[];
    hasVirtualChildren(): boolean;
    private childSet;
    setProperties<T>(this: T, styles: {
        [K in keyof T]?: T[K];
    }, pickKeys?: (keyof T)[]): T;
    /**
     * Appends one or more new node instances to this parent.
     * If one needs to:
     * - move a child to the end of the list of children
     * - move a child from one parent to another (including parents in other scenes)
     * one should use the {@link insertBefore} method instead.
     * @param nodes A node or nodes to append.
     */
    append(nodes: Node[] | Node): void;
    appendChild<T extends Node>(node: T): T;
    removeChild<T extends Node>(node: T): T;
    matrix: Matrix;
    private calculateCumulativeMatrix;
    transformPoint(x: number, y: number): {
        x: number;
        y: number;
    };
    inverseTransformPoint(x: number, y: number): {
        x: number;
        y: number;
    };
    transformBBox(bbox: BBox): BBox;
    inverseTransformBBox(bbox: BBox): BBox;
    protected dirtyTransform: boolean;
    markDirtyTransform(): void;
    scalingX: number;
    scalingY: number;
    /**
     * The center of scaling.
     * The default value of `null` means the scaling center will be
     * determined automatically, as the center of the bounding box
     * of a node.
     */
    scalingCenterX: number | null;
    scalingCenterY: number | null;
    rotationCenterX: number | null;
    rotationCenterY: number | null;
    /**
     * Rotation angle in radians.
     * The value is set as is. No normalization to the [-180, 180) or [0, 360)
     * interval is performed.
     */
    rotation: number;
    translationX: number;
    translationY: number;
    constructor({ isVirtual, tag, zIndex }?: NodeOptions);
    containsPoint(_x: number, _y: number): boolean;
    /**
     * Hit testing method.
     * Recursively checks if the given point is inside this node or any of its children.
     * Returns the first matching node or `undefined`.
     * Nodes that render later (show on top) are hit tested first.
     */
    pickNode(x: number, y: number): Node | undefined;
    private cachedBBox?;
    getCachedBBox(): BBox;
    computeBBox(): BBox | undefined;
    computeTransformedBBox(): BBox | undefined;
    computeTransformMatrix(): void;
    readonly _childNodeCounts: ChildNodeCounts;
    /** Perform any pre-rendering initialization. */
    preRender(): ChildNodeCounts;
    render(renderCtx: RenderContext): void;
    markDirty(_source: Node, type?: RedrawType, parentType?: RedrawType): void;
    get dirty(): RedrawType;
    markClean(opts?: {
        force?: boolean;
        recursive?: boolean | 'virtual';
    }): void;
    visible: boolean;
    protected onVisibleChange(): void;
    protected dirtyZIndex: boolean;
    zIndex: number;
    /** Discriminators for render order within a zIndex. */
    zIndexSubOrder?: ZIndexSubOrder;
    pointerEvents: PointerEvents;
    get nodeCount(): {
        count: number;
        visibleCount: number;
        dirtyCount: number;
    };
    protected onZIndexChange(): void;
}
