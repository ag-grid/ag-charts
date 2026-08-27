import { _ModuleSupport } from 'ag-charts-community';
import { Vec2, type Vertex } from 'ag-charts-core';
import type { AgNetworkSeriesTreeLayoutDirection } from 'ag-charts-types';

import {
    NetworkDirectionalLayout,
    type NetworkDirectionalLayoutUpdateOptions,
    NetworkDirectionalSwitchLayout,
} from './networkDirectionalLayout';
import type { NetworkLinkInterpolation } from './networkTypes';
import { pathWithElbows } from './networkUtils';

type TBBox = _ModuleSupport.BBox;
const { BBox } = _ModuleSupport;

export interface NetworkStackedLayoutUpdateOptions<TVertex, TEdge> extends NetworkDirectionalLayoutUpdateOptions<
    TVertex,
    TEdge
> {
    nodeHeight?: number;
    nodeWidth?: number;
    nodeMaxHeight?: number;
    nodeMaxWidth?: number;

    regularDimensions: boolean;

    direction: AgNetworkSeriesTreeLayoutDirection;
    depthSpacing: number;
    innerSpacing: number;
    outerSpacing: number;

    verticalSpacingExtra: number;

    linkIndentation: number;
    nodeIndentation: number;
    stackFromDepth: number;
}

/**
 * A Network Stacked Layout presents the nodes in a directed acyclic row or column. Unlike a tree layout, it arranges
 * both parents and siblings in the same direction.
 */
export class NetworkStackedLayout<TVertex, TEdge> extends NetworkDirectionalSwitchLayout<
    TVertex,
    TEdge,
    NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
    NetworkStackedVerticalLayout<TVertex, TEdge> | NetworkStackedHorizontalLayout<TVertex, TEdge>
> {
    private direction?: AgNetworkSeriesTreeLayoutDirection; // TODO: tree?

    override getInternalLayout(options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>) {
        if (this.direction !== options.direction || this.internalLayout == null) {
            this.direction = options.direction;

            if (options.direction === 'left' || options.direction === 'right') {
                return new NetworkStackedHorizontalLayout<TVertex, TEdge>();
            } else {
                return new NetworkStackedVerticalLayout<TVertex, TEdge>();
            }
        }

        return this.internalLayout;
    }
}

class NetworkStackedVerticalLayout<TVertex, TEdge> extends NetworkDirectionalLayout<
    TVertex,
    TEdge,
    NetworkStackedLayoutUpdateOptions<TVertex, TEdge>
> {
    protected override alignParentToChildren = false;

    protected override addNodesGroupBBoxOuterSpacing(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ) {
        // Add spacing to the top if the previous sibling has visible children.
        if (prevHasVisibleChildren) {
            if (options.direction === 'up') groupBBox.y -= options.outerSpacing;
            groupBBox.height += options.outerSpacing;
        }
    }

    protected override addNodesGroupBBoxInnerSpacing(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        vertices: Vertex<TVertex, TEdge>[],
        index: number,
        hasVisibleChildren: boolean
    ) {
        // Add inner padding to childless siblings in the group except for the last node.
        if (index < vertices.length - 1 && !hasVisibleChildren) {
            if (options.direction === 'up') groupBBox.y -= options.innerSpacing;
            groupBBox.height += options.innerSpacing;
        }
    }

    protected override getNodeLayoutBBox(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        nodeBBox: TBBox,
        groupBBox: TBBox
    ) {
        const y = options.direction === 'up' ? groupBBox.y - nodeBBox.height : groupBBox.y + groupBBox.height;

        return new BBox(groupBBox.x, y, nodeBBox.width, nodeBBox.height);
    }

    protected override getChildrenGroupBBox(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        parentBBox: TBBox
    ) {
        const gap = options.depthSpacing + options.verticalSpacingExtra;
        const y = options.direction === 'up' ? parentBBox.y - gap : parentBBox.y + parentBBox.height + gap;

        return new BBox(parentBBox.x + options.linkIndentation + options.nodeIndentation, y, 0, 0);
    }

    protected override getNodesContainerBBox(
        _options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        _groupBBox: TBBox,
        descendentsContainerBBox: TBBox
    ): TBBox {
        return descendentsContainerBBox;
    }

    protected override drawLink(
        path: _ModuleSupport.ExtendedPath2D,
        parentBBox: TBBox,
        childBBox: TBBox,
        interpolation: NetworkLinkInterpolation = { type: 'step' },
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>
    ) {
        const start = Vec2.from(
            parentBBox.x + parentBBox.width / 2,
            options.direction === 'up'
                ? parentBBox.y - options.verticalSpacingExtra
                : parentBBox.y + parentBBox.height + options.verticalSpacingExtra
        );
        const end = Vec2.from(childBBox.x, childBBox.y + childBBox.height / 2);

        const sign = options.direction === 'up' ? -1 : 1;
        const elbow1 = Vec2.from(start.x, start.y + (sign * options.depthSpacing) / 2);
        const elbow2 = Vec2.from(parentBBox.x + options.linkIndentation, elbow1.y);
        const elbow3 = Vec2.from(parentBBox.x + options.linkIndentation, end.y);

        const radius = interpolation.cornerRadius ?? 0;

        path.clear();
        pathWithElbows(path, start, [elbow1, elbow2, elbow3], end, [radius, radius, radius, radius]);
    }
}

