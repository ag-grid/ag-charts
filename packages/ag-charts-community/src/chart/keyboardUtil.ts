import type { FocusIndicator } from '../dom/focusIndicator';
import { BBox } from '../scene/bbox';
import type { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { TooltipPointerEvent } from './tooltip/tooltip';

function computeCenter(hoverRect: BBox, bboxOrPath: Path | BBox | undefined) {
    if (bboxOrPath == null) return;
    if (bboxOrPath instanceof BBox) {
        const { x: centerX, y: centerY } = bboxOrPath.computeCenter();
        return {
            x: hoverRect.x + centerX,
            y: hoverRect.y + centerY,
        };
    }
    return Transformable.toCanvas(bboxOrPath).computeCenter();
}

type PickProperties = { bounds: Path | BBox | undefined; showFocusBox: boolean; clipFocusBox: boolean };

export function drawPickedFocus(
    seriesRect: BBox | undefined,
    focusIndicator: FocusIndicator | undefined,
    pick: PickProperties,
    fixmeTranslatePathX?: number,
    fixmeTranslatePathY?: number
) {
    const { bounds, showFocusBox, clipFocusBox = true } = pick;
    if (showFocusBox) {
        focusIndicator?.updateBounds(
            bounds,
            clipFocusBox ? seriesRect : undefined,
            fixmeTranslatePathX,
            fixmeTranslatePathY
        );
    }
}

export function getPickedFocusBBox({ bounds }: PickProperties): BBox {
    if (bounds instanceof BBox) return bounds;
    if (bounds != null) return bounds.getBBox();
    return BBox.NaN;
}

export function makeKeyboardPointerEvent(
    hoverRect: BBox,
    pick: PickProperties
): TooltipPointerEvent<'keyboard'> | undefined {
    const { x: canvasX, y: canvasY } = computeCenter(hoverRect, pick.bounds) ?? {};
    if (canvasX !== undefined && canvasY !== undefined) {
        return { type: 'keyboard', canvasX, canvasY };
    }
    return undefined;
}
