import type { AgPatternColor } from 'ag-charts-types';

import { HdpiOffscreenCanvas } from '../canvas/hdpiOffscreenCanvas';
import { PATTERNS } from './patterns';

export class Pattern {
    constructor(
        public patternOptions: AgPatternColor & { path?: string },
        public pixelRatio = 1
    ) {}

    protected createCanvasPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
        const { pixelRatio, patternOptions } = this;

        const width = Math.max(patternOptions?.width ?? 10, 1);
        const height = Math.max(patternOptions?.height ?? 10, 1);

        const offscreenPattern = new HdpiOffscreenCanvas({ width, height, pixelRatio });

        const offscreenPatternCtx: OffscreenCanvasRenderingContext2D = offscreenPattern.context;

        const {
            fill = 'transparent',
            fillOpacity = 1,
            backgroundFill = 'transparent',
            backgroundFillOpacity = 1,
            stroke = 'black',
            strokeWidth = 1,
            path,
            padding = 1,
            pattern: patternName = 'forward-slanted-lines',
        } = patternOptions;

        offscreenPatternCtx.fillStyle = backgroundFill;
        offscreenPatternCtx.globalAlpha = backgroundFillOpacity;
        offscreenPatternCtx.fillRect(0, 0, width, height);

        offscreenPatternCtx.fillStyle = fill;
        offscreenPatternCtx.strokeStyle = stroke;
        offscreenPatternCtx.globalAlpha = fillOpacity;
        offscreenPatternCtx.lineWidth = strokeWidth;

        const drawParams = {
            ctx: offscreenPatternCtx,
            path,
            width,
            height,
            pixelRatio,
            strokeWidth,
            padding,
        };

        PATTERNS[patternName](drawParams);

        const pattern = ctx.createPattern(offscreenPattern.canvas, 'repeat');

        pattern?.setTransform(new DOMMatrix([1 / pixelRatio, 0, 0, 1 / pixelRatio, 0, 0]));

        offscreenPattern.destroy();

        return pattern;
    }

    private _cache:
        | {
              ctx: CanvasRenderingContext2D;
              pattern: CanvasPattern | undefined;
          }
        | undefined = undefined;
    createPattern(ctx: CanvasRenderingContext2D): CanvasPattern | undefined {
        if (this._cache != null && this._cache.ctx === ctx) {
            return this._cache.pattern;
        }

        const pattern = this.createCanvasPattern(ctx);
        if (pattern == null) return;

        this._cache = { ctx, pattern };

        return pattern;
    }
}
