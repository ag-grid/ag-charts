import type { Selection, Shape, ShapeStyle } from 'ag-charts-core';

import { type GroupedFromToFns, GroupedFromToMotion } from '../../motion/groupedFromToMotion';
import type { AnimationManager } from '../interaction/animationManager';
import type { ShapeFillBBox } from './shapeUtil';

type StyledDatum = { readonly datumIndex?: unknown };

/** A series' shapes styled in place, and the copies of its highlighted items' shapes drawn over them. */
export interface StyleLayer<D extends StyledDatum, N extends Shape<D>> {
    /** Prefixes the layer's animation ids, to tell layers apart. */
    readonly subId: string;
    readonly selection: Selection<D, N>;
    /**
     * Copies of the highlighted items' shapes, matched to the shapes of `selection` by `datumIndex`. Leaving copies
     * share their datum with a live shape, so a series must skip `isGarbage` nodes when it resolves styles.
     */
    readonly highlightSelection: Selection<D, N>;
    /** Whether this update resolved the styles of `selection`; `highlightSelection` is resolved every update. */
    readonly restyled: boolean;
}

const NO_STYLE: ShapeStyle = {};

/** Style values that `Shape.setStyleProperties` applies for absent properties. */
const STYLE_DEFAULTS = { opacity: 1, fillOpacity: 1, strokeOpacity: 1, strokeWidth: 0 };

const COMPARED_PROPERTIES = [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeOpacity',
    'strokeWidth',
    'lineDashOffset',
    'opacity',
];

/**
 * Applies, or animates to, the `targetStyle` a series resolved for each of its shapes; shapes with equal styles share
 * one animation. A cutout erases the shape beneath it at any opacity, so the two hand over instead of cross-fading.
 */
export class ShapeStyleMotion {
    private readonly motion: GroupedFromToMotion;
    /** Distinct styles from this restyle and the one before, so that equal styles stay shared across them. */
    private sharedStyles: ShapeStyle[] = [];
    private readonly hiddenStyles = new WeakMap<ShapeStyle, ShapeStyle>();
    private lastShapeCount = 0;

    constructor(owner: { readonly id: string }, animationManager: AnimationManager) {
        this.motion = new GroupedFromToMotion(owner, animationManager);
    }

    animate<D extends StyledDatum, N extends Shape<D>>(layers: StyleLayer<D, N>[], fillBBox: ShapeFillBBox) {
        this.lastShapeCount = countShapes(layers);
        const share = this.startRestyle();
        for (const { subId, selection, highlightSelection, restyled } of layers) {
            const prefix = subId === '' ? '' : `${subId}-`;
            const leavingCutouts = collectLeavingCutouts(highlightSelection);
            if (restyled || leavingCutouts.size > 0) {
                const fns = this.prepareStyleFns<D, N>(fillBBox, share, {
                    leavingCutout: (node) => leavingCutouts.get(node.datum?.datumIndex),
                });
                this.motion.animate(`${prefix}style`, [selection], fns, { cleanupRemoved: false });
            }

            let underlays: Map<unknown, N | undefined> | undefined;
            const fns = this.prepareStyleFns<D, N>(fillBBox, share, {
                underlay: (node) => {
                    underlays ??= collectUnderlays(selection, highlightSelection);
                    return underlays.get(node.datum?.datumIndex);
                },
            });
            this.motion.animate(`${prefix}highlight-style`, [highlightSelection], fns);
        }
    }

    isAnimating() {
        return this.motion.isAnimating();
    }

    /** How many shapes the last restyle styled, for the chart to bound how many fade at once. */
    get shapeCount() {
        return this.lastShapeCount;
    }

    /**
     * Apply each shape's `targetStyle` without animating, unless the series `applied` them as it resolved them, and
     * remove the removed highlight copies.
     */
    reset<D extends StyledDatum, N extends Shape<D>>(
        layers: StyleLayer<D, N>[],
        fillBBox: ShapeFillBBox,
        { applied = false }: { applied?: boolean } = {}
    ) {
        this.lastShapeCount = countShapes(layers);
        for (const { selection, highlightSelection, restyled } of layers) {
            if (!applied) {
                if (restyled) this.resetSelection(selection, fillBBox);
                this.resetSelection(highlightSelection, fillBBox);
            }
            highlightSelection.cleanup();
        }
    }