/**
 * The horizontal mirror of the vertical layout: siblings and depth both run along x, and children are indented
 * down the y axis from their parent.
 */
class NetworkStackedHorizontalLayout<TVertex, TEdge> extends NetworkDirectionalLayout<
    TVertex,
    TEdge,
    NetworkStackedLayoutUpdateOptions<TVertex, TEdge>
> {
    protected override alignParentToChildren = false;

    protected override addNodesGroupBBoxOuterSpacing(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ) {
        // Add spacing to the left if the previous sibling has visible children.
        if (prevHasVisibleChildren) {
            if (options.direction === 'left') groupBBox.x -= options.outerSpacing;
            groupBBox.width += options.outerSpacing;
        }
    }

    protected override addNodesGroupBBoxInnerSpacing(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        vertices: Vertex<TVertex, TEdge>[],
        index: number,
        hasVisibleChildren: boolean
    ) {
        // Add inner padding to childless siblings in the group except for the last node.
        if (index < vertices.length - 1 && !hasVisibleChildren) {
            if (options.direction === 'left') groupBBox.x -= options.innerSpacing;
            groupBBox.width += options.innerSpacing;
        }
    }

    protected override getNodeLayoutBBox(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        nodeBBox: TBBox,
        groupBBox: TBBox
    ) {
        const x = options.direction === 'left' ? groupBBox.x - nodeBBox.width : groupBBox.x + groupBBox.width;

        return new BBox(x, groupBBox.y, nodeBBox.width, nodeBBox.height);
    }

    protected override getChildrenGroupBBox(
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        parentBBox: TBBox
    ) {
        const gap = options.depthSpacing + options.verticalSpacingExtra;
        const x = options.direction === 'left' ? parentBBox.x - gap : parentBBox.x + parentBBox.width + gap;

        return new BBox(x, parentBBox.y + options.linkIndentation + options.nodeIndentation, 0, 0);
    }

    protected override getNodesContainerBBox(
        _options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>,
        _groupBBox: TBBox,
        descendentsContainerBBox: TBBox
    ): TBBox {
        return descendentsContainerBBox;
    }

    protected override drawLink(
        path: _ModuleSupport.ExtendedPath2D,
        parentBBox: TBBox,
        childBBox: TBBox,
        interpolation: NetworkLinkInterpolation = { type: 'step' },
        options: NetworkStackedLayoutUpdateOptions<TVertex, TEdge>
    ) {
        const start = Vec2.from(
            options.direction === 'left'
                ? parentBBox.x - options.verticalSpacingExtra
                : parentBBox.x + parentBBox.width + options.verticalSpacingExtra,
            parentBBox.y + parentBBox.height / 2
        );
        const end = Vec2.from(childBBox.x + childBBox.width / 2, childBBox.y);

        const sign = options.direction === 'left' ? -1 : 1;
        const elbow1 = Vec2.from(start.x + (sign * options.depthSpacing) / 2, start.y);
        const elbow2 = Vec2.from(elbow1.x, parentBBox.y + options.linkIndentation);
        const elbow3 = Vec2.from(end.x, parentBBox.y + options.linkIndentation);

        const radius = interpolation.cornerRadius ?? 0;

        path.clear();
        pathWithElbows(path, start, [elbow1, elbow2, elbow3], end, [radius, radius, radius, radius]);
    }
}
