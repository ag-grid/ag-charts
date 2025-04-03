import { type InternalAgImageFill } from 'ag-charts-core';

import type { ImageLoader } from './imageLoader';

export class Image implements Omit<InternalAgImageFill, 'type'> {
    uri: string;
    fallback: string;

    constructor(
        readonly imageLoader: ImageLoader | undefined,
        patternOptions: InternalAgImageFill
    ) {
        this.uri = patternOptions.uri;
        this.fallback = patternOptions.fallback ?? 'black';
    }

    private _cache: { ctx: CanvasRenderingContext2D; pattern: CanvasPattern } | undefined = undefined;
    createPattern(ctx: CanvasRenderingContext2D): CanvasPattern | string {
        if (this._cache != null) {
            return this._cache.pattern;
        }

        const image = this.imageLoader?.loadImage(this.uri);
        const pattern = image ? ctx.createPattern(image, 'repeat') : null;
        if (pattern == null) return this.fallback;
        this._cache = { ctx, pattern };
        return pattern;
    }

    // toSvg(): SVGElement {
    // }
}
