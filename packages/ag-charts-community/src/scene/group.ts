import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { clamp } from '../util/number';
import { BBox } from './bbox';
import { nodeCount } from './debug.util';
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

    protected clipRect?: BBox;

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

    protected isDirty(renderCtx: RenderContext) {
        const { resized } = renderCtx;
        const { dirty, dirtyZIndex } = this;
        const isDirty = dirty >= RedrawType.MINOR || dirtyZIndex || resized;
        let isChildDirty = isDirty;
        let isChildLayerDirty = false;
        for (const child of this.children()) {
            isChildDirty ||= child.layerManager == null && child.dirty >= RedrawType.TRIVIAL;
            isChildLayerDirty ||= child.layerManager != null && child.dirty >= RedrawType.TRIVIAL;
            if (isChildDirty) break;
        }

        if (this.opts?.name) {
            this._debug?.({ name: this.opts.name, group: this, isDirty, isChildDirty, renderCtx });
        }

        return { isDirty, isChildDirty, isChildLayerDirty };
    }

    protected debugSkip(renderCtx: RenderContext) {
        if (renderCtx.stats && this.opts?.name) {
            this._debug?.({
                name: this.opts.name,
                group: this,
                result: 'skipping',
                counts: nodeCount(this),
                renderCtx,
            });
        }
    }

    override render(renderCtx: RenderContext, skip?: boolean) {
        if (skip) {
            return super.render(renderCtx);
        }

        const { opts: { name } = {}, _debug: debug, dirtyZIndex, clipRect } = this;
        const { isDirty, isChildDirty, isChildLayerDirty } = this.isDirty(renderCtx);
        const { ctx, stats } = renderCtx;

        let { forceRender, clipBBox } = renderCtx;

        if (!isDirty && !isChildDirty && !isChildLayerDirty && !forceRender) {
            this.debugSkip(renderCtx);
            this.markClean({ recursive: false });
            return; // Nothing to do.
        }

        // Only apply opacity if this isn't a distinct layer - opacity will be applied
        // at composition time.
        ctx.globalAlpha *= this.opacity;

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
        const renderCtxChanged = forceRender !== renderCtx.forceRender || clipBBox !== renderCtx.clipBBox;
        this.renderChildren(children, renderCtxChanged ? { ...renderCtx, forceRender, clipBBox } : renderCtx);
        super.render(renderCtx); // Calls markClean().

        if (clipRect) {
            ctx.restore();
        }

        // Mark virtual nodes as clean and their virtual children.
        // All other nodes have already been visited and marked clean.
        for (const child of this.virtualChildren()) {
            child.markClean({ recursive: 'virtual' });
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

    protected renderChildren(children: Iterable<Node>, renderCtx: RenderContext) {
        const { ctx, forceRender, stats } = renderCtx;
        for (const child of children) {
            // Skip invisible children, but make sure their dirty flag is reset.
            if (!child.visible || !this.visible) {
                child.markClean();
                if (stats) {
                    stats.nodesSkipped += nodeCount(child).count;
                }
                continue;
            }

            // Skip children that don't need to be redrawn.
            if (!forceRender && child.dirty === RedrawType.NONE) {
                if (stats) {
                    stats.nodesSkipped += nodeCount(child).count;
                }
                continue;
            }

            // Render marks this node (and children) as clean - no need to explicitly markClean().
            ctx.save();
            child.render(renderCtx);
            ctx.restore();
        }
    }

    protected sortChildren(children: Node[]) {
        this.dirtyZIndex = false;
        children.sort(Group.compareChildren);
    }

    /**
     * Transforms bbox given in the canvas coordinate space to bbox in this group's coordinate space and
     * sets this group's clipRect to the transformed bbox.
     * @param bbox clipRect bbox in the canvas coordinate space.
     * @param useGroupCoordinateSpace keep provided bbox coordinate space.
     */
    setClipRect(bbox?: BBox, useGroupCoordinateSpace = true) {
        if (useGroupCoordinateSpace) {
            this.clipRect = bbox ? Transformable.fromCanvas(this, bbox) : undefined;
        } else {
            this.clipRect = bbox;
        }
    }
}

export class ScalableGroup extends Scalable(Group) {}
export class RotatableGroup extends Rotatable(Group) {}
export class TranslatableGroup extends Translatable(Group) {}
export class TransformableGroup extends Rotatable(Translatable(Group)) {}
