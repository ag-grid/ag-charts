import { ColorScale } from '../../scale/colorScale';
import { BBox } from '../bbox';
import type { RenderContext } from '../node';
import { RedrawType, SceneChangeDetection } from '../node';
import type { Path } from './path';
import { Shape } from './shape';

export class LinearGradientFill extends Shape {
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    direction: 'to-bottom' | 'to-right' = 'to-right';

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    stops?: string[] = undefined;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    mask?: Path = undefined;

    override isPointInPath(x: number, y: number): boolean {
        return this.mask?.isPointInPath(x, y) ?? false;
    }

    override computeBBox(): BBox {
        return this.mask?.computeBBox() ?? BBox.zero;
    }

    override render(renderCtx: RenderContext): void {
        const { mask, stops } = this;
        const { ctx, devicePixelRatio } = renderCtx;

        if (mask == null || stops == null) return;

        const bbox = this.computeBBox();

        ctx.save();

        if (mask.dirtyPath) {
            mask.updatePath();
            mask.dirtyPath = false;
        }

        ctx.beginPath();
        mask.path.draw(ctx);
        ctx.clip();

        const x0 = bbox.x;
        const x1 = bbox.x + bbox.width;
        const y0 = bbox.y;
        const y1 = bbox.y + bbox.height;

        const colorScale = new ColorScale();
        const [i0, i1] = this.direction === 'to-right' ? [x0, x1] : [y0, y1];
        colorScale.domain = stops.map((_, index) => {
            return i0 + ((i1 - i0) * index) / (stops.length - 1);
        });
        colorScale.range = stops;
        colorScale.update();

        if (this.direction === 'to-right') {
            for (let x = x0; x < x1; x += devicePixelRatio) {
                ctx.fillStyle = colorScale.convert(x);
                ctx.fillRect(x, y0, devicePixelRatio, y1 - y0);
            }
        } else {
            for (let y = y0; y < y1; y += devicePixelRatio) {
                ctx.fillStyle = colorScale.convert(y);
                ctx.fillRect(x0, y, x1 - x0, devicePixelRatio);
            }
        }

        ctx.restore();
    }
}
