import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { measureLabelText } from '../rendering/textMeasurer';
import type { Text } from '../scene/shape/text';
import { lineHeightAtSize } from '../text/textUtil';
import { type LabelFit, fitLabelTextOrOverflowAutoSize, fontWithSize } from '../text/textWrapper';
import type { FontOptions } from '../types/text';
import {
    type ItemLabelRefit,
    type ItemLabelSource,
    itemContentInset,
    itemStrokeDepth,
    refitItemLabelRoom,
} from './itemPadding';
import type { LabelFitDescriptor, PositionedLabelCandidate } from './labelPlacement';

/** How an item holds its labels in: the padding option and the inset it merged to with the resting stroke. */
export interface ItemLabelInsets {
    readonly padding: number;
    readonly inset: number;
    readonly centred: boolean;
}

/** {@link ItemLabelInsets} for an item drawn with `stroke` at rest; `centred` for a stroke centred on its outline. */
export function itemLabelInsets(
    padding: number,
    stroke: unknown,
    strokeWidth: number | undefined,
    centred = false
): ItemLabelInsets {
    return { padding, inset: itemContentInset(padding, itemStrokeDepth(stroke, strokeWidth, centred)), centred };
}

/** Which way an anchored label's end moves in: `1` from the low side, `-1` from the high side, `0` when centred. */
export function inwardOf(low: boolean, high: boolean): number {
    if (low) return 1;
    return high ? -1 : 0;
}

/**
 * The room the placement engine fitted an inside label into, written into `out` when given; `undefined` for a
 * candidate with no container. A shaped room keeps the box the fitted text took, which stays inside the shape as
 * its edges move in or out. `spacing` is the gap an anchored end keeps from its item's edge.
 */
export function placedItemLabelRoom(
    out: ItemLabelSource | undefined,
    insets: ItemLabelInsets,
    fit: LabelFitDescriptor,
    candidate: PositionedLabelCandidate | undefined,
    fittedText: NormalisedTextOrSegments,
    fontSize: number | undefined,
    rotationDeg: number,
    spacing: number
): ItemLabelSource | undefined {
    const fitTo = candidate?.fitTo;
    if (fitTo?.container == null) return undefined;
    const container =
        fitTo.shape == null
            ? fitTo.container
            : measureLabelText(fittedText, fontWithSize(fitTo.font ?? fit.font, fontSize));
    // An anchored label faces the end it hangs off, so its alignment says which way that end moves in.
    const { textAlign, textBaseline } = fitTo.anchor;
    const room = out ?? {
        ...insets,
        text: fit.text,
        fit: fit.policy,
        width: 0,
        height: 0,
        spacing: 0,
        anchorX: 0,
        anchorY: 0,
    };
    room.text = fit.text;
    room.fit = fit.policy;
    // The room is kept in canvas axes, so a quarter-turned label's glyph width runs along its height.
    const turned = rotationDeg % 180 !== 0;
    room.width = turned ? container.height : container.width;
    room.height = turned ? container.width : container.height;
    room.padding = insets.padding;
    room.inset = insets.inset;
    room.centred = insets.centred;
    room.spacing = spacing;
    room.anchorX = inwardOf(textAlign === 'left', textAlign === 'right');
    room.anchorY = inwardOf(textBaseline === 'top', textBaseline === 'bottom');
    return room;
}

/**
 * The room a label was fitted into by `fit`, `width` by `height`, which it re-fits to as its item's edges move;
 * `anchorX` and `anchorY` say which edge, if any, it is aligned to (see {@link inwardOf}).
 */
export function itemLabelRoom(
    insets: ItemLabelInsets,
    text: NormalisedTextOrSegments,
    fit: LabelFit,
    width: number,
    height: number,
    anchorX = 0,
    anchorY = 0
): ItemLabelSource {
    const { padding, inset, centred } = insets;
    return { padding, inset, centred, text, fit, width, height, spacing: 0, anchorX, anchorY };
}

/**
 * The room a label placed inside its marker was fitted into, by `policy` from the marker's `base` fit: the rect it was
 * bounded by, or for a fit to the marker's outline the box the fitted text took, which stays inside the outline as it
 * moves in or out. `undefined` for a label not bound to its marker.
 */
