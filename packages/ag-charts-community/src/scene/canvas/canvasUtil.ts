import { Debug } from '../../util/debug';

export function clearContext({
    context,
    pixelRatio,
    width,
    height,
}: {
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    pixelRatio: number;
    width: number;
    height: number;
}) {
    context.save();
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.restore();
}

export function debugContext(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    if (Debug.check('canvas')) {
        const save = ctx.save.bind(ctx);
        const restore = ctx.restore.bind(ctx);
        let depth = 0;
        Object.assign(ctx, {
            save() {
                save();
                depth++;
            },
            restore() {
                if (depth === 0) {
                    throw new Error('AG Charts - Unable to restore() past depth 0');
                }
                restore();
                depth--;
            },
            verifyDepthZero() {
                if (depth !== 0) {
                    throw new Error(`AG Charts - Save/restore depth is non-zero: ${depth}`);
                }
            },
        });
    }
}
