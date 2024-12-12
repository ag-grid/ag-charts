import { ascendingStringNumberUndefined } from '../util/compare';
import { clamp } from '../util/number';
import { BBox } from './bbox';
import { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';
import type { LayersManager } from './layersManager';
import type { ChildNodeCounts, RenderContext } from './node';
import { Node, SceneChangeDetection } from './node';
import type { CanvasContext } from './shape/shape';
import { Rotatable, Scalable, Transformable, Translatable } from './transformable';
import { type ZIndex, compareZIndex } from './zIndex';

interface OffscreenImageBitmap {
    bitmap: ImageBitmap;
    x: number;
    y: number;
    width: number;
    height: number;
}

let sharedOffscreenCanvas: HdpiOffscreenCanvas | undefined;

export class Group extends Node {
    static className = 'Group';

    static is(value: unknown): value is Group {
        return value instanceof Group;
    }

    static computeChildrenBBox(nodes: Iterable<Node>, skipInvisible = true) {
        return BBox.merge(Node.extractBBoxes(nodes, skipInvisible));
    }

    private static compareChildren(this: void, a: Node, b: Node) {
        return compareZIndex(a.zIndex, b.zIndex) || ascendingStringNumberUndefined(a.serialNumber, b.serialNumber);
    }

    private clipRect?: BBox;

    @SceneChangeDetection({ convertor: (v: number) => clamp(0, v, 1) })
    opacity: number = 1;

    renderToOffscreenCanvas: boolean = false;
    optimizeForInfrequentRedraws: boolean = false;

    // Used when renderToOffscreenCanvas: true
    private layer: HdpiOffscreenCanvas | undefined = undefined; // optimizeForInfrequentRedraws: false
    private image: OffscreenImageBitmap | undefined = undefined; // optimizeForInfrequentRedraws: true

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
        if (dirty || dirtyZIndex || resized) return true;

        for (const child of this.children()) {
            if (child.dirty) return true;
        }

        return false;
    }

    override preRender(): ChildNodeCounts {
        const counts = super.preRender(0);

        // Correct counts for this group.
        counts.groups += 1;
        counts.nonGroups -= 1;

        if (
            this.renderToOffscreenCanvas &&
            !this.optimizeForInfrequentRedraws &&
            counts.nonGroups > 0 &&
            this.getVisibility()
        ) {
            this.layer ??= this._layerManager?.addLayer({ name: this.name });
        } else if (this.layer != null) {
            this._layerManager?.removeLayer(this.layer);
            this.layer = undefined;
        }

        return counts;
    }

    override render(renderCtx: RenderContext) {
        const { layer, renderToOffscreenCanvas } = this;
        const childRenderCtx: RenderContext = { ...renderCtx };

        if (!renderToOffscreenCanvas) {
            this.renderInContext(childRenderCtx);
            super.render(childRenderCtx); // Calls markClean().
            return;
        }

        const { ctx, stats, devicePixelRatio: pixelRatio } = renderCtx;

        let { image } = this;
        if (this.isDirty(renderCtx)) {
            image?.bitmap.close();
            image = undefined;

            const bbox = layer ? BBox.NaN : this.computeBBox();

            const renderOffscreen = (
                offscreenCtx: OffscreenCanvasRenderingContext2D,
                ...transform: [DOMMatrix] | [number, number, number, number, number, number]
            ) => {
                childRenderCtx.ctx = offscreenCtx;
                offscreenCtx.save();
                offscreenCtx.setTransform(...(transform as any[]));
                offscreenCtx.globalAlpha = 1;
                this.renderInContext(childRenderCtx);
                offscreenCtx.restore();
                (offscreenCtx as any).verifyDepthZero?.(); // Check for save/restore depth of zero!
            };

            if (layer) {
                layer.clear();
                renderOffscreen(layer.context, ctx.getTransform());
            } else if (bbox.isFinite()) {
                // Align bbox to pixels, and pad by 1 pixel for anti-aliasing artefacts.
                const x = Math.floor(bbox.x) - 1;
                const y = Math.floor(bbox.y) - 1;
                const width = Math.ceil(bbox.x + bbox.width) - x + 1;
                const height = Math.ceil(bbox.y + bbox.height) - y + 1;

                if (sharedOffscreenCanvas == null || sharedOffscreenCanvas.pixelRatio !== pixelRatio) {
                    sharedOffscreenCanvas = new HdpiOffscreenCanvas({ width, height, pixelRatio });
                } else {
                    sharedOffscreenCanvas.clear();
                    sharedOffscreenCanvas.resize(width, height);
                }

                renderOffscreen(
                    sharedOffscreenCanvas.context,
                    pixelRatio,
                    0,
                    0,
                    pixelRatio,
                    -x * pixelRatio,
                    -y * pixelRatio
                );

                image = { bitmap: sharedOffscreenCanvas.imageBitmap(), x, y, width, height };
            }

            this.image = image;

            if (stats) stats.layersRendered++;
        } else {
            this.skipRender(childRenderCtx);

            if (stats) stats.layersSkipped++;
        }

        const { globalAlpha } = ctx;
        ctx.globalAlpha = globalAlpha * this.opacity;
        if (layer) {
            ctx.save();
            ctx.resetTransform();
            layer.drawImage(ctx as any);
            ctx.restore();
        } else if (image) {
            const { bitmap, x, y, width, height } = image;
            ctx.drawImage(bitmap, 0, 0, width * pixelRatio, height * pixelRatio, x, y, width, height);
        }
        ctx.globalAlpha = globalAlpha;

        super.render(childRenderCtx); // Calls markClean().
    }

    private skipRender(childRenderCtx: RenderContext) {
        const { stats } = childRenderCtx;

        for (const child of this.children()) {
            // Skip invisible children, but make sure their dirty flag is reset.
            child.markClean();
            if (stats) {
                stats.nodesSkipped += this.childNodeCounts.groups + this.childNodeCounts.nonGroups;
                stats.opsSkipped += this.childNodeCounts.complexity;
            }
        }
    }

    protected applyClip(ctx: CanvasContext, clipRect: BBox) {
        const { x, y, width, height } = clipRect;

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
    }

    private renderInContext(childRenderCtx: RenderContext) {
        const { ctx, stats } = childRenderCtx;

        if (this.dirtyZIndex) {
            this.sortChildren(Group.compareChildren);
        }

        ctx.save();

        ctx.globalAlpha *= this.opacity;

        if (this.clipRect != null) {
            // clipRect is in the group's coordinate space
            this.applyClip(ctx, this.clipRect);

            // clipBBox is in the canvas coordinate space,
            // when we hit a layer we apply the new clipping
            // at which point there are no transforms in play
            childRenderCtx.clipBBox = Transformable.toCanvas(this, this.clipRect);
        }

        for (const child of this.children()) {
            // Skip invisible children, but make sure their dirty flag is reset.
            if (!child.visible) {
                child.markClean();
                if (stats) {
                    stats.nodesSkipped += child.childNodeCounts.nonGroups + child.childNodeCounts.groups;
                    stats.opsSkipped += child.childNodeCounts.complexity;
                }
                continue;
            }

            // Render marks this node (and children) as clean - no need to explicitly markClean().
            ctx.save();
            child.render(childRenderCtx);
            ctx.restore();
        }

        ctx.restore();
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
