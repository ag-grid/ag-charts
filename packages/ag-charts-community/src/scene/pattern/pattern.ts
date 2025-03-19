import { createSvgElement } from 'ag-charts-core';
import type { AgPatternColor, AgPatternName, CssColor } from 'ag-charts-types';

import { HdpiOffscreenCanvas } from '../canvas/hdpiOffscreenCanvas';
import { ExtendedPath2D } from '../extendedPath2D';
import { PATTERNS } from './patterns';

export class Pattern implements Omit<Required<AgPatternColor>, 'type'> {
    pattern: AgPatternName;
    width: number;
    height: number;
    padding: number;
    fill: CssColor;
    fillOpacity: number;
    backgroundFill: CssColor;
    backgroundFillOpacity: number;
    stroke: CssColor;
    strokeWidth: number;

    constructor(
        patternOptions: AgPatternColor,
        public pixelRatio = 1
    ) {
        this.width = Math.max(patternOptions?.width ?? 10, 1);
        this.height = Math.max(patternOptions?.height ?? 10, 1);
        this.fill = patternOptions.fill ?? 'transparent';
        this.fillOpacity = patternOptions.fillOpacity ?? 1;
        this.backgroundFill = patternOptions.backgroundFill ?? 'transparent';
        this.backgroundFillOpacity = patternOptions.backgroundFillOpacity ?? 1;
        this.stroke = patternOptions.stroke ?? 'black';
        this.strokeWidth = patternOptions.strokeWidth ?? 1;
        this.padding = patternOptions.padding ?? 1;
        this.pattern = patternOptions.pattern ?? 'forward-slanted-lines';
    }

    private getPath() {
        const { pattern, width, height, padding, strokeWidth, pixelRatio } = this;

        const path = new ExtendedPath2D();
        PATTERNS[pattern](path, { width, height, pixelRatio, strokeWidth, padding });
        return path;
    }

    protected createCanvasPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
        const {
            width,
            height,
            fill,
            fillOpacity,
            backgroundFill,
            backgroundFillOpacity,
            stroke,
            strokeWidth,
            pixelRatio,
        } = this;

        const offscreenPattern = new HdpiOffscreenCanvas({ width, height, pixelRatio });
        const offscreenPatternCtx: OffscreenCanvasRenderingContext2D = offscreenPattern.context;

        offscreenPatternCtx.fillStyle = backgroundFill;
        offscreenPatternCtx.globalAlpha = backgroundFillOpacity;
        offscreenPatternCtx.fillRect(0, 0, width, height);

        offscreenPatternCtx.fillStyle = fill;
        offscreenPatternCtx.strokeStyle = stroke;
        offscreenPatternCtx.globalAlpha = fillOpacity;
        offscreenPatternCtx.lineWidth = strokeWidth;

        const path2d = this.getPath().getPath2D();

        offscreenPatternCtx.fill(path2d);
        offscreenPatternCtx.stroke(path2d);

        const pattern = ctx.createPattern(offscreenPattern.canvas, 'repeat');

        pattern?.setTransform(new DOMMatrix([1 / pixelRatio, 0, 0, 1 / pixelRatio, 0, 0]));

        offscreenPattern.destroy();

        return pattern;
    }

    private _cache: { ctx: CanvasRenderingContext2D; pattern: CanvasPattern | undefined } | undefined = undefined;
    createPattern(ctx: CanvasRenderingContext2D): CanvasPattern | undefined {
        if (this._cache != null && this._cache.ctx === ctx) {
            return this._cache.pattern;
        }

        const pattern = this.createCanvasPattern(ctx);
        if (pattern == null) return;

        this._cache = { ctx, pattern };

        return pattern;
    }

    toSvg(): SVGElement {
        const { width, height, fill, fillOpacity, backgroundFill, backgroundFillOpacity, stroke, strokeWidth } = this;

        const pattern = createSvgElement('pattern');
        pattern.setAttribute('viewBox', `0 0 ${width} ${height}`);
        pattern.setAttribute('width', String(width));
        pattern.setAttribute('height', String(height));
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');

        const rect = createSvgElement('rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', String(width));
        rect.setAttribute('height', String(height));
        rect.setAttribute('fill', backgroundFill);
        rect.setAttribute('fill-opacity', String(backgroundFillOpacity));
        pattern.appendChild(rect);

        const path = createSvgElement('path');
        path.setAttribute('fill', fill);
        path.setAttribute('fill-opacity', String(fillOpacity));
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', String(strokeWidth));
        path.setAttribute('d', this.getPath().toSVG());
        pattern.appendChild(path);

        return pattern;
    }
}
