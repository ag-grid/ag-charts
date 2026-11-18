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

/** The widths of the stroke of an item's body and of its wicks. A wick of the width of the stroke is in the path of the body. */
interface WickWidths {
    strokeWidth?: number;
    wickStrokeWidth?: number;
}

/** A body 30 across from y 80 to 140, with a wick 4 thick above it from y 40, which is a path of its own. */
export const candlestick = (
    glow: NormalisedDropShadowOptions,
    x: number,
    { strokeWidth = 1, wickStrokeWidth = 4 }: WickWidths = {}
) => {
    const node = new CandlestickNode();
    node.setStaticProperties(x, 30, 40, 140, 80, 140, false, undefined, glow);
    Object.assign(node, { fill: TRANSLUCENT_BLUE, stroke: TRANSLUCENT_BLUE, strokeWidth });
    node.setWickProperties(WICK_COLOUR, wickStrokeWidth, undefined, undefined, undefined);
    return node;
};

/** A box from x 120 to 280 and y 80 to 140, with whiskers 4 thick along y 110 out to x 40 and x 360, each a path of its own. */
export const boxPlot = (glow: NormalisedDropShadowOptions, { strokeWidth = 1, wickStrokeWidth = 4 }: WickWidths = {}) =>
    Object.assign(new BoxPlotNode(), {
        horizontal: true,
        center: 110,
        thickness: 60,
        min: 40,
        q1: 120,
        median: 200,
        q3: 280,
        max: 360,
        fill: TRANSLUCENT_BLUE,
        stroke: TRANSLUCENT_BLUE,
        strokeWidth,
        wickStroke: WICK_COLOUR,
        wickStrokeWidth,
        crisp: false,
        fillGlow: glow,
    });