export function insideMarkerLabelRoom(
    insets: ItemLabelInsets,
    base: LabelFit | undefined,
    policy: LabelFit,
    text: NormalisedTextOrSegments,
    fittedText: NormalisedTextOrSegments,
    font: FontOptions,
    fontSize: number | undefined
): ItemLabelSource | undefined {
    if (base == null) return undefined;
    if (policy.region == null && policy.maxWidth != null && policy.maxHeight != null) {
        return itemLabelRoom(insets, text, base, policy.maxWidth, policy.maxHeight);
    }
    const box = measureLabelText(fittedText, fontWithSize(font, fontSize));
    return itemLabelRoom(insets, text, base, box.width, box.height);
}

type RefitTextNode = Pick<Text, 'text' | 'fontSize' | 'lineHeight' | 'x' | 'y' | 'getTextMeasureBBox'>;

/**
 * How a label node sits on its room: `aligned` when its text alignment faces the room's anchored ends, `free` when
 * it is drawn from a fixed corner, and `turned` when it is also quarter-turned about its glyph-box centre.
 */
export type ItemLabelLayout = 'aligned' | 'free' | 'turned';

const itemLabelRefit: ItemLabelRefit = { width: 0, height: 0, shiftX: 0, shiftY: 0 };
const turnedLabelRoom = { width: 0, height: 0 };

/**
 * Re-fits a label node drawn at its resting fit to the room its item's drawn stroke leaves, when that stroke moves
 * an edge of the room. A label not `aligned` to its room is moved by what its drawn extent changed.
 */
export function refitItemLabelNode(
    textNode: RefitTextNode,
    room: ItemLabelSource,
    stroke: unknown,
    strokeWidth: number | undefined,
    font: FontOptions,
    layout: ItemLabelLayout = 'aligned'
): void {
    if (!refitItemLabelRoom(room, stroke, strokeWidth, itemLabelRefit)) return;
    const turned = layout === 'turned';
    let glyphRoom: { width: number; height: number } = itemLabelRefit;
    if (turned) {
        turnedLabelRoom.width = itemLabelRefit.height;
        turnedLabelRoom.height = itemLabelRefit.width;
        glyphRoom = turnedLabelRoom;
    }
    const before = layout === 'aligned' ? undefined : textNode.getTextMeasureBBox();
    const fit = {
        ...room.fit,
        maxWidth: Math.min(room.fit.maxWidth ?? Infinity, glyphRoom.width),
        maxHeight: Math.min(room.fit.maxHeight ?? Infinity, glyphRoom.height),
    };
    const { text, fontSize = font.fontSize } = fitLabelTextOrOverflowAutoSize(room.text, fit, undefined, font);
    textNode.text = text;
    textNode.fontSize = fontSize;
    textNode.lineHeight = lineHeightAtSize(font, fontSize);
    let { shiftX, shiftY } = itemLabelRefit;
    if (before != null) {
        const after = textNode.getTextMeasureBBox();
        const acrossX0 = turned ? before.height : before.width;
        const acrossX1 = turned ? after.height : after.width;
        const acrossY0 = turned ? before.width : before.height;
        const acrossY1 = turned ? after.width : after.height;
        shiftX += drawnEdgeShift(room.anchorX, before.x, before.width, acrossX0, after.x, after.width, acrossX1);
        shiftY += drawnEdgeShift(room.anchorY, before.y, before.height, acrossY0, after.y, after.height, acrossY1);
    }
    textNode.x += shiftX;
    textNode.y += shiftY;
}

/**
 * How far a label moves along one canvas axis to keep its drawn anchored edge, or its centre, where it was: its glyph
 * box spans `start` and `size` on that axis, and draws `extent` along it once any turn is applied.
 */
function drawnEdgeShift(
    anchor: number,
    start0: number,
    size0: number,
    extent0: number,
    start1: number,
    size1: number,
    extent1: number
): number {
    return start0 + size0 / 2 - (start1 + size1 / 2) - (anchor * (extent0 - extent1)) / 2;
}
