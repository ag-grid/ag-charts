import { toIterable } from '../util/iterator';
import type { Node, RenderContext } from './node';

type RenderSpriteOptions = { translateY: number };

export class SpriteRenderer {
    private readonly offCanvas: OffscreenCanvas;
    private readonly renderCtx: RenderContext;

    constructor() {
        this.offCanvas = new OffscreenCanvas(1, 1);
        const ctx = this.offCanvas.getContext('2d');
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
        this.offCanvas.width = width;
        this.offCanvas.height = height;
    }

    renderSprite(nodes: Node | Iterable<Node>, opts?: RenderSpriteOptions): ImageBitmap {
        nodes = toIterable(nodes);
        const { renderCtx, offCanvas } = this;
        const { translateY = 0 } = opts ?? {};

        renderCtx.ctx.beginPath();
        renderCtx.ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        renderCtx.ctx.setTransform(1, 0, 0, 1, 0, translateY);
        for (const node of nodes) {
            node.render(renderCtx);
        }

        return offCanvas.transferToImageBitmap();
    }
}
