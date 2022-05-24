import { Shape } from "./shape";
import { Path2D } from "../path2D";
import { RedrawType, SceneChangeDetection, RenderContext } from "../node";

export function ScenePathChangeDetection(opts?: {
    redraw?: RedrawType,
    changeCb?: (t: any) => any,
}) {
    const { redraw = RedrawType.MAJOR, changeCb: optChangeCb } = opts || {};

    const changeCb = (o: any) => {
        if (!o._dirtyPath) {
            o._dirtyPath = true;
            o.markDirty(redraw);
        }
        if (optChangeCb) {
            optChangeCb(o);
        }
    };

    return SceneChangeDetection({ redraw, type: 'path', changeCb });
}

export class Path extends Shape {

    static className = 'Path';

    /**
     * Declare a path to retain for later rendering and hit testing
     * using custom Path2D class. Think of it as a TypeScript version
     * of the native Path2D (with some differences) that works in all browsers.
     */
    readonly path = new Path2D();

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
                this.markDirty(RedrawType.MAJOR);
            }
        }
    }
    get dirtyPath(): boolean {
        return this._dirtyPath;
    }

    /**
     * Path definition in SVG path syntax:
     * https://www.w3.org/TR/SVG11/paths.html#DAttribute
     */
    private _svgPath: string = '';
    set svgPath(value: string) {
        if (this._svgPath !== value) {
            this._svgPath = value;
            this.path.setFromString(value);
            this.markDirty(RedrawType.MAJOR);
        }
    }
    get svgPath(): string {
        return this._svgPath;
    }

    isPointInPath(x: number, y: number): boolean {
        const point = this.transformPoint(x, y);
        return this.path.closedPath && this.path.isPointInPath(point.x, point.y);
    }

    isPointInStroke(_x: number, _y: number): boolean {
        return false;
    }

    /** Override point for more expensive dirty checks. */
    protected isDirtyPath() {}
    protected updatePath() {}

    render(renderCtx: RenderContext) {
        let { ctx, forceRender, stats } = renderCtx;

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
        this.path.draw(ctx);

        this.fillStroke(ctx);

        super.render(renderCtx);
    }
}
