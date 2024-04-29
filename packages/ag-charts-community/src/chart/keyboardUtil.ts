import type { BBox } from '../scene/bbox';
import type { RegionManager } from './interaction/regionManager';
import type { TooltipPointerEvent } from './tooltip/tooltip';

export function makeKeyboardPointerEvent(
    regionManager: RegionManager,
    pick: { bbox: BBox | undefined; showFocusBox: boolean }
): TooltipPointerEvent<'keyboard'> | undefined {
    const { bbox, showFocusBox } = pick;
    if (showFocusBox) {
        regionManager.updateFocusIndicatorRect(pick.bbox);
    }

    if (bbox !== undefined) {
        const { x: offsetX, y: offsetY } = bbox.computeCenter();
        return { type: 'keyboard', offsetX, offsetY };
    }
    return undefined;
}
