import type { CanvasPoint } from 'ag-charts-core';
import type { AgCoordinates } from 'ag-charts-types';

import { BBox } from '../scene/bbox';
import { Transformable } from '../scene/transformable';
import type { PickFocusOutputs } from './series/pickTypes';
import { SeriesNodeDatumSentinel } from './series/pickTypes';
import type { ISeries, SeriesNodeDatum } from './series/seriesTypes';
import { getDatumRefPoint } from './series/util';
import type { TooltipPointerEvent } from './tooltip/tooltip';

type CoordinateCalculator = {
    toAgCoordinates(point: CanvasPoint): AgCoordinates | undefined;
};

function computeRefPoint(series: ISeries<any, any, any>, pick: PickFocusOutputs) {
    if (pick.datum === SeriesNodeDatumSentinel.CULLED) return undefined;
    return getDatumRefPoint(series, pick.datum, pick.movedBounds);
}

function computeCenter(series: ISeries<any, any, any>, hoverRect: BBox, pick: PickFocusOutputs) {
    const refPoint = computeRefPoint(series, pick);
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

export function getPickedFocusBBox({ bounds }: PickFocusOutputs): Readonly<BBox> {
    if (bounds instanceof BBox) return bounds;
    if (bounds != null) return Transformable.toCanvas(bounds);
    return BBox.NaN;
}

export function makeKeyboardPointerEvent(
    series: ISeries<any, any, any>,
    hoverRect: BBox,
    pick: PickFocusOutputs
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
