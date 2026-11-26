import type { AgCartesianCrossLineLabelPlacement } from 'ag-charts-types';

import type { AnchorDirection } from './labelRoom';

/**
 * `rangeH`/`rangeV` pick the point on the range's bounds the label is pinned to; `labelH`/`labelV` the
 * side it grows to from there, `1` meaning towards the left or top and `0` centred on the point.
 */
export interface RangeLabelAnchor {
    rangeH: AnchorDirection;
    rangeV: AnchorDirection;
    labelH: AnchorDirection;
    labelV: AnchorDirection;
}

export type PhysicalRangeLabelPlacement = Exclude<
    AgCartesianCrossLineLabelPlacement,
    `${string}start${string}` | `${string}end${string}`
>;

// The first token names the edge the label sits against, the second where along it.
export const RANGE_LABEL_ANCHORS: Record<PhysicalRangeLabelPlacement, RangeLabelAnchor> = {
    top: { rangeH: 0, rangeV: -1, labelH: 0, labelV: 1 },
    bottom: { rangeH: 0, rangeV: 1, labelH: 0, labelV: -1 },
    left: { rangeH: -1, rangeV: 0, labelH: 1, labelV: 0 },
    right: { rangeH: 1, rangeV: 0, labelH: -1, labelV: 0 },
    'top-left': { rangeH: -1, rangeV: -1, labelH: -1, labelV: 1 },
    'top-right': { rangeH: 1, rangeV: -1, labelH: 1, labelV: 1 },
    'bottom-left': { rangeH: -1, rangeV: 1, labelH: -1, labelV: -1 },
    'bottom-right': { rangeH: 1, rangeV: 1, labelH: 1, labelV: -1 },
    'left-top': { rangeH: -1, rangeV: -1, labelH: 1, labelV: -1 },
    'left-bottom': { rangeH: -1, rangeV: 1, labelH: 1, labelV: 1 },
    'right-top': { rangeH: 1, rangeV: -1, labelH: -1, labelV: -1 },
    'right-bottom': { rangeH: 1, rangeV: 1, labelH: -1, labelV: 1 },
    inside: { rangeH: 0, rangeV: 0, labelH: 0, labelV: 0 },
    'inside-top': { rangeH: 0, rangeV: -1, labelH: 0, labelV: -1 },
    'inside-bottom': { rangeH: 0, rangeV: 1, labelH: 0, labelV: 1 },
    'inside-left': { rangeH: -1, rangeV: 0, labelH: -1, labelV: 0 },
    'inside-right': { rangeH: 1, rangeV: 0, labelH: 1, labelV: 0 },
    'inside-top-left': { rangeH: -1, rangeV: -1, labelH: -1, labelV: -1 },
    'inside-top-right': { rangeH: 1, rangeV: -1, labelH: 1, labelV: -1 },
    'inside-bottom-left': { rangeH: -1, rangeV: 1, labelH: -1, labelV: 1 },
    'inside-bottom-right': { rangeH: 1, rangeV: 1, labelH: 1, labelV: 1 },
};

const TWIN_TOKENS: Record<string, string> = { start: 'left', end: 'right' };
const LOGICAL_TOKENS: Record<string, string> = { left: 'start', right: 'end' };
const MIRRORED_TOKENS: Record<string, string> = { left: 'right', right: 'left' };

function mapTokens(placement: string, tokens: Record<string, string>) {
    return placement
        .split('-')
        .map((token) => tokens[token] ?? token)
        .join('-');
}

/** The physical placement a `start`/`end` twin names, before the text direction is applied. */
export function twinLabelPlacement(placement: string): string {
    return mapTokens(placement, TWIN_TOKENS);
}

/** The `start`/`end` twin of a physical placement, or the placement itself when it has none. */
export function logicalLabelPlacement(placement: string): string {
    return mapTokens(placement, LOGICAL_TOKENS);
}

/** Swaps `left` and `right`, which is where a `start`/`end` twin lands in a right-to-left chart. */
export function mirrorLabelPlacement(placement: string): string {
    return mapTokens(placement, MIRRORED_TOKENS);
}

/** Whether a label at `anchor` sits inside the range it is pinned to. */
export function isInsideRangeAnchor({ rangeH, rangeV, labelH, labelV }: RangeLabelAnchor): boolean {
    return labelH === rangeH && labelV === rangeV;
}

/** The anchor `placement` names on a range, resolving a `start`/`end` twin by the text direction. */
export function resolveRangeLabelPlacement(placement: string, rtl: boolean): RangeLabelAnchor | undefined {
    const twin = twinLabelPlacement(placement);
    const physical = twin !== placement && rtl ? mirrorLabelPlacement(twin) : twin;
    return RANGE_LABEL_ANCHORS[physical as PhysicalRangeLabelPlacement];
}
