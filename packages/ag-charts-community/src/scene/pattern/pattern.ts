import {
    type InternalAgPatternColor,
    Logger,
    type RequiredInternalAgPatternColor,
    createSvgElement,
} from 'ag-charts-core';
import type { AgPatternName, CssColor } from 'ag-charts-types';

import { normalizeAngle360FromDegrees } from 'ag-charts-core/utils/angle';
import { HdpiOffscreenCanvas } from '../canvas/hdpiOffscreenCanvas';
import { ExtendedPath2D } from '../extendedPath2D';
import { PATTERNS } from './patterns';

export class Pattern implements Omit<RequiredInternalAgPatternColor, 'type'> {
    pattern: AgPatternName;
    path?: string;
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
    scale: number;

    constructor(patternOptions: InternalAgPatternColor) {
        this.width = Math.max(patternOptions?.width ?? 10, 1);
        this.height = Math.max(patternOptions?.height ?? 10, 1);
        this.fill = patternOptions.fill ?? 'none';
        this.fillOpacity = patternOptions.fillOpacity ?? 1;
        this.backgroundFill = patternOptions.backgroundFill ?? 'none';
        this.backgroundFillOpacity = patternOptions.backgroundFillOpacity ?? 1;
        this.stroke = patternOptions.stroke ?? 'black';
        this.strokeOpacity = patternOptions.strokeOpacity ?? 1;
        this.strokeWidth = patternOptions.strokeWidth ?? 1;
        this.padding = patternOptions.padding ?? 1;
        this.pattern = patternOptions.pattern ?? 'forward-slanted-lines';
        this.rotation = patternOptions.rotation ?? 0;
        this.scale = patternOptions.scale ?? 1;
        this.path = patternOptions.path;
    }

    private getPath(pixelRatio: number) {
        const { pattern, width, height, padding, strokeWidth, path: svgPath } = this;

        const path = new ExtendedPath2D();

        let renderPattern = PATTERNS[pattern] != null;
        if (svgPath) {
            renderPattern &&= !path.appendSvg(svgPath);
        }

        if (renderPattern) {
            PATTERNS[pattern](path, { width, height, pixelRatio, strokeWidth, padding });
        }

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

        if (fill === 'none') {
            return;
        }

        ctx.fillStyle = fill;
        ctx.globalAlpha = fillOpacity;
        ctx.fill(path2d);
    }

    private createCanvasPattern(ctx: CanvasRenderingContext2D, pixelRatio: number): CanvasPattern | null {
        const { width, height, scale, backgroundFill, backgroundFillOpacity } = this;

        if (width * scale < 1 || height * scale < 1) {
            Logger.warnOnce('Pattern fill is too small to render, ignoring.');
            return null;
        }

        const offscreenPattern = new HdpiOffscreenCanvas({ width, height, pixelRatio: pixelRatio * scale });
        const offscreenPatternCtx: OffscreenCanvasRenderingContext2D = offscreenPattern.context;

        if (backgroundFill !== 'none') {
            offscreenPatternCtx.fillStyle = backgroundFill;
            offscreenPatternCtx.globalAlpha = backgroundFillOpacity;
            offscreenPatternCtx.fillRect(0, 0, width, height);
        }

        const path2d = this.getPath(pixelRatio).getPath2D();

        this.renderFill(path2d, offscreenPatternCtx);
        this.renderStroke(path2d, offscreenPatternCtx);

        const pattern = ctx.createPattern(offscreenPattern.canvas, 'repeat');

        this.setPatternTransform(pattern, pixelRatio);

        offscreenPattern.destroy();

        return pattern;
    }

    setPatternTransform(pattern: CanvasPattern | null | undefined, pixelRatio: number, tx: number = 0, ty: number = 0) {
        if (pattern == null) return;

        const angle = normalizeAngle360FromDegrees(this.rotation);
        const scale = 1 / pixelRatio;
        const cos = Math.cos(angle) * scale;
        const sin = Math.sin(angle) * scale;

        pattern.setTransform(new DOMMatrix([cos, sin, -sin, cos, tx, ty]));
    }

    private _cache:
        | { ctx: CanvasRenderingContext2D; pattern: CanvasPattern | undefined; pixelRatio: number }
        | undefined = undefined;
    createPattern(ctx: CanvasRenderingContext2D, pixelRatio: number): CanvasPattern | undefined {
        if (this._cache != null && this._cache.ctx === ctx && this._cache.pixelRatio === pixelRatio) {
            return this._cache.pattern;
        }

        const pattern = this.createCanvasPattern(ctx, pixelRatio);
        if (pattern == null) return;

        this._cache = { ctx, pattern, pixelRatio };

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
            scale,
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
        path.setAttribute('transform', `rotate(${rotation}) scale(${scale})`);
        path.setAttribute('d', this.getPath(1).toSVG());
        pattern.appendChild(path);

        return pattern;
    }
}
