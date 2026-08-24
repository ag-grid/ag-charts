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

export interface NetworkTreeLayoutUpdateOptions<TVertex, TEdge> extends NetworkDirectionalLayoutUpdateOptions<
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
}

/**
 * A Network Tree Layout presents the nodes in a directed acyclic network, for example an org chart or family
 * tree.
 */
export class NetworkTreeLayout<TVertex, TEdge> extends NetworkDirectionalSwitchLayout<
    TVertex,
    TEdge,
    NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
    NetworkTreeHorizontalLayout<TVertex, TEdge> | NetworkTreeVerticalLayout<TVertex, TEdge>
> {
    private direction?: AgNetworkSeriesTreeLayoutDirection;

    override getInternalLayout(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>) {
        if (this.direction !== options.direction || this.internalLayout == null) {
            this.direction = options.direction;

            if (options.direction === 'left' || options.direction === 'right') {
                return new NetworkTreeHorizontalLayout<TVertex, TEdge>();
            } else {
                return new NetworkTreeVerticalLayout<TVertex, TEdge>();
            }
        }

        return this.internalLayout;
    }

    protected override calculateRegularDimensions(options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>) {
        if (options.regularDimensions && (options.nodeWidth == null || options.nodeHeight == null)) {
            super.calculateRegularDimensions(options);

            if (!this.regularBBox) return;

            if (options.nodeWidth != null) {
                this.regularBBox.width = options.nodeWidth;
            } else if (options.nodeMaxWidth != null) {
                this.regularBBox.width = Math.min(options.nodeMaxWidth, this.regularBBox.width);
            }

            if (options.nodeHeight != null) {
                this.regularBBox.height = options.nodeHeight;
            } else if (options.nodeMaxHeight != null) {
                this.regularBBox.height = Math.min(options.nodeMaxHeight, this.regularBBox.height);
            }
        } else if (options.nodeWidth != null && options.nodeHeight != null) {
            this.regularBBox = new BBox(0, 0, options.nodeWidth, options.nodeHeight);
        }
    }
}

class NetworkTreeVerticalLayout<TVertex, TEdge> extends NetworkDirectionalLayout<
    TVertex,
    TEdge,
    NetworkTreeLayoutUpdateOptions<TVertex, TEdge>
> {
    protected override addNodesGroupBBoxOuterSpacing(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ) {
        // Add spacing to the left if the previous sibling has visible children.
        if (prevHasVisibleChildren) {
            groupBBox.width += options.outerSpacing;
        }
    }

    protected override addNodesGroupBBoxInnerSpacing(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        vertices: Vertex<TVertex, TEdge>[],
        index: number,
        hasVisibleChildren: boolean
    ) {
        // Add inner padding to childless siblings in the group except for the last node.
        if (index < vertices.length - 1 && !hasVisibleChildren) {
            groupBBox.width += options.innerSpacing;
        }
    }

    protected override getNodeLayoutBBox(
        _options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        nodeBBox: TBBox,
        groupBBox: TBBox,
        mergedChildrenBBoxes?: TBBox
    ) {
        const x = mergedChildrenBBoxes
            ? // When a node has children, align it centred to those immediate children, but not all descendents.
              mergedChildrenBBoxes.x + mergedChildrenBBoxes.width / 2 - nodeBBox.width / 2
            : // Otherwise justify the node to the left against its siblings.
              groupBBox.x + groupBBox.width;

        return new BBox(x, groupBBox.y, nodeBBox.width, nodeBBox.height);
    }

    protected override getChildrenGroupBBox(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        nodeBBox: TBBox,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ) {
        let adjustY = nodeBBox.height + options.depthSpacing + options.verticalSpacingExtra;
        if (options.direction === 'up') adjustY *= -1;
        const childrenGroupBBox = new BBox(groupBBox.x, groupBBox.y + adjustY, groupBBox.width, groupBBox.height);

        // Add spacing to the left if the parent's previous sibling does not have visible children.
        if (!prevHasVisibleChildren) {
            childrenGroupBBox.x += options.outerSpacing - options.innerSpacing;
        }

        return childrenGroupBBox;
    }

    protected override getNodesContainerBBox(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        descendentsContainerBBox: TBBox
    ): TBBox {
        return new BBox(
            descendentsContainerBBox.x,
            options.direction === 'up' ? groupBBox.y : descendentsContainerBBox.y,
            descendentsContainerBBox.width,
            descendentsContainerBBox.height
        );
    }

    protected override drawLink(
        path: _ModuleSupport.ExtendedPath2D,
        parentBBox: TBBox,
        childBBox: TBBox,
        interpolation: NetworkLinkInterpolation = { type: 'step' },
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>
    ) {
        const start = Vec2.from(
            parentBBox.x + parentBBox.width / 2,
            options.direction === 'up'
                ? parentBBox.y - options.verticalSpacingExtra
                : parentBBox.y + parentBBox.height + options.verticalSpacingExtra
        );
        const end = Vec2.from(
            childBBox.x + childBBox.width / 2,
            options.direction === 'up' ? childBBox.y + childBBox.height : childBBox.y
        );

        const elbowDist = (end.y - start.y) / 2;

        const elbow1 = Vec2.add(start, Vec2.from(0, elbowDist));
        const elbow2 = Vec2.sub(end, Vec2.from(0, elbowDist));

        const radius = interpolation.cornerRadius ?? 0;

        path.clear();
        pathWithElbows(path, start, [elbow1, elbow2], end, [0, radius, radius]);
    }
}

