import { createSvgElement } from 'ag-charts-core';
import type { AgPatternColor, AgPatternName, CssColor } from 'ag-charts-types';

import { normalizeAngle360, toRadians } from '../../util/angle';
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
    strokeOpacity: number;
    strokeWidth: number;
    rotation: number;

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
        this.strokeOpacity = patternOptions.strokeOpacity ?? 1;
        this.strokeWidth = patternOptions.strokeWidth ?? 1;
        this.padding = patternOptions.padding ?? 1;
        this.pattern = patternOptions.pattern ?? 'forward-slanted-lines';
        this.rotation = patternOptions.rotation ?? 0;
    }

    private getPath() {
        const { pattern, width, height, padding, strokeWidth, pixelRatio } = this;

        const path = new ExtendedPath2D();
        PATTERNS[pattern](path, { width, height, pixelRatio, strokeWidth, padding });
        return path;
    }

    private renderStroke(path2d: Path2D, ctx: OffscreenCanvasRenderingContext2D) {
        const { stroke, strokeWidth, strokeOpacity } = this;
        if (!strokeWidth) return;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = strokeOpacity;
        ctx.stroke(path2d);
    }

    private renderFill(path2d: Path2D, ctx: OffscreenCanvasRenderingContext2D) {
        const { fill, fillOpacity } = this;

        ctx.fillStyle = fill;
        ctx.globalAlpha = fillOpacity;
        ctx.fill(path2d);
    }

    protected createCanvasPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
        const { width, height, backgroundFill, backgroundFillOpacity, pixelRatio, rotation } = this;

        const offscreenPattern = new HdpiOffscreenCanvas({ width, height, pixelRatio });
        const offscreenPatternCtx: OffscreenCanvasRenderingContext2D = offscreenPattern.context;

        offscreenPatternCtx.fillStyle = backgroundFill;
        offscreenPatternCtx.globalAlpha = backgroundFillOpacity;
        offscreenPatternCtx.fillRect(0, 0, width, height);

        const path2d = this.getPath().getPath2D();

        this.renderFill(path2d, offscreenPatternCtx);
        this.renderStroke(path2d, offscreenPatternCtx);

        const pattern = ctx.createPattern(offscreenPattern.canvas, 'repeat');

        const angle = normalizeAngle360(toRadians(rotation));
        const scale = 1 / pixelRatio;
        const cos = Math.cos(angle) * scale;
        const sin = Math.sin(angle) * scale;

        pattern?.setTransform(new DOMMatrix([cos, sin, -sin, cos, 0, 0]));

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
        const {
            width,
            height,
            fill,
            fillOpacity,
            backgroundFill,
            backgroundFillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            rotation,
        } = this;

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
        path.setAttribute('stroke-opacity', String(strokeOpacity));
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', String(strokeWidth));
        path.setAttribute('transform', `rotate(${rotation})`);
        path.setAttribute('d', this.getPath().toSVG());
        pattern.appendChild(path);

        return pattern;
    }
}
