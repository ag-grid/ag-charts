import type { FocusIndicator } from '../dom/focusIndicator';
import { BBox } from '../scene/bbox';
import type { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { TooltipPointerEvent } from './tooltip/tooltip';

function computeCenter(seriesRect: BBox, bboxOrPath: Path | BBox | undefined) {
    if (bboxOrPath == null) return;
    if (bboxOrPath instanceof BBox) {
        const { x: centerX, y: centerY } = bboxOrPath.computeCenter();
        return {
            x: seriesRect.x + centerX,
            y: seriesRect.y + centerY,
        };
    }
    return Transformable.toCanvas(bboxOrPath).computeCenter();
}

type PickProperties = { bounds: Path | BBox | undefined; showFocusBox: boolean };

function drawPickedFocus(seriesRect: BBox, focusIndicator: FocusIndicator | undefined, pick: PickProperties) {
    const { bounds, showFocusBox } = pick;
    if (showFocusBox) {
        focusIndicator?.updateBounds(bounds, seriesRect);
    }
}

export function getPickedFocusBBox({ bounds }: PickProperties): BBox {
    if (bounds instanceof BBox) return bounds;
    if (bounds != null) return bounds.getBBox();
    return BBox.NaN;
}

export function makeKeyboardPointerEvent(
    seriesRect: BBox,
    focusIndicator: FocusIndicator | undefined,
    pick: PickProperties
): TooltipPointerEvent<'keyboard'> | undefined {
    drawPickedFocus(seriesRect, focusIndicator, pick);

    const { x: canvasX, y: canvasY } = computeCenter(seriesRect, pick.bounds) ?? {};
    if (canvasX !== undefined && canvasY !== undefined) {
        return { type: 'keyboard', canvasX, canvasY };
    }
    return undefined;
}
