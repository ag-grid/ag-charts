import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import { nodeCount } from './debug.util';
import { Group } from './group';
import type { LayersManager } from './layersManager';
import { type ChildNodeCounts, Node, RedrawType, type RenderContext } from './node';
import { Translatable } from './transformable';
import type { ZIndex } from './zIndex';

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
            zIndex?: ZIndex;
            deriveZIndexFromChildren?: boolean; // TODO remove feature
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

        const { opts: { name } = {}, _debug: debug, clipRect } = this;
        const { isDirty, isChildDirty, isChildLayerDirty } = this.isDirty(renderCtx);
        const { stats } = renderCtx;

        let { forceRender, clipBBox } = renderCtx;

        // If bounding-box of a layer changes, force re-render.
        const currentBBox = this.getBBox();
        if (!this.lastBBox?.equals(currentBBox)) {
            forceRender = 'dirtyTransform';
            this.lastBBox = currentBBox;
        }

        if (isDirty || isChildDirty || isChildLayerDirty || forceRender) {
            this.debugSkip(renderCtx);
            this.markClean({ recursive: false });

            if (forceRender !== 'dirtyTransform') {
                forceRender = isChildDirty || this.dirtyZIndex;
            }

            if (forceRender) {
                this.layer.clear();
            }

            if (this.dirtyZIndex) {
                this.sortChildren(Group.compareChildren);
            }
            const children = this.children();
            const renderCtxTransform = renderCtx.ctx.getTransform();
            const { context: layerCtx } = this.layer;

            layerCtx.save();

            if (clipBBox) {
                // clipBBox is in the canvas coordinate space, when we hit a layer we
                // apply the new clipping at which point there are no transforms in play
                const { width, height, x, y } = clipBBox;

                layerCtx.beginPath();
                layerCtx.rect(x, y, width, height);
                layerCtx.clip();

                debug?.(() => ({ name, clipBBox, renderCtx, group: this, ctxTransform: layerCtx.getTransform() }));
            }

            layerCtx.setTransform(renderCtxTransform);

            if (this.clipRect) {
                clipBBox = this.renderClip({ ...renderCtx, ctx: layerCtx });
            }

            this.renderChildren(children, { ...renderCtx, ctx: layerCtx, forceRender, clipBBox });
            super.render(renderCtx, true); // Calls markClean().

            if (clipRect) {
                layerCtx.restore();
            }

            if (stats) stats.layersRendered++;
            layerCtx.restore();

            layerCtx.verifyDepthZero?.(); // Check for save/restore depth of zero!
        }

        const { ctx } = renderCtx;
        ctx.save();
        ctx.resetTransform();
        if (this.getVisibility()) {
            ctx.globalAlpha = this.getComputedOpacity();
            this.layer.drawImage(ctx as any);
        }
        ctx.restore();

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
}

export class TranslatableLayer extends Translatable(Layer) {}
