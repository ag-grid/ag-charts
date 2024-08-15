import { BBox } from '../scene/bbox';
import type { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { FocusIndicator } from '../dom/focusIndicator';
import type { TooltipPointerEvent } from './tooltip/tooltip';

function computeCenter(bboxOrPath: Path | BBox | undefined) {
    if (bboxOrPath == null) return;
    if (bboxOrPath instanceof BBox) {
        return bboxOrPath.computeCenter();
    }
    return Transformable.toCanvas(bboxOrPath).computeCenter();
}

type PickProperties = { bounds: Path | BBox | undefined; showFocusBox: boolean };

export function drawPickedFocus(focusIndicator: FocusIndicator | undefined, pick: PickProperties) {
    const { bounds, showFocusBox } = pick;
    if (showFocusBox) {
        focusIndicator?.updateBounds(bounds);
    }
}

export function makeKeyboardPointerEvent(
    focusIndicator: FocusIndicator | undefined,
    pick: PickProperties
): TooltipPointerEvent<'keyboard'> | undefined {
    drawPickedFocus(focusIndicator, pick);

    const { x: offsetX, y: offsetY } = computeCenter(pick.bounds) ?? {};
    if (offsetX !== undefined && offsetY !== undefined) {
        return { type: 'keyboard', offsetX, offsetY };
    }
    return undefined;
}
