import { HdpiCanvas } from "../canvas/hdpiCanvas";
import { Node, RedrawType, RenderContext } from "./node";
import { createId } from "../util/id";
import { Group } from "./group";

interface DebugOptions {
    stats: boolean;
    dirtyTree: boolean;
    renderBoundingBoxes: boolean;
    consoleLog: boolean;
    onlyLayers: string[];
}

interface SceneOptions {
    document: Document,
    mode: 'simple' | 'composite' | 'dom-composite',
}

export class Scene {

    static className = 'Scene';

    readonly id = createId(this);

    readonly canvas: HdpiCanvas;
    readonly layers: { id: number, name?: string, zIndex: number, canvas: HdpiCanvas }[] = [];

    private readonly ctx: CanvasRenderingContext2D;

    private readonly opts: SceneOptions;

    constructor(
        opts: {
            width?: number,
            height?: number,
        } & Partial<SceneOptions>
    ) {
        const {
            document = window.document,
            mode = (window as any).agChartsSceneRenderModel || 'dom-composite',
            width,
            height,
        } = opts;

        this.opts = { document, mode };
        this.debug.stats = (window as any).agChartsSceneStats ?? false;
        this.debug.onlyLayers = (window as any).agChartsSceneOnlyLayers ?? [];
        this.debug.dirtyTree = (window as any).agChartsSceneDirtyTree ?? false;
        this.canvas = new HdpiCanvas({ document, width, height });
        this.ctx = this.canvas.context;
    }

    set container(value: HTMLElement | undefined) {
        this.canvas.container = value;
    }
    get container(): HTMLElement | undefined {
        return this.canvas.container;
    }

    download(fileName?: string) {
        this.canvas.download(fileName);
    }

    getDataURL(type?: string): string {
        return this.canvas.getDataURL(type);
    }

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

        if (width === this.width && height === this.height) {
            return false;
        } else if (width <= 0 || height <= 0) {
            // HdpiCanvas doesn't allow width/height <= 0.
            return false;
        }

        this.pendingSize = [width, height];
        this.markDirty();
        
