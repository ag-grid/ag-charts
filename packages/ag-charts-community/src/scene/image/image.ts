import { type InternalAgImageColor } from 'ag-charts-core';
import type { AgColorRepetition, AgImageColorFit } from 'ag-charts-types';

import { normalizeAngle360, toRadians } from '../../util/angle';
import { HdpiOffscreenCanvas } from '../canvas/hdpiOffscreenCanvas';
import type { Node } from '../node';
import type { ImageLoader } from './imageLoader';

export class Image implements Omit<InternalAgImageColor, 'type'> {
    url: string;
    fallback: string;
    width?: number;
    height?: number;
    repetition: AgColorRepetition;
    fit: AgImageColorFit;
    rotation: number;
    scale: number;

    constructor(
        readonly imageLoader: ImageLoader | undefined,
        imageOptions: InternalAgImageColor
    ) {
        this.url = imageOptions.url;
        this.fallback = imageOptions.fallback ?? 'black';
        this.repetition = imageOptions.repetition ?? 'repeat';
        this.width = imageOptions.width;
        this.height = imageOptions.height;
        this.fit = imageOptions.fit ?? 'stretch';
        this.rotation = imageOptions.rotation ?? 0;
        this.scale = imageOptions.scale ?? 1;
    }

    private createCanvasImage(
        ctx: CanvasRenderingContext2D,
        image: HTMLImageElement | undefined,
        width: number,
        height: number,
        pixelRatio: number
    ): CanvasPattern | null {
        if (!image) return null;

        const { fit, repetition } = this;

        const offscreenPattern = new HdpiOffscreenCanvas({ width, height, pixelRatio });
        const offscreenPatternCtx: OffscreenCanvasRenderingContext2D = offscreenPattern.context;

        if (fit === 'stretch') {
            offscreenPatternCtx.drawImage(image, 0, 0, width, height);
            return ctx.createPattern(offscreenPattern.canvas, repetition);
        }

        const imageWidth = image.width;
        const imageHeight = image.height;
        const shapeAspectRatio = width / height;
        const imageAspectRatio = imageWidth / imageHeight;

        let scale = 1;
        if (fit === 'contain') {
            scale = imageAspectRatio > shapeAspectRatio ? width / imageWidth : height / imageHeight;
        } else {
            scale = imageAspectRatio > shapeAspectRatio ? height / imageHeight : width / imageWidth;
        }

        const dw = imageWidth * scale;
        const dh = imageHeight * scale;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;

        offscreenPatternCtx.drawImage(image, dx, dy, dw, dh);
        return ctx.createPattern(offscreenPattern.canvas, repetition);
    }

    setImageTransform(pattern: CanvasPattern | string | undefined, pixelRatio: number, tx: number = 0, ty: number = 0) {
        if (typeof pattern === 'string') {
            return;
        }

        const { rotation } = this;

        const angle = normalizeAngle360(toRadians(rotation));
        const scale = this.scale / pixelRatio;
        const cos = Math.cos(angle) * scale;
        const sin = Math.sin(angle) * scale;

        pattern?.setTransform(new DOMMatrix([cos, sin, -sin, cos, tx, ty]));
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
        if (cache != null && cache.ctx === ctx) {
            return cache.pattern;
        }

        const image = this.imageLoader?.loadImage(this.url, node);
        const pattern = this.createCanvasImage(ctx, image, width, height, pixelRatio);

        if (pattern == null) return this.fallback;

        this._cache = { ctx, pattern, width, height, pixelRatio };

        return pattern;
    }

    // toSvg(): SVGElement {
    // }
}
