import { _ModuleSupport } from 'ag-charts-community';
import { BackgroundImage } from './backgroundImage';
export declare class Background extends _ModuleSupport.Background<BackgroundImage> {
    private readonly ctx;
    image: BackgroundImage;
    constructor(ctx: _ModuleSupport.ModuleContext);
    protected onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent): void;
    protected onImageLoad(): void;
}
