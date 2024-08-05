import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { clamp } from '../util/number';
import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import type { ChildNodeCounts, RenderContext } from './node';
import { Node, RedrawType, SceneChangeDetection } from './node';

export class Group extends Node {
    static className = 'Group';

    static is(value: unknown): value is Group {
        return value instanceof Group;
    }

    private clipRect?: BBox;
    protected layer?: HdpiCanvas;

    @SceneChangeDetection({
        redraw: RedrawType.MAJOR,
        convertor: (v: number) => clamp(0, v, 1),
    })
    opacity: number = 1;

    protected override onZIndexChange() {
        super.onZIndexChange();
        if (this.layer) {
            this._layerManager?.moveLayer(this.layer, this.zIndex, this.zIndexSubOrder);
        }
    }

    isLayer() {
        return this.layer != null;
    }

    public constructor(
        protected readonly opts?: {
            readonly layer?: boolean;
            readonly zIndex?: number;
            readonly zIndexSubOrder?: ZIndexSubOrder;
            readonly isVirtual?: boolean;
            readonly name?: string;
            readonly nonEmptyChildDerivedZIndex?: boolean;
        }
    ) {
        super({ isVirtual: opts?.isVirtual, name: opts?.name });

        const { zIndex, zIndexSubOrder } = opts ?? {};

        this.isContainerNode = true;
        if (zIndex !== undefined) {
            this.zIndex = zIndex;
        }
        if (zIndexSubOrder !== undefined) {
            this.zIndexSubOrder = zIndexSubOrder;
        }
    }

    override _setLayerManager(layersManager?: LayersManager) {
        if (this._layerManager && this.layer) {
            this._layerManager.removeLayer(this.layer);
            this.layer = undefined;
        }

        if (this.layer) {
            throw new Error('AG Charts - unable to deregister scene rendering layer!');
        }

        super._setLayerManager(layersManager);
    }

    private initialiseLayer() {
        if (this.layer) return;

        if (!this._layerManager || this.opts?.layer !== true) return;

        this.layer = this._layerManager.addLayer({
            name: this.name,
            zIndex: this.zIndex,
            zIndexSubOrder: this.zIndexSubOrder,
            getComputedOpacity: () => this.getComputedOpacity(),
            getVisibility: () => this.getVisibility(),
        });
    }

    protected getComputedOpacity() {
        let opacity = 1;
        for (const node of this.traverseUp()) {
            if (node instanceof Group) {
                opacity *= node.opacity;
            }
        }
        return opacity;
    }

