import { clamp, toIterable } from 'ag-charts-core';

import { BBox } from './bbox';
import { HdpiOffscreenCanvas } from './canvas/hdpiOffscreenCanvas';
import type { ChildNodeCounts, IScene, RenderContext } from './node';
import { Node, PointerEvents, SceneChangeDetection } from './node';
import { type CanvasContext, Shape } from './shape/shape';
import { Rotatable, Scalable, Transformable, Translatable } from './transformable';
import { alignBefore } from './util/pixel';
import { type ZIndex, compareZIndex } from './zIndex';

interface OffscreenImageBitmap {
    bitmap: ImageBitmap;
    x: number;
    y: number;
    width: number;
    height: number;
}

let sharedOffscreenCanvas: HdpiOffscreenCanvas | undefined;

export class Group<TDatum = unknown> extends Node<TDatum> {
    static override readonly className: string = 'Group';

    static is(value: unknown): value is Group {
        return value instanceof Group;
    }

    static computeChildrenBBox(nodes: Iterable<Node>, skipInvisible = true) {
        return BBox.merge(Node.extractBBoxes(nodes, skipInvisible));
    }

    private static compareChildren(this: void, a: Node, b: Node) {
        return compareZIndex(a.__zIndex, b.__zIndex) || a.serialNumber - b.serialNumber;
    }

    private readonly childNodes = new Set<Node>();

    public dirty = false;
    private dirtyZIndex: boolean = false;
    private clipRect: BBox | undefined = undefined;

    @SceneChangeDetection({ convertor: (v: number) => clamp(0, v, 1) })
    opacity: number = 1;

    renderToOffscreenCanvas: boolean;
    optimizeForInfrequentRedraws: boolean;

    // Used when renderToOffscreenCanvas: true
    private layer: HdpiOffscreenCanvas | undefined = undefined; // optimizeForInfrequentRedraws: false
    private image: OffscreenImageBitmap | undefined = undefined; // optimizeForInfrequentRedraws: true

    constructor(opts?: {
        readonly name?: string;
        readonly zIndex?: ZIndex;
        readonly renderToOffscreenCanvas?: boolean;
        readonly optimizeForInfrequentRedraws?: boolean;
    }) {
        super(opts);
        this.isContainerNode = true;
        this.renderToOffscreenCanvas = opts?.renderToOffscreenCanvas === true;
        this.optimizeForInfrequentRedraws = opts?.optimizeForInfrequentRedraws === true;
    }

    // We consider a group to be boundless, thus any point belongs to it.
    override containsPoint(_x: number, _y: number): boolean {
        return true;
    }

    protected override computeBBox(): BBox | undefined {
        return Group.computeChildrenBBox(this.children());
    }

    private computeSafeClippingBBox(pixelRatio: number): BBox | undefined {
        const bbox = this.computeBBox();
        if (bbox?.isFinite() !== true) return;

        let strokeWidth = 0;
        const strokeMiterAmount = 4;
        for (const child of this.descendants()) {
            if (child instanceof Shape) {
                strokeWidth = Math.max(strokeWidth, child.strokeWidth);
            }
        }

        // Align bbox to pixels, and pad.
        const padding = Math.max(
            // Account for anti-aliasing artefacts
            1,
            // Account for strokes (incl. miters) - this may not be the best place to include this
            (strokeWidth / 2) * strokeMiterAmount
        );
        const { x: originX, y: originY } = Transformable.toCanvasPoint(this, 0, 0);
        const x = alignBefore(pixelRatio, originX + bbox.x - padding) - originX;
        const y = alignBefore(pixelRatio, originY + bbox.y - padding) - originY;
        const width = Math.ceil(bbox.x + bbox.width - x + padding);
        const height = Math.ceil(bbox.y + bbox.height - y + padding);

        return new BBox(x, y, width, height);
    }

    private prepareSharedCanvas(width: number, height: number, pixelRatio: number) {
        if (sharedOffscreenCanvas?.pixelRatio === pixelRatio) {
            sharedOffscreenCanvas.resize(width, height, pixelRatio);
        } else {
            sharedOffscreenCanvas = new HdpiOffscreenCanvas({ width, height, pixelRatio });
        }

        return sharedOffscreenCanvas;
    }

    override setScene(scene?: IScene) {
        const previousScene = this.scene;
        super.setScene(scene);

        if (this.layer && previousScene && previousScene !== scene) {
            previousScene.layersManager.removeLayer(this.layer);
            this.layer = undefined;
        }

        for (const child of this.children()) {
            child.setScene(scene);
        }
    }

