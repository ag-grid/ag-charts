import { Logger, createId, createSvgElement, objectsEqual } from 'ag-charts-core';

import { BBox } from './bbox';
import { SceneChangeDetection, SceneObjectChangeDetection } from './changeDetectable';
import type { ImageLoader } from './image/imageLoader';
import type { LayersManager } from './layersManager';
import { type ZIndex } from './zIndex';

export { SceneChangeDetection } from './changeDetectable';

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
    scene?: IScene;
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

const MAX_ERROR_COUNT = 5;

/**
 * Abstract scene graph node.
 * Each node can have zero or one parent and belong to zero or one scene.
 */
export abstract class Node<TDatum = unknown> {
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
        root.setAttribute('overflow', 'visible');

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
    readonly name: string | undefined = undefined;

    /**
     * Some number to identify this node, typically within a `Group` node.
     * Usually this will be some enum value used as a selector.
     */
    tag: number;
    transitionOut: boolean | undefined = undefined;
    pointerEvents: PointerEvents = PointerEvents.All;

    protected _datum: TDatum | undefined = undefined;
    protected _previousDatum: TDatum | undefined = undefined;

    protected scene: IScene | undefined = undefined;
    private readonly _debugDirtyProperties: Map<string, string[]> | undefined = undefined;

    parentNode: Node | undefined = undefined;

    private cachedBBox: BBox | undefined = undefined;

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

    protected batchLevel = 0;
    private batchDirty = false;

    constructor(options?: NodeOptions) {
        this.name = options?.name;
        this.tag = options?.tag ?? Number.NaN;
        this.zIndex = options?.zIndex ?? 0;
        this.scene = options?.scene;

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

    closestDatum() {
        for (const { datum } of this.traverseUp(true)) {
            if (datum != null) {
                return datum;
            }
        }
    }

    /** Perform any pre-rendering initialization. */
    preRender(_renderCtx: RenderContext, thisComplexity = 1): ChildNodeCounts {
        this.childNodeCounts.groups = 0;
        this.childNodeCounts.nonGroups = 1; // Assume this node isn't a group.
        this.childNodeCounts.complexity = thisComplexity;
        this.childNodeCounts.thisComplexity = thisComplexity;

        if (this.batchLevel > 0 || this.batchDirty) {
            throw new Error('AG Charts - illegal rendering state; batched update in progress');
        }

        return this.childNodeCounts;
    }

    /** Guaranteed isolated render - if there is any failure, the Cavans2D context is returned to its prior state. */
    isolatedRender(renderCtx: RenderContext): void {
        renderCtx.ctx.save();
        try {
            this.render(renderCtx);
        } catch (e: any) {
            const errorCount = e.errorCount ?? 1;

            // If there are multiple failures, fail faster since raising errors is expensive and
            // could therefore manifest as a performance issue rather than a bug.
            if (errorCount >= MAX_ERROR_COUNT) {
                e.errorCount = errorCount;
                throw e;
            }

            Logger.warnOnce('Error during rendering', e, e.stack);
        } finally {
            renderCtx.ctx.restore();
        }
    }

    render(renderCtx: RenderContext): void {
        const { stats } = renderCtx;

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
    }

    *traverseUp(includeSelf?: boolean): Generator<Node, void, unknown> {
        if (includeSelf) {
            yield this;
        }
        let node = this.parentNode;
        while (node) {
            yield node;
            node = node.parentNode;
        }
    }

    /**
     * Checks if the node is the root (has no parent).
     */
    isRoot() {
        return !this.parentNode;
    }

    removeChild(node: Node) {
        throw new Error(
            `AG Charts - internal error, unknown child node ${node.name ?? node.id} in $${this.name ?? this.id}`
        );
    }

    remove() {
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
        this.parentNode?.removeChild(this);
    }

    destroy(): void {
        if (this.parentNode) {
            this.remove();
        }
    }

    batchedUpdate(fn: () => void) {
        this.batchLevel++;
        fn();
        this.batchLevel--;
        if (this.batchLevel === 0 && this.batchDirty) {
            this.markDirty();
            this.batchDirty = false;
        }
    }

    setProperties<T extends Node>(this: T, styles: { [K in keyof T]?: T[K] }) {
        this.batchLevel++;
        Object.assign(this, styles);
        this.batchLevel--;

        if (this.batchLevel === 0 && this.batchDirty) {
            this.markDirty();
            this.batchDirty = false;
        }
        return this;
    }

    containsPoint(_x: number, _y: number): boolean {
        return false;
    }

    pickNode(x: number, y: number): Node | undefined {
        if (this.containsPoint(x, y)) {
            return this;
        }
    }

    pickNodes(x: number, y: number, into: Node<any>[] = []): Node<any>[] {
        if (this.containsPoint(x, y)) {
            into.push(this);
        }
        return into;
    }

    getBBox(): BBox {
        this.cachedBBox ??= Object.freeze(this.computeBBox()) as BBox;
        return this.cachedBBox;
    }

    protected computeBBox(): BBox | undefined {
        return;
    }

    onChangeDetection(property: string): void {
        this.markDirty(property);
    }

    markDirtyChildrenOrder() {
        this.cachedBBox = undefined;
    }

    markDirty(property?: string) {
        if (this.batchLevel > 0) {
            this.batchDirty = true;
            return;
        }

        if (property != null && this._debugDirtyProperties) {
            this.markDebugProperties(property);
        }

        this.cachedBBox = undefined;
        this.parentNode?.markDirty();
    }

    private markDebugProperties(property: string) {
        const sources = this._debugDirtyProperties?.get(property) ?? [];
        const caller =
            new Error('Stack trace for property change tracking').stack?.split('\n').filter((line) => {
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
            for (const [property, sources] of this._debugDirtyProperties.entries()) {
                if (sources.length > 1) {
                    Logger.logGroup(
                        `Property changed multiple times before render: ${this.constructor.name}.${property} (${sources.length}x)`,
                        () => {
                            for (const source of sources) {
                                Logger.log(source);
                            }
                        }
                    );
                }
            }
        }
        this._debugDirtyProperties.clear();
    }

    protected onZIndexChange() {
        this.parentNode?.markDirtyChildrenOrder();
    }

    toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        return;
    }
}
