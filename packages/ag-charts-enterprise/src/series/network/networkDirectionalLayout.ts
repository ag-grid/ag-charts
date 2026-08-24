import { _ModuleSupport } from 'ag-charts-community';
import type { Vertex } from 'ag-charts-core';

import { NetworkLayout, type NetworkLayoutUpdateOptions } from './networkLayout';
import type { NetworkLinkInterpolation } from './networkTypes';

type TBBox = _ModuleSupport.BBox;
const { BBox } = _ModuleSupport;

interface ContentBoundsAccumulator {
    count: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface NetworkDirectionalLayoutUpdateOptions<TVertex, TEdge> extends NetworkLayoutUpdateOptions<
    TVertex,
    TEdge
> {
    hiddenOnCollapse: boolean;
    getLayout: (vertex: Vertex<TVertex, TEdge>) => NetworkDirectionalSwitchLayout<TVertex, TEdge, any, any> | undefined;
}

export abstract class NetworkDirectionalSwitchLayout<
    TVertex,
    TEdge,
    TOptions extends NetworkDirectionalLayoutUpdateOptions<TVertex, TEdge>,
    TInternalLayout extends NetworkDirectionalLayout<TVertex, TEdge, TOptions>,
> extends NetworkLayout<TVertex, TEdge> {
    protected internalLayout?: TInternalLayout;

    abstract getInternalLayout(options: TOptions): TInternalLayout;

    update(options: TOptions) {
        this.calculateRegularDimensions(options);

        this.internalLayout = this.getInternalLayout(options);
        this.internalLayout.reset();

        const { containerBBox } = this.internalLayout.updateNodes(options, this.regularBBox);
        this.contentBBox = this.internalLayout.getContentBBox() ?? containerBBox;
    }

    getNodeBBox(vertex: Vertex<TVertex, TEdge>) {
        return this.internalLayout?.getNodeBBox(vertex);
    }

    initChildLayout(
        parentLayout: NetworkDirectionalLayout<TVertex, TEdge, TOptions>,
        options: TOptions
    ): NetworkDirectionalLayout<TVertex, TEdge, TOptions> {
        this.internalLayout = this.getInternalLayout(options);
        this.internalLayout.contentBoundsAccumulator = parentLayout.contentBoundsAccumulator;
        this.internalLayout.nodeBBoxes = parentLayout.nodeBBoxes;

        return this.internalLayout;
    }
}

export abstract class NetworkDirectionalLayout<
    TVertex,
    TEdge,
    TOptions extends NetworkDirectionalLayoutUpdateOptions<TVertex, TEdge>,
> {
    protected alignParentToChildren = true;

    // Avoids `containerBBox`, whose recursive sibling-merge over-accumulates height to O(N).
    contentBoundsAccumulator: ContentBoundsAccumulator = {
        count: 0,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    };

    nodeBBoxes: Map<Vertex<TVertex, TEdge>, TBBox> = new Map();

    protected abstract addNodesGroupBBoxOuterSpacing(
        options: TOptions,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ): void;

    protected abstract addNodesGroupBBoxInnerSpacing(
        options: TOptions,
        groupBBox: TBBox,
        vertices: Vertex<TVertex, TEdge>[],
        index: number,
        hasVisibleChildren: boolean
    ): void;

    protected abstract getNodeLayoutBBox(
        options: TOptions,
        nodeBBox: TBBox,
        groupBBox: TBBox,
        mergedChildrenBBoxes?: TBBox
    ): TBBox;

    protected abstract getChildrenGroupBBox(
        options: TOptions,
        parentBBox: TBBox,
        groupBBox: TBBox,
        prevHasVisibleChildren: boolean
    ): TBBox;

    protected abstract getNodesContainerBBox(
        options: TOptions,
        groupBBox: TBBox,
        descendentsContainerBBox: TBBox
    ): TBBox;

    protected abstract drawLink(
        path: _ModuleSupport.ExtendedPath2D,
        parentBBox: TBBox,
        childBBox: TBBox,
        interpolation: NetworkLinkInterpolation,
        options: TOptions
    ): void;

    getNodeBBox(vertex: Vertex<TVertex, TEdge>) {
        return this.nodeBBoxes.get(vertex);
    }

    updateNodes(
        options: TOptions,
        regularBBox: TBBox | undefined,
        groupBBox: TBBox = new BBox(0, 0, 0, 0)
    ): {
        containerBBox: TBBox;
        childrenBBoxes: { vertex: Vertex<TVertex, TEdge>; bbox: TBBox }[];
    } {
        const { getDatumNodeBBox, getLinkInterpolation, layoutDatumNode, layoutLinkNode, vertices } = options;
        const layoutBBoxes = [];

        // Iterate through the sibling vertices calculating their layout positions.
        let index = -1;
        let prevHasVisibleChildren = false;
        for (const vertex of vertices) {
            index++;

            let nodeBBox = getDatumNodeBBox(vertex);
            if (!nodeBBox && options.hiddenOnCollapse) continue;

            nodeBBox = regularBBox ?? nodeBBox;
            if (!nodeBBox) continue;

            this.addNodesGroupBBoxOuterSpacing(options, groupBBox, prevHasVisibleChildren);

            const children = this.getVisibleChildren(options, vertex);
            const childrenLayout =
                children == null ? this : (options.getLayout(vertex)?.initChildLayout(this, options) ?? this);

            let layoutBBox = childrenLayout.alignParentToChildren
                ? undefined
                : this.getNodeLayoutBBox(options, nodeBBox, groupBBox);

            const { descendentsContainerBBox, childrenBBoxes, mergedChildrenBBoxes, childrenCount } =
                this.updateChildren(
                    options,
                    children,
                    childrenLayout,
                    groupBBox,
                    layoutBBox ?? nodeBBox,
                    regularBBox,
                    prevHasVisibleChildren || index === 0
                );

            const hasVisibleChildren =
                childrenCount > 0 && mergedChildrenBBoxes != null && mergedChildrenBBoxes.width > 0;
            prevHasVisibleChildren = hasVisibleChildren;

            layoutBBox ??= this.getNodeLayoutBBox(options, nodeBBox, groupBBox, mergedChildrenBBoxes);

            // Request the series to layout the node per the calculated bbox. Override the layoutBBox for the accumulator
            // if the node extends outside its default size, e.g. for an expander pill.
            const positionedBBox = layoutDatumNode(vertex, layoutBBox, regularBBox);
            if (positionedBBox) this.nodeBBoxes.set(vertex, positionedBBox);

            layoutBBoxes.push({ vertex, bbox: layoutBBox });
            this.accumulateContentBounds(positionedBBox ?? layoutBBox);

            // Merge the bboxes into the group.
            if (descendentsContainerBBox) {
                const containerBBox = this.getNodesContainerBBox(options, groupBBox, descendentsContainerBBox);
                groupBBox = BBox.merge([groupBBox, containerBBox, layoutBBox]);
            } else {
                groupBBox = BBox.merge([groupBBox, layoutBBox]);
            }

            this.addNodesGroupBBoxInnerSpacing(options, groupBBox, vertices, index, hasVisibleChildren);

            // Request the series to layout the links between children and their parents.
            if (childrenBBoxes) {
                for (const { vertex: childVertex, bbox } of childrenBBoxes) {
                    const interpolation = getLinkInterpolation(vertex, childVertex);
                    layoutLinkNode(childVertex, (path: _ModuleSupport.ExtendedPath2D) =>
                        childrenLayout.drawLink(path, layoutBBox, bbox, interpolation, options)
                    );
                }
            }
        }

        return { containerBBox: groupBBox, childrenBBoxes: layoutBBoxes };
    }

    reset() {
        this.contentBoundsAccumulator.count = 0;
        this.nodeBBoxes.clear();
    }

    getContentBBox() {
        const acc = this.contentBoundsAccumulator;
        if (acc.count === 0) return;

        return new BBox(acc.left, acc.top, acc.right - acc.left, acc.bottom - acc.top);
    }

    private getVisibleChildren(options: TOptions, vertex: Vertex<TVertex, TEdge>) {
        const children = options.graph.neighboursWithEdgeValue(vertex, 'child' as TEdge) as
            | Vertex<TVertex, TEdge>[]
            | undefined;
        if (!children || children.length === 0 || options.isVertexCollapsed(vertex)) return;

        return children;
    }

    private updateChildren(
        options: TOptions,
        children: Vertex<TVertex, TEdge>[] | undefined,
        childrenLayout: NetworkDirectionalLayout<TVertex, TEdge, TOptions>,
        groupBBox: TBBox,
        nodeBBox: TBBox,
        regularBBox: TBBox | undefined,
        prevHasVisibleChildren: boolean
    ) {
        if (children == null) return { childrenCount: 0 };

        const childrenGroupBBox = childrenLayout.getChildrenGroupBBox(
            options,
            nodeBBox,
            groupBBox,
            prevHasVisibleChildren
        );

        const { containerBBox, childrenBBoxes } = childrenLayout.updateNodes(
            { ...options, vertices: children },
            regularBBox,
            childrenGroupBBox
        );

        return {
            descendentsContainerBBox: containerBBox,
            childrenBBoxes,
            mergedChildrenBBoxes:
                childrenBBoxes.length > 0 ? BBox.merge(childrenBBoxes.map(({ bbox }) => bbox)) : undefined,
            childrenCount: children.length,
        };
    }

    private accumulateContentBounds(bbox: TBBox) {
        const acc = this.contentBoundsAccumulator;
        if (acc.count === 0) {
            acc.left = bbox.x;
            acc.top = bbox.y;
            acc.right = bbox.x + bbox.width;
            acc.bottom = bbox.y + bbox.height;
            acc.count = 1;
            return;
        }
        if (bbox.x < acc.left) acc.left = bbox.x;
        if (bbox.y < acc.top) acc.top = bbox.y;
        if (bbox.x + bbox.width > acc.right) acc.right = bbox.x + bbox.width;
        if (bbox.y + bbox.height > acc.bottom) acc.bottom = bbox.y + bbox.height;
        acc.count++;
    }
}
