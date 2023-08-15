import type { Size } from '../canvas/hdpiCanvas';
import { HdpiCanvas } from '../canvas/hdpiCanvas';
import type { Node, RenderContext, ZIndexSubOrder } from './node';
import { RedrawType } from './node';
import { createId } from '../util/id';
import { Group } from './group';
import { HdpiOffscreenCanvas } from '../canvas/hdpiOffscreenCanvas';
import { windowValue } from '../util/window';
import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import type { SceneDebugOptions } from './sceneDebugOptions';
import { SceneDebugLevel } from './sceneDebugOptions';
import { Logger } from '../util/logger';

interface SceneOptions {
    document: Document;
    window: Window;
    mode?: 'simple' | 'composite' | 'dom-composite' | 'adv-composite';
}

interface SceneLayer {
    id: number;
    name?: string;
    zIndex: number;
    zIndexSubOrder?: ZIndexSubOrder;
    canvas: HdpiOffscreenCanvas | HdpiCanvas;
    getComputedOpacity: () => number;
    getVisibility: () => boolean;
}

function buildSceneNodeHighlight() {
    let config = (windowValue('agChartsSceneDebug') as string | string[]) ?? [];

    if (typeof config === 'string') {
        config = [config];
    }

    const result: (string | RegExp)[] = [];
    config.forEach((name: string) => {
        if (name === 'layout') {
            result.push('seriesRoot', 'legend', 'root', /.*Axis-\d+-axis.*/);
        } else {
            result.push(name);
        }
    });

    return result;
}

const advancedCompositeIdentifier = 'adv-composite';
const domCompositeIdentifier = 'dom-composite';

export class Scene {
    static className = 'Scene';

    readonly id = createId(this);

    readonly canvas: HdpiCanvas;
    readonly layers: SceneLayer[] = [];

    private readonly opts: Required<SceneOptions>;

    constructor(
        opts: {
            width?: number;
            height?: number;
            overrideDevicePixelRatio?: number;
        } & SceneOptions
    ) {
        const {
            document,
            window,
            mode = (windowValue('agChartsSceneRenderModel') as SceneOptions['mode']) ?? advancedCompositeIdentifier,
            width,
            height,
            overrideDevicePixelRatio = undefined,
        } = opts;

        this.overrideDevicePixelRatio = overrideDevicePixelRatio;

        this.opts = { document, window, mode };
        this.debug.consoleLog = [true, 'scene'].includes(windowValue('agChartsDebug') as any);
        this.debug.level = ['scene'].includes(windowValue('agChartsDebug') as any)
            ? SceneDebugLevel.DETAILED
            : SceneDebugLevel.SUMMARY;
        this.debug.stats = (windowValue('agChartsSceneStats') as any) ?? false;
        this.debug.dirtyTree = (windowValue('agChartsSceneDirtyTree') as boolean) ?? false;
        this.debug.sceneNodeHighlight = buildSceneNodeHighlight();
        this.canvas = new HdpiCanvas({ document, window, width, height, overrideDevicePixelRatio });
    }

    set container(value: HTMLElement | undefined) {
        this.canvas.container = value;
    }
    get container(): HTMLElement | undefined {
        return this.canvas.container;
    }

    download(fileName?: string, fileFormat?: string) {
        this.canvas.download(fileName, fileFormat);
    }

    getDataURL(type?: string): string {
        return this.canvas.getDataURL(type);
    }

    overrideDevicePixelRatio?: number;

    get width(): number {
        return this.pendingSize ? this.pendingSize[0] : this.canvas.width;
    }

    get height(): number {
        return this.pendingSize ? this.pendingSize[1] : this.canvas.height;
    }

