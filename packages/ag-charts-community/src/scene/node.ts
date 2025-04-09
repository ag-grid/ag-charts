import { createSvgElement, toIterable } from 'ag-charts-core';

import { createId } from '../util/id';
import { objectsEqual } from '../util/object';
import { BBox } from './bbox';
import { SceneChangeDetection, SceneObjectChangeDetection } from './changeDetectable';
import type { ImageLoader } from './image/imageLoader';
import type { LayersManager } from './layersManager';
import type { ZIndex } from './zIndex';

export { SceneChangeDetection };

export enum PointerEvents {
    All,
    None,
}

export type RenderContext = {
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    width: number;
    height: number;
    devicePixelRatio: number;
    clipBBox?: BBox;
    stats?: {
        opsPerformed: number;
        opsSkipped: number;
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
    debugDirty?: boolean;
}

export type NodeWithOpacity = Node & { opacity: number };

export type ChildNodeCounts = {
    groups: number;
    nonGroups: number;
    thisComplexity: number;
    complexity: number;
};

export interface IScene {
    layersManager: LayersManager;
    imageLoader: ImageLoader;
}

/**
 * Abstract scene graph node.
 * Each node can have zero or one parent and belong to zero or one scene.
 */
export abstract class Node<D = any> {
    private static _nextSerialNumber = 0;
    // eslint-disable-next-line sonarjs/public-static-readonly
    public static _debugEnabled = false;

    static toSVG(node: Node, width: number, height: number) {
        const svg = node?.toSVG();

        if (svg == null || (!svg.elements.length && !svg.defs?.length)) return;

        const root = createSvgElement('svg');
        root.setAttribute('width', String(width));
        root.setAttribute('height', String(height));
        root.setAttribute('viewBox', `0 0 ${width} ${height}`);

        if (svg.defs?.length) {
            const defs = createSvgElement('defs');
            defs.append(...svg.defs);
            root.append(defs);
        }

        root.append(...svg.elements);

        return root.outerHTML;
    }

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
    readonly childNodeCounts: ChildNodeCounts = { groups: 0, nonGroups: 0, thisComplexity: 0, complexity: 0 };

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

    protected _datum?: D;
    protected _previousDatum?: D;

    protected _debug?: (...args: any[]) => void;
    protected scene: IScene | undefined = undefined;
    private readonly _debugDirtyProperties?: Map<string, string[]>;

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

    @SceneChangeDetection<Node>()
    visible: boolean = true;

    @SceneObjectChangeDetection<Node>({
        equals: objectsEqual,
        changeCb: (target) => target.onZIndexChange(),
    })
    zIndex: ZIndex = 0;

    constructor(options?: NodeOptions) {
        this.name = options?.name;
        this.tag = options?.tag ?? NaN;
        this.zIndex = options?.zIndex ?? 0;

        if (options?.debugDirty ?? Node._debugEnabled) {
            this._debugDirtyProperties = new Map([['__first__', []]]);
        }
    }

    /**
     * Some arbitrary data bound to the node.
     */
    get datum() {
        return this._datum;
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
        return this.scene?.layersManager;
    }

    protected get imageLoader(): ImageLoader | undefined {
        return this.scene?.imageLoader;
    }

    get dirty() {
        return this._dirty;
    }

    closestDatum() {
        for (const { datum } of this.traverseUp(true)) {
            if (datum != null) {
                return datum;
            }
        }
    }

    /** Perform any pre-rendering initialization. */
    preRender(renderCtx: RenderContext, thisComplexity = 1): ChildNodeCounts {
        this.childNodeCounts.groups = 0;
        this.childNodeCounts.nonGroups = 1; // Assume this node isn't a group.
        this.childNodeCounts.complexity = thisComplexity;
        this.childNodeCounts.thisComplexity = thisComplexity;

        for (const child of this.children()) {
            const childCounts = child.preRender(renderCtx);
            this.childNodeCounts.groups += childCounts.groups;
            this.childNodeCounts.nonGroups += childCounts.nonGroups;
            this.childNodeCounts.complexity += childCounts.complexity;
        }

        return this.childNodeCounts;
    }

    render(renderCtx: RenderContext): void {
        const { stats } = renderCtx;

        this._dirty = false;
        this.debugDirtyProperties();

        if (renderCtx.debugNodeSearch) {
            const idOrName = this.name ?? this.id;
            if (renderCtx.debugNodeSearch.some((v) => (typeof v === 'string' ? v === idOrName : v.test(idOrName)))) {
                renderCtx.debugNodes[this.name ?? this.id] = this;
            }
        }

        if (stats) {
            stats.nodesRendered++;
            stats.opsPerformed += this.childNodeCounts.thisComplexity;
        }
    }

    setScene(scene?: IScene) {
        this.scene = scene;
        this._debug = scene?.layersManager?.debug;

        for (const child of this.children()) {
            child.setScene(scene);
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

    *traverseUp(includeSelf?: boolean): Generator<Node, void, unknown> {
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

    *descendants(): Generator<Node, void, undefined> {
        for (const child of this.children()) {
            yield child;
            yield* child.descendants();
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
            node.setScene(this.scene);
        }

        this.invalidateCachedBBox();
        this.dirtyZIndex = true;
        this.markDirty();
    }

    appendChild<T extends Node>(node: T): T {
        this.append(node);
        return node;
    }

    removeChild(node: Node) {
        if (!this.childNodes?.delete(node)) {
            throw new Error(
                `AG Charts - internal error, unknown child node ${node.name ?? node.id} in $${this.name ?? this.id}`
            );
        }

        delete node.parentNode;
        node.setScene();

        this.invalidateCachedBBox();
        this.dirtyZIndex = true;
        this.markDirty();
    }

    remove() {
        this.parentNode?.removeChild(this);
    }

    clear() {
        for (const child of this.children()) {
            delete child.parentNode;
            child.setScene();
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
    pickNode(x: number, y: number): Node | undefined {
        if (!this.visible || this.pointerEvents === PointerEvents.None || !this.containsPoint(x, y)) {
            return;
        }

        if (this.childNodes != null && this.childNodes.size !== 0) {
            const children = [...this.children()];
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

    pickNodes(x: number, y: number, into: Node<any>[] = []): Node<any>[] {
        if (!this.visible || this.pointerEvents === PointerEvents.None || !this.containsPoint(x, y)) {
            return into;
        }

        if (!this.isContainerNode) {
            into.push(this);
        }

        for (const child of this.children()) {
            child.pickNodes(x, y, into);
        }

        return into;
    }

    private invalidateCachedBBox() {
        if (this.cachedBBox != null) {
            this.cachedBBox = undefined;
            this.parentNode?.invalidateCachedBBox();
        }
    }

    getBBox(): BBox {
        if (this.cachedBBox == null) {
            this.cachedBBox = Object.freeze(this.computeBBox()) as BBox;
        }

        return this.cachedBBox;
    }

    protected computeBBox(): BBox | undefined {
        return;
    }

    onChangeDetection(property: string): void {
        this.markDirty(property);
    }

    markDirty(property?: string) {
        const { _dirty } = this;

        if (property != null && this._debugDirtyProperties) {
            this.markDebugProperties(property);
        }

        const noParentCachedBBox = this.cachedBBox == null;
        if (noParentCachedBBox && _dirty) return;

        this.invalidateCachedBBox();
        this._dirty = true;
        if (this.parentNode) {
            this.parentNode.markDirty();
        }
    }

    markClean() {
        if (!this._dirty) return;

        this._dirty = false;
        this.debugDirtyProperties();

        for (const child of this.children()) {
            child.markClean();
        }
    }

    private markDebugProperties(property: string) {
        const sources = this._debugDirtyProperties?.get(property) ?? [];
        const caller =
            new Error().stack?.split('\n').filter((line) => {
                return (
                    line !== 'Error' &&
                    !line.includes('.markDebugProperties') &&
                    !line.includes('.markDirty') &&
                    !line.includes('Object.assign ') &&
                    !line.includes(`${this.constructor.name}.`)
                );
            }) ?? 'unknown';
        sources.push(caller[0].replace(' at ', '').trim());
        this._debugDirtyProperties?.set(property, sources);
    }

    private debugDirtyProperties() {
        if (this._debugDirtyProperties == null) return;

        if (!this._debugDirtyProperties.has('__first__')) {
            // Construction cases aren't interesting - we only really care about update cases.
            this._debugDirtyProperties.forEach((sources, property) => {
                if (sources.length > 1) {
                    // eslint-disable-next-line no-console
                    console.groupCollapsed(
                        `Property changed multiple times before render: ${this.constructor.name}.${property} (${sources.length}x)`
                    );
                    // eslint-disable-next-line no-console
                    sources.forEach((source) => console.log(source));
                    // eslint-disable-next-line no-console
                    console.groupEnd();
                }
            });
        }
        this._debugDirtyProperties.clear();
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
