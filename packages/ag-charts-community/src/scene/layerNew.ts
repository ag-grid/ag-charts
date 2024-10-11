import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import { nodeCount } from './debug.util';
import { Group } from './group';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import { type ChildNodeCounts, RedrawType, type RenderContext } from './node';
import { Translatable } from './transformable';

export class LayerNew extends Group {
    static override className = 'LayerNew';

    static override is(value: unknown): value is LayerNew {
        return value instanceof LayerNew;
    }

    private layer?: HdpiCanvas;
    private lastBBox?: BBox = undefined;

    constructor(
        protected override readonly opts?: {
            name?: string;
            zIndex?: number;
            zIndexSubOrder?: ZIndexSubOrder;
        }
    ) {
        super(opts);
    }

    override markDirty(type = RedrawType.TRIVIAL) {
        super.markDirty(type, RedrawType.TRIVIAL);
    }

    override preRender(): ChildNodeCounts {
        const counts = super.preRender();

        if (counts.nonGroups > 0 && this.layer == null) {
            this.layer = this._layerManager?.addLayer({
                name: this.name,
                zIndex: this.zIndex,
                zIndexSubOrder: this.zIndexSubOrder,
                getComputedOpacity: () => this.getComputedOpacity(),
                getVisibility: () => this.getVisibility(),
                mode: 'next',
            });
            this.markDirty();
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
        } else if (!this.getVisibility()) {
            return;
        }

        const { opts: { name } = {}, _debug: debug } = this;
        const { isDirty, isChildDirty, isChildLayerDirty } = this.isDirty(renderCtx);
        const { stats } = renderCtx;

        let { forceRender } = renderCtx;

        // If bounding-box of a layer changes, force re-render.
        const currentBBox = this.getBBox();
        if (!this.lastBBox?.equals(currentBBox)) {
            forceRender = 'dirtyTransform';
            this.lastBBox = currentBBox;
        }

        if (forceRender !== 'dirtyTransform') {
            forceRender = isChildDirty || this.dirtyZIndex;
        }

        if (isDirty || isChildDirty || isChildLayerDirty || forceRender) {
            console.log('Render layer');
            if (forceRender) {
                this.layer.clear();
            }

            const layerRenderCtx: RenderContext = {
                ...renderCtx,
                ctx: this.layer.context,
                forceRender,
            };

            console.log(layerRenderCtx);
            console.log(this.layer);

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

export class TranslatableLayerNew extends Translatable(LayerNew) {}