    private pendingSize?: [number, number];
    resize(width: number, height: number): boolean {
        width = Math.round(width);
        height = Math.round(height);

        // HdpiCanvas doesn't allow width/height <= 0.
        const lessThanZero = width <= 0 || height <= 0;
        const nan = isNaN(width) || isNaN(height);
        const unchanged = width === this.width && height === this.height;
        if (unchanged || nan || lessThanZero) {
            return false;
        }

        this.pendingSize = [width, height];
        this.markDirty();

        return true;
    }

    private _nextZIndex = 0;
    private _nextLayerId = 0;
    addLayer(opts: {
        zIndex?: number;
        zIndexSubOrder?: ZIndexSubOrder;
        name?: string;
        getComputedOpacity: () => number;
        getVisibility: () => boolean;
    }): HdpiCanvas | HdpiOffscreenCanvas | undefined {
        const { mode } = this.opts;
        const layeredModes = ['composite', domCompositeIdentifier, advancedCompositeIdentifier];
        if (!layeredModes.includes(mode)) {
            return undefined;
        }

        const { zIndex = this._nextZIndex++, name, zIndexSubOrder, getComputedOpacity, getVisibility } = opts;
        const { width, height, overrideDevicePixelRatio } = this;
        const domLayer = mode === domCompositeIdentifier;
        const advLayer = mode === advancedCompositeIdentifier;
        const canvas =
            !advLayer || !HdpiOffscreenCanvas.isSupported()
                ? new HdpiCanvas({
                      document: this.opts.document,
                      window: this.opts.window,
                      width,
                      height,
                      domLayer,
                      zIndex,
                      name,
                      overrideDevicePixelRatio,
                  })
                : new HdpiOffscreenCanvas({
                      width,
                      height,
                      overrideDevicePixelRatio,
                  });
        const newLayer: SceneLayer = {
            id: this._nextLayerId++,
            name,
            zIndex,
            zIndexSubOrder,
            canvas,
            getComputedOpacity,
            getVisibility,
        };

        if (zIndex >= this._nextZIndex) {
            this._nextZIndex = zIndex + 1;
        }

        this.layers.push(newLayer);
        this.sortLayers();

        if (domLayer) {
            const domCanvases = this.layers
                .map((v) => v.canvas)
                .filter((v): v is HdpiCanvas => v instanceof HdpiCanvas);
            const newLayerIndex = domCanvases.findIndex((v) => v === canvas);
            const lastLayer = domCanvases[newLayerIndex - 1] ?? this.canvas;
            lastLayer.element.insertAdjacentElement('afterend', (canvas as HdpiCanvas).element);
        }

        if (this.debug.consoleLog) {
            Logger.debug('Scene.addLayer() - layers', this.layers);
        }

        return newLayer.canvas;
    }

    removeLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas) {
        const index = this.layers.findIndex((l) => l.canvas === canvas);

        if (index >= 0) {
            this.layers.splice(index, 1);
            canvas.destroy();
            this.markDirty();

            if (this.debug.consoleLog) {
                Logger.debug('Scene.removeLayer() -  layers', this.layers);
            }
        }
    }

    moveLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas, newZIndex: number, newZIndexSubOrder?: ZIndexSubOrder) {
        const layer = this.layers.find((l) => l.canvas === canvas);

        if (layer) {
            layer.zIndex = newZIndex;
            layer.zIndexSubOrder = newZIndexSubOrder;
            this.sortLayers();
            this.markDirty();

            if (this.debug.consoleLog) {
                Logger.debug('Scene.moveLayer() -  layers', this.layers);
            }
        }
    }

    private sortLayers() {
        this.layers.sort((a, b) => {
            return compoundAscending(
                [a.zIndex, ...(a.zIndexSubOrder ?? [undefined, undefined]), a.id],
                [b.zIndex, ...(b.zIndexSubOrder ?? [undefined, undefined]), b.id],
                ascendingStringNumberUndefined
            );
        });
    }

    private _dirty = false;
    markDirty() {
        this._dirty = true;
    }
    get dirty(): boolean {
        return this._dirty;
    }

    _root: Node | null = null;
    set root(node: Node | null) {
        if (node === this._root) {
            return;
        }

        if (this._root) {
            this._root._setLayerManager();
        }

        this._root = node;

        if (node) {
            // If `node` is the root node of another scene ...
            if (node.parent === null && node.layerManager && node.layerManager !== this) {
                (node.layerManager as Scene).root = null;
            }
            node._setLayerManager({
                addLayer: (opts) => this.addLayer(opts),
                moveLayer: (...opts) => this.moveLayer(...opts),
                removeLayer: (...opts) => this.removeLayer(...opts),
                markDirty: () => this.markDirty(),
                canvas: this.canvas,
                debug: {
                    ...this.debug,
                    consoleLog: this.debug.level >= SceneDebugLevel.DETAILED,
                },
            });
        }

        this.markDirty();
    }
    get root(): Node | null {
        return this._root;
    }

    readonly debug: SceneDebugOptions = {
        dirtyTree: false,
        stats: false,
        renderBoundingBoxes: false,
        consoleLog: false,
        level: SceneDebugLevel.SUMMARY,
        sceneNodeHighlight: [],
    };

    /** Alternative to destroy() that preserves re-usable resources. */
    strip() {
        const { layers } = this;
        for (const layer of layers) {
            layer.canvas.destroy();
            delete (layer as any)['canvas'];
        }
        layers.splice(0, layers.length);

        this.root = null;
        this._dirty = false;
        this.canvas.context.resetTransform();
    }

    destroy() {
        this.container = undefined;

        this.strip();

        this.canvas.destroy();
        Object.assign(this, { canvas: undefined, ctx: undefined });
    }

    async render(opts?: { debugSplitTimes: Record<string, number>; extraDebugStats: Record<string, number> }) {
        const { debugSplitTimes = { start: performance.now() }, extraDebugStats = {} } = opts ?? {};
        const {
            canvas,
            canvas: { context: ctx },
            root,
            layers,
            pendingSize,
            opts: { mode },
        } = this;

        if (pendingSize) {
            this.canvas.resize(...pendingSize);
            this.layers.forEach((layer) => layer.canvas.resize(...pendingSize));

            this.pendingSize = undefined;
        }

        if (root && !root.visible) {
            this._dirty = false;
            return;
        }

        if (root && !this.dirty) {
            if (this.debug.consoleLog) {
                Logger.debug('Scene.render() - no-op', {
                    redrawType: RedrawType[root.dirty],
                    tree: this.buildTree(root),
                });
            }

            this.debugStats(debugSplitTimes, ctx, undefined, extraDebugStats);
            return;
        }

        const renderCtx: RenderContext = {
            ctx,
            forceRender: true,
            resized: !!pendingSize,
            debugNodes: {},
        };
        if (this.debug.stats === 'detailed') {
            renderCtx.stats = { layersRendered: 0, layersSkipped: 0, nodesRendered: 0, nodesSkipped: 0 };
        }

        let canvasCleared = false;
        if (!root || root.dirty >= RedrawType.TRIVIAL) {
            // start with a blank canvas, clear previous drawing
            canvasCleared = true;
            canvas.clear();
        }

        if (root && this.debug.dirtyTree) {
            const { dirtyTree, paths } = this.buildDirtyTree(root);
            Logger.debug('Scene.render() - dirtyTree', { dirtyTree, paths });
        }

        if (root && canvasCleared) {
            if (this.debug.consoleLog) {
                Logger.debug('Scene.render() - before', {
                    redrawType: RedrawType[root.dirty],
                    canvasCleared,
                    tree: this.buildTree(root),
                });
            }

            if (root.visible) {
                ctx.save();
                root.render(renderCtx);
                ctx.restore();
            }
        }

        debugSplitTimes['✍️'] = performance.now();

        if (mode !== domCompositeIdentifier && layers.length > 0 && canvasCleared) {
            this.sortLayers();
            ctx.save();
            ctx.setTransform(1 / canvas.pixelRatio, 0, 0, 1 / canvas.pixelRatio, 0, 0);
            layers.forEach(({ canvas: { imageSource, enabled }, getComputedOpacity, getVisibility }) => {
                if (!enabled || !getVisibility()) {
                    return;
                }

                ctx.globalAlpha = getComputedOpacity();
                ctx.drawImage(imageSource, 0, 0);
            });
            ctx.restore();

            debugSplitTimes['⛙'] = performance.now();
        }

        // Check for save/restore depth of zero!
        ctx.verifyDepthZero?.();

        this._dirty = false;

        this.debugStats(debugSplitTimes, ctx, renderCtx.stats, extraDebugStats);
        this.debugSceneNodeHighlight(ctx, this.debug.sceneNodeHighlight, renderCtx.debugNodes);

        if (root && this.debug.consoleLog) {
            Logger.debug('Scene.render() - after', {
                redrawType: RedrawType[root.dirty],
                canvasCleared,
                tree: this.buildTree(root),
            });
        }
    }

    debugStats(
        debugSplitTimes: Record<string, number>,
        ctx: CanvasRenderingContext2D,
        renderCtxStats: RenderContext['stats'],
        extraDebugStats = {}
    ) {
        const end = performance.now();

        if (this.debug.stats) {
            const start = debugSplitTimes['start'];
            debugSplitTimes['end'] = performance.now();

            const pct = (rendered: number, skipped: number) => {
                const total = rendered + skipped;
                return `${rendered} / ${total} (${Math.round((100 * rendered) / total)}%)`;
            };
            const time = (name: string, start: number, end: number) => {
                return `${name}: ${Math.round((end - start) * 100) / 100}ms`;
            };
            const { layersRendered = 0, layersSkipped = 0, nodesRendered = 0, nodesSkipped = 0 } = renderCtxStats ?? {};

            let lastSplit = 0;
            const splits = Object.entries(debugSplitTimes)
                .filter(([n]) => n !== 'end')
                .map(([n, t], i) => {
                    const result = i > 0 ? time(n, lastSplit, t) : null;
                    lastSplit = t;
                    return result;
                })
                .filter((v) => v != null)
                .join(' + ');
            const extras = Object.entries(extraDebugStats)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' ; ');

            const stats = [
                `${time('⏱️', start, end)} (${splits})`,
                `${extras}`,
                this.debug.stats !== 'detailed' ? `Layers: ${this.layers.length}` : null,
                this.debug.stats === 'detailed' ? `Layers: ${pct(layersRendered, layersSkipped)}` : null,
                this.debug.stats === 'detailed' ? `Nodes: ${pct(nodesRendered, nodesSkipped)}` : null,
            ].filter((v): v is string => v != null);
            const statsSize: [string, Size][] = stats.map((t) => [t, HdpiCanvas.getTextSize(t, ctx.font)]);
            const width = Math.max(...statsSize.map(([, { width }]) => width));
            const height = statsSize.reduce((total, [, { height }]) => total + height, 0);

            ctx.save();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = 'black';
            let y = 0;
            for (const [stat, size] of statsSize) {
                y += size.height;
                ctx.fillText(stat, 2, y);
            }
            ctx.restore();
        }
    }

    debugSceneNodeHighlight(
        ctx: CanvasRenderingContext2D,
        sceneNodeHighlight: (string | RegExp)[],
        debugNodes: Record<string, Node>
    ) {
        const regexpPredicate = (matcher: RegExp) => (n: Node) => {
            if (matcher.test(n.id)) {
                return true;
            }

            return n instanceof Group && n.name != null && matcher.test(n.name);
        };
        const stringPredicate = (match: string) => (n: Node) => {
            if (match === n.id) {
                return true;
            }

            return n instanceof Group && n.name != null && match === n.name;
        };

        for (const next of sceneNodeHighlight) {
            if (typeof next === 'string' && debugNodes[next] != null) continue;

            const predicate = typeof next === 'string' ? stringPredicate(next) : regexpPredicate(next);
            const nodes = this.root?.findNodes(predicate);
            if (!nodes || nodes.length === 0) {
                Logger.debug(`Scene.render() - no debugging node with id [${next}] in scene graph.`);
                continue;
            }

            for (const node of nodes) {
                if (node instanceof Group && node.name) {
                    debugNodes[node.name] = node;
                } else {
                    debugNodes[node.id] = node;
                }
            }
        }

        ctx.save();

        for (const [name, node] of Object.entries(debugNodes)) {
            const bbox = node.computeTransformedBBox();

            if (!bbox) {
                Logger.debug(`Scene.render() - no bbox for debugged node [${name}].`);
                continue;
            }

            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.lineWidth = 2;
            ctx.strokeText(name, bbox.x, bbox.y, bbox.width);
            ctx.fillText(name, bbox.x, bbox.y, bbox.width);
        }

        ctx.restore();
    }

    buildTree(node: Node): { name?: string; node?: any; dirty?: string; virtualParent?: Node } {
        const name = (node instanceof Group ? node.name : null) ?? node.id;

        return {
            name,
            node,
            dirty: RedrawType[node.dirty],
            ...(node.parent?.isVirtual
                ? {
                      virtualParentDirty: RedrawType[node.parent.dirty],
                      virtualParent: node.parent,
                  }
                : {}),
            ...node.children
                .map((c) => this.buildTree(c))
                .reduce((result, childTree) => {
                    let { name: treeNodeName } = childTree;
                    const {
                        node: { visible, opacity, zIndex, zIndexSubOrder },
                        node: childNode,
                        virtualParent,
                    } = childTree;
                    if (!visible || opacity <= 0) {
                        treeNodeName = `(${treeNodeName})`;
                    }
                    if (childNode instanceof Group && childNode.isLayer()) {
                        treeNodeName = `*${treeNodeName}*`;
                    }
                    const key = [
                        `${treeNodeName ?? '<unknown>'}`,
                        `z: ${zIndex}`,
                        zIndexSubOrder &&
                            `zo: ${zIndexSubOrder
                                .map((v: any) => (typeof v === 'function' ? `${v()} (fn)` : v))
                                .join(' / ')}`,
                        virtualParent && `(virtual parent)`,
                    ]
                        .filter((v) => !!v)
                        .join(' ');

                    let selectedKey = key;
                    let index = 1;
                    while (result[selectedKey] != null && index < 100) {
                        selectedKey = `${key} (${index++})`;
                    }
                    result[selectedKey] = childTree;
                    return result;
                }, {} as Record<string, {}>),
        };
    }

    buildDirtyTree(node: Node): {
        dirtyTree: { name?: string; node?: any; dirty?: string };
        paths: string[];
    } {
        if (node.dirty === RedrawType.NONE) {
            return { dirtyTree: {}, paths: [] };
        }

        const childrenDirtyTree = node.children.map((c) => this.buildDirtyTree(c)).filter((c) => c.paths.length > 0);
        const name = (node instanceof Group ? node.name : null) ?? node.id;
        const paths =
            childrenDirtyTree.length === 0
                ? [name]
                : childrenDirtyTree
                      .map((c) => c.paths)
                      .reduce((r, p) => r.concat(p), [])
                      .map((p) => `${name}.${p}`);

        return {
            dirtyTree: {
                name,
                node,
                dirty: RedrawType[node.dirty],
                ...childrenDirtyTree
                    .map((c) => c.dirtyTree)
                    .filter((t) => t.dirty !== undefined)
                    .reduce((result, childTree) => {
                        result[childTree.name ?? '<unknown>'] = childTree;
                        return result;
                    }, {} as Record<string, {}>),
            },
            paths,
        };
    }
}
