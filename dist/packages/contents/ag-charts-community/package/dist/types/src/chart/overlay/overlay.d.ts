import type { BBox } from '../../scene/bbox';
import { BaseProperties } from '../../util/properties';
import type { AnimationManager } from '../interaction/animationManager';
import type { LocaleManager } from '../locale/localeManager';
export declare const DEFAULT_OVERLAY_CLASS = "ag-chart-overlay";
export declare const DEFAULT_OVERLAY_DARK_CLASS = "ag-chart-dark-overlay";
export declare class Overlay extends BaseProperties {
    protected className: string;
    protected defaultMessageId: string;
    text?: string;
    renderer?: () => string | HTMLElement;
    private content?;
    focusBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    constructor(className: string, defaultMessageId: string);
    getText(localeManager: LocaleManager): string;
    getElement(animationManager: AnimationManager | undefined, localeManager: LocaleManager, rect: BBox): HTMLElement;
    removeElement(cleanup?: () => void | undefined, animationManager?: AnimationManager): void;
}
