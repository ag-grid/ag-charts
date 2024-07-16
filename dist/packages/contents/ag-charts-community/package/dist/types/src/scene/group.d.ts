import { BBox } from './bbox';
import type { HdpiCanvas } from './canvas/hdpiCanvas';
import type { LayersManager, ZIndexSubOrder } from './layersManager';
import type { ChildNodeCounts, RenderContext } from './node';
import { Node, RedrawType } from './node';
export declare class Group extends Node {
    protected readonly opts?: {
        readonly layer?: boolean | undefined;
        readonly zIndex?: number | undefined;
        readonly zIndexSubOrder?: ZIndexSubOrder | undefined;
        readonly isVirtual?: boolean | undefined;
        readonly name?: string | undefined;
        readonly nonEmptyChildDerivedZIndex?: boolean | undefined;
    } | undefined;
    static className: string;
    static is(value: unknown): value is Group;
    private clipRect?;
    protected layer?: HdpiCanvas;
    readonly name?: string;
    opacity: number;
    protected onZIndexChange(): void;
    isLayer(): boolean;
    constructor(opts?: {
        readonly layer?: boolean | undefined;
        readonly zIndex?: number | undefined;
        readonly zIndexSubOrder?: ZIndexSubOrder | undefined;
        readonly isVirtual?: boolean | undefined;
        readonly name?: string | undefined;
        readonly nonEmptyChildDerivedZIndex?: boolean | undefined;
    } | undefined);
    _setLayerManager(layersManager?: LayersManager): void;
    private initialiseLayer;
    protected getComputedOpacity(): number;
    protected getVisibility(): boolean;
    protected onVisibleChange(): void;
    markDirty(source: Node, type?: RedrawType): void;
    containsPoint(_x: number, _y: number): boolean;
    computeBBox(): BBox;
    computeTransformedBBox(): BBox | undefined;
    private lastBBox?;
    preRender(): ChildNodeCounts;
    deriveZIndexFromChildren(): void;
    render(renderCtx: RenderContext): void;
    private sortChildren;
    static computeBBox(nodes: Node[]): BBox;
    /**
     * Transforms bbox given in the canvas coordinate space to bbox in this group's coordinate space and
     * sets this group's clipRect to the transformed bbox.
     * @param bbox clipRect bbox in the canvas coordinate space.
     */
    setClipRectInGroupCoordinateSpace(bbox?: BBox): void;
}
