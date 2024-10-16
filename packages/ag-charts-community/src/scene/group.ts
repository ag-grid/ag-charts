import { ascendingStringNumberUndefined, compoundAscending } from '../util/compare';
import { clamp } from '../util/number';
import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import { nodeCount } from './debug.util';
import type { LayersManager } from './layersManager';
import type { ChildNodeCounts, RenderContext } from './node';
import { Node, SceneChangeDetection } from './node';
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

    private static compareChildren(a: Node, b: Node) {
        return (
            compareZIndex(a.zIndex, b.zIndex) ||
            compoundAscending([a.serialNumber], [b.serialNumber], ascendingStringNumberUndefined)
        );
    }

    private clipRect?: BBox;

    @SceneChangeDetection({
        convertor: (v: number) => clamp(0, v, 1),
    })
    opacity: number = 1;

    private layer: HdpiCanvas | undefined = undefined;
    renderToOffscreenCanvas: boolean = false;

    constructor(opts?: {
        readonly name?: string;
        readonly zIndex?: ZIndex;
        readonly renderToOffscreenCanvas?: boolean;
    }) {
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

    private isDirty(renderCtx: RenderContext) {
        const { resized } = renderCtx;
        const { dirty, dirtyZIndex } = this;
        const isDirty = dirty || dirtyZIndex || resized;
        if (isDirty) return true;

        for (const child of this.children()) {
            if (child.dirty) return true;
        }

        return false;
    }

    override preRender(): ChildNodeCounts {
        const counts = super.preRender();

        // Correct counts for this group.
        counts.groups += 1;
        counts.nonGroups -= 1;

        if (this.renderToOffscreenCanvas && counts.nonGroups > 0 && this.getVisibility()) {
            this.layer ??= this._layerManager?.addLayer({ name: this.name });
        } else if (this.layer != null) {
            this._layerManager?.removeLayer(this.layer);
            this.layer = undefined;
        }

        return counts;
    }

    override render(renderCtx: RenderContext) {
        if (!this.visible) {
            return super.render(renderCtx);
        }

        const childRenderCtx: RenderContext = { ...renderCtx };

        if (this.layer == null) {
            this.renderInContext(childRenderCtx);
            return;
        }

        const { layer } = this;
        const { ctx } = renderCtx;

        if (this.isDirty(renderCtx)) {
            const transform = ctx.getTransform();
            const { globalAlpha } = ctx;

            const layerCtx = layer.context;
            childRenderCtx.ctx = layerCtx;

            layer.clear();
            layerCtx.save();
            layerCtx.setTransform(transform);
            layerCtx.globalAlpha = globalAlpha;
            this.renderInContext(childRenderCtx);
            layerCtx.restore();
            layerCtx.verifyDepthZero?.(); // Check for save/restore depth of zero!
        } else {
            this.skipRender(childRenderCtx);
        }

        ctx.save();
        ctx.resetTransform();
        layer.drawImage(ctx as any);
        ctx.restore();
    }

    private renderClip(renderCtx: RenderContext, clipRect: BBox) {
        // clipRect is in the group's coordinate space
        const { x, y, width, height } = clipRect;
        const { ctx } = renderCtx;

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        // clipBBox is in the canvas coordinate space,
        // when we hit a layer we apply the new clipping
        // at which point there are no transforms in play
        return Transformable.toCanvas(this, clipRect);
    }

    private skipRender(childRenderCtx: RenderContext) {
        const { stats } = childRenderCtx;

        for (const child of this.children()) {
            // Skip invisible children, but make sure their dirty flag is reset.
            child.markClean();
            if (stats) {
                stats.nodesSkipped += nodeCount(child).count;
            }
        }

        super.render(childRenderCtx); // Calls markClean().
    }

    private renderInContext(childRenderCtx: RenderContext) {
        const { ctx, stats } = childRenderCtx;

        if (this.dirtyZIndex) {
            this.sortChildren(Group.compareChildren);
        }

        ctx.save();

        ctx.globalAlpha *= this.opacity;

        if (this.clipRect != null) {
            childRenderCtx.clipBBox = this.renderClip(childRenderCtx, this.clipRect);
        }

        for (const child of this.children()) {
            // Skip invisible children, but make sure their dirty flag is reset.
            if (!child.visible) {
                child.markClean();
                if (stats) {
                    stats.nodesSkipped += nodeCount(child).count;
                }
                continue;
            }

            // Render marks this node (and children) as clean - no need to explicitly markClean().
            ctx.save();
            child.render(childRenderCtx);
            ctx.restore();
        }

        ctx.restore();

        super.render(childRenderCtx); // Calls markClean().
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
