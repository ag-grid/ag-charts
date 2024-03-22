import type { RenderContext } from '../node';
import { RedrawType, SceneChangeDetection } from '../node';
import { Path2D } from '../path2D';
import { Shape } from './shape';

export class BatchPath<DatumType> extends Shape {
    static readonly className: string = 'BatchPath';

    private _clipX: number = NaN;
    private _clipY: number = NaN;
    private _clipPath?: Path2D;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    clipMode?: 'normal' | 'punch-out';

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    set clipX(value: number) {
        this._clipX = value;
        this.dirtyPath = true;
    }

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
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

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    datums: DatumType[] = [];

    public constructor(private readonly pathFn: (datum: DatumType, ctx: CanvasRenderingContext2D) => void) {
        super();
    }

    isPointInPath(_x: number, _y: number): boolean {
        return false;
    }

    override render(renderCtx: RenderContext) {
        const { ctx, forceRender, stats } = renderCtx;

        if (this.dirty === RedrawType.NONE && !forceRender) {
            if (stats) stats.nodesSkipped += this.nodeCount.count;
            return;
        }

        this.computeTransformMatrix();
        this.matrix.toContext(ctx);

        if (!isNaN(this._clipX) && !isNaN(this._clipY) && this.clipMode != null) {
            ctx.save();

            // AG-10477 avoid clipping thick lines that touch the top, bottom and left edges of the clip rect
            const margin = this.strokeWidth / 2;
            this._clipPath ??= new Path2D();
            this._clipPath.clear();
            this._clipPath.rect(-margin, -margin, this._clipX + margin, this._clipY + margin + margin);

            if (this.clipMode === 'normal') {
                // Bound the shape rendered to the clipping path.
                this._clipPath?.draw(ctx);
                ctx.clip();
            }

            if (this._clipX > 0 && this._clipY > 0) {
                this.drawPath(ctx);
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
            this.drawPath(ctx);
        }

        this.fillShadow?.markClean();
        super.render(renderCtx);
    }

    protected drawPath(ctx: RenderContext['ctx']) {
        for (const datum of this.datums) {
            this.pathFn(datum, ctx);
        }
        this.fillStroke(ctx);
    }
}