    protected getVisibility() {
        for (const node of this.traverseUp()) {
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

    override markDirty(type = RedrawType.TRIVIAL) {
        if (this.isVirtual) {
            // Always percolate directly for virtual nodes - they don't exist for rendering purposes.
            super.markDirty(type);
            return;
        }

        // Downgrade dirty-ness percolated to parent in special cases.
        let parentType = type;
        if (type < RedrawType.MINOR || this.layer != null) {
            parentType = RedrawType.TRIVIAL;
        }

        super.markDirty(type, parentType);
    }

    // We consider a group to be boundless, thus any point belongs to it.
    override containsPoint(_x: number, _y: number): boolean {
        return true;
    }

    protected override computeBBox(): BBox {
        this.computeTransformMatrix();

        return Group.computeBBox(this.children);
    }

    override computeTransformedBBox(): BBox {
        return this.getBBox();
    }

    computeTransformedRegionBBox(): BBox {
        if (this.clipRect) {
            this.computeTransformMatrix();
            return this.matrix.transformBBox(this.clipRect);
        }

        return this.computeTransformedBBox();
    }

    private lastBBox?: BBox = undefined;

    override preRender(): ChildNodeCounts {
        const counts = super.preRender();

        // Correct counts for this group.
        counts.groups += 1;
        counts.nonGroups -= 1;

        if (this.opts?.layer !== true || this.layer != null) return counts;

        if (counts.nonGroups > 0) {
            this.initialiseLayer();
        }

        if (this.opts?.nonEmptyChildDerivedZIndex && counts.nonGroups > 0) {
            this.deriveZIndexFromChildren();
        }

        return counts;
    }

    deriveZIndexFromChildren() {
        const children = this.children.filter((c) => c._childNodeCounts.nonGroups > 0);

        this.sortChildren(children);

        const lastChild = children.at(-1);
        this.zIndex = lastChild?.zIndex ?? -Infinity;
        this.zIndexSubOrder = lastChild?.zIndexSubOrder;
    }

    override render(renderCtx: RenderContext) {
        const { opts: { name = undefined } = {}, _debug: debug } = this;
        const { dirty, dirtyZIndex, layer, children, clipRect, dirtyTransform } = this;
        let { ctx, forceRender, clipBBox } = renderCtx;
        const { resized, stats } = renderCtx;

        const canvasCtxTransform = ctx.getTransform();

        const isDirty = dirty >= RedrawType.MINOR || dirtyZIndex || resized;
        let isChildDirty = isDirty;
        let isChildLayerDirty = false;
        for (const child of children) {
            isChildDirty ||= child.layerManager == null && child.dirty >= RedrawType.TRIVIAL;
            isChildLayerDirty ||= child.layerManager != null && child.dirty >= RedrawType.TRIVIAL;
            if (isChildDirty) {
                break;
            }
        }

        if (name) {
            debug?.({ name, group: this, isDirty, isChildDirty, dirtyTransform, renderCtx, forceRender });
        }

        if (dirtyTransform) {
            forceRender = 'dirtyTransform';
        } else if (layer) {
            // If bounding-box of a layer changes, force re-render.
            const currentBBox = this.getBBox();
            if (this.lastBBox === undefined || !this.lastBBox.equals(currentBBox)) {
                forceRender = 'dirtyTransform';
                this.lastBBox = currentBBox;
            }
        }

        if (!isDirty && !isChildDirty && !isChildLayerDirty && !forceRender) {
            if (name && stats) {
                debug?.({ name, result: 'skipping', renderCtx, counts: this.nodeCount, group: this });
            }

            if (layer && stats) {
                stats.layersSkipped++;
                stats.nodesSkipped += this.nodeCount.count;
            }

            this.markClean({ recursive: false });

            // Nothing to do.
            return;
        }

        const groupVisible = this.visible;
        if (layer) {
            // Switch context to the canvas layer we use for this group.
            ctx = layer.context;
            ctx.save();
            ctx.setTransform(layer.pixelRatio, 0, 0, layer.pixelRatio, 0, 0);

            if (forceRender !== 'dirtyTransform') {
                forceRender = isChildDirty || dirtyZIndex;
            }
            if (forceRender) layer.clear();

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

            ctx.setTransform(canvasCtxTransform);
        } else {
            // Only apply opacity if this isn't a distinct layer - opacity will be applied
            // at composition time.
            ctx.globalAlpha *= this.opacity;
        }

        // A group can have `scaling`, `rotation`, `translation` properties
        // that are applied to the canvas context before children are rendered,
        // so all children can be transformed at once.
        const matrix = this.transformRenderContext(renderCtx, ctx);

        if (clipRect) {
            // clipRect is in the group's coordinate space
            const { x, y, width, height } = clipRect;
            ctx.save();

            debug?.(() => ({ name, clipRect, ctxTransform: ctx.getTransform(), renderCtx, group: this }));

            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            // clipBBox is in the canvas coordinate space, when we hit a layer we apply the new clipping at which point there are no transforms in play
            clipBBox = matrix.transformBBox(clipRect);
        }

        const hasVirtualChildren = this.hasVirtualChildren();
        if (dirtyZIndex) {
            this.sortChildren(children);
            if (forceRender !== 'dirtyTransform') forceRender = true;
        } else if (hasVirtualChildren) {
            this.sortChildren(children);
        }

        // Reduce churn if renderCtx is identical.
        const renderContextChanged =
            forceRender !== renderCtx.forceRender || clipBBox !== renderCtx.clipBBox || ctx !== renderCtx.ctx;
        const childRenderContext = renderContextChanged ? { ...renderCtx, ctx, forceRender, clipBBox } : renderCtx;

        // Render visible children.
        let skipped = 0;
        for (const child of children) {
            if (!child.visible || !groupVisible) {
                // Skip invisible children, but make sure their dirty flag is reset.
                child.markClean();
                if (stats) skipped += child.nodeCount.count;
                continue;
            }

            if (!forceRender && child.dirty === RedrawType.NONE) {
                // Skip children that don't need to be redrawn.
                if (stats) skipped += child.nodeCount.count;
                continue;
            }

            // Render marks this node (and children) as clean - no need to explicitly markClean().
            ctx.save();
            child.render(childRenderContext);
            ctx.restore();
        }
        if (stats) stats.nodesSkipped += skipped;

        // Render marks this node as clean - no need to explicitly markClean().
        super.render(renderCtx);

        if (clipRect) {
            ctx.restore();
        }

        if (hasVirtualChildren) {
            // Mark virtual nodes as clean and their virtual children - all other nodes have already
            // been visited and marked clean.
            for (const child of this.virtualChildren) {
                child.markClean({ recursive: 'virtual' });
            }
        }

        if (layer) {
            if (stats) stats.layersRendered++;
            ctx.restore();

            if (forceRender) layer.snapshot();

            // Check for save/restore depth of zero!
            layer.context.verifyDepthZero?.();
        }

        if (name && stats) {
            debug?.({ name, result: 'rendered', skipped, renderCtx, counts: this.nodeCount, group: this });
        }
    }

    private sortChildren(children: Node[]) {
        this.dirtyZIndex = false;
        children.sort((a, b) =>
            compoundAscending(
                [a.zIndex, ...(a.zIndexSubOrder ?? [undefined, undefined]), a.serialNumber],
                [b.zIndex, ...(b.zIndexSubOrder ?? [undefined, undefined]), b.serialNumber],
                ascendingStringNumberUndefined
            )
        );
    }

    static computeBBox(nodes: Iterable<Node>, opts?: { skipInvisible: boolean }) {
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;
        const skipInvisible = opts?.skipInvisible ?? true;

        for (const n of nodes) {
            if (skipInvisible && !n.visible) continue;

            const bbox = n.computeTransformedBBox();

            if (!bbox) continue;

            const { x, y, width, height } = bbox;

            if (x < left) {
                left = x;
            }
            if (y < top) {
                top = y;
            }
            if (x + width > right) {
                right = x + width;
            }
            if (y + height > bottom) {
                bottom = y + height;
            }
        }

        return new BBox(left, top, right - left, bottom - top);
    }

    /**
     * Transforms bbox given in the canvas coordinate space to bbox in this group's coordinate space and
     * sets this group's clipRect to the transformed bbox.
     * @param bbox clipRect bbox in the canvas coordinate space.
     */
    setClipRectInGroupCoordinateSpace(bbox?: BBox) {
        this.clipRect = bbox ? this.transformBBox(bbox) : undefined;
    }
}
