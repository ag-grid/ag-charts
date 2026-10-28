/** The corners, in the coordinates of the group, of the rectangle that a path clips its drawing and its shadow to. */
export type ShadowClip = readonly number[];

/** A region of the layer in device pixels, as contours that are filled even-odd, so that a contour inside another is a hole. */
export type ShadowRegion = readonly ShadowClip[];

/** Where a caster of a `root` cast draws, which for a cast of one group is that of the group, and so is not repeated. */
export interface ShadowFrame {
    /** The a, b, c, d, e, f of the transform of the caster's group, in device pixels. */
    readonly matrix: readonly number[];
    /** The opacity that the caster draws at: the product of those of its groups, as they would draw it. */
    readonly alpha: number;
    /** The regions, in device pixels, that the groups of the caster clip their drawing to. */
    readonly clips: readonly ShadowRegion[];
}

export interface CollectedFrame extends ShadowFrame {
    /** The group whose children cast. */
    readonly source: object;
    /** The version of the group when it was gathered, which changes whenever it or anything below it is marked dirty. */
    readonly version: number;
}

/** What the collector reads of the context that the shadow root draws into. */
type CollectorContext = CanvasTransform &
    CanvasState & {
        readonly canvas: { readonly width: number; readonly height: number };
    };

export function transformCorners(matrix: readonly number[], corners: readonly number[]): number[] {
    const [a, b, c, d, e, f] = matrix;
    const result: number[] = [];
    for (let i = 0; i < corners.length; i += 2) {
        result.push(a * corners[i] + c * corners[i + 1] + e, b * corners[i] + d * corners[i + 1] + f);
    }
    return result;
}

/** Records the groups below a shadow root that cast through it, with the device-space state they draw in. */
export class ShadowCollector {
    alpha: number;
    readonly clips: ShadowRegion[] = [];
    readonly frames: CollectedFrame[] = [];

    constructor(
        readonly ctx: CollectorContext,
        alpha: number
    ) {
        this.alpha = alpha;
    }

    addFrame(source: object, version: number) {
        const { a, b, c, d, e, f } = this.ctx.getTransform();
        this.frames.push({ source, version, matrix: [a, b, c, d, e, f], alpha: this.alpha, clips: [...this.clips] });
    }

    pushRect(x: number, y: number, width: number, height: number) {
        this.clips.push([this.toDevice([x, y, x + width, y, x + width, y + height, x, y + height])]);
    }

    /** Clips to the layer less the holes, the rectangles `[x0, y0, x1, y1]` of the group. */
    pushGaps(holes: readonly (readonly [number, number, number, number])[]) {
        const { width, height } = this.ctx.canvas;
        const contours = [[0, 0, width, 0, width, height, 0, height]];
        for (const [x0, y0, x1, y1] of holes) contours.push(this.toDevice([x0, y0, x1, y0, x1, y1, x0, y1]));
        this.clips.push(contours);
    }

    private toDevice(corners: readonly number[]): number[] {
        const { a, b, c, d, e, f } = this.ctx.getTransform();
        return transformCorners([a, b, c, d, e, f], corners);
    }
}
