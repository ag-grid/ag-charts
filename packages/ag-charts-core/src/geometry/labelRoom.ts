import type { PaddingOptions } from 'ag-charts-types';

import {
    type LabelFit,
    type TurnedBounds,
    drawnLineHeight,
    fitLabelText,
    fontWithSize,
    hasRealChars,
    resolveMinimumFontSize,
    turnedBoundsHolding,
} from '../text/textWrapper';
import type { FontOptions } from '../types/text';
import { toRadians } from './angle';
import { leadCharacterWidth } from './labelPlacement';

/** `1` grows the label towards the left or top of the point it is pinned to, `-1` the other way, `0` centres it. */
export type AnchorDirection = 1 | 0 | -1;

/** A rotation component below this is a rounding artefact, not a real one, and must not divide a bound. */
export const ROTATION_EPSILON = 1e-6;

/** Room along one axis from `anchorAt` for a label growing in `labelDir`, held inside `low` to `high`. */
export function availableExtent(anchorAt: number, labelDir: AnchorDirection, pad: number, low: number, high: number) {
    if (labelDir === 1) return anchorAt - pad - low;
    if (labelDir === -1) return high - (anchorAt + pad);
    return 2 * Math.min(anchorAt - low, high - anchorAt);
}

/**
 * Room along one axis for a label pinned at `rangeDir` on the span `start` to `start + size`, held inside
 * `low` to `high`, which default to the span itself.
 */
export function anchorRoom(
    rangeDir: AnchorDirection,
    labelDir: AnchorDirection,
    pad: number,
    start: number,
    size: number,
    paddingDiff: number,
    low = start,
    high = start + size
): number {
    const anchorAt = start + (size * (rangeDir + 1)) / 2 - paddingDiff / 2;
    return Math.max(availableExtent(anchorAt, labelDir, pad, low, high), 0);
}

/** Zoom stretches a scale's range linearly about its axis range, so this undoes it for one position. */
export function unzoomedPosition(position: number, [s0, s1]: readonly number[], [r0, r1]: readonly number[]): number {
    return s1 === s0 ? position : r0 + ((position - s0) * (r1 - r0)) / (s1 - s0);
}

/** `roomX` by `roomY` less the boxing `insets`, turned to `rotation` degrees. */
export function turnedRoom(
    roomX: number,
    roomY: number,
    rotation: number,
    insets: Required<PaddingOptions> | undefined
): TurnedBounds {
    const cos = Math.abs(Math.cos(toRadians(rotation)));
    const sin = Math.abs(Math.sin(toRadians(rotation)));
    const insetsH = insets == null ? 0 : insets.left + insets.right;
    const insetsV = insets == null ? 0 : insets.top + insets.bottom;
    const width = Math.max(roomX - insetsH * cos - insetsV * sin, 0);
    const height = Math.max(roomY - insetsH * sin - insetsV * cos, 0);
    return { rotation, width, height };
}

/** The longest a label's own dimension can run at `along`/`across` (its turned cos/sin) inside a box. */
function turnedSpan(width: number, height: number, along: number, across: number): number {
    return Math.min(
        along > ROTATION_EPSILON ? width / along : Infinity,
        across > ROTATION_EPSILON ? height / across : Infinity
    );
}

/**
 * `turned` with the label's own width or height left unbounded, for a dimension something else bounds.
 * The result is in the label's own frame, hence unturned.
 */
export function freeTurnedRoom(
    turned: TurnedBounds,
    freeWidth: boolean,
    freeHeight: boolean
): TurnedBounds | undefined {
    if (freeWidth && freeHeight) return;
    if (!freeWidth && !freeHeight) return turned;

    const { width, height } = turned;
    const cos = Math.abs(Math.cos(toRadians(turned.rotation)));
    const sin = Math.abs(Math.sin(toRadians(turned.rotation)));
    return freeHeight
        ? { rotation: 0, width: turnedSpan(width, height, cos, sin), height: Infinity }
        : { rotation: 0, width: Infinity, height: turnedSpan(width, height, sin, cos) };
}

export interface KeptLabelText {
    text: string;
    fontSize: number;
    rotated?: TurnedBounds;
}

/** Refits a kept label its bounds left without a character, those bounds grown to hold its first one. */
export function fitKeptLabel(
    text: string,
    fit: LabelFit,
    label: FontOptions & { minimumFontSize?: number }
): KeptLabelText {
    const fontSize = resolveMinimumFontSize(label.minimumFontSize, label.fontSize);
    const font = fontWithSize(label, fontSize);
    const leadWidth = leadCharacterWidth(text, font);
    const lineHeight = drawnLineHeight(font);
    const { rotated: bounds, maxWidth, maxHeight, ...rest } = fit;
    const policy: LabelFit = {
        ...rest,
        maxWidth: maxWidth == null ? undefined : Math.max(maxWidth, leadWidth),
        maxHeight: maxHeight == null ? undefined : Math.max(maxHeight, lineHeight),
    };
    if (bounds != null) {
        const rotated = turnedBoundsHolding(bounds, leadWidth, lineHeight);
        const fitted = fitLabelText(text, { ...policy, rotated }, font);
        if (typeof fitted === 'string' && hasRealChars(fitted)) return { text: fitted, fontSize, rotated };
    }
    const own = fitLabelText(text, policy, font);
    return { text: typeof own === 'string' && hasRealChars(own) ? own : text, fontSize };
}
