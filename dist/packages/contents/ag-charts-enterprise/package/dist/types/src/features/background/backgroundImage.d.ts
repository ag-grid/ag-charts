import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class BackgroundImage extends BaseProperties {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    width?: number;
    height?: number;
    opacity: number;
    url?: string;
    private readonly imageElement;
    private loadedSynchronously;
    readonly node: _Scene.Image;
    constructor();
    get complete(): boolean;
    private containerWidth;
    private containerHeight;
    onLoad?: () => void;
    performLayout(containerWidth: number, containerHeight: number): void;
    private onImageLoad;
}
export {};
