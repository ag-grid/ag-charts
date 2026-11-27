import {
    type CrossLineType,
    type PhysicalRangeLabelPlacement,
    RANGE_LABEL_ANCHORS,
    type RangeLabelAnchor,
    logicalLabelPlacement,
    mirrorLabelPlacement,
    twinLabelPlacement,
} from 'ag-charts-core';

const RANGE_PLACEMENTS = new Set(Object.keys(RANGE_LABEL_ANCHORS));

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
        const twin = logicalLabelPlacement(name);
        if (twin !== name) names.push(twin);
    }
    if (context.type === 'line' && !context.horizontal) names.push(...Object.keys(VERTICAL_LINE_INSIDE_TWINS));
    return names.map((name) => `\`${name}\``).join(', ');
}

/** Resolves one `placement` entry to its anchor, or `undefined` when it does not apply to this cross line. */
function resolvePlacement(placement: string, context: CrossLinePlacementContext): RangeLabelAnchor | undefined {
    if (context.type === 'line' && !context.horizontal) {
        placement = VERTICAL_LINE_INSIDE_TWINS[placement] ?? placement;
    }

    let physical = twinLabelPlacement(placement);
    const twinned = physical !== placement;

    if (!validPlacements(context).has(physical)) {
        context.warn(
            `Placement \`${placement}\` does not apply to ${describeCrossLine(context)} and is ignored; expecting one of ${validPlacementNames(context)}.`
        );
        return;
    }

    if (twinned && context.rtl) physical = mirrorLabelPlacement(physical);
    return RANGE_LABEL_ANCHORS[physical as PhysicalRangeLabelPlacement];
}

/** The anchors to try in order; `top` is the default. */
export function resolveCrossLinePlacements(
    placement: string | readonly string[] | undefined,
    context: CrossLinePlacementContext
): RangeLabelAnchor[] {
    const anchors: RangeLabelAnchor[] = [];
    if (placement != null) {
        for (const entry of typeof placement === 'string' ? [placement] : placement) {
            const anchor = resolvePlacement(entry, context);
            if (anchor != null) anchors.push(anchor);
        }
    }
    if (anchors.length === 0) anchors.push(RANGE_LABEL_ANCHORS.top);
    return anchors;
}
