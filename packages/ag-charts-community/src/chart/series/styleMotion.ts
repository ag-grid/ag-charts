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
 */
export function prepareStyleAnimationFunctions<D, N extends Shape<D>>(
    fillBBox: ShapeFillBBox,
    fadeRemoved: boolean
): GroupedFromToFns<D, N, ShapeStyle> {
    return {
        fromFn: (node) => node.displayedStyle ?? hidden(node.targetStyle ?? NO_STYLE),
        toFn: (node, _datum, status) => {
            if (status !== 'removed') return node.targetStyle ?? NO_STYLE;
            const displayed = node.displayedStyle ?? node.targetStyle ?? NO_STYLE;
            return fadeRemoved ? hidden(displayed) : displayed;
        },
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
