import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { clamp } from '../util/number';
import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import { nodeCount } from './debug.util';
import type { LayersManager } from './layersManager';
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

    private layer: HdpiCanvas | undefined = undefined;
    renderToOffscreenCanvas: boolean = false;

    constructor(
        protected readonly opts?: {
            readonly name?: string;
            readonly zIndex?: ZIndex;
            readonly renderToOffscreenCanvas?: boolean;
        }
    ) {
        super(opts);
        this.isContainerNode = true;
        this.renderToOffscreenCanvas = opts?.renderToOffscreenCanvas === true;
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

        if (this.renderToOffscreenCanvas && counts.nonGroups > 0) {
            this.layer ??= this._layerManager?.addLayer({
                name: this.name,
                zIndex: this.zIndex,
                getComputedOpacity: () => this.getComputedOpacity(),
                getVisibility: () => this.getVisibility(),
            });
        } else if (!this.renderToOffscreenCanvas && this.layer != null) {
            this._layerManager?.removeLayer(this.layer);
            this.layer = undefined;
        }

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

    private renderOffscreen(renderCtx: RenderContext, layer: HdpiCanvas, forceRender: boolean | 'dirtyTransform') {
        if (forceRender) {
            layer.clear();
        }

        const children = this.children();
        const renderCtxTransform = renderCtx.ctx.getTransform();
        const { context: layerCtx } = layer;

        layerCtx.save();

        layerCtx.setTransform(renderCtxTransform);

        const layerRenderCtx = { ...renderCtx, ctx: layerCtx, forceRender };
        if (this.clipRect != null) {
            layerCtx.save();
            layerRenderCtx.clipBBox = this.renderClip(layerRenderCtx, this.clipRect);
        }

        this.renderChildren(children, layerRenderCtx);

        if (this.clipRect) {
            layerCtx.restore();
        }

        layerCtx.restore();
        layerCtx.verifyDepthZero?.(); // Check for save/restore depth of zero!
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

        if (this.dirtyZIndex) {
            this.sortChildren(Group.compareChildren);
        }

        if (forceRender !== 'dirtyTransform') {
            forceRender ||= this.dirtyZIndex;
        }

        if (this.renderToOffscreenCanvas && this.layer != null) {
            this.markClean({ recursive: false });

            if (forceRender !== 'dirtyTransform') {
                forceRender ||= isChildDirty;
            }

            if (this.getVisibility()) {
                if (isDirty || isChildDirty || isChildLayerDirty || forceRender) {
                    this.renderOffscreen(renderCtx, this.layer, forceRender);
                }

                ctx.save();
                ctx.resetTransform();
                ctx.globalAlpha = this.getComputedOpacity();
                this.layer.drawImage(ctx as any);
                ctx.restore();
            }
        } else {
            ctx.globalAlpha *= this.opacity;

            const children = this.children();

            const childRenderCtx = { ...renderCtx, forceRender };

            if (this.clipRect != null) {
                ctx.save();
                childRenderCtx.clipBBox = this.renderClip(renderCtx, this.clipRect);
            }

            this.renderChildren(children, childRenderCtx);
            super.render(renderCtx); // Calls markClean().

            if (this.clipRect != null) {
                ctx.restore();
            }
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

    protected renderClip(renderCtx: RenderContext, clipRect: BBox) {
        // clipRect is in the group's coordinate space
        const { x, y, width, height } = clipRect;
        const { ctx } = renderCtx;

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        this._debug?.(() => ({
            name: this.opts?.name,
            clipRect: clipRect,
            ctxTransform: ctx.getTransform(),
            renderCtx,
            group: this,
        }));

        // clipBBox is in the canvas coordinate space,
        // when we hit a layer we apply the new clipping
        // at which point there are no transforms in play
        return Transformable.toCanvas(this, clipRect);
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
     */
    setClipRect(bbox?: BBox) {
        this.clipRect = bbox ? Transformable.fromCanvas(this, bbox) : undefined;
    }

    /**
     * Set the clip rect within the canvas coordinate space.
     * @param bbox clipRect bbox in the canvas coordinate space.
     */
    setClipRectCanvasSpace(bbox?: BBox) {
        this.clipRect = bbox;
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

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible) return;

        const defs: SVGElement[] = [];
        const elements: SVGElement[] = [];

        for (const child of this.children()) {
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
