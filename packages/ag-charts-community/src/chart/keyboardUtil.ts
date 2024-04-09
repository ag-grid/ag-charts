import type { Node } from '../scene/node';
import type { RegionManager } from './interaction/regionManager';
import type { TooltipPointerEvent } from './tooltip/tooltip';

export function makeKeyboardPointerEvent(
    regionManager: RegionManager,
    node: Node | undefined
): TooltipPointerEvent<'keyboard'> | undefined {
    const bbox = node?.computeTransformedBBox();
    regionManager.updateFocusIndicatorRect(bbox);
    if (bbox !== undefined) {
        const { x: offsetX, y: offsetY } = bbox.computeCenter();
        return { type: 'keyboard', offsetX, offsetY };
    }
    return undefined;
}
