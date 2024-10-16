import type { DistantObject } from '../../util/nearest';
import { ExtendedPath2D } from '../extendedPath2D';
import type { ChildNodeCounts, RenderContext } from '../node';
import { SceneChangeDetection } from '../node';
import { Shape } from './shape';

export function ScenePathChangeDetection(opts?: { convertor?: (o: any) => any; changeCb?: (t: any) => any }) {
    const { changeCb, convertor } = opts ?? {};

    return SceneChangeDetection({ type: 'path', convertor, changeCb });
}

export class Path extends Shape implements DistantObject {
    static readonly className: string = 'Path';

    /**
     * Declare a path to retain for later rendering and hit testing
     * using custom Path2D class. Think of it as a TypeScript version
     * of the native Path2D (with some differences) that works in all browsers.
     */
    readonly path = new ExtendedPath2D();

    private _clipX: number = NaN;
    private _clipY: number = NaN;
    private _clipPath?: ExtendedPath2D;

    @ScenePathChangeDetection()
    clip: boolean = false;

    @ScenePathChangeDetection()
    set clipX(value: number) {
        this._clipX = value;
        this.dirtyPath = true;
    }

    @ScenePathChangeDetection()
    set clipY(value: number) {
        this._clipY = value;
        this.dirtyPath = true;
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
                this.markDirty();
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

    isPointInPath(x: number, y: number): boolean {
        this.updatePathIfDirty();
        return this.path.closedPath && this.path.isPointInPath(x, y);
    }

    distanceSquared(x: number, y: number): number {
        return this.distanceSquaredTransformedPoint(x, y);
    }

    svgPathData(transform?: (x: number, y: number) => { x: number; y: number }): string {
        if (this.dirtyPath) {
            this.updatePath();
            this.dirtyPath = false;
        }
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

    private updatePathIfDirty() {
        if (this.dirtyPath || this.isDirtyPath()) {
            this.updatePath();
            this.dirtyPath = false;
        }
    }

    override preRender(): ChildNodeCounts {
        this.updatePathIfDirty();
        return super.preRender();
    }

    override render(renderCtx: RenderContext) {
        const { ctx } = renderCtx;

        if (this.clip && !isNaN(this._clipX) && !isNaN(this._clipY)) {
            ctx.save();

            // AG-10477 avoid clipping thick lines that touch the top, bottom and left edges of the clip rect
            const margin = this.strokeWidth / 2;
            this._clipPath ??= new ExtendedPath2D();
            this._clipPath.clear();
            this._clipPath.rect(-margin, -margin, this._clipX + margin, this._clipY + margin + margin);

            // Bound the shape rendered to the clipping path.
            ctx.clip(this._clipPath?.getPath2D());

            if (this._clipX > 0 && this._clipY > 0) {
                this.drawPath(ctx);
            }

            ctx.restore();
        } else {
            this._clipPath = undefined;

            this.drawPath(ctx);
        }

        this.fillShadow?.markClean();
        super.render(renderCtx);
    }

    protected drawPath(ctx: any) {
        this.fillStroke(ctx, this.path.getPath2D());
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible) return;

        const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        element.setAttribute('d', this.svgPathData());
        element.setAttribute('fill', typeof this.fill === 'string' ? this.fill : 'none');
        element.setAttribute('fill-opacity', String(this.fillOpacity));
        if (this.stroke != null) {
            element.setAttribute('stroke', this.stroke);
            element.setAttribute('stroke-opacity', String(this.strokeOpacity));
            element.setAttribute('stroke-width', String(this.strokeWidth));
        }

        return {
            elements: [element],
        };
    }
}
