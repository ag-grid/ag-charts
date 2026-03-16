import { CleanupRegistry, Debug, EventEmitter, Logger, createId, downloadUrl } from 'ag-charts-core';

import type { BBox } from './bbox';
import { type CanvasOptions, HdpiCanvas } from './canvas/hdpiCanvas';
import { Group } from './group';
import { ImageLoader } from './image/imageLoader';
import { LayersManager } from './layersManager';
import { Node, type RenderContext } from './node';
import {
    DebugSelectors,
    buildDirtyTree,
    buildTree,
    cleanupDebugStats,
    debugSceneNodeHighlight,
    debugStats,
    prepareSceneNodeHighlight,
    registerDebugStatsConsumer,
} from './sceneDebug';

type EventMap = {
    'scene-changed': object;
};

export class Scene extends EventEmitter<EventMap> {
    static readonly className = 'Scene';

    private readonly debug = Debug.create(true, DebugSelectors.SCENE);

    readonly id = createId(this);
    readonly canvas: HdpiCanvas;
    readonly layersManager: LayersManager;
    readonly imageLoader = new ImageLoader();

    private root: Group | null = null;
    private pendingSize: [number, number, number] | null = null;
    private isDirty: boolean = false;
    private direction: CanvasDirection = 'ltr';
    private _baseFont: string | undefined;

    private readonly cleanup = new CleanupRegistry();
    private releaseDebugStats?: () => void;

    constructor(canvasOptions: CanvasOptions) {
        super();

        this.updateDebugFlags();
        this.canvas = new HdpiCanvas(canvasOptions);
        this.layersManager = new LayersManager(this.canvas);

        this.cleanup.register(
            this.imageLoader.on('image-loaded', () => {
                this.emit('scene-changed', {});
            }),
            this.imageLoader.on('image-error', ({ uri }) => {
                Logger.warnOnce(`Unable to load image ${uri}`);
            })
        );
    }

    waitingForUpdate(): boolean {
        return this.imageLoader?.waitingToLoad() ?? false;
    }

    get width(): number {
        return this.pendingSize?.[0] ?? this.canvas.width;
    }

    get height(): number {
        return this.pendingSize?.[1] ?? this.canvas.height;
    }

    get pixelRatio(): number {
        return this.pendingSize?.[2] ?? this.canvas.pixelRatio;
    }

    /**
     * @deprecated v10.2.0 Only used by AG Grid Sparklines + Mini Charts
     *
     * DO NOT REMOVE WITHOUT FIXING THE GRID DEPENDENCIES.
     */
    setContainer(value: HTMLElement) {
        const { element } = this.canvas;
        element.remove();
        value.appendChild(element);
        return this;
    }

    setRoot(node: Group | null) {
        if (this.root === node) {
            return this;
        }

        this.isDirty = true;
        this.root?.setScene();
        this.root = node;

        if (node) {
            node.visible = true;
            node.setScene(this);
        }

        return this;
    }

    updateDebugFlags() {
        Debug.inDevelopmentMode(() => (Node._debugEnabled = true));
    }

    clearCanvas() {
        this.canvas.clear();
    }

    attachNode<T extends Node>(node: T) {
        this.appendChild(node);
        return () => node.remove();
    }

    appendChild<T extends Node>(node: T) {
        this.root?.appendChild(node);
        return this;
    }

    removeChild<T extends Node>(node: T) {
        node.remove();
        return this;
    }

    download(fileName?: string, fileFormat?: string) {
        downloadUrl(this.canvas.toDataURL(fileFormat), fileName?.trim() ?? 'image');
    }

    /** NOTE: Integrated Charts undocumented image download method. */
    getDataURL(fileFormat?: string) {
        return this.canvas.toDataURL(fileFormat);
    }

    resize(width: number, height: number, pixelRatio: number | undefined): boolean {
        width = Math.round(width);
        height = Math.round(height);
        pixelRatio ??= this.pixelRatio;
        if (
            width > 0 &&
            height > 0 &&
            (width !== this.width || height !== this.height || pixelRatio !== this.pixelRatio)
        ) {
            this.pendingSize = [width, height, pixelRatio];
            this.isDirty = true;
            return true;
        }
        return false;
    }

    setDirection(isRtl: boolean) {
        this.direction = isRtl ? 'rtl' : 'ltr';
        this.canvas.setDirection(isRtl);
    }

    updateBaseFont() {
        const baseFont = this.root?.resolveFont();
        if (baseFont != null && baseFont !== this._baseFont) {
            this._baseFont = baseFont;
            this.canvas.context.font = baseFont;
        }
    }

    applyPendingResize(): boolean {
        if (this.pendingSize) {
            this.layersManager.resize(...this.pendingSize);
            this.pendingSize = null;
            // Resize resets canvas context state — re-apply the cached base font.
            if (this._baseFont != null) {
                this.canvas.context.font = this._baseFont;
            }
            return true;
        }
        return false;
    }

