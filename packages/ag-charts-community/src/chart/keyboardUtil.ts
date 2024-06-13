import { BBox } from '../scene/bbox';
import type { Path } from '../scene/shape/path';
import type { FocusIndicator } from './dom/focusIndicator';
import type { TooltipPointerEvent } from './tooltip/tooltip';

function computeCenter(bboxOrPath: Path | BBox | undefined) {
    if (bboxOrPath instanceof BBox) {
        return bboxOrPath.computeCenter();
    }
    return bboxOrPath?.computeTransformedBBox()?.computeCenter();
}

export function makeKeyboardPointerEvent(
    focusIndicator: FocusIndicator | undefined,
    pick: { bbox: Path | BBox | undefined; showFocusBox: boolean }
): TooltipPointerEvent<'keyboard'> | undefined {
    const { bbox, showFocusBox } = pick;
    if (showFocusBox) {
        if (pick.bbox instanceof BBox) {
            focusIndicator?.updateBBox(pick.bbox);
        } else {
            focusIndicator?.updatePath(pick.bbox);
        }
    }

    const { x: offsetX, y: offsetY } = computeCenter(bbox) ?? {};
    if (offsetX !== undefined && offsetY !== undefined) {
        return { type: 'keyboard', offsetX, offsetY };
    }
    return undefined;
}
