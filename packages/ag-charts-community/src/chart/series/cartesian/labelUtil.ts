import type { AgChartLabelOptions } from 'ag-charts-types';

import type { Point } from '../../../scene/point';
import type { Text } from '../../../scene/shape/text';

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type LabelPlacement =
    | 'inside-center'
    | 'inside-start'
    | 'inside-end'
    | 'outside-start'
    | 'outside-end'
    // @todo(AG-5950) Deprecate
    | 'start'
    | 'end'
    | 'inside'
    | 'outside';

type LabelDatum = Point & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
};

export function updateLabelNode(textNode: Text, label: AgChartLabelOptions<any, any>, labelDatum?: LabelDatum) {
    if (label.enabled && labelDatum) {
        const { x, y, text, textAlign, textBaseline } = labelDatum;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = label;
        textNode.setProperties({
            visible: true,
            x,
            y,
            text,
            fill,
            fontStyle,
            fontWeight,
            fontSize,
            fontFamily,
            textAlign,
            textBaseline,
        });
    } else {
        textNode.visible = false;
    }
}

interface PlacementConfig {
    inside: boolean;
    direction: -1 | 1;
    textAlignment: -1 | 1;
}

const placements: Record<Exclude<LabelPlacement, 'inside' | 'inside-center'>, PlacementConfig> = {
    'inside-start': { inside: true, direction: -1, textAlignment: 1 },
    'inside-end': { inside: true, direction: 1, textAlignment: -1 },
    'outside-start': { inside: false, direction: -1, textAlignment: -1 },
    'outside-end': { inside: false, direction: 1, textAlignment: 1 },
    // Remove these in a breaking release
    start: { inside: true, direction: -1, textAlignment: 1 },
    end: { inside: true, direction: 1, textAlignment: -1 },
    outside: { inside: false, direction: 1, textAlignment: 1 },
};

export function adjustLabelPlacement({
    isUpward,
    isVertical,
    placement,
    padding = 0,
    rect,
}: {
    placement: LabelPlacement;
    isUpward: boolean;
    isVertical: boolean;
    padding?: number;
    rect: Bounds;
}): Omit<LabelDatum, 'text'> {
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    let textAlign: CanvasTextAlign = 'center';
    let textBaseline: CanvasTextBaseline = 'middle';

    if (placement !== 'inside' && placement !== 'inside-center') {
        const barDirection = (isUpward ? 1 : -1) * (isVertical ? -1 : 1);
        const { direction, textAlignment } = placements[placement];
        const displacementRatio = (direction + 1) * 0.5;

        if (isVertical) {
            const y0 = isUpward ? rect.y + rect.height : rect.y;
            const height = rect.height * barDirection;
            y = y0 + height * displacementRatio + padding * textAlignment * barDirection;
            textBaseline = textAlignment === barDirection ? 'top' : 'bottom';
        } else {
            const x0 = isUpward ? rect.x : rect.x + rect.width;
            const width = rect.width * barDirection;
            x = x0 + width * displacementRatio + padding * textAlignment * barDirection;
            textAlign = textAlignment === barDirection ? 'left' : 'right';
        }
    }

    return { x, y, textAlign, textBaseline };
}
