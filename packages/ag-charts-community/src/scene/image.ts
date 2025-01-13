import type { RenderContext } from './node';
import { Node, SceneChangeDetection } from './node';

export class Image extends Node {
    constructor(private readonly sourceImage?: HTMLImageElement | ImageBitmap) {
        super();
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
        if (image) {
            ctx.globalAlpha = this.opacity;
            ctx.drawImage(image, 0, 0, image.width, image.height, this.x, this.y, this.width, this.height);
        }

        super.render(renderCtx);
    }
}
