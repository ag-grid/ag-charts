import type { FocusIndicator } from '../dom/focusIndicator';
import { BBox } from '../scene/bbox';
import type { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import { getDatumRefPoint } from './series/seriesTypes';
import type { TooltipPointerEvent } from './tooltip/tooltip';

type PickProperties = {
    bounds: Path | BBox | undefined;
    datum: Parameters<typeof getDatumRefPoint>[0];
    showFocusBox: boolean;
    clipFocusBox: boolean;
};

function computeCenter(hoverRect: BBox, pick: PickProperties) {
    const refPoint = getDatumRefPoint(pick.datum);
    if (refPoint != null) return { x: refPoint.canvasX, y: refPoint.canvasY };

    const bboxOrPath = pick.bounds;
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
    const { x: canvasX, y: canvasY } = computeCenter(hoverRect, pick) ?? {};
    if (canvasX !== undefined && canvasY !== undefined) {
        return { type: 'keyboard', canvasX, canvasY };
    }
    return undefined;
}
