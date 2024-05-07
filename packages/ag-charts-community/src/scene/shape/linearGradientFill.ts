import { ColorScale } from '../../scale/colorScale';
import type { RenderContext } from '../node';
import { RedrawType, SceneChangeDetection } from '../node';
import type { Path } from './path';
import { Shape } from './shape';

export class LinearGradientFill extends Shape {
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    direction: 'to-bottom' | 'to-top' | 'to-right' | 'to-left' = 'to-right';

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    stops?: string[] = undefined;

    get mask(): Path | undefined {
        return this._mask;
    }
    set mask(newMask: Path | undefined) {
        if (this._mask != null) {
            this.removeChild(this._mask);
        }

        if (newMask != null) {
            this.appendChild(newMask);
        }

        this._mask = newMask;
    }

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    private _mask?: Path = undefined;

    override isPointInPath(x: number, y: number): boolean {
        return this.mask?.isPointInPath(x, y) ?? false;
    }

    override computeBBox() {
        return this.mask?.computeBBox();
    }

    override render(renderCtx: RenderContext): void {
        const { mask, stops } = this;
        const { ctx, devicePixelRatio } = renderCtx;
        const pixelLength = 1 / devicePixelRatio;

        const maskBbox = mask?.computeTransformedBBox();

        if (mask == null || stops == null || maskBbox == null) return;

        if (mask.dirtyPath) {
            mask.updatePath();
            mask.dirtyPath = false;
        }

        ctx.save();
        ctx.clip(mask.path.getPath2D());
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

        const x0 = Math.floor(maskBbox.x);
        const x1 = Math.ceil(maskBbox.x + maskBbox.width);
        const y0 = Math.floor(maskBbox.y);
        const y1 = Math.ceil(maskBbox.y + maskBbox.height);

        const horizontal = this.direction === 'to-right' || this.direction === 'to-left';
        const reversed = this.direction === 'to-top' || this.direction === 'to-left';

        const colorScale = new ColorScale();
        const [i0, i1] = horizontal ? [x0, x1] : [y0, y1];
        colorScale.domain = stops.map((_, index) => {
            return i0 + ((i1 - i0) * index) / (stops.length - 1);
        });
        colorScale.range = reversed ? stops.slice().reverse() : stops;
        colorScale.update();

        const height = y1 - y0;
        const width = x1 - x0;

        switch (this.direction) {
            case 'to-right':
            case 'to-left':
                for (let x = x0; x <= x1; x += pixelLength) {
                    ctx.fillStyle = colorScale.convert(x);
                    ctx.fillRect(x, y0, pixelLength, height);
                }
                break;
            case 'to-bottom':
            case 'to-top':
                for (let y = y0; y <= y1; y += pixelLength) {
                    ctx.fillStyle = colorScale.convert(y);
                    ctx.fillRect(x0, y, width, pixelLength);
                }
                break;
        }

        ctx.restore();
    }
}
