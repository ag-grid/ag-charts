import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import type { Text } from '../scene/shape/text';
import { lineHeightAtSize } from '../text/textUtil';
import { type LabelFit, type RegionAlign, fitLabelTextOrOverflowAutoSize, hasRealChars } from '../text/textWrapper';
import type { FontOptions } from '../types/text';
import { type FitRegion, insetFitRegion } from './fitRegion';
import {
    type ItemLabelFit,
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
 * candidate with no container. A shaped room re-fits to the candidate's shape held further in, as the engine
 * fitted it. `spacing` is the gap an anchored end keeps from its item's edge.
 */
export function placedItemLabelRoom(
    out: ItemLabelSource | undefined,
    insets: ItemLabelInsets,
    fit: LabelFitDescriptor,
    candidate: PositionedLabelCandidate | undefined,
    rotationDeg: number,
    spacing: number
): ItemLabelSource | undefined {
    const fitTo = candidate?.fitTo;
    if (fitTo?.container == null) return undefined;
    const { container, shape } = fitTo;
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
    room.refit =
        shape == null
            ? undefined
            : (inset) =>
                  refitToShape(fit, fitTo.font ?? fit.font, container, shape, fitTo.shapeAlign, inset - insets.inset);
    return room;
}

/** Fits a label as the engine fitted it to its candidate's shape and container, each held `delta` further in. */
function refitToShape(
    fit: Pick<LabelFitDescriptor, 'text' | 'policy' | 'fitOverflow'>,
    font: FontOptions,
    container: { width: number; height: number },
    shape: FitRegion,
    shapeAlign: RegionAlign | undefined,
    delta: number
): ItemLabelFit | undefined {
    const { policy } = fit;
    const { text, fontSize } = fitLabelTextOrOverflowAutoSize(
        fit.text,
        {
            ...policy,
            maxWidth: Math.min(policy.maxWidth ?? Infinity, Math.max(0, container.width - 2 * delta)),
            maxHeight: Math.min(policy.maxHeight ?? Infinity, Math.max(0, container.height - 2 * delta)),
            region: insetFitRegion(shape, delta, delta),
            regionAlign: shapeAlign,
        },
        fit.fitOverflow,
        font
    );
    return hasRealChars(text) ? { text, fontSize } : undefined;
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
 * The room a label inside a marker was fitted into by `policy`, when `base` is how the series fits it; a marker
 * fitted by its shape re-fits to that shape held further in.
 */
export function insideMarkerLabelRoom(
    insets: ItemLabelInsets,
    base: LabelFit | undefined,
    policy: LabelFit,
    text: NormalisedTextOrSegments,
    font: FontOptions
): ItemLabelSource | undefined {
    if (base == null) return undefined;
    const { region, maxWidth = Infinity, maxHeight = Infinity } = policy;
    const room = itemLabelRoom(insets, text, base, maxWidth, maxHeight);
    if (region != null) {
        const container = { width: maxWidth, height: maxHeight };
        room.refit = (inset) =>
            refitToShape({ text, policy }, font, container, region, policy.regionAlign, inset - insets.inset);
    }
    return room;
}

type RefitTextNode = Pick<Text, 'text' | 'fontSize' | 'lineHeight' | 'x' | 'y' | 'getTextMeasureBBox'>;

/**
 * How a label node sits on its room: `aligned` when its text alignment faces the room's anchored ends, `free` when
 * it is drawn from a fixed corner, and `turned` when it is also quarter-turned about its glyph-box centre.
 */
export type ItemLabelLayout = 'aligned' | 'free' | 'turned';

const itemLabelRefit: ItemLabelRefit = { width: 0, height: 0, shiftX: 0, shiftY: 0 };
/** The last fit each shaped re-fit gave, so a label re-fits only when its item's drawn stroke changes depth. */
const shapedRefits = new WeakMap<object, { inset: number; fit: ItemLabelFit | undefined }>();
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
    if (room.refit != null) {
        const inset = itemContentInset(room.padding, itemStrokeDepth(stroke, strokeWidth, room.centred));
        refitShapedItemLabelNode(textNode, room, room.refit, inset, font);
        return;
    }
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
 * Re-fits a label to its item's own shape at the inset the drawn stroke leaves. A fit that does not place the label
 * keeps its centre, or its anchored edge moved in with the item's.
 */
function refitShapedItemLabelNode(
    textNode: RefitTextNode,
    room: ItemLabelSource,
    refit: (inset: number) => ItemLabelFit | undefined,
    inset: number,
    font: FontOptions
): void {
    let last = shapedRefits.get(refit);
    if (last?.inset !== inset) {
        last = { inset, fit: refit(inset) };
        shapedRefits.set(refit, last);
    }
    const { fit } = last;
    if (fit == null) {
        textNode.text = '';
        return;
    }
    const before = fit.x == null || fit.y == null ? textNode.getTextMeasureBBox() : undefined;
    const fontSize = fit.fontSize ?? font.fontSize;
    textNode.text = fit.text;
    textNode.fontSize = fontSize;
    textNode.lineHeight = lineHeightAtSize(font, fontSize);
    if (before != null) {
        const after = textNode.getTextMeasureBBox();
        const { anchorX, anchorY } = room;
        const { shiftX, shiftY } = itemLabelRefit;
        textNode.x +=
            shiftX + drawnEdgeShift(anchorX, before.x, before.width, before.width, after.x, after.width, after.width);
        textNode.y +=
            shiftY +
            drawnEdgeShift(anchorY, before.y, before.height, before.height, after.y, after.height, after.height);
    }
    if (fit.x != null) textNode.x = fit.x;
    if (fit.y != null) textNode.y = fit.y;
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
