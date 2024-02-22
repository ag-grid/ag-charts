import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { Debug } from '../util/debug';
import { downloadUrl } from '../util/dom';
import { createId } from '../util/id';
import { HdpiCanvas } from './canvas/hdpiCanvas';
import { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';
import type { Node, RenderContext, ZIndexSubOrder } from './node';
import { RedrawType } from './node';
import { DebugSelectors, buildDirtyTree, buildTree, debugSceneNodeHighlight, debugStats } from './sceneDebug';

interface SceneOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
    simpleMode?: boolean;
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

export class Scene {
    static readonly className = 'Scene';

    readonly id = createId(this);

    readonly canvas: HdpiCanvas;
    readonly layers: SceneLayer[] = [];

    private root: Node | null = null;
    private isDirty: boolean = false;
    private pendingSize?: [number, number];
    private readonly simpleMode: boolean;
    private readonly debug = Debug.create(true, DebugSelectors.SCENE);

    pixelRatio?: number;

    constructor({ width, height, pixelRatio, simpleMode = false }: SceneOptions) {
        this.canvas = new HdpiCanvas({ width, height, pixelRatio });
        this.pixelRatio = pixelRatio;
        this.simpleMode = simpleMode;
    }

    get width(): number {
        return this.pendingSize?.[0] ?? this.canvas.width;
    }

    get height(): number {
        return this.pendingSize?.[1] ?? this.canvas.height;
    }

    setContainer(value: HTMLElement) {
        this.canvas.container = value;
        return this;
    }

    setRoot(node: Node | null) {
        if (this.root === node) {
            return this;
        }

        if (node) {
            node.visible = true;
            node._setLayerManager({
                addLayer: (opts) => this.addLayer(opts),
                moveLayer: (...opts) => this.moveLayer(...opts),
                removeLayer: (...opts) => this.removeLayer(...opts),
                markDirty: () => {
                    this.isDirty = true;
                },
                canvas: this.canvas,
                debug: this.debug,
            });
        }

        this.isDirty = true;
        this.root?._setLayerManager();
        this.root = node;

        return this;
    }

    attachNode<T extends Node>(node: T) {
        this.root?.appendChild(node);
        return () => this.removeChild(node);
    }

    appendChild<T extends Node>(node: T) {
        this.root?.appendChild(node);
        return this;
    }

    removeChild<T extends Node>(node: T) {
        this.root?.removeChild(node);
        return this;
    }

    download(fileName?: string, fileFormat?: string) {
        downloadUrl(this.canvas.toDataURL(fileFormat), fileName?.trim() || 'image');
    }

    /** NOTE: Integrated Charts undocumented image download method. */
    getDataURL(fileFormat?: string) {
        return this.canvas.toDataURL(fileFormat);
    }

    resize(width: number, height: number): boolean {
        width = Math.round(width);
        height = Math.round(height);
        if (width > 0 && height > 0 && !(width === this.width && height === this.height)) {
            this.pendingSize = [width, height];
            this.isDirty = true;
            return true;
        }
        return false;
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
        if (this.simpleMode) {
            return;
        }

        const { zIndex = this._nextZIndex++, name, zIndexSubOrder, getComputedOpacity, getVisibility } = opts;
        const { width, height, pixelRatio: pixelRatio } = this;
        const CanvasConstructor = HdpiOffscreenCanvas.isSupported() ? HdpiOffscreenCanvas : HdpiCanvas;

        const canvas = new CanvasConstructor({ width, height, pixelRatio });

        if (HdpiCanvas.is(canvas)) {
            canvas.style({ display: 'block', userSelect: 'none' });
        }

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

        this.debug('Scene.addLayer() - layers', this.layers);

        return newLayer.canvas;
    }

    removeLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas) {
        const index = this.layers.findIndex((l) => l.canvas === canvas);

        if (index >= 0) {
            this.layers.splice(index, 1);
            canvas.destroy();
            this.isDirty = true;

            this.debug('Scene.removeLayer() -  layers', this.layers);
        }
    }

    moveLayer(canvas: HdpiCanvas | HdpiOffscreenCanvas, newZIndex: number, newZIndexSubOrder?: ZIndexSubOrder) {
        const layer = this.layers.find((l) => l.canvas === canvas);

        if (layer) {
            layer.zIndex = newZIndex;
            layer.zIndexSubOrder = newZIndexSubOrder;
            this.sortLayers();
            this.isDirty = true;

            this.debug('Scene.moveLayer() -  layers', this.layers);
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

    async render(opts?: { debugSplitTimes: Record<string, number>; extraDebugStats: Record<string, number> }) {
        const { debugSplitTimes = { start: performance.now() }, extraDebugStats } = opts ?? {};
        const {
            canvas,
            canvas: { context: ctx },
            root,
            layers,
            pendingSize,
        } = this;

        if (pendingSize) {
            this.canvas.resize(...pendingSize);
            this.layers.forEach((layer) => layer.canvas.resize(...pendingSize));
            this.pendingSize = undefined;
        }

        if (root && !root.visible) {
            this.isDirty = false;
            return;
        }

        if (root && !this.isDirty) {
            if (this.debug.check()) {
                this.debug('Scene.render() - no-op', {
                    redrawType: RedrawType[root.dirty],
                    tree: buildTree(root),
                });
            }

            debugStats(this, debugSplitTimes, ctx, undefined, extraDebugStats);
            return;
        }

        const renderCtx: RenderContext = {
            ctx,
            devicePixelRatio: this.canvas.pixelRatio ?? 1,
            forceRender: true,
            resized: !!pendingSize,
            debugNodes: {},
        };

        if (Debug.check(DebugSelectors.SCENE_STATS_VERBOSE)) {
            renderCtx.stats = { layersRendered: 0, layersSkipped: 0, nodesRendered: 0, nodesSkipped: 0 };
        }

        let canvasCleared = false;
        if (!root || root.dirty >= RedrawType.TRIVIAL) {
            // start with a blank canvas, clear previous drawing
            canvasCleared = true;
            canvas.clear();
        }

        if (root && Debug.check(DebugSelectors.SCENE_DIRTY_TREE)) {
            const { dirtyTree, paths } = buildDirtyTree(root);
            Debug.create(DebugSelectors.SCENE_DIRTY_TREE)('Scene.render() - dirtyTree', { dirtyTree, paths });
        }

        if (root && canvasCleared) {
            this.debug('Scene.render() - before', {
                redrawType: RedrawType[root.dirty],
                canvasCleared,
                tree: buildTree(root),
            });

            if (root.visible) {
                ctx.save();
                root.render(renderCtx);
                ctx.restore();
            }
        }

        debugSplitTimes['✍️'] = performance.now();

        if (layers.length && canvasCleared) {
            this.sortLayers();
            ctx.save();
            ctx.resetTransform();
            layers.forEach(({ canvas, getComputedOpacity, getVisibility }) => {
                if (canvas.enabled && getVisibility()) {
                    ctx.globalAlpha = getComputedOpacity();
                    canvas.drawImage(ctx);
                }
            });
            ctx.restore();

            debugSplitTimes['⛙'] = performance.now();
        }

        // Check for save/restore depth of zero!
        ctx.verifyDepthZero?.();

        this.isDirty = false;

        debugStats(this, debugSplitTimes, ctx, renderCtx.stats, extraDebugStats);
        debugSceneNodeHighlight(this.root, ctx, renderCtx.debugNodes);

        if (root && this.debug.check()) {
            this.debug('Scene.render() - after', {
                redrawType: RedrawType[root.dirty],
                tree: buildTree(root),
                canvasCleared,
            });
        }
    }

    /** Alternative to destroy() that preserves re-usable resources. */
    strip() {
        const { layers } = this;
        for (const layer of layers) {
            layer.canvas.destroy();
            delete (layer as any).canvas;
        }
        layers.splice(0, layers.length);

        this.root = null;
        this.isDirty = false;
        this.canvas.context.resetTransform();
    }

    destroy() {
        this.canvas.container = undefined;

        this.strip();

        this.canvas.destroy();
        Object.assign(this, { canvas: undefined, ctx: undefined });
    }
}
