import type { BBox } from '../../scene/bbox';

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