        return true;
    }

    private _nextZIndex = 0;
    private _nextLayerId = 0;
    addLayer(opts?: { zIndex?: number, name?: string }): HdpiCanvas | undefined {
        const { mode } = this.opts;
        if (mode !== 'composite' && mode !== 'dom-composite') {
            return undefined;
        }

        const { zIndex = this._nextZIndex++, name } = opts || {};
        const { width, height } = this;
        const domLayer = mode === 'dom-composite';
        const newLayer = {
            id: this._nextLayerId++,
            name,
            zIndex,
            canvas: new HdpiCanvas({
                document: this.canvas.document,
                width,
                height,
                domLayer,
                zIndex,
                name,
            }),
        };

        if (zIndex >= this._nextZIndex) {
            this._nextZIndex = zIndex + 1;
        }

        this.layers.push(newLayer);
        this.layers.sort((a, b) => { 
            const zDiff = a.zIndex - b.zIndex;
            if (zDiff !== 0) {
                return zDiff;
            }
            return a.id - b.id;
        });

        if (domLayer) {
            const newLayerIndex = this.layers.findIndex(v => v === newLayer);
            const lastLayer = this.layers[newLayerIndex - 1]?.canvas ?? this.canvas;
            lastLayer.element.insertAdjacentElement('afterend', newLayer.canvas.element);
        }

        if (this.debug.consoleLog) {
            console.log({ layers: this.layers });
        }

        return newLayer.canvas;
    }

    removeLayer(canvas: HdpiCanvas) {
        const index = this.layers.findIndex((l) => l.canvas = canvas);

        if (index >= 0) {
            this.layers.splice(index, 1);
            canvas.destroy();
            this.markDirty();

            if (this.debug.consoleLog) {
                console.log({ layers: this.layers });
            }
        }
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
            this._root._setScene();
        }

        this._root = node;

        if (node) {
            // If `node` is the root node of another scene ...
            if (node.parent === null && node.scene && node.scene !== this) {
                node.scene.root = null;
            }
            node._setScene(this);
        }

        this.markDirty();
    }
    get root(): Node | null {
        return this._root;
    }

    readonly debug: DebugOptions = {
        dirtyTree: false,
        stats: false,
        renderBoundingBoxes: false,
        consoleLog: false,
        onlyLayers: [],
    };

    private _frameIndex = 0;
    get frameIndex(): number {
        return this._frameIndex;
    }

    render() {
        const start = performance.now();
        const { canvas, ctx, root, layers, pendingSize, opts: { mode } } = this;

        if (pendingSize) {
            this.canvas.resize(...pendingSize);
            this.layers.forEach((layer) => layer.canvas.resize(...pendingSize));

            this.pendingSize = undefined;
        }

        if (root && !root.visible) {
            this._dirty = false;
            return;
        }

        if (!this.dirty) {
            return;
        }

        const renderCtx: RenderContext = {
            ctx,
            forceRender: true,
            resized: !!pendingSize,
        };
        if (this.debug.stats) {
            renderCtx.stats = { layersRendered: 0, layersSkipped: 0, nodesRendered: 0, nodesSkipped: 0 };
        }

        let canvasCleared = false;
        if (!root || root.dirty >= RedrawType.TRIVIAL) {
            // start with a blank canvas, clear previous drawing
            canvasCleared = true;
            canvas.clear();
        }

        if (root && this.debug.dirtyTree) {
            const {dirtyTree, paths} = this.buildDirtyTree(root);
            console.log({dirtyTree, paths});
        }

        if (root && canvasCleared) {
            if (this.debug.consoleLog) {
                console.log({ redrawType: RedrawType[root.dirty], canvasCleared });
            }

            if (root.visible) {
                ctx.save();
                root.render(renderCtx);
                ctx.restore();
            }
        }

        if (mode !== 'dom-composite' && layers.length > 0 && canvasCleared) {
            ctx.save();
            ctx.resetTransform();
            layers.forEach((layer) => {
                if (layer.canvas.enabled) {
                    ctx.globalAlpha = layer.canvas.opacity;
                    // Indirect reference to fix typings for tests.
                    const canvas = layer.canvas.context.canvas;
                    ctx.drawImage(canvas, 0, 0);
                }
            });
            ctx.restore();
        }

        this._dirty = false;

        const end = performance.now();
        this._frameIndex++;

        if (this.debug.stats) {
            const pct = (rendered: number, skipped: number) => {
                const total = rendered + skipped;
                return `${rendered}/${total}(${Math.round(100*rendered/total)}%)`;
            }
            const { layersRendered = 0, layersSkipped = 0, nodesRendered = 0, nodesSkipped = 0 } =
                renderCtx.stats || {};
            const stats = `${Math.round((end - start)*100) / 100}ms; ` +
                `Layers: ${pct(layersRendered, layersSkipped)}; ` +
                `Nodes: ${pct(nodesRendered, nodesSkipped)}`;

            ctx.save();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 300, 15);
            ctx.fillStyle = 'black';
            ctx.fillText(this.frameIndex.toString(), 2, 10);
            ctx.fillText(stats, 30, 10);
            ctx.restore();
        }

    }

    buildDirtyTree(node: Node): {
        dirtyTree: { meta?: { name: string, node: any, dirty: string } },
        paths: string[],
    } {
        if (node.dirty === RedrawType.NONE) {
            return { dirtyTree: {}, paths: [] };
        }

        const childrenDirtyTree = node.children.map(c => this.buildDirtyTree(c))
            .filter(c => c.paths.length > 0);
        const name = (node instanceof Group ? node.name : null) ?? node.id;
        const paths = childrenDirtyTree.length === 0 ? [ name ]
            : childrenDirtyTree.map(c => c.paths)
                .reduce((r, p) => r.concat(p), [])
                .map(p => `${name}.${p}`);

        return {
            dirtyTree: {
                meta: { name, node, dirty: RedrawType[node.dirty] },
                ...childrenDirtyTree.map((c) => c.dirtyTree)
                    .filter((t) => t.meta !== undefined)
                    .reduce((result, childTree) => {
                        result[childTree.meta?.name || '<unknown>'] = childTree;
                        return result;
                    }, {} as Record<string, {}>),
            },
            paths,
        };
    }
}
