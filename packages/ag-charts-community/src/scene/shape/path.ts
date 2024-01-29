import type { RenderContext } from '../node';
import { RedrawType, SceneChangeDetection } from '../node';
import { Path2D } from '../path2D';
import { Shape } from './shape';

export function ScenePathChangeDetection(opts?: {
    redraw?: RedrawType;
    convertor?: (o: any) => any;
    changeCb?: (t: any) => any;
}) {
    const { redraw = RedrawType.MAJOR, changeCb, convertor } = opts ?? {};

    return SceneChangeDetection({ redraw, type: 'path', convertor, changeCb });
}

export class Path extends Shape {
    static className = 'Path';

    /**
     * Declare a path to retain for later rendering and hit testing
     * using custom Path2D class. Think of it as a TypeScript version
     * of the native Path2D (with some differences) that works in all browsers.
     */
    readonly path = new Path2D();

    private _clipX: number = NaN;
    private _clipY: number = NaN;
    private _clipPath?: Path2D;

    @ScenePathChangeDetection()
    clipMode?: 'normal' | 'punch-out';

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
                this.markDirty(this, RedrawType.MAJOR);
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
        const point = this.transformPoint(x, y);
        return this.path.closedPath && this.path.isPointInPath(point.x, point.y);
    }

    protected isDirtyPath(): boolean {
        // Override point for more expensive dirty checks.
        return false;
    }

    updatePath() {
        // Override point for subclasses.
    }

    override render(renderCtx: RenderContext) {
        const { ctx, forceRender, stats } = renderCtx;

        if (this.dirty === RedrawType.NONE && !forceRender) {
            if (stats) stats.nodesSkipped += this.nodeCount.count;
            return;
        }

        this.computeTransformMatrix();
        this.matrix.toContext(ctx);

        if (this.dirtyPath || this.isDirtyPath()) {
            this.updatePath();
            this.dirtyPath = false;
        }

        if (!isNaN(this._clipX) && !isNaN(this._clipY) && this.clipMode != null) {
            ctx.save();

            // AG-10477 avoid clipping thick lines that run in parellel near the top & bottom edges of the clip rect
            const yOff = this.strokeWidth;
            this._clipPath ??= new Path2D();
            this._clipPath.clear();
            this._clipPath.rect(0, -yOff, this._clipX, this._clipY + yOff + yOff);

            if (this.clipMode === 'normal') {
                // Bound the shape rendered to the clipping path.
                this._clipPath?.draw(ctx);
                ctx.clip();
            }

            if (this._clipX > 0 && this._clipY > 0) {
                this.path.draw(ctx);
                this.fillStroke(ctx);
            }

            if (this.clipMode === 'punch-out') {
                // Bound the shape rendered to the clipping path.
                this._clipPath?.draw(ctx);
                ctx.clip();
                // Fallback values, but practically these should never be used.
                const { x = -10000, y = -10000, width = 20000, height = 20000 } = this.computeBBox() ?? {};
                ctx.clearRect(x, y, width, height);
            }

            ctx.restore();
        } else {
            this.path.draw(ctx);
            this.fillStroke(ctx);
        }

        this.fillShadow?.markClean();
        super.render(renderCtx);
    }
}
