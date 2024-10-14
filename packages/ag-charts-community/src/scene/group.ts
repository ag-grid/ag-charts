import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { clamp } from '../util/number';
import { BBox } from './bbox';
import { nodeCount } from './debug.util';
import type { ChildNodeCounts, RenderContext } from './node';
import { Node, RedrawType, SceneChangeDetection } from './node';
import { Rotatable, Scalable, Transformable, Translatable } from './transformable';
import { type ZIndex, compareZIndex } from './zIndex';

export class Group extends Node {
    static className = 'Group';

    static is(value: unknown): value is Group {
        return value instanceof Group;
    }

    static computeChildrenBBox(nodes: Iterable<Node>, skipInvisible = true) {
        return BBox.merge(Node.extractBBoxes(nodes, skipInvisible));
    }

    protected static compareChildren(a: Node, b: Node) {
        return (
            compareZIndex(a.zIndex, b.zIndex) ||
            compoundAscending([a.serialNumber], [b.serialNumber], ascendingStringNumberUndefined)
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
            readonly zIndex?: ZIndex;
            readonly layer?: boolean; // TODO remove
        }
    ) {
        super(opts);
        this.isContainerNode = true;
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

        const { opts: { name } = {}, _debug: debug } = this;
        const { isDirty, isChildDirty, isChildLayerDirty } = this.isDirty(renderCtx);
        const { ctx, stats } = renderCtx;
        let { forceRender } = renderCtx;

        if (!isDirty && !isChildDirty && !isChildLayerDirty && !forceRender) {
            this.debugSkip(renderCtx);
            this.markClean({ recursive: false });
            return; // Nothing to do.
        }

        if (forceRender !== 'dirtyTransform') {
            forceRender ||= this.dirtyZIndex;
        }

        ctx.globalAlpha *= this.opacity;

        if (this.dirtyZIndex) {
            this.sortChildren(Group.compareChildren);
        }
        const children = this.sortedChildren();
        const clipBBox = this.renderClip(renderCtx) ?? renderCtx.clipBBox;
        const renderCtxChanged = forceRender !== renderCtx.forceRender || clipBBox !== renderCtx.clipBBox;

        this.renderChildren(children, renderCtxChanged ? { ...renderCtx, forceRender, clipBBox } : renderCtx);
        super.render(renderCtx); // Calls markClean().

        if (this.clipRect) {
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

    protected sortedChildren() {
        let children: Iterable<Node> = this.children();
        if (this.hasVirtualChildren()) {
            children = [...children].sort(Group.compareChildren);
        }
        return children;
    }

    protected renderClip(renderCtx: RenderContext) {
        if (!this.clipRect) return;

        // clipRect is in the group's coordinate space
        const { x, y, width, height } = this.clipRect;
        const { ctx } = renderCtx;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        this._debug?.(() => ({
            name: this.opts?.name,
            clipRect: this.clipRect,
            ctxTransform: ctx.getTransform(),
            renderCtx,
            group: this,
        }));

        // clipBBox is in the canvas coordinate space,
        // when we hit a layer we apply the new clipping
        // at which point there are no transforms in play
        return Transformable.toCanvas(this, this.clipRect);
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

    /**
     * Transforms bbox given in the canvas coordinate space to bbox in this group's coordinate space and
     * sets this group's clipRect to the transformed bbox.
     * @param bbox clipRect bbox in the canvas coordinate space.
     * @param transformToGroupSpace set false to keep provided bbox coordinate space.
     */
    setClipRect(bbox?: BBox, transformToGroupSpace = true) {
        if (transformToGroupSpace) {
            this.clipRect = bbox ? Transformable.fromCanvas(this, bbox) : undefined;
        } else {
            this.clipRect = bbox;
        }
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible) return;

        const defs: SVGElement[] = [];
        const elements: SVGElement[] = [];

        for (const child of this.sortedChildren()) {
            const svg = child.toSVG();
            if (svg != null) {
                elements.push(...svg.elements);

                if (svg.defs != null) {
                    defs.push(...svg.defs);
                }
            }
        }

        return { elements, defs };
    }
}

export class ScalableGroup extends Scalable(Group) {}
export class RotatableGroup extends Rotatable(Group) {}
export class TranslatableGroup extends Translatable(Group) {}
export class TransformableGroup extends Rotatable(Translatable(Group)) {}
