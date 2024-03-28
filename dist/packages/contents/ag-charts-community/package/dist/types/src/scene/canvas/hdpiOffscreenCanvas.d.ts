type OffscreenCanvasRenderingContext2D = any;
type OffscreenCanvas = any;
interface OffscreenCanvasOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
}
/**
 * Wraps a native OffscreenCanvas and overrides its OffscreenCanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export declare class HdpiOffscreenCanvas {
    readonly context: OffscreenCanvasRenderingContext2D & {
        verifyDepthZero?: () => void;
    };
    readonly canvas: OffscreenCanvas;
    protected imageSource: ImageBitmap;
    enabled: boolean;
    width: number;
    height: number;
    pixelRatio: number;
    static isSupported(): boolean;
    constructor({ width, height, pixelRatio }: OffscreenCanvasOptions);
    drawImage(context: CanvasRenderingContext2D, dx?: number, dy?: number): void;
    resize(width: number, height: number): void;
    snapshot(): void;
    clear(): void;
    destroy(): void;
}
export {};
