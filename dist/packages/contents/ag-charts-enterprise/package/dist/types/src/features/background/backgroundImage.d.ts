import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class BackgroundImage extends BaseProperties {
    private readonly imageElement;
    private loadedSynchronously;
    readonly node: _Scene.Image;
    constructor(ctx: Pick<_ModuleSupport.ModuleContext, 'document'>);
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    width?: number;
    height?: number;
    opacity: number;
    url?: string;
    get complete(): boolean;
    private containerWidth;
    private containerHeight;
    onLoad?: () => void;
    performLayout(containerWidth: number, containerHeight: number): void;
    calculatePosition(naturalWidth: number, naturalHeight: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    private onImageLoad;
}
export {};
