type OffscreenCanvasRenderingContext2D = any;
export interface CanvasOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
    canvasConstructor?: () => HTMLCanvasElement;
}
/**
 * Wraps the native Canvas element and overrides its CanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export declare class HdpiCanvas {
    static is(value: unknown): value is HdpiCanvas;
    readonly element: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D & {
        verifyDepthZero?: () => void;
    };
    enabled: boolean;
    width: number;
    height: number;
    pixelRatio: number;
    constructor(options: CanvasOptions);
    drawImage(context: CanvasRenderingContext2D, dx?: number, dy?: number): void;
    toDataURL(type?: string): string;
    resize(width: number, height: number): void;
    snapshot(): void;
    clear(): void;
    destroy(): void;
    private onEnabledChange;
    static debugContext(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;
}
export {};