    override markDirty(property?: string): void {
        this.dirty = true;
        super.markDirty(property);
    }

    override markDirtyChildrenOrder(): void {
        super.markDirtyChildrenOrder();
        this.dirtyZIndex = true;
        this.markDirty();
    }

    /**
     * Appends one or more new node instances to this parent.
     * If one needs to:
     * - move a child to the end of the list of children
     * - move a child from one parent to another (including parents in other scenes)
     * one should use the {@link insertBefore} method instead.
     * @param nodes A node or nodes to append.
     */
    append(nodes: Iterable<Node> | Node) {
        for (const node of toIterable(nodes)) {
            node.remove();
            this.childNodes.add(node);

            node.parentNode = this;
            node.setScene(this.scene);
        }

        this.markDirtyChildrenOrder();
        this.markDirty();
    }

    appendChild<T extends Node>(node: T): T {
        this.append(node);
        return node;
    }

    override removeChild(node: Node) {
        if (!this.childNodes?.delete(node)) {
            throw new Error(
                `AG Charts - internal error, unknown child node ${node.name ?? node.id} in $${this.name ?? this.id}`
            );
        }

        node.parentNode = undefined;
        node.setScene();

        this.markDirtyChildrenOrder();
        this.markDirty();
    }

    clear() {
        for (const child of this.children()) {
            delete child.parentNode;
            child.setScene();
        }
        this.childNodes?.clear();
        this.markDirty();
    }

