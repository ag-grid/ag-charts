import type { BBox } from '../../scene/bbox';
import { BaseProperties } from '../../util/properties';
import type { AnimationManager } from '../interaction/animationManager';
export declare const DEFAULT_OVERLAY_CLASS = "ag-chart-overlay";
export declare const DEFAULT_OVERLAY_DARK_CLASS = "ag-chart-dark-overlay";
export declare class Overlay extends BaseProperties {
    protected className: string;
    protected defaultText: string;
    text?: string;
    renderer?: () => string | HTMLElement;
    darkTheme: boolean;
    private element?;
    focusBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    constructor(className: string, defaultText: string);
    getText(): string;
    getElement(animationManager: AnimationManager | undefined, rect: BBox): HTMLElement;
    removeElement(animationManager?: AnimationManager): void;
}
