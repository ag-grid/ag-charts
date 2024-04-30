import type { BBox } from '../scene/bbox';
import type { RegionManager } from './interaction/regionManager';
import type { TooltipPointerEvent } from './tooltip/tooltip';
export declare function makeKeyboardPointerEvent(regionManager: RegionManager, pick: {
    bbox: BBox | undefined;
    showFocusBox: boolean;
}): TooltipPointerEvent<'keyboard'> | undefined;
