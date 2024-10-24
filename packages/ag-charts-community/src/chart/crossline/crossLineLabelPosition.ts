import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { ChartAxisDirection } from '../chartAxisDirection';

export type CrossLineLabelPosition =
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'inside'
    | 'insideLeft'
    | 'insideRight'
    | 'insideTop'
    | 'insideBottom'
    | 'insideTopLeft'
    | 'insideBottomLeft'
    | 'insideTopRight'
    | 'insideBottomRight';

type CoordinatesFnOpts = { direction: ChartAxisDirection; xStart: number; xEnd: number; yStart: number; yEnd: number };

type CoordinatesFn = ({ direction, xStart, xEnd, yStart, yEnd }: CoordinatesFnOpts) => Point;

type PositionCalcFns = {
    c: CoordinatesFn;
};

type LabelTranslationDirection = 1 | -1 | 0;
type CrossLineTranslationDirection = {
    xTranslationDirection: LabelTranslationDirection;
    yTranslationDirection: LabelTranslationDirection;
};

const horizontalCrosslineTranslationDirections: Record<CrossLineLabelPosition, CrossLineTranslationDirection> = {
    top: { xTranslationDirection: 0, yTranslationDirection: -1 },
    bottom: { xTranslationDirection: 0, yTranslationDirection: 1 },
    left: { xTranslationDirection: -1, yTranslationDirection: 0 },
    right: { xTranslationDirection: 1, yTranslationDirection: 0 },
    topLeft: { xTranslationDirection: 1, yTranslationDirection: -1 },
    topRight: { xTranslationDirection: -1, yTranslationDirection: -1 },
    bottomLeft: { xTranslationDirection: 1, yTranslationDirection: 1 },
    bottomRight: { xTranslationDirection: -1, yTranslationDirection: 1 },
    inside: { xTranslationDirection: 0, yTranslationDirection: 0 },
    insideLeft: { xTranslationDirection: 1, yTranslationDirection: 0 },
    insideRight: { xTranslationDirection: -1, yTranslationDirection: 0 },
    insideTop: { xTranslationDirection: 0, yTranslationDirection: 1 },
    insideBottom: { xTranslationDirection: 0, yTranslationDirection: -1 },
    insideTopLeft: { xTranslationDirection: 1, yTranslationDirection: 1 },
    insideBottomLeft: { xTranslationDirection: 1, yTranslationDirection: -1 },
    insideTopRight: { xTranslationDirection: -1, yTranslationDirection: 1 },
    insideBottomRight: { xTranslationDirection: -1, yTranslationDirection: -1 },
};

const verticalCrossLineTranslationDirections: Record<CrossLineLabelPosition, CrossLineTranslationDirection> = {
    top: { xTranslationDirection: 1, yTranslationDirection: 0 },
    bottom: { xTranslationDirection: -1, yTranslationDirection: 0 },
    left: { xTranslationDirection: 0, yTranslationDirection: -1 },
    right: { xTranslationDirection: 0, yTranslationDirection: 1 },
    topLeft: { xTranslationDirection: -1, yTranslationDirection: -1 },
    topRight: { xTranslationDirection: -1, yTranslationDirection: 1 },
    bottomLeft: { xTranslationDirection: 1, yTranslationDirection: -1 },
    bottomRight: { xTranslationDirection: 1, yTranslationDirection: 1 },
    inside: { xTranslationDirection: 0, yTranslationDirection: 0 },
    insideLeft: { xTranslationDirection: 0, yTranslationDirection: 1 },
    insideRight: { xTranslationDirection: 0, yTranslationDirection: -1 },
    insideTop: { xTranslationDirection: -1, yTranslationDirection: 0 },
    insideBottom: { xTranslationDirection: 1, yTranslationDirection: 0 },
    insideTopLeft: { xTranslationDirection: -1, yTranslationDirection: 1 },
    insideBottomLeft: { xTranslationDirection: 1, yTranslationDirection: 1 },
    insideTopRight: { xTranslationDirection: -1, yTranslationDirection: -1 },
    insideBottomRight: { xTranslationDirection: 1, yTranslationDirection: -1 },
};

export function calculateLabelTranslation({
    yDirection,
    padding = 0,
    position = 'top',
    bbox,
}: {
    yDirection: boolean;
    padding: number;
    position: CrossLineLabelPosition;
    bbox: BBox;
}) {
    const crossLineTranslationDirections = yDirection
        ? horizontalCrosslineTranslationDirections
        : verticalCrossLineTranslationDirections;
    const { xTranslationDirection, yTranslationDirection } = crossLineTranslationDirections[position];
    const xTranslation = xTranslationDirection * (padding + bbox.width / 2);
    const yTranslation = yTranslationDirection * (padding + bbox.height / 2);

    return {
        xTranslation,
        yTranslation,
    };
}

