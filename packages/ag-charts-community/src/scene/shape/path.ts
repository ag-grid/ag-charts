import type { DistantObject, Logger, SerializedNodeState, SerializedPathProps } from 'ag-charts-core';
import { SceneChangeDetection, createSvgElement } from 'ag-charts-core';

import type { BBox } from '../bbox';
import { ExtendedPath2D } from '../extendedPath2D';
import type { ChildNodeCounts, RenderContext } from '../node';
import { Shape } from './shape';

export class Path<D = unknown> extends Shape<D> implements DistantObject {
    static override readonly className: string = 'Path';

    /**
     * Declare a path to retain for later rendering and hit testing
     * using custom Path2D class. Think of it as a TypeScript version
     * of the native Path2D (with some differences) that works in all browsers.
     *
     * Lazily allocated so subclasses that author their geometry elsewhere (e.g. `Marker`, which
     * shares an origin-centred path via the marker path cache) do not pay the per-instance
     * `ExtendedPath2D` allocation when `this.path` is never read.
     */
    private _path?: ExtendedPath2D;
    get path(): ExtendedPath2D {
        this._path ??= new ExtendedPath2D();
        return this._path;
    }
    set path(value: ExtendedPath2D) {
        this._path = value;
    }

    protected _clipX: number = Number.NaN;
    protected _clipY: number = Number.NaN;
    protected _clipPath?: ExtendedPath2D;

    @SceneChangeDetection()
    clip: boolean = false;

    @SceneChangeDetection()
    set clipX(value: number) {
        this._clipX = value;
        this.dirtyPath = true;
    }

    @SceneChangeDetection()
    set clipY(value: number) {
        this._clipY = value;
        this.dirtyPath = true;
    }

    /** Serialised-state discriminator for subclasses (e.g. `Marker`) that share the path property set. */
    protected get serializedType(): 'path' | 'marker' {
        return 'path';
    }

    override serialize(): SerializedNodeState {
        return { type: this.serializedType, props: this.serializeProps(), svgPath: this.serializeSvgPath() };
    }

    protected override serializeProps(): SerializedPathProps {
        const bbox: BBox | undefined = this.getBBox();
        return {
            ...super.serializeProps(),
            x: bbox?.x ?? Number.NaN,
            y: bbox?.y ?? Number.NaN,
            width: bbox?.width ?? Number.NaN,
            height: bbox?.height ?? Number.NaN,
            clip: this.clip,
            clipX: this._clipX,
            clipY: this._clipY,
        };
    }

    /**
     * The drawn path in SVG form, read from `_path` directly: serialisation must reflect the path as
     * last drawn, without forcing lazy allocation (Marker) or a premature updatePath.
     */
    protected serializeSvgPath(): string | undefined {
        return this._path?.toSVG();
    }

    /**
     * The path only has to be updated when certain attributes change.
     * For example, if transform attributes (such as `translationX`)
     * are changed, we don't have to update the path. The `dirtyPath` flag
     * is how we keep track if the path has to be updated or not.
     */
    private _dirtyPath = true;
    set dirtyPath(value: boolean) {
        if (this._dirtyPath !== value) {
            this._dirtyPath = value;
            if (value) {
                this.markDirty('path');
            }
        }
    }
    get dirtyPath(): boolean {
        return this._dirtyPath;
    }

    checkPathDirty() {
        if (this._dirtyPath) {
            return;
        }

        this.dirtyPath =
            this.path.isDirty() || (this.fillShadow?.isDirty() ?? false) || (this._clipPath?.isDirty() ?? false);
    }

    resetPathDirty() {
        this.path.clear(true);
        this._dirtyPath = false;
    }

    isPathDirty() {
        return this.path.isDirty();
    }

    override onChangeDetection(property: string): void {
        // Always invalidate the cached bbox — a late position update (e.g. realign()) after
        // the layout pass would otherwise return stale values to image-fill pattern transforms.
        this._dirtyPath = true;
        super.onChangeDetection(property);
    }

    protected override computeBBox(): BBox | undefined {
        this.updatePathIfDirty();
        return this.path.computeBBox();
    }

    isPointInPath(x: number, y: number): boolean {
        this.updatePathIfDirty();
        return this.path.closedPath && this.path.isPointInPath(x, y);
    }

    override distanceSquared(x: number, y: number): number {
        return this.distanceSquaredTransformedPoint(x, y);
    }

    svgPathData(transform?: (x: number, y: number) => { x: number; y: number }): string {
        this.updatePathIfDirty();
        return this.path.toSVG(transform);
    }

    protected distanceSquaredTransformedPoint(x: number, y: number): number {
        this.updatePathIfDirty();
        if (this.path.closedPath && this.path.isPointInPath(x, y)) {
            return 0;
        }
        return this.path.distanceSquared(x, y);
    }

    protected isDirtyPath(): boolean {
        // Override point for more expensive dirty checks.
        return false;
    }

    updatePath() {
        // Override point for subclasses.
    }

    protected updatePathIfDirty() {
        if (this.dirtyPath || this.isDirtyPath()) {
            this.updatePath();
            this.dirtyPath = false;
        }
    }

    private lastPixelRatio = Number.NaN;
    override preRender(renderCtx: RenderContext): ChildNodeCounts {
        if (renderCtx.devicePixelRatio !== this.lastPixelRatio) {
            // Pixel-aligned paths must be rebuilt; invalidate unconditionally rather than opt-in,
            // since only a cross-monitor drag changes the ratio without also resizing the chart.
            this.dirtyPath = true;
        }
        this.lastPixelRatio = renderCtx.devicePixelRatio;
        this.updatePathIfDirty();
        return super.preRender(renderCtx, this.pathComplexity());
    }

    /**
     * Per-render complexity hint for {@link preRender}. Subclasses with externally-managed path
     * geometry (e.g. `Marker`, which uses a shared origin-centred path from a cache) override
     * this to avoid forcing `this.path` to lazy-allocate on every render.
     */
    protected pathComplexity(): number {
        return this.path.commands.length;
    }

    override render(renderCtx: RenderContext) {
        const { ctx } = renderCtx;

        if (this.clip && !Number.isNaN(this._clipX) && !Number.isNaN(this._clipY)) {
            ctx.save();

            try {
                // Avoid clipping thick lines that touch the top, bottom and left edges of the clip rect
                const margin = this.strokeWidth / 2;
                this._clipPath ??= new ExtendedPath2D();
                this._clipPath.clear();
                this._clipPath.rect(-margin, -margin, this._clipX + margin, this._clipY + margin + margin);

                // Bound the shape rendered to the clipping path.
                ctx.clip(this._clipPath?.getPath2D());

                if (this._clipX > 0 && this._clipY > 0) {
                    this.drawPath(ctx, renderCtx.logger);
                }
            } finally {
                ctx.restore();
            }
        } else {
            this._clipPath = undefined;

            this.drawPath(ctx, renderCtx.logger);
        }

        this.fillShadow?.markClean();
        super.render(renderCtx);
    }

    drawPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, logger: Logger): void {
        this.fillStroke(ctx, logger, this.path.getPath2D());
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible) return;

        const element = createSvgElement('path');

        element.setAttribute('d', this.svgPathData());
        const defs = this.applySvgFillAttributes(element, []);
        this.applySvgStrokeAttributes(element);

        return {
            elements: [element],
            defs,
        };
    }
}