    /**
     * Hit testing method.
     * Recursively checks if the given point is inside this node or any of its children.
     * Returns the first matching node or `undefined`.
     * Nodes that render later (show on top) are hit tested first.
     */
    override pickNode(x: number, y: number): Node | undefined {
        if (!this.visible || this.pointerEvents === PointerEvents.None || !this.containsPoint(x, y)) {
            return;
        }

        if (this.childNodes != null && this.childNodes.size !== 0) {
            const children = [...this.children()];
            // Nodes added later should be hit-tested first,
            // as they are rendered on top of the previously added nodes.
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                const hit = child.pickNode(x, y);
                if (hit != null) {
                    return hit;
                }
            }
        } else if (!this.isContainerNode) {
            // a leaf node, but not a container leaf
            return this;
        }
    }

    override pickNodes(x: number, y: number, into: Node[] = []): Node[] {
        if (!this.visible || this.pointerEvents === PointerEvents.None || !this.containsPoint(x, y)) {
            return into;
        }

        if (!this.isContainerNode) {
            into.push(this);
        }

        for (const child of this.children()) {
            child.pickNodes(x, y, into);
        }

        return into;
    }

    private _lastWidth = Number.NaN;
    private _lastHeight = Number.NaN;
    private _lastDevicePixelRatio = Number.NaN;
    private isDirty(renderCtx: RenderContext) {
        const { width, height, devicePixelRatio } = renderCtx;
        const { dirty, layer } = this;
        const layerResized = layer != null && (this._lastWidth !== width || this._lastHeight !== height);
        const pixelRatioChanged = this._lastDevicePixelRatio !== devicePixelRatio;
        this._lastWidth = width;
        this._lastHeight = height;
        this._lastDevicePixelRatio = devicePixelRatio;
        return dirty || layerResized || pixelRatioChanged;
    }

    override preRender(renderCtx: RenderContext): ChildNodeCounts {
        let counts: ChildNodeCounts;
        if (this.dirty) {
            counts = super.preRender(renderCtx, 0);

            for (const child of this.children()) {
                const childCounts = child.preRender(renderCtx);
                counts.groups += childCounts.groups;
                counts.nonGroups += childCounts.nonGroups;
                counts.complexity += childCounts.complexity;
            }

            // Correct counts for this group.
            counts.groups += 1;
            counts.nonGroups -= 1;
        } else {
            counts = this.childNodeCounts;
        }

        if (
            this.renderToOffscreenCanvas &&
            !this.optimizeForInfrequentRedraws &&
            counts.nonGroups > 0 &&
            this.getVisibility()
        ) {
            this.layer ??= this.layerManager?.addLayer({ name: this.name });
        } else if (this.layer != null) {
            this.layerManager?.removeLayer(this.layer);
            this.layer = undefined;
        }

        return counts;
    }

    override render(renderCtx: RenderContext) {
        const { layer, renderToOffscreenCanvas } = this;
        const childRenderCtx: RenderContext = { ...renderCtx };

        const dirty = this.isDirty(renderCtx);
        this.dirty = false;

        if (!renderToOffscreenCanvas) {
            this.renderInContext(childRenderCtx);
            super.render(childRenderCtx); // Calls markClean().
            return;
        }

        const { ctx, stats, devicePixelRatio: pixelRatio } = renderCtx;

        let { image } = this;
        if (dirty) {
            image?.bitmap.close();
            image = undefined;

            const bbox = layer ? undefined : this.computeSafeClippingBBox(pixelRatio);

            const renderOffscreen = (
                offscreenCanvas: HdpiOffscreenCanvas,
                ...transform: [DOMMatrix] | [number, number, number, number, number, number]
            ) => {
                const offscreenCtx = offscreenCanvas.context;
                childRenderCtx.ctx = offscreenCtx;

                offscreenCanvas.clear();
                offscreenCtx.save();
                try {
                    offscreenCtx.setTransform(...(transform as any[]));
                    offscreenCtx.globalAlpha = 1;
                    this.renderInContext(childRenderCtx);
                } finally {
                    offscreenCtx.restore();
                    offscreenCtx.verifyDepthZero?.(); // Check for save/restore depth of zero!
                }
            };

            if (layer) {
                renderOffscreen(layer, ctx.getTransform());
            } else if (bbox) {
                const { x, y, width, height } = bbox;

                // Canvas dimensions are floored, so skip if scaled dimensions would be < 1px
                const scaledWidth = Math.floor(width * pixelRatio);
                const scaledHeight = Math.floor(height * pixelRatio);

                if (scaledWidth > 0 && scaledHeight > 0) {
                    const canvas = this.prepareSharedCanvas(width, height, pixelRatio);
                    renderOffscreen(canvas, pixelRatio, 0, 0, pixelRatio, -x * pixelRatio, -y * pixelRatio);

                    image = { bitmap: canvas.transferToImageBitmap(), x, y, width, height };
                }
            }

            this.image = image;

            if (stats) stats.layersRendered++;
        } else if (stats) {
            stats.layersSkipped++;
        }

        const { globalAlpha } = ctx;
        ctx.globalAlpha = globalAlpha * this.opacity;
        if (layer) {
            ctx.save();
            try {
                ctx.resetTransform();
                layer.drawImage(ctx as any);
            } finally {
                ctx.restore();
            }
        } else if (image) {
            const { bitmap, x, y, width, height } = image;
            ctx.drawImage(bitmap, 0, 0, width * pixelRatio, height * pixelRatio, x, y, width, height);
        }
        ctx.globalAlpha = globalAlpha;

        super.render(childRenderCtx); // Calls markClean().
    }

    protected applyClip(ctx: CanvasContext, clipRect: BBox) {
        const { x, y, width, height } = clipRect;

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
    }

    protected renderInContext(childRenderCtx: RenderContext) {
        const { ctx, stats } = childRenderCtx;

        if (this.dirtyZIndex) {
            this.sortChildren(Group.compareChildren);
            this.dirtyZIndex = false;
        }

        ctx.save();

        try {
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
                    if (stats) {
                        stats.nodesSkipped += child.childNodeCounts.nonGroups + child.childNodeCounts.groups;
                        stats.opsSkipped += child.childNodeCounts.complexity;
                    }
                    continue;
                }

                // Render marks this node (and children) as clean - no need to explicitly markClean().
                child.isolatedRender(childRenderCtx);
            }
        } finally {
            ctx.restore();
        }
    }

    private sortChildren(compareFn?: (a: Node, b: Node) => number) {
        if (!this.childNodes) return;

        // Sort children, and re-add in new order (Set preserves insertion order).
        const sortedChildren = [...this.childNodes].sort(compareFn);
        this.childNodes.clear();
        for (const child of sortedChildren) {
            this.childNodes.add(child);
        }
    }

    *children(): Generator<Node, void, undefined> {
        yield* this.childNodes;
    }

    *excludeChildren(exclude: { instance?: any; name?: string }) {
        for (const child of this.children()) {
            if (
                (exclude.instance && !(child instanceof exclude.instance)) ||
                (exclude.name && child.name !== exclude.name)
            ) {
                yield child;
            }
        }
    }

    *descendants(): Generator<Node, void, undefined> {
        for (const child of this.children()) {
            yield child;
            if (child instanceof Group) {
                yield* child.descendants();
            }
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