export function calculateLabelChartPadding({
    yDirection,
    bbox,
    padding = 0,
    position = 'top',
}: {
    yDirection: boolean;
    padding: number;
    position: CrossLineLabelPosition;
    bbox: BBox;
}) {
    const chartPadding: Partial<Record<AgCartesianAxisPosition, number>> = {};
    if (position.startsWith('inside')) return chartPadding;

    if (position === 'top' && !yDirection) {
        chartPadding.top = padding + bbox.height;
    } else if (position === 'bottom' && !yDirection) {
        chartPadding.bottom = padding + bbox.height;
    } else if (position === 'left' && yDirection) {
        chartPadding.left = padding + bbox.width;
    } else if (position === 'right' && yDirection) {
        chartPadding.right = padding + bbox.width;
    }

    return chartPadding;
}

export const POSITION_TOP_COORDINATES: CoordinatesFn = ({ direction, xEnd, yStart, yEnd }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xEnd / 2, y: yStart };
    } else {
        return { x: xEnd, y: isNaN(yEnd) ? yStart : (yStart + yEnd) / 2 };
    }
};

const POSITION_LEFT_COORDINATES: CoordinatesFn = ({ direction, xStart, xEnd, yStart, yEnd }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xStart, y: isNaN(yEnd) ? yStart : (yStart + yEnd) / 2 };
    } else {
        return { x: xEnd / 2, y: yStart };
    }
};

const POSITION_RIGHT_COORDINATES: CoordinatesFn = ({ direction, xEnd, yStart, yEnd }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xEnd, y: isNaN(yEnd) ? yStart : (yStart + yEnd) / 2 };
    } else {
        return { x: xEnd / 2, y: isNaN(yEnd) ? yStart : yEnd };
    }
};

const POSITION_BOTTOM_COORDINATES: CoordinatesFn = ({ direction, xStart, xEnd, yStart, yEnd }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xEnd / 2, y: isNaN(yEnd) ? yStart : yEnd };
    } else {
        return { x: xStart, y: isNaN(yEnd) ? yStart : (yStart + yEnd) / 2 };
    }
};

const POSITION_INSIDE_COORDINATES: CoordinatesFn = ({ xEnd, yStart, yEnd }) => {
    return { x: xEnd / 2, y: isNaN(yEnd) ? yStart : (yStart + yEnd) / 2 };
};

const POSITION_TOP_LEFT_COORDINATES: CoordinatesFn = ({ direction, xStart, xEnd, yStart }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xStart / 2, y: yStart };
    } else {
        return { x: xEnd, y: yStart };
    }
};

const POSITION_BOTTOM_LEFT_COORDINATES: CoordinatesFn = ({ direction, xStart, yStart, yEnd }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xStart, y: isNaN(yEnd) ? yStart : yEnd };
    } else {
        return { x: xStart, y: yStart };
    }
};

const POSITION_TOP_RIGHT_COORDINATES: CoordinatesFn = ({ direction, xEnd, yStart, yEnd }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xEnd, y: yStart };
    } else {
        return { x: xEnd, y: isNaN(yEnd) ? yStart : yEnd };
    }
};

const POSITION_BOTTOM_RIGHT_COORDINATES: CoordinatesFn = ({ direction, xStart, xEnd, yStart, yEnd }) => {
    if (direction === ChartAxisDirection.Y) {
        return { x: xEnd, y: isNaN(yEnd) ? yStart : yEnd };
    } else {
        return { x: xStart, y: isNaN(yEnd) ? yStart : yEnd };
    }
};

export const labelDirectionHandling: Record<CrossLineLabelPosition, PositionCalcFns> = {
    top: { c: POSITION_TOP_COORDINATES },
    bottom: { c: POSITION_BOTTOM_COORDINATES },
    left: { c: POSITION_LEFT_COORDINATES },
    right: { c: POSITION_RIGHT_COORDINATES },
    topLeft: { c: POSITION_TOP_LEFT_COORDINATES },
    topRight: { c: POSITION_TOP_RIGHT_COORDINATES },
    bottomLeft: { c: POSITION_BOTTOM_LEFT_COORDINATES },
    bottomRight: { c: POSITION_BOTTOM_RIGHT_COORDINATES },
    inside: { c: POSITION_INSIDE_COORDINATES },
    insideLeft: { c: POSITION_LEFT_COORDINATES },
    insideRight: { c: POSITION_RIGHT_COORDINATES },
    insideTop: { c: POSITION_TOP_COORDINATES },
    insideBottom: { c: POSITION_BOTTOM_COORDINATES },
    insideTopLeft: { c: POSITION_TOP_LEFT_COORDINATES },
    insideBottomLeft: { c: POSITION_BOTTOM_LEFT_COORDINATES },
    insideTopRight: { c: POSITION_TOP_RIGHT_COORDINATES },
    insideBottomRight: { c: POSITION_BOTTOM_RIGHT_COORDINATES },
};
