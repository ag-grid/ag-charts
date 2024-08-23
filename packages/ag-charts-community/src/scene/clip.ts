import { jsonDiff } from '../util/json';
import { BBox } from './bbox';
import { Node, RedrawType, type RenderContext } from './node';

type Constructor<T> = new (...args: any[]) => T;
type Circle = { x: number; y: number; radius: number };

export type ClippableOutsideType<T> = T & {
    clipShape?: BBox | Circle;
    setClipMask: (shape?: BBox | Circle) => void;
};

export function ClippableOutside<N extends Node>(Parent: Constructor<N>): Constructor<ClippableOutsideType<N>> {
    const ParentNode = Parent as Constructor<Node>;
    class ClippableOutsideInternal extends ParentNode {
        clipShape?: BBox | Circle;

        setClipMask(shape?: BBox | Circle) {
            if (jsonDiff(this.clipShape, shape) != null) {
                this.markDirty(this, RedrawType.MINOR);
            }

            this.clipShape = shape;
        }

        override postRender(renderCtx: RenderContext) {
            const { ctx } = renderCtx;
            const { clipShape } = this;

            if (!clipShape) {
                super.postRender(renderCtx);
                return;
            }

            const prevOperation = ctx.globalCompositeOperation;
            ctx.beginPath();
            ctx.globalCompositeOperation = 'destination-out';
            if (clipShape instanceof BBox) {
                const { x, y, width, height } = clipShape;
                ctx.rect(x, y, width, height);
            } else {
                const { x, y, radius } = clipShape;
                ctx.arc(x, y, radius, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.globalCompositeOperation = prevOperation;

            super.postRender(renderCtx);
        }
    }
    return ClippableOutsideInternal as unknown as Constructor<ClippableOutsideType<N>>;
}
