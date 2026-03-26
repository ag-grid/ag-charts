import {
    type InternalAgImageFill,
    Logger,
    createSvgElement,
    getDOMMatrix,
    normalizeAngle360FromDegrees,
} from 'ag-charts-core';
import type { AgColorRepeat, AgImageFillFit } from 'ag-charts-types';

import type { BBox } from '../bbox';
import type { Node } from '../node';
import type { ImageLoader } from './imageLoader';

export class Image implements Omit<InternalAgImageFill, 'type'> {
    url: string;
    backgroundFill: string;
    backgroundFillOpacity: number;
    width?: number;
    height?: number;
    repeat: AgColorRepeat;
    fit: AgImageFillFit;
    rotation: number;

    constructor(
        readonly imageLoader: ImageLoader | undefined,
        imageOptions: InternalAgImageFill
    ) {
        this.url = imageOptions.url;
        this.backgroundFill = imageOptions.backgroundFill ?? 'black';
        this.backgroundFillOpacity = imageOptions.backgroundFillOpacity ?? 1;
        this.repeat = imageOptions.repeat ?? 'no-repeat';
        this.width = imageOptions.width;
        this.height = imageOptions.height;
        this.fit = imageOptions.fit ?? 'stretch';
        this.rotation = imageOptions.rotation ?? 0;
    }

    private createCanvasImage(
        ctx: CanvasRenderingContext2D,
        image: HTMLImageElement | undefined,
        width: number,
        height: number
    ): CanvasPattern | null {
        if (!image) return null;
        const [renderedWidth, renderedHeight] = this.getSize(image.width, image.height, width, height);

        if (renderedWidth < 1 || renderedHeight < 1) {
            Logger.warnOnce('Image fill is too small to render, ignoring.');
            return null;
        }

        return ctx.createPattern(image, this.repeat);
    }

    private getSize(imageWidth: number, imageHeight: number, width: number, height: number): [number, number] {
        const { fit } = this;

        let dw = imageWidth;
        let dh = imageHeight;
        let scale = 1;
        const shapeAspectRatio = width / height;
        const imageAspectRatio = imageWidth / imageHeight;

        if (fit === 'stretch' || imageWidth === 0 || imageHeight === 0) {
            dw = width;
            dh = height;
        } else if (fit === 'contain') {
            scale = imageAspectRatio > shapeAspectRatio ? width / imageWidth : height / imageHeight;
        } else if (fit === 'cover') {
            scale = imageAspectRatio > shapeAspectRatio ? height / imageHeight : width / imageWidth;
        }

        return [Math.max(1, dw * scale), Math.max(1, dh * scale)];
    }

    setImageTransform(pattern: CanvasPattern | string | undefined, bbox: BBox) {
        if (typeof pattern === 'string') return;

        const { url, rotation, width, height } = this;

        const image = this.imageLoader?.loadImage(url);
        if (!image) {
            return;
        }

        const angle = normalizeAngle360FromDegrees(rotation);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const [renderedWidth, renderedHeight] = this.getSize(
            image.width,
            image.height,
            width ?? bbox.width,
            height ?? bbox.height
        );

        const widthScale = renderedWidth / image.width;
        const heightScale = renderedHeight / image.height;

        const bboxCenterX = bbox.x + bbox.width / 2;
        const bboxCenterY = bbox.y + bbox.height / 2;

        const rotatedW = cos * renderedWidth - sin * renderedHeight;
        const rotatedH = sin * renderedWidth + cos * renderedHeight;

        const shapeCenterX = rotatedW / 2;
        const shapeCenterY = rotatedH / 2;

        const DOMMatrixCtor = getDOMMatrix();
        pattern?.setTransform(
            new DOMMatrixCtor([
                cos * widthScale,
                sin * heightScale,
                -sin * widthScale,
                cos * heightScale,
                bboxCenterX - shapeCenterX,
                bboxCenterY - shapeCenterY,
            ])
        );
    }

    private _cache:
        | {
              ctx: CanvasRenderingContext2D;
              pattern: CanvasPattern | undefined;
              width: number;
              height: number;
          }
        | undefined = undefined;
    createPattern(
        ctx: CanvasRenderingContext2D,
        shapeWidth: number,
        shapeHeight: number,
        node: Node
    ): CanvasPattern | string | undefined {
        const width = this.width ?? shapeWidth;
        const height = this.height ?? shapeHeight;

        const cache = this._cache;
        if (cache?.ctx === ctx && cache.width === width && cache.height === height) {
            return cache.pattern;
        }

        const image = this.imageLoader?.loadImage(this.url, node);
        const pattern = this.createCanvasImage(ctx, image, width, height);

        if (pattern == null) return;

        this._cache = { ctx, pattern, width, height };

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
