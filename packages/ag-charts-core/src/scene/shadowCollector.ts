export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type Polygon = readonly number[];

/** A shared-shadow group, with the device-space state that its casters are drawn in. */
export interface ShadowFrame<TGroup> {
    readonly group: TGroup;
    /** The a, b, c, d, e, f of the group's transform, in device pixels. */
    readonly matrix: readonly number[];
    /** The product of the opacities of the group and its ancestors, up to the shadow root. */
    readonly alpha: number;
    /** The clips, in device pixels, that the group's ancestors and the group itself apply. */
    readonly clips: readonly Polygon[];
    /** Whether the group holds the highlighted copies of items, which cast a shadow of their own key. */
    readonly highlight: boolean;
}

/** Records the shared-shadow groups below a shadow root, without drawing or marking anything clean. */
export class ShadowCollector<TGroup> {
    alpha: number;
    readonly clips: Polygon[] = [];
    readonly frames: ShadowFrame<TGroup>[] = [];

    constructor(
        readonly ctx: Ctx,
        alpha: number
    ) {
        this.alpha = alpha;
    }

    addFrame(group: TGroup, highlight: boolean) {
        const { a, b, c, d, e, f } = this.ctx.getTransform();
        this.frames.push({ group, matrix: [a, b, c, d, e, f], alpha: this.alpha, clips: [...this.clips], highlight });
    }

    pushClip(x: number, y: number, width: number, height: number) {
        const { a, b, c, d, e, f } = this.ctx.getTransform();
        const polygon: number[] = [];
        for (const [px, py] of [
            [x, y],
            [x + width, y],
            [x + width, y + height],
            [x, y + height],
        ]) {
            polygon.push(a * px + c * py + e, b * px + d * py + f);
        }
        this.clips.push(polygon);
    }
}
