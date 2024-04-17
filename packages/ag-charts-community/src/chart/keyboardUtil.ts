import type { BBox } from '../scene/bbox';
import type { RegionManager } from './interaction/regionManager';
import type { TooltipPointerEvent } from './tooltip/tooltip';

export function makeKeyboardPointerEvent(
    regionManager: RegionManager,
    bbox: BBox | undefined
): TooltipPointerEvent<'keyboard'> | undefined {
    regionManager.updateFocusIndicatorRect(bbox);
    if (bbox !== undefined) {
        const { x: offsetX, y: offsetY } = bbox.computeCenter();
        return { type: 'keyboard', offsetX, offsetY };
    }
    return undefined;
}
