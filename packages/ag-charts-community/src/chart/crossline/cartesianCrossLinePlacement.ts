import type { CrossLineType } from 'ag-charts-core';
import type { AgCartesianCrossLineLabelPlacement } from 'ag-charts-types';

export type AnchorDirection = 1 | 0 | -1;

/**
 * `rangeH`/`rangeV` pick the point on the cross line's bounds the label is pinned to; `labelH`/`labelV` the
 * side it grows to from there, `1` meaning towards the left or top and `0` centred on the point.
 */
export interface Anchor {
    rangeH: AnchorDirection;
    rangeV: AnchorDirection;
    labelH: AnchorDirection;
    labelV: AnchorDirection;
}

type PhysicalPlacement = Exclude<
    AgCartesianCrossLineLabelPlacement,
    `${string}start${string}` | `${string}end${string}`
>;

// The first token names the edge the label sits against, the second where along it.
const ANCHORS: Record<PhysicalPlacement, Anchor> = {
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

const RANGE_PLACEMENTS = new Set(Object.keys(ANCHORS));

const HORIZONTAL_LINE_PLACEMENTS = new Set<string>([
    'top',
    'bottom',
    'left',
    'right',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'inside',
    'inside-left',
    'inside-right',
]);

const VERTICAL_LINE_PLACEMENTS = new Set<string>([
    'top',
    'bottom',
    'left',
    'right',
    'left-top',
    'left-bottom',
    'right-top',
    'right-bottom',
    'inside',
    'inside-top',
    'inside-bottom',
]);

// Along a vertical line, these follow the line itself rather than the text direction.
const VERTICAL_LINE_INSIDE_TWINS: Record<string, string> = {
    'inside-start': 'inside-top',
    'inside-end': 'inside-bottom',
};

const TWIN_TOKENS: Record<string, string> = { start: 'left', end: 'right' };
const PHYSICAL_TOKENS: Record<string, string> = { left: 'start', right: 'end' };
const MIRRORED_TOKENS: Record<string, string> = { left: 'right', right: 'left' };

function mapTokens(placement: string, tokens: Record<string, string>) {
    return placement
        .split('-')
        .map((token) => tokens[token] ?? token)
        .join('-');
}

export interface CrossLinePlacementContext {
    type: CrossLineType;
    /** The cross line runs horizontally, i.e. it belongs to a y axis. */
    horizontal: boolean;
    rtl: boolean;
    warn(message: string): void;
}

function describeCrossLine({ type, horizontal }: CrossLinePlacementContext) {
    return `a ${type} cross line on ${horizontal ? 'a y' : 'an x'} axis`;
}

function validPlacements(context: CrossLinePlacementContext): Set<string> {
    if (context.type === 'range') return RANGE_PLACEMENTS;
    return context.horizontal ? HORIZONTAL_LINE_PLACEMENTS : VERTICAL_LINE_PLACEMENTS;
}

function validPlacementNames(context: CrossLinePlacementContext) {
    const names = [...validPlacements(context)];
    for (const name of [...names]) {
        const twin = mapTokens(name, PHYSICAL_TOKENS);
        if (twin !== name) names.push(twin);
    }
    if (context.type === 'line' && !context.horizontal) names.push(...Object.keys(VERTICAL_LINE_INSIDE_TWINS));
    return names.map((name) => `\`${name}\``).join(', ');
}

/** Resolves one `placement` entry to its anchor, or `undefined` when it does not apply to this cross line. */
function resolvePlacement(placement: string, context: CrossLinePlacementContext): Anchor | undefined {
    if (context.type === 'line' && !context.horizontal) {
        placement = VERTICAL_LINE_INSIDE_TWINS[placement] ?? placement;
    }

    let physical = mapTokens(placement, TWIN_TOKENS);
    const twinned = physical !== placement;

    if (!validPlacements(context).has(physical)) {
        context.warn(
            `Placement \`${placement}\` does not apply to ${describeCrossLine(context)} and is ignored; expecting one of ${validPlacementNames(context)}.`
        );
        return;
    }

    if (twinned && context.rtl) physical = mapTokens(physical, MIRRORED_TOKENS);
    return ANCHORS[physical as PhysicalPlacement];
}

/** The anchors to try in order; `top` is the default. */
export function resolveCrossLinePlacements(
    placement: string | readonly string[] | undefined,
    context: CrossLinePlacementContext
): Anchor[] {
    const anchors: Anchor[] = [];
    if (placement != null) {
        for (const entry of typeof placement === 'string' ? [placement] : placement) {
            const anchor = resolvePlacement(entry, context);
            if (anchor != null) anchors.push(anchor);
        }
    }
    if (anchors.length === 0) anchors.push(ANCHORS.top);
    return anchors;
}
