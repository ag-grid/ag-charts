import type { PixelSize } from '../../chart/types';

export type AgNetworkSeriesTreeLayoutDirection = 'down' | 'left' | 'right' | 'up';
export type AgNetworkSeriesTreeLayoutAlignment = 'center-direct-children' | 'center-all-children' | 'start' | 'end';

/** A network series tree layout where each node has one or more parents. */
export interface AgNetworkSeriesTreeLayout {
    /**
     * Default: 'center-all-children'
     */
    alignment?: AgNetworkSeriesTreeLayoutAlignment;
    /**
     * The direction child nodes are arranged relative to their parent. Sibling nodes are arranged along the perpendicular axis.
     *
     * Default: 'down'
     */
    direction?: AgNetworkSeriesTreeLayoutDirection;
    /**
     * Gap in pixels between sibling nodes (nodes that share the same parent).
     *
     * Default: `20`
     */
    innerSpacing?: PixelSize;
    /**
     * Gap in pixels between parent and child layers.
     *
     * Default: `52`
     */
    layerSpacing?: PixelSize;
    /**
     * Gap in pixels between adjacent nodes whose immediate parents differ (cousins). The layout
     * uses `outerSpacing` for these cross-subtree gaps and `innerSpacing` for gaps between nodes
     * that share the same parent.
     *
     * Default: `40`
     */
    outerSpacing?: PixelSize;
    /**
     * Whether collapsed children and child-less children are stacked.
     *
     * Default: false
     */
    stackCollapsedChildren?: boolean;
    /**
     * Vertical gap in pixels between parent and child rows.
     *
     * Default: `52`
     */
    verticalSpacing?: PixelSize; // @deprecated use `layerSpacing` instead
}

/** A network series layout where each node is positioned within an ordered grid, ignoring the links connecting nodes. */
export interface AgNetworkSeriesGridLayout {}