class NetworkTreeHorizontalLayout<TVertex, TEdge> extends NetworkDirectionalLayout<
    TVertex,
    TEdge,
    NetworkTreeLayoutUpdateOptions<TVertex, TEdge>
> {
    protected override addNodesGroupBBoxOuterSpacing(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ) {
        // Add spacing to the top if the previous sibling has visible children.
        if (prevHasVisibleChildren) {
            groupBBox.height += options.outerSpacing;
        }
    }

    protected override addNodesGroupBBoxInnerSpacing(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        vertices: Vertex<TVertex, TEdge>[],
        index: number,
        hasVisibleChildren: boolean
    ) {
        // Add inner padding to childless siblings in the group except for the last node.
        if (index < vertices.length - 1 && !hasVisibleChildren) {
            groupBBox.height += options.innerSpacing;
        }
    }

    protected override getNodeLayoutBBox(
        _options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        nodeBBox: TBBox,
        groupBBox: TBBox,
        mergedChildrenBBoxes?: TBBox
    ) {
        const y = mergedChildrenBBoxes
            ? // When a node has children, align it centred to those immediate children, but not all descendents.
              mergedChildrenBBoxes.y + mergedChildrenBBoxes.height / 2 - nodeBBox.height / 2
            : // Otherwise justify the node to the top against its siblings.
              groupBBox.y + groupBBox.height;

        return new BBox(groupBBox.x, y, nodeBBox.width, nodeBBox.height);
    }

    protected override getNodesContainerBBox(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        groupBBox: TBBox,
        descendentsContainerBBox: TBBox
    ) {
        return new BBox(
            options.direction === 'left' ? groupBBox.x : descendentsContainerBBox.x,
            descendentsContainerBBox.y,
            descendentsContainerBBox.width,
            descendentsContainerBBox.height
        );
    }

    protected override getChildrenGroupBBox(
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>,
        nodeBBox: TBBox,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ) {
        let adjustX = nodeBBox.width + options.depthSpacing + options.verticalSpacingExtra;
        if (options.direction === 'left') adjustX *= -1;
        const childrenGroupBBox = new BBox(groupBBox.x + adjustX, groupBBox.y, groupBBox.width, groupBBox.height);

        // Add spacing to the top if the parent's previous sibling does not have visible children.
        if (!prevHasVisibleChildren) {
            childrenGroupBBox.y += options.outerSpacing - options.innerSpacing;
        }

        return childrenGroupBBox;
    }

    protected override drawLink(
        path: _ModuleSupport.ExtendedPath2D,
        parentBBox: TBBox,
        childBBox: TBBox,
        interpolation: NetworkLinkInterpolation = { type: 'step' },
        options: NetworkTreeLayoutUpdateOptions<TVertex, TEdge>
    ) {
        const start = Vec2.from(
            options.direction === 'left'
                ? parentBBox.x - options.verticalSpacingExtra
                : parentBBox.x + parentBBox.width + options.verticalSpacingExtra,
            parentBBox.y + parentBBox.height / 2
        );
        const end = Vec2.from(
            options.direction === 'left' ? childBBox.x + childBBox.width : childBBox.x,
            childBBox.y + childBBox.height / 2
        );

        const elbowDist = (end.x - start.x) / 2;

        const elbow1 = Vec2.add(start, Vec2.from(elbowDist, 0));
        const elbow2 = Vec2.sub(end, Vec2.from(elbowDist, 0));

        const radius = interpolation.cornerRadius ?? 0;

        path.clear();
        pathWithElbows(path, start, [elbow1, elbow2], end, [0, radius, radius]);
    }
}
