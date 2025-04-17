import { type InternalAgImageFill, createSvgElement } from 'ag-charts-core';
import type { AgColorRepetition, AgImageFillFit } from 'ag-charts-types';

import { normalizeAngle360, toRadians } from '../../util/angle';
import { HdpiOffscreenCanvas } from '../canvas/hdpiOffscreenCanvas';
import type { Node } from '../node';
import type { ImageLoader } from './imageLoader';

export class Image implements Omit<InternalAgImageFill, 'type'> {
    url: string;
    backgroundFill: string;
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
        this.repetition = imageOptions.repetition ?? 'repeat';
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

        const offscreenPattern = new HdpiOffscreenCanvas({ width: dw, height: dh, pixelRatio });
        const offscreenPatternCtx: OffscreenCanvasRenderingContext2D = offscreenPattern.context;

        offscreenPatternCtx.drawImage(image, 0, 0, dw, dh);
        return ctx.createPattern(offscreenPattern.canvas, this.repetition);
    }

    private getDimensions(
        imageWidth: number,
        imageHeight: number,
        width: number,
        height: number,
        shapeWidth: number = width,
        shapeHeight: number = height
    ): { dx: number; dy: number; dw: number; dh: number } {
        const { fit } = this;
        if (fit === 'stretch' || imageWidth === 0 || imageHeight === 0) {
            return {
                dx: 0,
                dy: 0,
                dw: width,
                dh: height,
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

        const scaledWidth = imageWidth * scale;
        const scaledHeight = imageHeight * scale;

        return {
            dx: (shapeWidth - scaledWidth) / 2,
            dy: (shapeHeight - scaledHeight) / 2,
            dw: scaledWidth,
            dh: scaledHeight,
        };
    }

    setImageTransform(
        pattern: CanvasPattern | string | undefined,
        pixelRatio: number,
        tx: number = 0,
        ty: number = 0,
        shapeWidth: number = 0,
        shapeHeight: number = 0
    ) {
        if (typeof pattern === 'string') return;

        const image = this.imageLoader?.loadImage(this.url);
        if (!image) {
            return;
        }

        const width = Math.max(1, this.width ?? shapeWidth);
        const height = Math.max(1, this.height ?? shapeHeight);

        const { dx, dy } = this.getDimensions(image.width, image.height, width, height, shapeWidth, shapeHeight);

        const angle = normalizeAngle360(toRadians(this.rotation));
        const scale = 1 / pixelRatio;
        const cos = Math.cos(angle) * scale;
        const sin = Math.sin(angle) * scale;

        pattern?.setTransform(new DOMMatrix([cos, sin, -sin, cos, tx + dx, ty + dy]));
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
        const width = Math.max(1, this.width ?? shapeWidth);
        const height = Math.max(1, this.height ?? shapeHeight);

        const cache = this._cache;
        if (cache != null && cache.ctx === ctx && cache.width === width && cache.height === height) {
            return cache.pattern;
        }

        const image = this.imageLoader?.loadImage(this.url, node);
        const pattern = this.createCanvasImage(ctx, image, width, height, pixelRatio);

        if (pattern == null) return this.backgroundFill;

        this._cache = { ctx, pattern, width, height, pixelRatio };

        return pattern;
    }

    toSvg(shapeWidth: number, shapeHeight: number, pixelRatio: number): SVGElement {
        const { url, width = shapeWidth, height = shapeHeight, rotation } = this;

        const pattern = createSvgElement('pattern');
        pattern.setAttribute('viewBox', `0 0 ${width} ${height}`);
        pattern.setAttribute('width', String(width));
        pattern.setAttribute('height', String(height));
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute(
            'patternTransform',
            `scale(${1 / pixelRatio}) rotate(${rotation}, ${width / 2}, ${height / 2})`
        );

        const image = createSvgElement('image');
        image.setAttribute('href', url);
        image.setAttribute('x', '0');
        image.setAttribute('y', '0');
        image.setAttribute('width', String(width));
        image.setAttribute('height', String(height));
        image.setAttribute('preserveAspectRatio', 'none');

        pattern.appendChild(image);

        return pattern;
    }
}
