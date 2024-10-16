import type { RenderContext } from './node';
import { Node, SceneChangeDetection } from './node';

export class Image extends Node {
    constructor(private sourceImage?: HTMLImageElement | ImageBitmap) {
        super();
    }

    updateBitmap(newBitmap: ImageBitmap, bitmapPixelRatio: number, x: number, y: number) {
        this.sourceImage = newBitmap;
        this.width = newBitmap.width / bitmapPixelRatio;
        this.height = newBitmap.height / bitmapPixelRatio;
        this.x = x / bitmapPixelRatio;
        this.y = y / bitmapPixelRatio;
        this.markDirty();
    }

    @SceneChangeDetection()
    x: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    @SceneChangeDetection()
    width: number = 0;

    @SceneChangeDetection()
    height: number = 0;

    @SceneChangeDetection()
    opacity: number = 1;

    override render(renderCtx: RenderContext): void {
        const { ctx } = renderCtx;

        const image = this.sourceImage;
        if (!image) return;

        ctx.globalAlpha = this.opacity;
        ctx.drawImage(image, 0, 0, image.width, image.height, this.x, this.y, this.width, this.height);

        super.render(renderCtx);
    }
}
