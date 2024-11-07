import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { ChartAxisDirection } from '../chartAxisDirection';

export type CrossLineLabelPosition =
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'inside'
    | 'inside-left'
    | 'inside-right'
    | 'inside-top'
    | 'inside-bottom'
    | 'inside-top-left'
    | 'inside-bottom-left'
    | 'inside-top-right'
    | 'inside-bottom-right';

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
    'top-left': { xTranslationDirection: 1, yTranslationDirection: -1 },
    'top-right': { xTranslationDirection: -1, yTranslationDirection: -1 },
    'bottom-left': { xTranslationDirection: 1, yTranslationDirection: 1 },
    'bottom-right': { xTranslationDirection: -1, yTranslationDirection: 1 },
    inside: { xTranslationDirection: 0, yTranslationDirection: 0 },
    'inside-left': { xTranslationDirection: 1, yTranslationDirection: 0 },
    'inside-right': { xTranslationDirection: -1, yTranslationDirection: 0 },
    'inside-top': { xTranslationDirection: 0, yTranslationDirection: 1 },
    'inside-bottom': { xTranslationDirection: 0, yTranslationDirection: -1 },
    'inside-top-left': { xTranslationDirection: 1, yTranslationDirection: 1 },
    'inside-bottom-left': { xTranslationDirection: 1, yTranslationDirection: -1 },
    'inside-top-right': { xTranslationDirection: -1, yTranslationDirection: 1 },
    'inside-bottom-right': { xTranslationDirection: -1, yTranslationDirection: -1 },
};

const verticalCrossLineTranslationDirections: Record<CrossLineLabelPosition, CrossLineTranslationDirection> = {
    top: { xTranslationDirection: 1, yTranslationDirection: 0 },
    bottom: { xTranslationDirection: -1, yTranslationDirection: 0 },
    left: { xTranslationDirection: 0, yTranslationDirection: -1 },
    right: { xTranslationDirection: 0, yTranslationDirection: 1 },
    'top-left': { xTranslationDirection: -1, yTranslationDirection: -1 },
    'top-right': { xTranslationDirection: -1, yTranslationDirection: 1 },
    'bottom-left': { xTranslationDirection: 1, yTranslationDirection: -1 },
    'bottom-right': { xTranslationDirection: 1, yTranslationDirection: 1 },
    inside: { xTranslationDirection: 0, yTranslationDirection: 0 },
    'inside-left': { xTranslationDirection: 0, yTranslationDirection: 1 },
    'inside-right': { xTranslationDirection: 0, yTranslationDirection: -1 },
    'inside-top': { xTranslationDirection: -1, yTranslationDirection: 0 },
    'inside-bottom': { xTranslationDirection: 1, yTranslationDirection: 0 },
    'inside-top-left': { xTranslationDirection: -1, yTranslationDirection: 1 },
    'inside-bottom-left': { xTranslationDirection: 1, yTranslationDirection: 1 },
    'inside-top-right': { xTranslationDirection: -1, yTranslationDirection: -1 },
    'inside-bottom-right': { xTranslationDirection: 1, yTranslationDirection: -1 },
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
    'top-left': { c: POSITION_TOP_LEFT_COORDINATES },
    'top-right': { c: POSITION_TOP_RIGHT_COORDINATES },
    'bottom-left': { c: POSITION_BOTTOM_LEFT_COORDINATES },
    'bottom-right': { c: POSITION_BOTTOM_RIGHT_COORDINATES },
    inside: { c: POSITION_INSIDE_COORDINATES },
    'inside-left': { c: POSITION_LEFT_COORDINATES },
    'inside-right': { c: POSITION_RIGHT_COORDINATES },
    'inside-top': { c: POSITION_TOP_COORDINATES },
    'inside-bottom': { c: POSITION_BOTTOM_COORDINATES },
    'inside-top-left': { c: POSITION_TOP_LEFT_COORDINATES },
    'inside-bottom-left': { c: POSITION_BOTTOM_LEFT_COORDINATES },
    'inside-top-right': { c: POSITION_TOP_RIGHT_COORDINATES },
    'inside-bottom-right': { c: POSITION_BOTTOM_RIGHT_COORDINATES },
};
