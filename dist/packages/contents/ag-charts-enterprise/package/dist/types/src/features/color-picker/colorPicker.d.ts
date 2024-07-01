import { _ModuleSupport } from 'ag-charts-community';
export declare class ColorPicker extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    readonly ctx: _ModuleSupport.ModuleContext;
    private readonly element;
    private anchor?;
    private fallbackAnchor?;
    constructor(ctx: _ModuleSupport.ModuleContext);
    show(opts: {
        color?: string;
        onChange?: (colorString: string) => void;
        onClose: () => void;
    }): void;
    setAnchor(anchor: {
        x: number;
        y: number;
    }, fallbackAnchor?: {
        x?: number;
        y?: number;
    }): void;
    hide(): void;
    isChildElement(element: HTMLElement): boolean;
    private updatePosition;
    private repositionWithinBounds;
}
