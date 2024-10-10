import type { Node, RenderContext } from './node';

type RenderSpriteOptions = { scale: number; translateX: number; translateY: number };

export type SpriteDimensions = {
    spritePixelRatio: number;
    spriteAAPadding: number;
    spriteWidth: number;
    spriteHeight: number;
    markerWidth: number;
};

export class SpriteRenderer {
    private width = 0;
    private height = 0;
    private offscreenCanvas: OffscreenCanvas | null = null;
    private renderCtx: RenderContext | null = null;

    private getRenderState() {
        const { width, height } = this;

        if (width === 0 && height === 0) return;

        if (this.offscreenCanvas == null) {
            this.offscreenCanvas = new OffscreenCanvas(width, height);
        }

        if (this.renderCtx == null) {
            const ctx = this.offscreenCanvas.getContext('2d');
            if (ctx == null) throw new TypeError(`AG Charts - invalid 2d context`);

            this.renderCtx = {
                ctx,
                devicePixelRatio: 1,
                forceRender: true,
                resized: false,
                debugNodes: {},
            };
        }

        return {
            offscreenCanvas: this.offscreenCanvas,
            renderCtx: this.renderCtx,
        };
    }

    resize({ spritePixelRatio, spriteWidth, spriteHeight }: SpriteDimensions) {
        const width = Math.max(spriteWidth, 0) * spritePixelRatio;
        const height = Math.max(spriteHeight, 0) * spritePixelRatio;

        this.width = width;
        this.height = height;

        if (this.offscreenCanvas != null) {
            this.offscreenCanvas.width = width;
            this.offscreenCanvas.height = height;
        }

        this.renderCtx = null;
    }

    renderSprite(node: Node, opts?: RenderSpriteOptions) {
        const renderState = this.getRenderState();
        if (renderState == null) return;

        const { offscreenCanvas, renderCtx } = renderState;
        const { ctx } = renderCtx;

        const { scale = 1, translateX = 0, translateY = 0 } = opts ?? {};

        ctx.resetTransform();
        ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.setTransform(scale, 0, 0, scale, translateX, translateY);
        node.render(renderCtx);
        ctx.closePath();
        ctx.restore();

        return offscreenCanvas.transferToImageBitmap();
    }
}
