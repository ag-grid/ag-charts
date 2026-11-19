import { TRANSLUCENT_BLUE } from 'ag-charts-community-test';
import type { NormalisedDropShadowOptions } from 'ag-charts-core';

import { BoxPlotNode } from '../series/box-plot/boxPlotNode';
import { CandlestickNode } from '../series/candlestick/candlestickNode';
import { SankeyLink } from '../series/sankey/sankeyLink';

const WICK_COLOUR = 'rgba(0, 0, 255, 0.5)';

/** A link 40 across from y 90 to 130, whose extent is the whole layer, as the arcs of a link are not bounded. */
export const sankeyLink = (glow: NormalisedDropShadowOptions) =>
    Object.assign(new SankeyLink(), {
        x1: 60,
        x2: 340,
        y1: 90,
        y2: 90,
        height: 40,
        fill: TRANSLUCENT_BLUE,
        strokeWidth: 0,
        fillGlow: glow,
    });

/**
 * The stroke of the body of an item, and whether its wicks share the body's path, as they do when styled as the body is. The
 * `shift` moves the item along the axis of its wicks, so that a wick can end part way through a pixel.
 */
export interface WickOptions {
    strokeWidth?: number;
    wickInBodyPath?: boolean;
    shift?: number;
}

/** A body 30 across from y 80 to 140, with a wick 4 thick above it from y 40 and below it to y 180, which is a path of its own. */
export const candlestick = (
    glow: NormalisedDropShadowOptions,
    x: number,
    { strokeWidth = 1, wickInBodyPath = false, shift = 0 }: WickOptions = {}
) => {
    const node = new CandlestickNode();
    node.setStaticProperties(x, 30, 40 + shift, 140, 80 + shift, 140 + shift, false, undefined, glow);
    Object.assign(node, { fill: TRANSLUCENT_BLUE, stroke: TRANSLUCENT_BLUE, strokeWidth });
    if (wickInBodyPath) node.setWickProperties(undefined, undefined, undefined, undefined, undefined);
    else node.setWickProperties(WICK_COLOUR, 4, undefined, undefined, undefined);
    return node;
};

/** A box from x 120 to 280 and y 80 to 140, with whiskers 4 thick along y 110 out to x 40 and x 360, each a path of its own. */
export const boxPlot = (
    glow: NormalisedDropShadowOptions,
    { strokeWidth = 1, wickInBodyPath = false, shift = 0 }: WickOptions = {}
) =>
    Object.assign(new BoxPlotNode(), {
        horizontal: true,
        center: 110 + shift,
        thickness: 60,
        min: 40 + shift,
        q1: 120,
        median: 200,
        q3: 280,
        max: 360 + shift,
        fill: TRANSLUCENT_BLUE,
        stroke: TRANSLUCENT_BLUE,
        strokeWidth,
        wickStroke: wickInBodyPath ? undefined : WICK_COLOUR,
        wickStrokeWidth: wickInBodyPath ? undefined : 4,
        crisp: false,
        fillGlow: glow,
    });