    render(opts?: {
        debugSplitTimes: Record<string, number>;
        extraDebugStats: Record<string, number>;
        seriesRect?: BBox;
        debugColors?: { background?: string; foreground?: string };
    }) {
        const { debugSplitTimes = { start: performance.now() }, extraDebugStats, seriesRect, debugColors } = opts ?? {};
        const { canvas, canvas: { context: ctx } = {}, root, width, height, pixelRatio: devicePixelRatio } = this;

        if (!ctx) {
            // Scene.destroy() has dereferenced the HdpiCanvas instance, just abort silently.
            return;
        }

        const statsEnabled = Debug.check(DebugSelectors.SCENE_STATS, DebugSelectors.SCENE_STATS_VERBOSE);
        if (statsEnabled) {
            this.ensureDebugStatsRegistration();
        }

        const renderStartTime = performance.now();
        const resized: boolean = this.applyPendingResize();

        if (root && !root.visible) {
            this.isDirty = false;
            return;
        }

        let rootDirty: boolean | undefined;
        if (root instanceof Group) {
            rootDirty = root.dirty;
        }

        if (root != null && rootDirty === false && !this.isDirty) {
            if (this.debug.check()) {
                this.debug('Scene.render() - no-op', {
                    tree: buildTree(root, 'console'),
                });
            }

            if (statsEnabled) {
                debugStats(
                    this.layersManager,
                    debugSplitTimes,
                    ctx,
                    undefined,
                    extraDebugStats,
                    seriesRect,
                    debugColors
                );
            }
            return;
        }

        const renderCtx: RenderContext = {
            ctx,
            direction: this.direction,
            width,
            height,
            devicePixelRatio,
            debugNodes: {},
        };

        if (Debug.check(DebugSelectors.SCENE_STATS_VERBOSE)) {
            renderCtx.stats = {
                layersRendered: 0,
                layersSkipped: 0,
                nodesRendered: 0,
                nodesSkipped: 0,
                opsPerformed: 0,
                opsSkipped: 0,
            };
        }

        prepareSceneNodeHighlight(renderCtx);

        let canvasCleared = false;
        // Groups are considered dirty when the layer is resized,
        // but this doesn't actually get propagated to the scene graph,
        // so the root isn't marked as dirty on the resize case
        if (rootDirty !== false || resized) {
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
                root.preRender(renderCtx);
            }

            if (this.debug.check()) {
                const tree = buildTree(root, 'console');
                this.debug('Scene.render() - before', {
                    canvasCleared,
                    tree,
                });
                // Uncomment to write tree to filesystem from tests / Node.js.
                // require('fs').writeFileSync('scene.json', JSON.stringify(buildTree(root, 'json')));
                // console.log('Skipped properties', skippedProperties);
            }

            if (root.visible) {
                try {
                    ctx.save();
                    root.render(renderCtx);
                    ctx.restore();
                } catch (e) {
                    // AG-14976 - make sure to reset canvas state on error.
                    // This is not bullet proof, but does at least give a chance for an application to recover.
                    this.canvas.reset();

                    throw e;
                }
            }
        }

        debugSplitTimes['✍️'] = performance.now() - renderStartTime;

        // Check for save/restore depth of zero!
        ctx.verifyDepthZero?.();

        this.isDirty = false;

        if (statsEnabled) {
            debugStats(
                this.layersManager,
                debugSplitTimes,
                ctx,
                renderCtx.stats,
                extraDebugStats,
                seriesRect,
                debugColors
            );
        }
        debugSceneNodeHighlight(ctx, renderCtx.debugNodes);

        if (root && this.debug.check()) {
            this.debug('Scene.render() - after', {
                tree: buildTree(root, 'console'),
                canvasCleared,
            });
        }
    }

    private ensureDebugStatsRegistration() {
        if (this.releaseDebugStats) return;

        const release = registerDebugStatsConsumer();
        const cleanup = () => {
            release();
            this.releaseDebugStats = undefined;
        };

        this.releaseDebugStats = cleanup;
        this.cleanup.register(cleanup);
    }

    toSVG() {
        const { root, width, height } = this;
        if (root == null) return;
        return Node.toSVG(root, width, height);
    }

    /** Alternative to destroy() that preserves re-usable resources. */
    strip() {
        const { context, pixelRatio } = this.canvas;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this.layersManager.clear();

        this.setRoot(null);
        this.isDirty = false;
        this.clear();
    }

    destroy() {
        this.strip();

        this.canvas.destroy();
        this.imageLoader.destroy();
        this.cleanup.flush();
        cleanupDebugStats();
        Object.assign(this, { canvas: undefined });
    }
}
