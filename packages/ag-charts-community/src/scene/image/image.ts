import { type InternalAgImageFill, Logger, createSvgElement } from 'ag-charts-core';
import type { AgColorRepetition, AgImageFillFit } from 'ag-charts-types';

import { normalizeAngle360FromDegrees } from '../../util/angle';
import type { BBox } from '../bbox';
import { HdpiOffscreenCanvas } from '../canvas/hdpiOffscreenCanvas';
import type { Node } from '../node';
import type { ImageLoader } from './imageLoader';

export class Image implements Omit<InternalAgImageFill, 'type'> {
    url: string;
    backgroundFill: string;
    backgroundFillOpacity: number;
    width?: number;
    height?: number;
    repetition: AgColorRepetition;
    fit: AgImageFillFit;
    rotation: number;

    constructor(
        readonly imageLoader: ImageLoader | undefined,
        imageOptions: InternalAgImageFill
    ) {
        this.url = imageOptions.url;
        this.backgroundFill = imageOptions.backgroundFill ?? 'black';
        this.backgroundFillOpacity = imageOptions.backgroundFillOpacity ?? 1;
        this.repetition = imageOptions.repetition ?? 'no-repeat';
        this.width = imageOptions.width;
        this.height = imageOptions.height;
        this.fit = imageOptions.fit ?? 'stretch';
        this.rotation = imageOptions.rotation ?? 0;
    }

    private createCanvasImage(
        ctx: CanvasRenderingContext2D,
        image: HTMLImageElement | undefined,
        width: number,
        height: number,
        pixelRatio: number
    ): CanvasPattern | null {
        if (!image) return null;
        const { dw, dh } = this.getDimensions(image.width, image.height, width, height);

        if (dw < 1 || dh < 1) {
            Logger.warnOnce('Image fill is too small to render, ignoring.');
            return null;
        }

        const offscreenPattern = new HdpiOffscreenCanvas({ width: dw, height: dh, pixelRatio });
        const offscreenPatternCtx: OffscreenCanvasRenderingContext2D = offscreenPattern.context;

        offscreenPatternCtx.drawImage(image, 0, 0, dw, dh);
        return ctx.createPattern(offscreenPattern.canvas, this.repetition);
    }

    private getDimensions(
        imageWidth: number,
        imageHeight: number,
        width: number,
        height: number
    ): { dx: number; dy: number; dw: number; dh: number } {
        const { fit } = this;
        if (fit === 'stretch' || imageWidth === 0 || imageHeight === 0) {
            return {
                dx: 0,
                dy: 0,
                dw: Math.max(1, width),
                dh: Math.max(1, height),
            };
        }

        const shapeAspectRatio = width / height;
        const imageAspectRatio = imageWidth / imageHeight;

        let scale = 1;
        if (fit === 'contain') {
            scale = imageAspectRatio > shapeAspectRatio ? width / imageWidth : height / imageHeight;
        } else {
            scale = imageAspectRatio > shapeAspectRatio ? height / imageHeight : width / imageWidth;
        }

        const scaledWidth = Math.max(1, imageWidth * scale);
        const scaledHeight = Math.max(1, imageHeight * scale);

        return {
            dx: scaledWidth / 2,
            dy: scaledHeight / 2,
            dw: scaledWidth,
            dh: scaledHeight,
        };
    }

    setImageTransform(pattern: CanvasPattern | string | undefined, pixelRatio: number, bbox: BBox) {
        if (typeof pattern === 'string') return;

        const { url, rotation, width, height } = this;

        const image = this.imageLoader?.loadImage(url);
        if (!image) {
            return;
        }

        const angle = normalizeAngle360FromDegrees(rotation);
        const scale = 1 / pixelRatio;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const bboxCenterX = bbox.x + bbox.width / 2;
        const bboxCenterY = bbox.y + bbox.height / 2;

        const { dw, dh } = this.getDimensions(image.width, image.height, width ?? bbox.width, height ?? bbox.height);
        const rotatedW = cos * dw - sin * dh;
        const rotatedH = sin * dw + cos * dh;

        const shapeCenterX = rotatedW / 2;
        const shapeCenterY = rotatedH / 2;

        pattern?.setTransform(
            new DOMMatrix([
                cos * scale,
                sin * scale,
                -sin * scale,
                cos * scale,
                bboxCenterX - shapeCenterX,
                bboxCenterY - shapeCenterY,
            ])
        );
    }

    private _cache:
        | {
              ctx: CanvasRenderingContext2D;
              pattern: CanvasPattern | undefined;
              pixelRatio: number;
              width: number;
              height: number;
          }
        | undefined = undefined;
    createPattern(
        ctx: CanvasRenderingContext2D,
        pixelRatio: number,
        shapeWidth: number,
        shapeHeight: number,
        node: Node
    ): CanvasPattern | string | undefined {
        const width = this.width ?? shapeWidth;
        const height = this.height ?? shapeHeight;

        const cache = this._cache;
        if (
            cache != null &&
            cache.ctx === ctx &&
            cache.width === width &&
            cache.height === height &&
            cache.pixelRatio === pixelRatio
        ) {
            return cache.pattern;
        }

        const image = this.imageLoader?.loadImage(this.url, node);
        const pattern = this.createCanvasImage(ctx, image, width, height, pixelRatio);

        if (pattern == null) return this.backgroundFill;

        this._cache = { ctx, pattern, width, height, pixelRatio };

        return pattern;
    }

    toSvg(bbox: BBox, pixelRatio: number): SVGElement {
        const { url, rotation, backgroundFill, backgroundFillOpacity } = this;
        const { x, y, width, height } = bbox;

        const pattern = createSvgElement('pattern');
        pattern.setAttribute('viewBox', `0 0 ${width} ${height}`);
        pattern.setAttribute('x', String(x));
        pattern.setAttribute('y', String(y));
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

        const image = createSvgElement('image');
        image.setAttribute('href', url);
        image.setAttribute('x', '0');
        image.setAttribute('y', '0');
        image.setAttribute('width', String(width));
        image.setAttribute('height', String(height));
        image.setAttribute('preserveAspectRatio', 'none');
        image.setAttribute('transform', `scale(${1 / pixelRatio}) rotate(${rotation}, ${width / 2}, ${height / 2})`);
        pattern.appendChild(image);

        return pattern;
    }
}
