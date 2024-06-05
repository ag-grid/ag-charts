import type { BBox } from '../scene/bbox';
import type { FocusIndicator } from './dom/focusIndicator';
import type { TooltipPointerEvent } from './tooltip/tooltip';

export function makeKeyboardPointerEvent(
    focusIndicator: FocusIndicator | undefined,
    pick: { bbox: BBox | undefined; showFocusBox: boolean }
): TooltipPointerEvent<'keyboard'> | undefined {
    const { bbox, showFocusBox } = pick;
    if (showFocusBox) {
        focusIndicator?.updateBBox(pick.bbox);
    }

    if (bbox !== undefined) {
        const { x: offsetX, y: offsetY } = bbox.computeCenter();
        return { type: 'keyboard', offsetX, offsetY };
    }
    return undefined;
}
