import { HdpiCanvas } from './canvas/hdpiCanvas';
import { LayersManager } from './layersManager';
import type { Node } from './node';
interface SceneOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
    canvasPosition?: 'absolute';
}
export declare class Scene {
    static readonly className = "Scene";
    private readonly debug;
    readonly id: string;
    readonly canvas: HdpiCanvas;
    readonly layersManager: LayersManager;
    private root;
    private isDirty;
    private pendingSize?;
    constructor({ width, height, pixelRatio, canvasPosition }: SceneOptions);
    get width(): number;
    get height(): number;
    setContainer(value: HTMLElement): this;
    setRoot(node: Node | null): this;
    attachNode<T extends Node>(node: T): () => this;
    appendChild<T extends Node>(node: T): this;
    removeChild<T extends Node>(node: T): this;
    download(fileName?: string, fileFormat?: string): void;
    /** NOTE: Integrated Charts undocumented image download method. */
    getDataURL(fileFormat?: string): string;
    resize(width: number, height: number): boolean;
    render(opts?: {
        debugSplitTimes: Record<string, number>;
        extraDebugStats: Record<string, number>;
    }): Promise<void>;
    /** Alternative to destroy() that preserves re-usable resources. */
    strip(): void;
    destroy(): void;
}
export {};
