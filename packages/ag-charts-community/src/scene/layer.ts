import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import { nodeCount } from './debug.util';
import { Group } from './group';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import { type ChildNodeCounts, Node, RedrawType, type RenderContext } from './node';
import { Translatable } from './transformable';

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
            mode?: 'legacy' | 'next';
        }
    ) {
        super(opts);
    }

    override markDirty(type = RedrawType.TRIVIAL) {
        super.markDirty(type, RedrawType.TRIVIAL);
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
                mode: this.opts?.mode ?? 'legacy',
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

    private renderLegacy(renderCtx: RenderContext, forceRender: boolean | 'dirtyTransform') {
        if (!this.layer) {
            super.render(renderCtx);
            return false;
        }

        const { opts: { name } = {}, _debug: debug, clipRect } = this;
        let { clipBBox } = renderCtx;

        if (forceRender) {
            this.layer.clear();
        }

        const children = this.sortedChildren();
        const renderCtxTransform = renderCtx.ctx.getTransform();
        const { context: ctx } = this.layer;

        ctx.save();

        if (clipBBox) {
            // clipBBox is in the canvas coordinate space, when we hit a layer we
            // apply the new clipping at which point there are no transforms in play
            const { width, height, x, y } = clipBBox;

            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            debug?.(() => ({ name, clipBBox, renderCtx, group: this, ctxTransform: ctx.getTransform() }));
        }

        ctx.setTransform(renderCtxTransform);

        if (this.clipRect) {
            clipBBox = this.renderClip({ ...renderCtx, ctx });
        }

        this.renderChildren(children, { ...renderCtx, ctx, forceRender, clipBBox });
        super.render(renderCtx, true); // Calls markClean().

        if (clipRect) {
            ctx.restore();
        }

        ctx.restore();
        ctx.verifyDepthZero?.(); // Check for save/restore depth of zero!

        return true;
    }

    private renderNext(renderCtx: RenderContext, forceRender: boolean | 'dirtyTransform') {
        if (!this.getVisibility()) {
            return true;
        } else if (!this.layer) {
            super.render(renderCtx);
            return false;
        }

        const { isDirty, isChildDirty, isChildLayerDirty } = this.isDirty(renderCtx);

        if (forceRender) {
            this.layer.clear();
        }

        if (isDirty || isChildDirty || isChildLayerDirty || forceRender) {
            const layerRenderCtx: RenderContext = {
                ...renderCtx,
                ctx: this.layer.context,
                forceRender,
            };

            super.render(layerRenderCtx, false);

            this.layer.context.verifyDepthZero?.(); // Check for save/restore depth of zero!
        } else {
            this.debugSkip(renderCtx);
            this.markClean({ recursive: false });
        }

        const { ctx } = renderCtx;
        ctx.save();
        ctx.resetTransform();
        ctx.globalAlpha = this.getComputedOpacity();
        this.layer.drawImage(ctx);
        ctx.restore();

        return true;
    }

    override render(renderCtx: RenderContext) {
        const { opts: { name, mode } = {}, _debug: debug } = this;
        const { isDirty, isChildDirty, isChildLayerDirty } = this.isDirty(renderCtx);

        let { forceRender } = renderCtx;
        const { stats } = renderCtx;

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

        if (forceRender !== 'dirtyTransform') {
            forceRender = isChildDirty || this.dirtyZIndex;
        }

        if (this.dirtyZIndex) {
            this.sortChildren(Group.compareChildren);
        }

        let layersRendered: boolean;
        if (mode === 'next') {
            layersRendered = this.renderNext(renderCtx, forceRender);
        } else {
            layersRendered = this.renderLegacy(renderCtx, forceRender);
        }

        // Mark virtual nodes as clean and their virtual children.
        // All other nodes have already been visited and marked clean.
        for (const child of this.virtualChildren()) {
            child.markClean({ recursive: 'virtual' });
        }

        if (stats && layersRendered) {
            stats.layersRendered++;
        }

        if (name && stats) {
            debug?.({
                name,
                renderCtx,
                result: 'rendered',
                skipped: stats.nodesSkipped,
                counts: nodeCount(this),
                group: this,
            });
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
