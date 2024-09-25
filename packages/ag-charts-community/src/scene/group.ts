import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { nodeCount } from '../util/debug.util';
import { clamp } from '../util/number';
import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import type { ZIndexSubOrder } from './layersManager';
import type { ChildNodeCounts, RenderContext } from './node';
import { Node, RedrawType, SceneChangeDetection } from './node';
import { Rotatable, Scalable, Transformable, Translatable } from './transformable';

export class Group extends Node {
    static className = 'Group';

    static is(value: unknown): value is Group {
        return value instanceof Group;
    }

    static computeChildrenBBox(nodes: Iterable<Node>, skipInvisible = true) {
        function* visible() {
            for (const n of nodes) {
                if (!skipInvisible || (n.visible && !n.transitionOut)) {
                    const bbox = n.getBBox();
                    if (bbox) yield bbox;
                }
            }
        }
        return BBox.merge(visible());
    }

    protected static compareChildren(a: Node, b: Node) {
        return compoundAscending(
            [a.zIndex, ...(a.zIndexSubOrder ?? [undefined, undefined]), a.serialNumber],
            [b.zIndex, ...(b.zIndexSubOrder ?? [undefined, undefined]), b.serialNumber],
            ascendingStringNumberUndefined
        );
    }

    // should all be private
    protected clipRect?: BBox;
    protected layer?: HdpiCanvas;
    protected lastBBox?: BBox = undefined;

    @SceneChangeDetection({
        redraw: RedrawType.MAJOR,
        convertor: (v: number) => clamp(0, v, 1),
    })
    opacity: number = 1;

    constructor(
        protected readonly opts?: {
            readonly name?: string;
            readonly isVirtual?: boolean;
            readonly zIndex?: number;
            readonly zIndexSubOrder?: ZIndexSubOrder;
            readonly layer?: boolean; // TODO remove
        }
    ) {
        super(opts);
        this.isContainerNode = true;
        this.zIndexSubOrder = opts?.zIndexSubOrder;
    }

    // We consider a group to be boundless, thus any point belongs to it.
    override containsPoint(_x: number, _y: number): boolean {
        return true;
    }

    protected override computeBBox(): BBox {
        return Group.computeChildrenBBox(this.children());
    }

    override preRender(): ChildNodeCounts {
        const counts = super.preRender();

        // Correct counts for this group.
        counts.groups += 1;
        counts.nonGroups -= 1;

        return counts;
    }

    override render(renderCtx: RenderContext) {
        const { opts: { name = undefined } = {}, _debug: debug } = this;
        const { dirty, dirtyZIndex, layer, clipRect } = this;
        let { ctx, forceRender, clipBBox } = renderCtx;
        const { resized, stats } = renderCtx;

        const isDirty = dirty >= RedrawType.MINOR || dirtyZIndex || resized;
        let isChildDirty = isDirty;
        let isChildLayerDirty = false;
        for (const child of this.children()) {
            isChildDirty ||= child.layerManager == null && child.dirty >= RedrawType.TRIVIAL;
            isChildLayerDirty ||= child.layerManager != null && child.dirty >= RedrawType.TRIVIAL;
            if (isChildDirty) break;
        }

        if (name) {
            debug?.({ name, group: this, isDirty, isChildDirty, renderCtx, forceRender });
        }

        if (layer) {
            // If bounding-box of a layer changes, force re-render.
            const currentBBox = this.getBBox();
            if (!this.lastBBox?.equals(currentBBox)) {
                forceRender = 'dirtyTransform';
                this.lastBBox = currentBBox;
            }
        }

        if (!isDirty && !isChildDirty && !isChildLayerDirty && !forceRender) {
            if (stats) {
                if (name) {
                    debug?.({ name, result: 'skipping', renderCtx, counts: nodeCount(this), group: this });
                }
                if (layer) {
                    stats.layersSkipped++;
                    stats.nodesSkipped += nodeCount(this).count;
                }
            }
            this.markClean({ recursive: false });
            return; // Nothing to do.
        }

        const groupVisible = this.visible;
        if (layer) {
            const canvasCtxTransform = ctx.getTransform();

            // Switch context to the canvas layer we use for this group.
            ctx = layer.context;
            ctx.save();
            ctx.setTransform(layer.pixelRatio, 0, 0, layer.pixelRatio, 0, 0);

            if (forceRender !== 'dirtyTransform') {
                forceRender = isChildDirty || dirtyZIndex;
            }
            if (forceRender) {
                layer.clear();
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

            ctx.setTransform(canvasCtxTransform);
        } else {
            // Only apply opacity if this isn't a distinct layer - opacity will be applied
            // at composition time.
            ctx.globalAlpha *= this.opacity;
        }

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
        super.render(renderCtx);

        if (clipRect) {
            ctx.restore();
        }

        // Mark virtual nodes as clean and their virtual children.
        // All other nodes have already been visited and marked clean.
        for (const child of this.virtualChildren()) {
            child.markClean({ recursive: 'virtual' });
        }

        if (layer) {
            if (stats) stats.layersRendered++;
            ctx.restore();

            if (forceRender) layer.snapshot();

            // Check for save/restore depth of zero!
            layer.context.verifyDepthZero?.();
        }

        if (name && stats) {
            debug?.({ name, result: 'rendered', skipped, renderCtx, counts: nodeCount(this), group: this });
        }
    }

    private sortChildren(children: Node[]) {
        this.dirtyZIndex = false;
        children.sort(Group.compareChildren);
    }

    setClipRect(bbox?: BBox) {
        this.clipRect = bbox;
    }

    /**
     * Transforms bbox given in the canvas coordinate space to bbox in this group's coordinate space and
     * sets this group's clipRect to the transformed bbox.
     * @param bbox clipRect bbox in the canvas coordinate space.
     */
    setClipRectInGroupCoordinateSpace(bbox?: BBox) {
        this.clipRect = bbox ? Transformable.fromCanvas(this, bbox) : undefined;
    }
}

export class ScalableGroup extends Scalable(Group) {}
export class RotatableGroup extends Rotatable(Group) {}
export class TranslatableGroup extends Translatable(Group) {}
export class TransformableGroup extends Rotatable(Translatable(Group)) {}