    private resetSelection<D, N extends Shape<D>>(selection: Selection<D, N>, fillBBox: ShapeFillBBox) {
        const motion = this.motion.isAnimating() ? this.motion : undefined;
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetNodeStyles() {
            for (const node of nodes) {
                motion?.release(node);
                if (node.targetStyle != null) {
                    node.setStyleProperties(node.targetStyle, fillBBox, node.fillParams);
                }
            }
        });
    }

    /**
     * Functions animating shapes from the style they display to their `targetStyle`. Shapes that have never displayed
     * a style fade in, or start from their `underlay` if they are cutouts. Removed highlight copies fade out, or leave
     * at once if they are cutouts; other removed shapes keep their style for the motion that owns their removal.
     */
    private prepareStyleFns<D, N extends Shape<D>>(
        fillBBox: ShapeFillBBox,
        share: (style: ShapeStyle) => ShapeStyle,
        {
            underlay,
            leavingCutout,
        }: { underlay?: (node: N) => Shape | undefined; leavingCutout?: (node: N) => Shape | undefined }
    ): GroupedFromToFns<D, N, ShapeStyle> {
        const target = (node: Shape) => share(node.targetStyle ?? NO_STYLE);
        // Shapes that snapped display their unshared `targetStyle`, so what they display shares too.
        const displayed = (node: Shape) => (node.displayedStyle == null ? undefined : share(node.displayedStyle));
        const cutoutUnderlay = (node: N) => (node.drawingMode === 'cutout' ? underlay?.(node) : undefined);
        return {
            fromFn: (node) => {
                const own = displayed(node);
                if (own != null) return own;
                const beneath = cutoutUnderlay(node);
                const beneathDisplayed = beneath == null ? undefined : displayed(beneath);
                if (beneathDisplayed != null) return beneathDisplayed;
                if (beneath?.targetStyle != null) return target(beneath);
                return this.hidden(target(node));
            },
            toFn: (node, _datum, status) => {
                if (status !== 'removed') return target(node);
                const shown = displayed(node) ?? target(node);
                if (underlay == null || cutoutUnderlay(node) != null) return shown;
                return this.hidden(node.targetStyle == null ? shown : target(node));
            },
            takeoverFn:
                leavingCutout == null
                    ? undefined
                    : (node) => {
                          const leaving = leavingCutout(node);
                          return leaving == null ? undefined : displayed(leaving);
                      },
            applyFn: (node, style) => node.setStyleProperties(style, fillBBox, node.fillParams),
            defaults: STYLE_DEFAULTS,
            // Past `MAX_SHARED_STYLES` styles go unshared, so equal ones compare by value.
            equalFn: equalStyles,
        };
    }

    /** `style` at zero opacity; shared by every shape with `style`, so they animate together. */
    private hidden(style: ShapeStyle): ShapeStyle {
        let result = this.hiddenStyles.get(style);
        if (result == null) {
            result = { ...style, opacity: 0 };
            this.hiddenStyles.set(style, result);
        }
        return result;
    }

    /**
     * Begin a restyle; returns a function giving the style shared by all shapes with styles equal to `style`. Styles
     * compare by value without allocating; past `MAX_SHARED_STYLES` distinct styles, further ones go unshared.
     */
    private startRestyle() {
        const previous = this.sharedStyles;
        const current: ShapeStyle[] = [];
        this.sharedStyles = current;

        return (style: ShapeStyle) => {
            if (!isShareable(style)) return style;
            for (const shared of current) {
                if (shared === style || equalStyles(shared, style)) return shared;
            }
            if (current.length >= MAX_SHARED_STYLES) return style;
            let shared = style;
            for (const candidate of previous) {
                if (equalStyles(candidate, style)) {
                    shared = candidate;
                    break;
                }
            }
            current.push(shared);
            return shared;
        };
    }
}

function countShapes(layers: { selection: { length: number }; highlightSelection: { length: number } }[]) {
    let count = 0;
    for (const { selection, highlightSelection } of layers) {
        count += selection.length + highlightSelection.length;
    }
    return count;
}

/** Bounds the per-shape cost of sharing styles, for series whose shapes mostly have distinct styles. */
const MAX_SHARED_STYLES = 32;

/** Whether `style` can compare by value; gradient, pattern and image fills cannot. */
function isShareable(style: ShapeStyle) {
    const record = style as Record<string, unknown>;
    for (const property of COMPARED_PROPERTIES) {
        const value = record[property];
        if (value != null && typeof value === 'object') return false;
    }
    return true;
}

/** Whether two shareable styles display the same. */
function equalStyles(a: ShapeStyle, b: ShapeStyle) {
    const recordA = a as Record<string, unknown>;
    const recordB = b as Record<string, unknown>;
    for (const property of COMPARED_PROPERTIES) {
        if (recordA[property] !== recordB[property]) return false;
    }
    const dashA = a.lineDash;
    const dashB = b.lineDash;
    if (dashA === dashB) return true;
    if (dashA == null || dashA.length !== dashB?.length) return false;
    for (let i = 0; i < dashA.length; i++) {
        if (dashA[i] !== dashB[i]) return false;
    }
    return true;
}

/** The cutout highlight copies being removed, by the `datumIndex` of the shape beneath them. */
function collectLeavingCutouts<D extends StyledDatum, N extends Shape<D>>(copies: Selection<D, N>) {
    const leaving = new Map<unknown, N>();
    for (const copy of copies.nodes()) {
        if (copies.isGarbage(copy) && copy.drawingMode === 'cutout') {
            leaving.set(copy.datum?.datumIndex, copy);
        }
    }
    return leaving;
}

/** The first shape of `selection` beneath each copy in `copies`, by `datumIndex`; sized by the copies, not the shapes. */
function collectUnderlays<D extends StyledDatum, N extends Shape<D>>(
    selection: Selection<D, N>,
    copies: Selection<D, N>
) {
    const underlays = new Map<unknown, N | undefined>();
    for (const copy of copies.nodes()) {
        underlays.set(copy.datum?.datumIndex, undefined);
    }
    let unmatched = underlays.size;
    for (const node of selection.nodes()) {
        if (unmatched === 0) break;
        const datumIndex = node.datum?.datumIndex;
        if (underlays.has(datumIndex) && underlays.get(datumIndex) == null) {
            underlays.set(datumIndex, node);
            unmatched--;
        }
    }
    return underlays;
}
