import { nodeCount } from '../util/debug.util';
import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import { Group } from './group';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import { type ChildNodeCounts, Node, RedrawType, type RenderContext } from './node';
import { Transformable, Translatable } from './transformable';

export class Layer extends Group {
    static override className = 'Layer';

    static override is(value: unknown): value is Layer {
        return value instanceof Layer;
    }

    private layer?: HdpiCanvas;
    private lastBBox?: BBox = undefined;

    constructor(
        protected override readonly opts?: {
            name?: string;
            zIndex?: number;
            zIndexSubOrder?: ZIndexSubOrder;
            deriveZIndexFromChildren?: boolean; // TODO remove feature
        }
    ) {
        super(opts);
    }

    override markDirty(type = RedrawType.TRIVIAL) {
        super.markDirty(type, this.layer != null ? RedrawType.TRIVIAL : type);
    }

    override preRender(): ChildNodeCounts {
        const counts = super.preRender();

        if (counts.nonGroups > 0) {
            this.layer ??= this._layerManager?.addLayer({
                name: this.name,
                zIndex: this.zIndex,
                zIndexSubOrder: this.zIndexSubOrder,
                getComputedOpacity: () => this.getComputedOpacity(),
                getVisibility: () => this.getVisibility(),
            });
            if (this.opts?.deriveZIndexFromChildren) {
                this.deriveZIndexFromChildren();
            }
        }

        return counts;
    }

    protected override debugSkip(renderCtx: RenderContext) {
        super.debugSkip(renderCtx);
        const { stats } = renderCtx;
        if (stats) {
            stats.layersSkipped++;
            stats.nodesSkipped += nodeCount(this).count;
        }
    }

    override render(renderCtx: RenderContext) {
        if (!this.layer) {
            return super.render(renderCtx);
        }

        const { opts: { name } = {}, _debug: debug, dirtyZIndex, clipRect } = this;
        const { isDirty, isChildDirty, isChildLayerDirty } = this.isDirty(renderCtx);
        const { stats } = renderCtx;

        let { forceRender, clipBBox } = renderCtx;

        // If bounding-box of a layer changes, force re-render.
        const currentBBox = this.getBBox();
        if (!this.lastBBox?.equals(currentBBox)) {
            forceRender = 'dirtyTransform';
            this.lastBBox = currentBBox;
        }

        if (!isDirty && !isChildDirty && !isChildLayerDirty && !forceRender) {
            this.debugSkip(renderCtx);
            this.markClean({ recursive: false });
            return; // Nothing to do.
        }

        const renderCtxTransform = renderCtx.ctx.getTransform();
        const { context: ctx } = this.layer;

        ctx.save();
        // ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        if (forceRender !== 'dirtyTransform') {
            forceRender = isChildDirty || dirtyZIndex;
        }
        if (forceRender) {
            this.layer.clear();
        }

        if (clipBBox) {
            // clipBBox is in the canvas coordinate space, when we hit a layer we apply the new clipping at which point there are no transforms in play
            const { width, height, x, y } = clipBBox;

            debug?.(() => ({
                name,
                clipBBox,
                ctxTransform: ctx.getTransform(),
                renderCtx,
                group: this,
            }));

            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();
        }

        ctx.setTransform(renderCtxTransform);

        if (clipRect) {
            // clipRect is in the group's coordinate space
            const { x, y, width, height } = clipRect;
            ctx.save();

            debug?.(() => ({ name, clipRect, ctxTransform: ctx.getTransform(), renderCtx, group: this }));

            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            // clipBBox is in the canvas coordinate space, when we hit a layer we apply the new clipping at which point there are no transforms in play
            clipBBox = Transformable.toCanvas(this, clipRect);
        }

        let children: Iterable<Node> = this.children();
        if (dirtyZIndex) {
            children = [...children];
            this.sortChildren(children as Node[]);
            if (forceRender !== 'dirtyTransform') {
                forceRender = true;
            }
        } else if (this.hasVirtualChildren()) {
            children = [...children];
            this.sortChildren(children as Node[]);
        }

        const childRenderContext = { ...renderCtx, ctx, forceRender, clipBBox };

        // Render visible children.
        let skipped = 0;
        for (const child of children) {
            if (!child.visible || !this.visible) {
                // Skip invisible children, but make sure their dirty flag is reset.
                child.markClean();
                if (stats) skipped += nodeCount(child).count;
                continue;
            }

            if (!forceRender && child.dirty === RedrawType.NONE) {
                // Skip children that don't need to be redrawn.
                if (stats) skipped += nodeCount(child).count;
                continue;
            }

            // Render marks this node (and children) as clean - no need to explicitly markClean().
            ctx.save();
            child.render(childRenderContext);
            ctx.restore();
        }
        if (stats) stats.nodesSkipped += skipped;

        // Render marks this node as clean - no need to explicitly markClean().
        super.render(renderCtx, true);

        if (clipRect) {
            ctx.restore();
        }

        // Mark virtual nodes as clean and their virtual children.
        // All other nodes have already been visited and marked clean.
        for (const child of this.virtualChildren()) {
            child.markClean({ recursive: 'virtual' });
        }

        if (stats) stats.layersRendered++;
        ctx.restore();

        if (forceRender) {
            this.layer.snapshot();
        }

        ctx.verifyDepthZero?.(); // Check for save/restore depth of zero!

        if (name && stats) {
            debug?.({ name, result: 'rendered', skipped, renderCtx, counts: nodeCount(this), group: this });
        }
    }

    private deriveZIndexFromChildren() {
        let lastChild: Node | undefined;
        for (const child of this.children()) {
            if (!child.childNodeCounts.nonGroups) continue;
            if (!lastChild || Group.compareChildren(lastChild, child) < 0) {
                lastChild = child;
            }
        }
        this.zIndex = lastChild?.zIndex ?? -Infinity;
        this.zIndexSubOrder = lastChild?.zIndexSubOrder;
    }

    override _setLayerManager(layersManager?: LayersManager) {
        if (this.layer) {
            this._layerManager?.removeLayer(this.layer);
            this.layer = undefined;
        }
        super._setLayerManager(layersManager);
    }

    private getComputedOpacity() {
        let opacity = 1;
        for (const node of this.traverseUp(true)) {
            if (node instanceof Group) {
                opacity *= node.opacity;
            }
        }
        return opacity;
    }

    private getVisibility() {
        for (const node of this.traverseUp(true)) {
            if (!node.visible) {
                return false;
            }
        }
        return true;
    }

    protected override onVisibleChange() {
        if (this.layer) {
            this.layer.enabled = this.visible;
        }
    }

    protected override onZIndexChange() {
        super.onZIndexChange();
        if (this.layer) {
            this._layerManager?.moveLayer(this.layer, this.zIndex, this.zIndexSubOrder);
        }
    }
}

export class TranslatableLayer extends Translatable(Layer) {}
