import { toIterable } from '../util/iterator';
import type { Node, RenderContext } from './node';

type RenderSpriteOptions = { translateY: number };

export class SpriteRenderer {
    private readonly offscreenCanvas: OffscreenCanvas;
    private readonly renderCtx: RenderContext;

    constructor() {
        this.offscreenCanvas = new OffscreenCanvas(1, 1);
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

    resize(width: number, height: number) {
        if (!(width > 0 && height > 0)) {
            throw new Error(`AG Charts - invalid dimensions: ${width}x${height}`);
        }
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
    }

    renderSprite(nodes: Node | Iterable<Node>, opts?: RenderSpriteOptions) {
        nodes = toIterable(nodes);
        const {
            renderCtx,
            renderCtx: { ctx },
            offscreenCanvas,
        } = this;
        const { translateY = 0 } = opts ?? {};

        ctx.resetTransform();
        ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.setTransform(1, 0, 0, 1, 0, translateY);
        for (const node of nodes) {
            node.render(renderCtx);
        }
        ctx.closePath();
        ctx.restore();

        return offscreenCanvas.transferToImageBitmap();
    }
}
