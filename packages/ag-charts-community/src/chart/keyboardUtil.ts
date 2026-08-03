import type { CanvasPoint } from 'ag-charts-core';
import type { AgCoordinates } from 'ag-charts-types';

import { BBox } from '../scene/bbox';
import type { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { ISeries, SeriesNodeDatum } from './series/seriesTypes';
import { getDatumRefPoint } from './series/util';
import type { TooltipPointerEvent } from './tooltip/tooltip';

type PickProperties = {
    bounds: Path | BBox | undefined;
    datum: Parameters<typeof getDatumRefPoint>[1];
    movedBounds?: Parameters<typeof getDatumRefPoint>[2];
    clipFocusBox: boolean;
};

type CoordinateCalculator = {
    toAgCoordinates(point: CanvasPoint): AgCoordinates | undefined;
};

function computeCenter(series: ISeries<any, any, any>, hoverRect: BBox, pick: PickProperties) {
    const refPoint = getDatumRefPoint(series, pick.datum, pick.movedBounds);
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

export function getPickedFocusBBox({ bounds }: PickProperties): Readonly<BBox> {
    if (bounds instanceof BBox) return bounds;
    if (bounds != null) return Transformable.toCanvas(bounds);
    return BBox.NaN;
}

export function makeKeyboardPointerEvent(
    series: ISeries<any, any, any>,
    hoverRect: BBox,
    pick: PickProperties
): TooltipPointerEvent<'keyboard'> | undefined {
    const { x: canvasX, y: canvasY } = computeCenter(series, hoverRect, pick) ?? {};
    if (canvasX !== undefined && canvasY !== undefined) {
        return { type: 'keyboard', canvasX, canvasY };
    }
    return undefined;
}

export function makeKeyboardAgCoordinates(
    calculator: CoordinateCalculator,
    datum: SeriesNodeDatum
): AgCoordinates | undefined {
    const refPoint = getDatumRefPoint(datum.series, datum, undefined);
    return refPoint === undefined ? undefined : calculator.toAgCoordinates(refPoint);
}
