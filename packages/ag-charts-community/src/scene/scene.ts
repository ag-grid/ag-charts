import { Debug } from '../util/debug';
import { downloadUrl } from '../util/dom';
import { createId } from '../util/id';
import type { BBox } from './bbox';
import { type CanvasOptions, HdpiCanvas } from './canvas/hdpiCanvas';
import { LayersManager } from './layersManager';
import type { Node, RenderContext } from './node';
import { RedrawType } from './node';
import {
    DebugSelectors,
    buildDirtyTree,
    buildTree,
    debugSceneNodeHighlight,
    debugStats,
    prepareSceneNodeHighlight,
} from './sceneDebug';

export class Scene {
    static readonly className = 'Scene';

    private readonly debug = Debug.create(true, DebugSelectors.SCENE);

    readonly id = createId(this);
    readonly canvas: HdpiCanvas;
    readonly layersManager: LayersManager;

    private root: Node | null = null;
    private pendingSize: [number, number] | null = null;
    private isDirty: boolean = false;

    constructor(canvasOptions: CanvasOptions) {
        this.canvas = new HdpiCanvas(canvasOptions);
        this.layersManager = new LayersManager(this.canvas, () => {
            this.isDirty = true;
        });
    }

    get width(): number {
        return this.pendingSize?.[0] ?? this.canvas.width;
    }

    get height(): number {
        return this.pendingSize?.[1] ?? this.canvas.height;
    }

    /** @deprecated v10.2.0 Only used by AG Grid Sparklines */
    setContainer(value: HTMLElement) {
        const { element } = this.canvas;
        element.parentElement?.removeChild(element);
        value.appendChild(element);
        return this;
    }

    setRoot(node: Node | null) {
        if (this.root === node) {
            return this;
        }

        this.isDirty = true;
        this.root?._setLayerManager();
        this.root = node;

        if (node) {
            node.visible = true;
            node._setLayerManager(this.layersManager);
        }

        return this;
    }

    attachNode<T extends Node>(node: T) {
        this.appendChild(node);
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
        downloadUrl(this.canvas.toDataURL(fileFormat), fileName?.trim() ?? 'image');
    }

    /** NOTE: Integrated Charts undocumented image download method. */
    getDataURL(fileFormat?: string) {
        return this.canvas.toDataURL(fileFormat);
    }

    resize(width: number, height: number): boolean {
        width = Math.round(width);
        height = Math.round(height);
        if (width > 0 && height > 0 && (width !== this.width || height !== this.height)) {
            this.pendingSize = [width, height];
            this.isDirty = true;
            return true;
        }
        return false;
    }

    async render(opts?: {
        debugSplitTimes: Record<string, number>;
        extraDebugStats: Record<string, number>;
        seriesRect?: BBox;
    }) {
        const { debugSplitTimes = { start: performance.now() }, extraDebugStats, seriesRect } = opts ?? {};
        const { canvas, canvas: { context: ctx } = {}, root, pendingSize } = this;

        if (!ctx) {
            // Scene.destroy() has dereferenced the HdpiCanvas instance, just abort silently.
            return;
        }

        const renderStartTime = performance.now();
        if (pendingSize) {
            this.layersManager.resize(...pendingSize);
            this.pendingSize = null;
        }

        if (root && !root.visible) {
            this.isDirty = false;
            return;
        }

        if (root && !this.isDirty) {
            if (this.debug.check()) {
                this.debug('Scene.render() - no-op', {
                    redrawType: RedrawType[root.dirty],
                    tree: buildTree(root, 'console'),
                });
            }

            debugStats(this.layersManager, debugSplitTimes, ctx, undefined, extraDebugStats, seriesRect);
            return;
        }

        const renderCtx: RenderContext = {
            ctx,
            devicePixelRatio: this.canvas.pixelRatio ?? 1,
            forceRender: true,
            resized: Boolean(pendingSize),
            debugNodes: {},
        };

        if (Debug.check(DebugSelectors.SCENE_STATS_VERBOSE)) {
            renderCtx.stats = { layersRendered: 0, layersSkipped: 0, nodesRendered: 0, nodesSkipped: 0 };
        }

        prepareSceneNodeHighlight(renderCtx);

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
            if (root.visible) {
                // Pre-render before building debug tree, so state matches that used in rendering.
                root.preRender();
            }

            if (this.debug.check()) {
                const tree = buildTree(root, 'console');
                this.debug('Scene.render() - before', {
                    redrawType: RedrawType[root.dirty],
                    canvasCleared,
                    tree,
                });
                // Uncomment to write tree to filesystem from tests / Node.js.
                // require('fs').writeFileSync('scene.json', JSON.stringify(buildTree(root, 'json')));
                // console.log('Skipped properties', skippedProperties);
            }

            if (root.visible) {
                ctx.save();
                root.render(renderCtx);
                ctx.restore();
            }
        }

        debugSplitTimes['✍️'] = performance.now() - renderStartTime;

        if (this.layersManager.size && canvasCleared) {
            const layerRenderStart = performance.now();
            ctx.save();
            ctx.resetTransform();
            this.layersManager.forEach((layer) => {
                if (layer.canvas.enabled && layer.getVisibility()) {
                    ctx.globalAlpha = layer.getComputedOpacity();
                    layer.canvas.drawImage(ctx);
                }
            });
            ctx.restore();

            debugSplitTimes['⛙'] = performance.now() - layerRenderStart;
        }

        // Check for save/restore depth of zero!
        ctx.verifyDepthZero?.();

        this.isDirty = false;

        debugStats(this.layersManager, debugSplitTimes, ctx, renderCtx.stats, extraDebugStats, seriesRect);
        debugSceneNodeHighlight(ctx, renderCtx.debugNodes);

        if (root && this.debug.check()) {
            this.debug('Scene.render() - after', {
                redrawType: RedrawType[root.dirty],
                tree: buildTree(root, 'console'),
                canvasCleared,
            });
        }
    }

    toSVG() {
        const svg = this.root?.toSVG();

        if (svg == null) return;

        const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        root.setAttribute('width', String(this.width));
        root.setAttribute('height', String(this.height));

        if (svg.defs != null) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.append(...svg.defs);
            root.append(defs);
        }

        root.append(...svg.elements);

        return root.outerHTML;
    }

    /** Alternative to destroy() that preserves re-usable resources. */
    strip() {
        const { context, pixelRatio } = this.canvas;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this.layersManager.clear();

        this.setRoot(null);
        this.isDirty = false;
    }

    destroy() {
        this.strip();

        this.canvas.destroy();
        Object.assign(this, { canvas: undefined });
    }
}
