import type { BoxBounds } from 'ag-charts-core';

import type { BBox } from '../../scene/bbox';
import type { Node } from '../../scene/node';
import type { Path } from '../../scene/shape/path';
import type { SeriesNodeDatum } from './seriesTypes';

/** Modes of matching user interactions to rendered nodes (e.g. hover or click) */
export enum SeriesNodePickMode {
    /** Pick matches based upon pick coordinates being inside a matching shape/marker. */
    EXACT_SHAPE_MATCH,
    /** Pick matches based upon distance to ideal position */
    NEAREST_NODE,
    /** Pick matches based upon distance from axis */
    AXIS_ALIGNED,
}

/** SeriesNodeDatum values with a special meaning */
export enum SeriesNodeDatumSentinel {
    /** This SeriesNodeDatum does not exist: it's culled as part of a rendering optimisation like M4 aggregation. */
    CULLED = 1,
}

export type SeriesNodePickIntent = 'tooltip' | 'highlight' | 'highlight-tooltip' | 'context-menu' | 'event';

export type SeriesNodePickMatch = {
    datum: SeriesNodeDatum;
    distance: number;
    /**
     * The scene-node hit under the pointer, as accurate as possible. Exact-shape and
     * nearest-object picks report the matched leaf; modes that match on datum geometry (e.g.
     * "closest") cannot resolve the leaf efficiently and fall back to the series `contentGroup`.
     */
    target: Node<unknown>;
};

export type PickFocusInputs = {
    // datum delta is strictly +ve/-ve when changing datum focus, or 0 when changing series focus.
    readonly datumIndex: number;
    readonly datumIndexDelta: number;
    // 'other' means 'depth' for hierarchical charts, or 'series' for all other charts
    readonly otherIndex: number;
    readonly otherIndexDelta: number;
    readonly seriesRect?: BBox;
};

export type PickViewportFocusInputs = {
    readonly otherIndex: number;
    readonly where: 'data-start' | 'data-end' | 'viewport-start' | 'viewport-end';
    readonly hoverRect: Readonly<BoxBounds>;
};

export type PickFocusOutputs = {
    datumIndex: number;
    datum: SeriesNodeDatum | SeriesNodeDatumSentinel;
    otherIndex?: number;
    bounds: BBox | Path;
    movedBounds?: BBox;
    clipFocusBox: boolean;
};

export type PickResult = {
    pickMode: SeriesNodePickMode;
    picks: SeriesNodePickMatch[];
};

export type PickNodesInBBoxPredicate = (selectionBox: BoxBounds, node: Node<unknown>) => boolean;
