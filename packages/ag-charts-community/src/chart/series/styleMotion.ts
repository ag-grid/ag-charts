import type { Node, Selection, Shape, ShapeStyle } from 'ag-charts-core';

import type { GroupedFromToFns } from '../../motion/groupedFromToMotion';
import type { ShapeFillBBox } from './shapeUtil';

const NO_STYLE: ShapeStyle = {};

/** Style values that `Shape.setStyleProperties` applies for absent properties. */
const STYLE_DEFAULTS = { opacity: 1, fillOpacity: 1, strokeOpacity: 1, strokeWidth: 0 };

const hiddenStyles = new WeakMap<ShapeStyle, ShapeStyle>();

/** `style` at zero opacity; shared by every shape with `style`, so they animate together. */
function hidden(style: ShapeStyle): ShapeStyle {
    let result = hiddenStyles.get(style);
    if (result == null) {
        result = { ...style, opacity: 0 };
        hiddenStyles.set(style, result);
    }
    return result;
}

/**
 * Functions for `groupedFromToMotion` that animate shapes from the style they display to their `targetStyle`. Shapes
 * that have never displayed a style fade in. Removed shapes fade out with `fadeRemoved`, and otherwise keep their
 * style for the motion that owns their removal.
 *
 * A cutout erases the shape beneath it whatever its opacity, so the two hand over instead of fading: the cutout starts
 * from what its `underlay` displays, and once removed leaves at once, with the shape beneath taking over from what
 * it displayed through `leavingCutout`.
 */
export function prepareStyleAnimationFunctions<D, N extends Shape<D>>(
    fillBBox: ShapeFillBBox,
    fadeRemoved: boolean,
    {
        underlay,
        leavingCutout,
    }: { underlay?: (node: N) => Shape | undefined; leavingCutout?: (node: N) => Shape | undefined } = {}
): GroupedFromToFns<D, N, ShapeStyle> {
    const cutoutUnderlay = (node: N) => (node.drawingMode === 'cutout' ? underlay?.(node) : undefined);
    return {
        fromFn: (node) => {
            if (node.displayedStyle != null) return node.displayedStyle;
            const beneath = cutoutUnderlay(node);
            return beneath?.displayedStyle ?? beneath?.targetStyle ?? hidden(node.targetStyle ?? NO_STYLE);
        },
        toFn: (node, _datum, status) => {
            if (status !== 'removed') return node.targetStyle ?? NO_STYLE;
            const displayed = node.displayedStyle ?? node.targetStyle ?? NO_STYLE;
            if (!fadeRemoved || cutoutUnderlay(node) != null) return displayed;
            return hidden(node.targetStyle ?? displayed);
        },
        takeoverFn: leavingCutout == null ? undefined : (node) => leavingCutout(node)?.displayedStyle,
        applyFn: (node, style) => node.setStyleProperties(style, fillBBox),
        defaults: STYLE_DEFAULTS,
    };
}

/**
 * Apply each shape's `targetStyle` without animating. With `cleanup`, remove the removed shapes, unless another
 * motion owns their removal.
 */
export function resetStyles<D, N extends Shape<D> & Node<D>>(
    selections: Selection<D, N>[],
    fillBBox: ShapeFillBBox,
    cleanup: boolean
) {
    for (const selection of selections) {
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetNodeStyles() {
            for (const node of nodes) {
                if (node.targetStyle != null) {
                    node.setStyleProperties(node.targetStyle, fillBBox);
                }
            }
            if (cleanup) selection.cleanup();
        });
    }
}
