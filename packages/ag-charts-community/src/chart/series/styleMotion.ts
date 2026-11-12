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
    /** Copies of the highlighted items' shapes, matched to the shapes of `selection` by `datumIndex`. */
    readonly highlightSelection: Selection<D, N>;
    /** Whether this update resolved the styles of `selection`; `highlightSelection` is resolved every update. */
    readonly restyled: boolean;
}

const NO_STYLE: ShapeStyle = {};

/** Style values that `Shape.setStyleProperties` applies for absent properties. */
const STYLE_DEFAULTS = { opacity: 1, fillOpacity: 1, strokeOpacity: 1, strokeWidth: 0 };

const KEYED_PROPERTIES = ['fill', 'fillOpacity', 'stroke', 'strokeOpacity', 'strokeWidth', 'lineDashOffset', 'opacity'];

/**
 * Applies, or animates to, the `targetStyle` a series resolved for each of its shapes. Highlight changes animate each
 * shape from the style it displays; other updates apply the styles directly.
 *
 * Shapes with equal styles share one animation, even where a series resolves a new style object per shape, as with an
 * item styler. Past `AnimationManager.maxAnimatableItems` shapes, styles apply without animating.
 *
 * Highlight copies fade in and out over the shapes beneath them, except that a cutout erases the shape beneath it
 * whatever its opacity, so the two hand over instead: the cutout starts from what the shape beneath displays, and once
 * removed leaves at once, with the shape beneath taking over from what the cutout displayed.
 */
export class ShapeStyleMotion {
    private readonly motion: GroupedFromToMotion;
    /** Equal styles by value, from this restyle and the one before, so that equal styles stay shared across them. */
    private sharedStyles = new Map<string, ShapeStyle>();
    private readonly hiddenStyles = new WeakMap<ShapeStyle, ShapeStyle>();

    constructor(
        owner: { readonly id: string },
        private readonly animationManager: AnimationManager
    ) {
        this.motion = new GroupedFromToMotion(owner, animationManager);
    }

    animate<D extends StyledDatum, N extends Shape<D>>(layers: StyleLayer<D, N>[], fillBBox: ShapeFillBBox) {
        if (!this.isAnimatable(layers)) {
            this.reset(layers, fillBBox);
            return;
        }

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

            const fns = this.prepareStyleFns<D, N>(fillBBox, share, {
                underlay: (node) => findByDatumIndex(selection, node),
            });
            this.motion.animate(`${prefix}highlight-style`, [highlightSelection], fns);
        }
    }

    /** Apply each shape's `targetStyle` without animating, and remove the removed highlight copies. */
    reset<D extends StyledDatum, N extends Shape<D>>(layers: StyleLayer<D, N>[], fillBBox: ShapeFillBBox) {
        // Shared styles only group animations, so keying every shape's style is wasted where none can animate.
        const share = this.isAnimatable(layers) ? this.startRestyle() : unshared;
        for (const { selection, highlightSelection, restyled } of layers) {
            if (restyled) this.resetSelection(selection, fillBBox, share);
            this.resetSelection(highlightSelection, fillBBox, share);
            highlightSelection.cleanup();
        }
    }

    private resetSelection<D, N extends Shape<D>>(
        selection: Selection<D, N>,
        fillBBox: ShapeFillBBox,
        share: (style: ShapeStyle) => ShapeStyle
    ) {
        const { motion } = this;
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetNodeStyles() {
            for (const node of nodes) {
                motion.release(node);
                if (node.targetStyle != null) {
                    node.setStyleProperties(share(node.targetStyle), fillBBox, node.fillParams);
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
        const cutoutUnderlay = (node: N) => (node.drawingMode === 'cutout' ? underlay?.(node) : undefined);
        return {
            fromFn: (node) => {
                if (node.displayedStyle != null) return node.displayedStyle;
                const beneath = cutoutUnderlay(node);
                if (beneath?.displayedStyle != null) return beneath.displayedStyle;
                if (beneath?.targetStyle != null) return target(beneath);
                return this.hidden(target(node));
            },
            toFn: (node, _datum, status) => {
                if (status !== 'removed') return target(node);
                const displayed = node.displayedStyle ?? target(node);
                if (underlay == null || cutoutUnderlay(node) != null) return displayed;
                return this.hidden(node.targetStyle == null ? displayed : target(node));
            },
            takeoverFn: leavingCutout == null ? undefined : (node) => leavingCutout(node)?.displayedStyle,
            applyFn: (node, style) => node.setStyleProperties(style, fillBBox, node.fillParams),
            defaults: STYLE_DEFAULTS,
        };
    }

    private isAnimatable(layers: { selection: { length: number }; highlightSelection: { length: number } }[]) {
        let shapeCount = 0;
        for (const { selection, highlightSelection } of layers) {
            shapeCount += selection.length + highlightSelection.length;
        }
        return shapeCount <= this.animationManager.maxAnimatableItems;
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

    /** Begin a restyle; returns a function giving the style shared by all shapes with styles equal to `style`. */
    private startRestyle() {
        const previous = this.sharedStyles;
        const current = new Map<string, ShapeStyle>();
        this.sharedStyles = current;

        const byIdentity = new Map<ShapeStyle, ShapeStyle>();
        return (style: ShapeStyle) => {
            let shared = byIdentity.get(style);
            if (shared != null) return shared;

            const key = styleKey(style);
            shared = key == null ? style : (current.get(key) ?? previous.get(key) ?? style);
            if (key != null) current.set(key, shared);
            byIdentity.set(style, shared);
            return shared;
        };
    }
}

const unshared = (style: ShapeStyle) => style;

/** A key equal for styles that display the same; undefined for styles with gradient, pattern or image fills. */
function styleKey(style: ShapeStyle): string | undefined {
    const record = style as Record<string, unknown>;
    let key = '';
    for (const property of KEYED_PROPERTIES) {
        const value = record[property];
        if (value != null && typeof value === 'object') return undefined;
        key += `${String(value ?? '')}|`;
    }
    return key + (style.lineDash?.join(',') ?? '');
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

function findByDatumIndex<D extends StyledDatum, N extends Shape<D>>(selection: Selection<D, N>, node: N) {
    const datumIndex = node.datum?.datumIndex;
    for (const candidate of selection.nodes()) {
        if (candidate.datum?.datumIndex === datumIndex) return candidate;
    }
}
