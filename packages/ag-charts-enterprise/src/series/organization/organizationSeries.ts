import {
    type AgActiveItemState,
    type AgCollapsedChangeEventSource,
    type AgOrganizationExpanderTextFormatterParams,
    type AgOrganizationNodeTextFormatterParams,
    type AgOrganizationSeriesExpanderItemStylerParams,
    type AgOrganizationSeriesExpanderStyle,
    type AgOrganizationSeriesLinkItemStylerParams,
    type AgOrganizationSeriesLinkStyle,
    type AgOrganizationSeriesNodeItemStylerParams,
    type AgOrganizationSeriesNodeStyle,
    type AgOrganizationSeriesNodeTextStyle,
    type AgOrganizationSeriesNodeTextStylerParams,
    type CssColor,
    type PaddingOptions,
    type RichFormatter,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type AxisID,
    type CallbackParamRules,
    ChartAxisDirection,
    type DeepRequired,
    type DynamicContext,
    type Normalised,
    type NormalisedColorType,
    type NormalisedTextOrSegments,
    type Point,
    Vertex,
    clamp,
    mergeDefaults,
    strictObjectKeys,
    toPlainText,
} from 'ag-charts-core';

import { NetworkLinkNode } from '../network/networkLinkNode';
import { AbstractNetworkSeries } from '../network/networkSeries';
import { NetworkTreeLayout, type NetworkTreeLayoutUpdateOptions } from '../network/networkTreeLayout';
import type { NetworkLinkInterpolation } from '../network/networkTypes';
import { OrganizationGraph } from './organizationGraph';
import { OrganizationNode, OrganizationNodeTag } from './organizationNode';
import { OrganizationSeriesNodeTextProperties, OrganizationSeriesProperties } from './organizationSeriesProperties';
import type {
    NormalisedOrganizationNodeStyle,
    NormalisedOrganizationNodeTextStyle,
    NormalisedOrganizationSeriesExpanderStyle,
    OrganizationDatum,
    OrganizationEdge,
    OrganizationLinkDatum,
    OrganizationVertex,
} from './organizationTypes';

const { keyProperty, valueProperty } = _ModuleSupport;

const ISOTROPY_EPSILON = 1e-6;

// Keeps `[mid - range/2, mid + range/2]` inside `[0, 1]`.
function clampMid(mid: number, range: number): number {
    const half = range / 2;
    if (mid - half < 0) return half;
    if (mid + half > 1) return 1 - half;
    return mid;
}

export class OrganizationSeries extends AbstractNetworkSeries<
    OrganizationVertex,
    OrganizationEdge,
    OrganizationGraph,
    OrganizationNode,
    OrganizationDatum,
    OrganizationLinkDatum,
    NetworkTreeLayout<OrganizationVertex, OrganizationEdge>
> {
    static override readonly className = 'OrganizationSeries';
    static readonly type = 'organization' as const;

    override properties = new OrganizationSeriesProperties();

    private rootVertex?: Vertex<OrganizationVertex, OrganizationEdge>;

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(ctx);
        this.cleanup.register(ctx.eventsHub.on('zoom:change-request', (event) => this.onZoomChangeRequest(event)));
    }

    createNetworkGraph() {
        return new OrganizationGraph();
    }

    createNetworkLayout() {
        return new NetworkTreeLayout<OrganizationVertex, OrganizationEdge>();
    }

    getRootVertices() {
        if (!this.rootVertex) return [];
        return (
            (this.graph.neighboursWithEdgeValue(this.rootVertex, 'child') as Vertex<
                OrganizationVertex,
                OrganizationEdge
            >[]) ?? []
        );
    }

    getFocusedVertex() {
        return undefined;
    }

    getDefaultFocusedVertices() {
        if (!this.rootVertex) return undefined;
        return this.graph.neighboursWithEdgeValue(this.rootVertex, 'child') as Vertex<
            OrganizationVertex,
            OrganizationEdge
        >[];
    }

    updateOffset(offset: Point) {
        this.dataNodeGroup.translationX = offset.x;
        this.dataNodeGroup.translationY = offset.y;

        this.linkGroup.translationX = offset.x;
        this.linkGroup.translationY = offset.y;
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data } = this;
        if (data == null) return;

        this.layout.clear();

        const {
            idKey,
            parentIdKey,
            node: {
                image: { key: imageKey },
                title: { key: titleKey },
                subtitle: { key: subtitleKey },
                labels,
            },
        } = this.properties;

        const props = [
            keyProperty(idKey, undefined, { id: 'idValue' }),
            valueProperty(parentIdKey, undefined, { id: 'parentIdValue', allowNullKey: true }),
            valueProperty(imageKey, undefined, { id: 'imageValue', allowNullKey: true, missingValue: undefined }),
            valueProperty(titleKey, undefined, { id: 'titleValue', allowNullKey: true, missingValue: undefined }),
            valueProperty(subtitleKey, undefined, {
                id: 'subtitleValue',
                allowNullKey: true,
                missingValue: undefined,
            }),
        ];

        let index = 0;
        for (const label of labels) {
            // Skip disabled tiers — without a `key` they crash `dataModel`. The slot is
            // preserved as `undefined` in `createGraphData` so tier indexing stays aligned.
            if (label.enabled) {
                props.push(
                    valueProperty(label.key, undefined, {
                        id: `labelValue-${index}`,
                        allowNullKey: true,
                        missingValue: undefined,
                    })
                );
            }
            index++;
        }

        const { dataModel, processedData } = await dataController.request(this.id, data, { props });

        this.dataModel = dataModel;
        this.processedData = processedData;

        this.createGraphData();
        this.processPendingCollapse();
    }

    createNodeData() {
        const nodeData: OrganizationDatum[] = [];
        const linkData: OrganizationLinkDatum[] = [];

        this.vertexDatumIndex = {};

        if (this.rootVertex) {
            const vertices = this.graph.neighboursWithEdgeValue(this.rootVertex, 'child');
            if (vertices) {
                for (const vertex of vertices as Vertex<OrganizationVertex, OrganizationEdge>[]) {
                    linkData.push({ from: this.rootVertex, to: vertex });
                    this.createNodeDataFromVertex(nodeData, linkData, vertex);
                }
            }
        }

        return { itemId: this.id, nodeData, linkData, labelData: [] };
    }

    nodeFactory(): OrganizationNode {
        return new OrganizationNode();
    }

    hasItemStylers() {
        const { expander, node, link, selection } = this.properties;
        return (
            selection.enabled ||
            expander.itemStyler != null ||
            node.itemStyler != null ||
            link.itemStyler != null ||
            node.title.itemStyler != null ||
            node.subtitle.itemStyler != null ||
            node.labels.some((label) => label.itemStyler != null)
        );
    }

    updateDatumSelection(
        nodeData: OrganizationDatum[],
        datumSelection: _ModuleSupport.Selection<OrganizationDatum, OrganizationNode>
    ) {
        datumSelection.update(nodeData);
    }

    updateDatumNodes(datumSelection: _ModuleSupport.Selection<OrganizationDatum, OrganizationNode>) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        datumSelection.each((node, datum) => {
            const datumIndex = this.graph.findNeighbourValue(datum.vertex, 'datumIndex') as number;
            const depth = this.graph.findNeighbourValue(datum.vertex, 'depth') as number;
            const descendantsCount = this.graph.findNeighbourValue(datum.vertex, 'descendants') as number;
            const childrenCount = this.graph.neighboursWithEdgeValue(datum.vertex, 'child')?.length ?? 0;

            const isHighlight = highlightedDatum?.datumIndex === datum.datumIndex;
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            // Only report `isCollapsed` for nodes whose descendants would actually be hidden;
            // a leaf id present in `collapsedManager` is a no-op visually and would mislead
            // styler consumers about the rendered tree state.
            const isCollapsed =
                descendantsCount > 0 && datum.itemId != null && this.ctx.collapsedManager.isCollapsed(datum.itemId);
            const styles = this.getNodeStyle(datumIndex, depth, isHighlight, highlightState, isCollapsed);
            node.opacity = this.getNodeOpacity(datumIndex, isHighlight, highlightState);

            const fields = this.resolveVertexFields(datum.vertex);
            const title = this.formatText(
                fields.title,
                this.properties.node.title.formatter,
                datumIndex,
                isCollapsed,
                depth
            );
            const subtitle = this.formatText(
                fields.subtitle,
                this.properties.node.subtitle.formatter,
                datumIndex,
                isCollapsed,
                depth
            );
            const labels = fields.labels?.map((label, index) =>
                this.formatText(label, this.properties.node.labels[index]?.formatter, datumIndex, isCollapsed, depth)
            );

            let defaultExpanderText = '';
            if (styles.expander.text.showAllChildren && styles.expander.text.showDirectChildren) {
                defaultExpanderText = `${childrenCount} / ${descendantsCount}`;
            } else if (styles.expander.text.showAllChildren) {
                defaultExpanderText = `${descendantsCount}`;
            } else if (styles.expander.text.showDirectChildren) {
                defaultExpanderText = `${childrenCount}`;
            }
            const expanderText = this.formatExpanderText(
                defaultExpanderText,
                this.properties.expander.text.formatter,
                datumIndex,
                isCollapsed,
                depth,
                descendantsCount,
                childrenCount
            );

            node.update(
                { image: fields.image, title, subtitle, labels },
                expanderText,
                descendantsCount,
                styles,
                isCollapsed,
                this.ctx.domManager.isRtl
            );
        });
    }

    updateLinkNodes(
        linkSelection: _ModuleSupport.Selection<OrganizationLinkDatum, NetworkLinkNode<OrganizationLinkDatum>>
    ) {
        linkSelection.each((node, datum) => {
            const fromIndex = this.graph.findNeighbourValue(datum.from, 'datumIndex') as number;
            const toIndex = this.graph.findNeighbourValue(datum.to, 'datumIndex') as number;
            const styles = this.getLinkStyle(fromIndex, toIndex);

            node.update(styles);
        });
    }

    positionDatumNode(node: OrganizationNode, bbox: _ModuleSupport.BBox, regularBBox?: _ModuleSupport.BBox) {
        node.translationX = bbox.x;
        node.translationY = bbox.y;

        if (regularBBox) {
            node.updateBBox(regularBBox);
            node.realign(regularBBox);
        }

        const focusBBox = node.getFocusBBox();

        return new _ModuleSupport.BBox(bbox.x, bbox.y, focusBBox.width, focusBBox.height);
    }

    getLinkInterpolation(
        from: Vertex<OrganizationVertex, OrganizationEdge>,
        to: Vertex<OrganizationVertex, OrganizationEdge>
    ): NetworkLinkInterpolation {
        const fromIndex = this.graph.findNeighbourValue(from, 'datumIndex') as number;
        const toIndex = this.graph.findNeighbourValue(to, 'datumIndex') as number;
        const styles = this.getLinkStyle(fromIndex, toIndex);

        return { type: styles.interpolation.type, cornerRadius: styles.interpolation.cornerRadius };
    }

    expandNetworkToItem(itemIdOrIndex: string | number, source: AgCollapsedChangeEventSource) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        const id = this.resolveItemId(itemIdOrIndex);
        if (id == null) return;

        let vertex = this.graph.findVertexById(id);
        if (!vertex) return;

        // Iterate up the parents until we reach the root node, which does not have a datumIndex, and expand the full
        // ancestry to ensure the active node is visible.
        const ids = [];
        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        while (
            (vertex = this.graph.findNeighbour(vertex, 'parent') as
                | Vertex<OrganizationVertex, OrganizationEdge>
                | undefined) != null
        ) {
            const datumIndex = this.graph.findNeighbourValue(vertex, 'datumIndex') as number | undefined;
            if (datumIndex == null) break;
            ids.push(idValues[datumIndex]);
        }

        this.expand(ids, source);
    }

    expandItem(itemIdOrIndex: string | number, source: AgCollapsedChangeEventSource) {
        const id = this.resolveItemId(itemIdOrIndex);
        if (id == null) return;

        if (this.ctx.collapsedManager.expand([id], this.id, source)) {
            this.markNodeDataDirty();
        }
    }

    collapseItem(itemIdOrIndex: string | number, source: AgCollapsedChangeEventSource) {
        const id = this.resolveItemId(itemIdOrIndex);
        if (id == null) return;

        if (this.ctx.collapsedManager.collapseAppend([id], this.id, source)) {
            this.markNodeDataDirty();
        }
    }

    // Keyboard activations have no pointer target — allow them; pointer clicks must hit the expander.
    override hasBuiltinListener(target: _ModuleSupport.Node<unknown> | undefined): boolean {
        const { clickToExpand } = this.properties.node;
        const Expander: number = OrganizationNodeTag.Expander;
        const Card: number = OrganizationNodeTag.Card;
        return target != null && (target.tag === Expander || (target.tag === Card && clickToExpand));
    }

    override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        const nodeData = this.contextNodeData?.nodeData;
        if (!nodeData?.length) return;

        const currentNodeIdx = clamp(0, opts.datumIndex - opts.datumIndexDelta, nodeData.length - 1);
        const currentVertex = nodeData[currentNodeIdx]?.vertex;
        if (!currentVertex) return;

        const next = this.resolveFocusVertex(currentVertex, opts.datumIndexDelta, opts.otherIndexDelta);
        if (!next) return;

        const nextDatumIdx = this.vertexDatumIndex[next.value as string];
        if (nextDatumIdx == null) return;

        const node = this.datumSelection.at(nextDatumIdx);
        if (!node) return;

        // Card + expander pill so the focus ring shows what `Enter` will toggle.
        const bounds = _ModuleSupport.Transformable.toCanvas(node, node.getFocusBBox());
        if (!bounds?.isFinite()) return;

        const depth = this.graph.findNeighbourValue(next, 'depth') as number | undefined;

        const datum = node.datum;
        if (!datum) return;

        return {
            datum,
            datumIndex: nextDatumIdx,
            otherIndex: depth,
            bounds,
            clipFocusBox: true,
        };
    }

    getDatumAriaText(datum: OrganizationDatum, _description: string): string | undefined {
        const { vertex } = datum;
        const depth = (this.graph.findNeighbourValue(vertex, 'depth') as number | undefined) ?? 1;

        const siblings = this.getSiblings(vertex);
        const posInSet = siblings.indexOf(vertex) + 1;
        const setSize = siblings.length;

        const childCount = this.getChildren(vertex).length;

        // Tooltip-derived description carries only the heading; build a fuller one for SR.
        const description = this.composeDatumDescription(vertex);

        // Leaf vs. parent — a single key with empty `${collapsedState}` would stutter (",,").
        if (childCount === 0) {
            return this.ctx.localeManager.t('ariaAnnounceOrgChartLeaf', {
                description,
                level: depth,
                posInSet,
                setSize,
            });
        }

        const itemId = vertex.value as string;
        const collapsedState = this.ctx.localeManager.t(
            this.ctx.collapsedManager.isCollapsed(itemId) ? 'ariaOrgChartCollapsed' : 'ariaOrgChartExpanded'
        );
        // Locale tooling has no `[plural]` annotation, so split the key by child count.
        const key = childCount === 1 ? 'ariaAnnounceOrgChartParentSingular' : 'ariaAnnounceOrgChartParent';
        return this.ctx.localeManager.t(key, {
            description,
            level: depth,
            posInSet,
            setSize,
            childCount,
            collapsedState,
        });
    }

    findNodeDatum(itemIdOrIndex: AgActiveItemState['itemId']): OrganizationDatum | undefined {
        const id = this.resolveItemId(itemIdOrIndex);
        if (id == null) return undefined;

        const vertex = this.graph.findVertexById(id);
        if (!vertex) return undefined;

        return this.createNodeDatumFromVertex(vertex);
    }

    override getTooltipContent(datumIndex: _ModuleSupport.DatumIndex): _ModuleSupport.TooltipContent | undefined {
        const datum = this.processedData?.dataSources.get(this.id)?.data?.[datumIndex];
        if (datum == null) return;

        const nodeDatum = this.getDatumByDatumIndex(datumIndex);
        if (nodeDatum == null) return;

        return this.formatTooltipWithContext(
            this.properties.tooltip,
            { heading: this.resolveVertexFields(nodeDatum.vertex).title },
            {
                seriesId: this.id,
                datum: datum,
            }
        );
    }

    // Exclude the expander pill from measurements — its overhang would compound into
    // `regularBBox` on each layout pass, growing the card by `expander.height / 2` per toggle.
    protected override measureDatumNode(node: OrganizationNode): _ModuleSupport.BBox {
        return node.getCardBBox();
    }

    protected override makeLayoutUpdateOptions(): NetworkTreeLayoutUpdateOptions<OrganizationVertex, OrganizationEdge> {
        const {
            properties: { node, expander, innerSpacing, outerSpacing, verticalSpacing },
        } = this;

        return {
            ...super.makeLayoutUpdateOptions(),
            nodeHeight: node.height,
            nodeWidth: node.width,
            nodeMaxHeight: node.maxHeight,
            nodeMaxWidth: node.maxWidth,
            regularDimensions: true,
            hiddenOnCollapse: true,
            innerSpacing: innerSpacing ?? 0,
            outerSpacing: outerSpacing ?? 0,
            verticalSpacing: verticalSpacing ?? 0,
            verticalSpacingExtra: expander.enabled
                ? (expander.text.fontSize + expander.padding.top + expander.padding.bottom + expander.strokeWidth) / 2
                : 0,
        };
    }

    // Order matters: `applyNativePixelFloor` reads the post-clamp window mutated in-place by
    // `applyPanBoundaryClamp`.
    private onZoomChangeRequest(event: _ModuleSupport.ZoomChangeRequestEvent) {
        if (event.isReset) return;
        this.applyPanBoundaryClamp(event);
        this.applyNativePixelFloor(event);
    }

    // AG-17204: keep some of the zoom window inside `[0, 1]` so content stays visible.
    private applyPanBoundaryClamp(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const clamped: _ModuleSupport.CoreZoomState = {};
        let didClamp = false;

        for (const id of strictObjectKeys(event.state)) {
            const entry = event.state[id];
            if (entry == null) continue;

            const { min, max, direction } = entry;
            const size = max - min;

            let clampedMin = min;
            let clampedMax = max;

            if (min >= 1) {
                clampedMax = 1;
                clampedMin = 1 - size;
                didClamp = true;
            } else if (max <= 0) {
                clampedMin = 0;
                clampedMax = size;
                didClamp = true;
            }

            // CoreZoomState wants the enum, not 'x'/'y' literals (runtime-equivalent).
            const coreDirection = direction === 'x' ? ChartAxisDirection.X : ChartAxisDirection.Y;
            clamped[id] = { min: clampedMin, max: clampedMax, direction: coreDirection };
        }

        if (didClamp) {
            event.constrainChanges(clamped);
        }
    }

    // Caps scale at native pixels (`s ≤ 1`) and projects off-isotropic states onto the
    // isotropic line `xRange/fitX = yRange/fitY` — less-zoomed axis wins, preserving content.
    private applyNativePixelFloor(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const sMax = 1;
        const { seriesRect } = this;
        const contentBBox = this.layout.contentBBox;
        if (!seriesRect || !contentBBox || contentBBox.width <= 0 || contentBBox.height <= 0) return;

        const fitX = seriesRect.width / contentBBox.width;
        const fitY = seriesRect.height / contentBBox.height;

        let xId: AxisID | undefined;
        let yId: AxisID | undefined;
        for (const id of strictObjectKeys(event.state)) {
            const entry = event.state[id];
            if (entry == null) continue;
            if (entry.direction === 'x') xId = id;
            else yId = id;
        }
        if (!xId || !yId) return;

        const xEntry = event.state[xId]!;
        const yEntry = event.state[yId]!;
        const xRange = xEntry.max - xEntry.min;
        const yRange = yEntry.max - yEntry.min;
        if (xRange <= 0 || yRange <= 0) return;

        // AG-17239: at the 1:1 floor, further zoom-in is a no-op — otherwise the
        // cursor-anchored input mid leaks through `clampMid` and reads as a pan.
        const oldX = event.oldState[xId];
        const oldY = event.oldState[yId];
        if (oldX && oldY) {
            const oldXRange = oldX.max - oldX.min;
            const oldYRange = oldY.max - oldY.min;
            const inputT = Math.max(xRange / fitX, yRange / fitY);
            const oldT = Math.max(oldXRange / fitX, oldYRange / fitY);
            const wantsShrink = xRange < oldXRange - ISOTROPY_EPSILON || yRange < oldYRange - ISOTROPY_EPSILON;
            if (wantsShrink && inputT <= 1 + ISOTROPY_EPSILON && oldT <= 1 + ISOTROPY_EPSILON) {
                const restored: _ModuleSupport.CoreZoomState = {};
                restored[xId] = { min: oldX.min, max: oldX.max, direction: ChartAxisDirection.X };
                restored[yId] = { min: oldY.min, max: oldY.max, direction: ChartAxisDirection.Y };
                event.constrainChanges(restored);
                return;
            }
        }

        // Project to the isotropic line, then floor at sMax (t ≥ 1/sMax).
        const targetT = Math.max(xRange / fitX, yRange / fitY, 1 / sMax);
        const targetXRange = Math.min(1, targetT * fitX);
        const targetYRange = Math.min(1, targetT * fitY);

        const xMid = clampMid((xEntry.min + xEntry.max) / 2, targetXRange);
        const yMid = clampMid((yEntry.min + yEntry.max) / 2, targetYRange);

        const xChanged =
            Math.abs(xMid - targetXRange / 2 - xEntry.min) > ISOTROPY_EPSILON ||
            Math.abs(xMid + targetXRange / 2 - xEntry.max) > ISOTROPY_EPSILON;
        const yChanged =
            Math.abs(yMid - targetYRange / 2 - yEntry.min) > ISOTROPY_EPSILON ||
            Math.abs(yMid + targetYRange / 2 - yEntry.max) > ISOTROPY_EPSILON;

        if (xChanged || yChanged) {
            const constrained: _ModuleSupport.CoreZoomState = {};
            constrained[xId] = {
                min: xMid - targetXRange / 2,
                max: xMid + targetXRange / 2,
                direction: ChartAxisDirection.X,
            };
            constrained[yId] = {
                min: yMid - targetYRange / 2,
                max: yMid + targetYRange / 2,
                direction: ChartAxisDirection.Y,
            };
            event.constrainChanges(constrained);
        }
    }

    private composeDatumDescription(vertex: Vertex<OrganizationVertex, OrganizationEdge>): string {
        const fields = this.resolveVertexFields(vertex);
        const parts: string[] = [];
        const title = toPlainText(fields.title).trim();
        const subtitle = toPlainText(fields.subtitle).trim();
        if (title) parts.push(title);
        if (subtitle) parts.push(subtitle);
        for (const label of fields.labels ?? []) {
            const labelText = toPlainText(label).trim();
            if (labelText) parts.push(labelText);
        }
        return parts.join(', ');
    }

    // Returns the next focus vertex per the spatial model, or `undefined` for a no-op (ArrowUp
    // at the top tier, ArrowDown into a leaf or collapsed node) so focus stays put.
    private resolveFocusVertex(
        current: Vertex<OrganizationVertex, OrganizationEdge>,
        siblingDelta: number,
        depthDelta: number
    ): Vertex<OrganizationVertex, OrganizationEdge> | undefined {
        if (depthDelta > 0) {
            const itemId = current.value as string;
            if (this.ctx.collapsedManager.isCollapsed(itemId)) return;
            return this.getChildren(current)[0];
        }
        if (depthDelta < 0) {
            const parent = this.graph.findNeighbour(current, 'parent') as
                | Vertex<OrganizationVertex, OrganizationEdge>
                | undefined;
            if (!parent) return;
            // The synthetic root carries no datumIndex — clamp at the top tier.
            const parentDatumIdx = this.graph.findNeighbourValue(parent, 'datumIndex');
            if (parentDatumIdx == null) return;
            return parent;
        }
        if (siblingDelta !== 0) {
            const siblings = this.getSiblings(current);
            const idx = siblings.indexOf(current);
            if (idx === -1) return;
            const next = clamp(0, idx + siblingDelta, siblings.length - 1);
            return siblings[next];
        }
        return current;
    }

    private getSiblings(
        vertex: Vertex<OrganizationVertex, OrganizationEdge>
    ): Vertex<OrganizationVertex, OrganizationEdge>[] {
        const parent = this.graph.findNeighbour(vertex, 'parent') as
            | Vertex<OrganizationVertex, OrganizationEdge>
            | undefined;
        // Top-tier nodes' parent is the synthetic root; falling back to `getRootVertices()` keeps
        // the sibling set consistent for ArrowLeft/ArrowRight at the top of the tree.
        if (parent === this.rootVertex || parent == null) {
            return this.getRootVertices();
        }
        return this.getChildren(parent);
    }

    private getChildren(
        vertex: Vertex<OrganizationVertex, OrganizationEdge>
    ): Vertex<OrganizationVertex, OrganizationEdge>[] {
        return (
            (this.graph.neighboursWithEdgeValue(vertex, 'child') as Vertex<OrganizationVertex, OrganizationEdge>[]) ??
            []
        );
    }

    private createGraphData() {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        this.graph.clear();
        this.rootVertex = this.graph.addVertex('root');

        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        const parentIdValues = dataModel.resolveColumnById<string | undefined>(
            this,
            'parentIdValue',
            processedData,
            'object'
        );
        const imageValues = dataModel.resolveColumnById<string | undefined>(
            this,
            'imageValue',
            processedData,
            'object'
        );
        const titleValues = dataModel.resolveColumnById<string | undefined>(
            this,
            'titleValue',
            processedData,
            'object'
        );
        const subtitleValues = dataModel.resolveColumnById<string | undefined>(
            this,
            'subtitleValue',
            processedData,
            'object'
        );

        const labelsValues: (string[] | undefined)[] = [];
        for (let i = 0; i < this.properties.node.labels.length; i++) {
            // Disabled tiers have no value-property; preserve slot so tier indexing stays aligned.
            labelsValues.push(
                this.properties.node.labels[i].enabled
                    ? dataModel.resolveColumnById<string>(this, `labelValue-${i}`, processedData, 'object')
                    : undefined
            );
        }

        // TODO: This is passing `any[]` in as the values, and the build fn then constrains the types without any safety.
        this.graph.build(
            idValues,
            parentIdValues,
            imageValues,
            titleValues,
            subtitleValues,
            labelsValues,
            this.rootVertex
        );

        this.graph.computeDescendants(this.getRootVertices());
    }

    private createNodeDataFromVertex(
        nodeData: OrganizationDatum[],
        linkData: OrganizationLinkDatum[],
        vertex: Vertex<OrganizationVertex, OrganizationEdge>,
        depth: number = 1
    ) {
        const nodeDatumIndex = nodeData.length;
        this.vertexDatumIndex[vertex.value as string] = nodeDatumIndex;

        this.graph.addEdge(vertex, this.graph.addVertex(depth), 'depth');

        const nodeDatum = this.createNodeDatumFromVertex(vertex);
        nodeData.push(nodeDatum);

        const children = this.graph.neighboursWithEdgeValue(vertex, 'child') as
            | Vertex<OrganizationVertex, OrganizationEdge>[]
            | undefined;
        if (!children) return;

        if (this.ctx.collapsedManager.isCollapsed(vertex.value as string)) {
            return;
        }

        for (const childVertex of children) {
            const linkDatum: OrganizationLinkDatum = {
                from: vertex,
                to: childVertex,
            };

            linkData.push(linkDatum);

            this.createNodeDataFromVertex(nodeData, linkData, childVertex, depth + 1);
        }
    }

    private formatText(
        text: NormalisedTextOrSegments | undefined,
        formatter: RichFormatter<AgOrganizationNodeTextFormatterParams> | undefined,
        datumIndex: number | undefined,
        isCollapsed: boolean,
        depth: number
    ) {
        const { dataModel, processedData } = this;
        if (!formatter || !dataModel || !processedData || datumIndex == null) return text;

        return (
            this.callWithContext(
                formatter,
                this.makeNodeTextFormatterParams(dataModel, processedData, datumIndex, isCollapsed, depth, text)
            ) ?? text
        );
    }

    private formatExpanderText(
        text: NormalisedTextOrSegments,
        formatter: RichFormatter<AgOrganizationNodeTextFormatterParams> | undefined,
        datumIndex: number | undefined,
        isCollapsed: boolean,
        depth: number,
        descendantsCount: number,
        childrenCount: number
    ) {
        const { dataModel, processedData } = this;
        if (!formatter || !dataModel || !processedData || datumIndex == null) return text;

        return (
            this.callWithContext(
                formatter,
                this.makeExpanderTextFormatterParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    isCollapsed,
                    depth,
                    descendantsCount,
                    childrenCount,
                    text
                )
            ) ?? text
        );
    }

    private resolveVertexFields(vertex: Vertex<OrganizationVertex, OrganizationEdge>) {
        return {
            image: this.graph.findNeighbourValue(vertex, 'image') as string | undefined,
            title: this.graph.findNeighbourValue(vertex, 'title') as NormalisedTextOrSegments | undefined,
            subtitle: this.graph.findNeighbourValue(vertex, 'subtitle') as NormalisedTextOrSegments | undefined,
            labels: this.graph.findNeighbourValue(vertex, 'labels') as
                | (NormalisedTextOrSegments | undefined)[]
                | undefined,
        };
    }

    private createNodeDatumFromVertex(vertex: Vertex<OrganizationVertex, OrganizationEdge>): OrganizationDatum {
        const datumIndex = this.graph.findNeighbourValue(vertex, 'datumIndex') as number;
        const userDatum = this.processedData?.dataSources.get(this.id)?.data?.[datumIndex];
        return {
            series: this,
            datum: userDatum,
            itemId: vertex.value as string,
            datumIndex,
            vertex,
        };
    }

    private getLinkStyle(
        fromIndex: number | undefined,
        toIndex: number | undefined
    ): DeepRequired<AgOrganizationSeriesLinkStyle> {
        const { dataModel, processedData } = this;
        const { itemStyler: linkStyler } = this.properties.link;

        let style = this.getLinkDefaultStyle();

        if (linkStyler && dataModel && processedData && fromIndex != null && toIndex != null) {
            const overrides = this.cachedDatumCallback(
                _ModuleSupport.createDatumId(this.id, fromIndex, toIndex, 'link'),
                () => {
                    const params = this.makeLinkItemStylerParams(dataModel, processedData, fromIndex, toIndex, style);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(linkStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private getNodeStyle(
        datumIndex: number | undefined,
        depth: number,
        isHighlight: boolean,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean
    ): NormalisedOrganizationNodeStyle {
        const { dataModel, processedData } = this;
        const { itemStyler } = this.properties.node;
        const { itemStyler: titleStyler } = this.properties.node.title;
        const { itemStyler: subtitleStyler } = this.properties.node.subtitle;
        const { itemStyler: expanderStyler } = this.properties.expander;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const selectionStyle = this.getSelectionStyle(datumIndex);

        let style = mergeDefaults(selectionStyle, highlightStyle, this.getNodeDefaultStyle(), {
            title: this.getNodeTextDefaultStyle(this.properties.node.title),
            subtitle: this.getNodeTextDefaultStyle(this.properties.node.subtitle),
            labels: this.properties.node.labels.map((label) => this.getNodeTextDefaultStyle(label)),
            expander: this.getExpanderDefaultStyle(),
        });

        style = this.getNodeItemStylerStyle(
            itemStyler,
            style,
            dataModel,
            processedData,
            datumIndex,
            depth,
            highlightState,
            isCollapsed
        );

        style.title = this.getNodeTextItemStylerStyle(
            titleStyler,
            style.title,
            'title',
            dataModel,
            processedData,
            datumIndex,
            depth,
            highlightState,
            isCollapsed
        );
        style.subtitle = this.getNodeTextItemStylerStyle(
            subtitleStyler,
            style.subtitle,
            'subtitle',
            dataModel,
            processedData,
            datumIndex,
            depth,
            highlightState,
            isCollapsed
        );

        style.expander = this.getExpanderItemStylerStyle(
            expanderStyler,
            style.expander,
            dataModel,
            processedData,
            datumIndex,
            depth,
            highlightState,
            isCollapsed
        );

        let labelIndex = 0;
        for (const { itemStyler: labelStyler } of this.properties.node.labels) {
            style.labels[labelIndex] = this.getNodeTextItemStylerStyle(
                labelStyler,
                style.labels[labelIndex],
                _ModuleSupport.createDatumId('label', labelIndex),
                dataModel,
                processedData,
                datumIndex,
                depth,
                highlightState,
                isCollapsed
            );
            labelIndex++;
        }

        return style;
    }

    // Selection/highlight dimming is a whole-card effect, so it applies to the node group's
    // opacity rather than the card paint style, which only covers fill and stroke.
    private getNodeOpacity(
        datumIndex: number,
        isHighlight: boolean,
        highlightState: _ModuleSupport.HighlightState | undefined
    ): number {
        return (
            this.getSelectionStyle(datumIndex)?.opacity ??
            this.getHighlightStyle(isHighlight, datumIndex, highlightState).opacity ??
            1
        );
    }

    private getNodeDefaultStyle(): Normalised<
        DeepRequired<Omit<AgOrganizationSeriesNodeStyle, 'padding'> & { padding: PaddingOptions }>,
        never,
        { fill: NormalisedColorType; stroke: CssColor }
    > {
        const {
            cornerRadius,
            fill,
            fillOpacity,
            height,
            image,
            lineDash,
            lineDashOffset,
            maxHeight,
            maxWidth,
            padding,
            stroke,
            strokeOpacity,
            strokeWidth,
            width,
        } = this.properties.node;
        return {
            cornerRadius,
            fill,
            fillOpacity,
            height: height ?? Number.NaN,
            image: {
                cornerRadius: image.cornerRadius,
                enabled: image.enabled,
                key: image.key,
                height: image.height,
                width: image.width,
                position: image.position,
                spacing: image.spacing,
            },
            lineDash,
            lineDashOffset: lineDashOffset ?? 0,
            maxHeight: maxHeight ?? Infinity,
            maxWidth: maxWidth ?? Infinity,
            padding: {
                top: padding.top,
                right: padding.right,
                bottom: padding.bottom,
                left: padding.left,
            },
            stroke,
            strokeOpacity,
            strokeWidth,
            width: width ?? Number.NaN,
        };
    }

    private getExpanderDefaultStyle(): NormalisedOrganizationSeriesExpanderStyle {
        const {
            cornerRadius,
            enabled,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            padding,
            stroke,
            strokeWidth,
            strokeOpacity,
            text,
        } = this.properties.expander;
        return {
            cornerRadius,
            enabled,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset: lineDashOffset ?? 0,
            padding: {
                top: padding.top,
                right: padding.right,
                bottom: padding.bottom,
                left: padding.left,
            },
            stroke,
            strokeWidth,
            strokeOpacity,
            text: {
                color: text.color,
                fontFamily: text.fontFamily,
                fontSize: text.fontSize,
                fontStyle: text.fontStyle,
                fontWeight: text.fontWeight,
                showAllChildren: text.showAllChildren,
                showDirectChildren: text.showDirectChildren,
                textAlign: text.textAlign,
            },
        };
    }

    private getLinkDefaultStyle(): DeepRequired<AgOrganizationSeriesLinkStyle> {
        const { interpolation, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = this.properties.link;
        return {
            interpolation,
            lineDash,
            lineDashOffset: lineDashOffset ?? 0,
            stroke,
            strokeOpacity,
            strokeWidth,
        };
    }

    private getNodeTextDefaultStyle(props: OrganizationSeriesNodeTextProperties): NormalisedOrganizationNodeTextStyle {
        return {
            color: props.color,
            enabled: props.enabled,
            fontFamily: props.fontFamily,
            fontSize: props.fontSize,
            fontStyle: props.fontStyle,
            fontWeight: props.fontWeight,
            overflowStrategy: props.overflowStrategy,
            spacing: props.spacing,
            textAlign: props.textAlign,
            wrapping: props.wrapping,
            fill: props.fill,
            fillOpacity: props.fillOpacity,
            stroke: props.stroke,
            strokeWidth: props.strokeWidth,
            strokeOpacity: props.strokeOpacity,
            cornerRadius: props.cornerRadius,
            padding: {
                top: props.padding.top,
                right: props.padding.right,
                bottom: props.padding.bottom,
                left: props.padding.left,
            },
        };
    }

    private getNodeItemStylerStyle(
        styler:
            | Styler<AgOrganizationSeriesNodeItemStylerParams<unknown, unknown>, AgOrganizationSeriesNodeStyle>
            | undefined,
        style: NormalisedOrganizationNodeStyle,
        dataModel: _ModuleSupport.DataModel<any, any, any> | undefined,
        processedData: _ModuleSupport.ProcessedData<any> | undefined,
        datumIndex: number | undefined,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, 'node', isCollapsed),
            () => {
                const params = this.makeNodeItemStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    depth,
                    highlightState,
                    isCollapsed,
                    style
                );
                return this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.callWithContext(styler, params)
                );
            }
        );

        if (overrides) {
            style = mergeDefaults(overrides, style);
        }

        return style;
    }

    private getExpanderItemStylerStyle(
        styler:
            | Styler<AgOrganizationSeriesExpanderItemStylerParams<unknown, unknown>, AgOrganizationSeriesExpanderStyle>
            | undefined,
        style: NormalisedOrganizationSeriesExpanderStyle,
        dataModel: _ModuleSupport.DataModel<any, any, any> | undefined,
        processedData: _ModuleSupport.ProcessedData<any> | undefined,
        datumIndex: number | undefined,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, 'expander', isCollapsed),
            () => {
                const params = this.makeExpanderItemStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    depth,
                    highlightState,
                    isCollapsed,
                    style
                );
                return this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.callWithContext(styler, params)
                );
            }
        );

        if (overrides) {
            style = mergeDefaults(overrides, style);
        }

        return style;
    }

    private getNodeTextItemStylerStyle(
        styler:
            | Styler<AgOrganizationSeriesNodeTextStylerParams<unknown, unknown>, AgOrganizationSeriesNodeTextStyle>
            | undefined,
        style: NormalisedOrganizationNodeTextStyle,
        datumIdSuffix: string,
        dataModel: _ModuleSupport.DataModel<any, any, any> | undefined,
        processedData: _ModuleSupport.ProcessedData<any> | undefined,
        datumIndex: number | undefined,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, datumIdSuffix, isCollapsed),
            () => {
                const params = this.makeNodeTextStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    depth,
                    highlightState,
                    isCollapsed,
                    style
                );
                return this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.callWithContext(styler, params)
                );
            }
        );

        if (overrides) {
            style = mergeDefaults(overrides, style);
        }

        return style;
    }

    private makeLinkItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        fromIndex: number,
        toIndex: number,
        style: Required<AgOrganizationSeriesLinkStyle>
    ): AgOrganizationSeriesLinkItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const fromDatum = processedData.dataSources.get(seriesId)?.data?.[fromIndex];
        const toDatum = processedData.dataSources.get(seriesId)?.data?.[toIndex];

        return {
            ...style,
            fromDatum,
            toDatum,
            seriesId,
            // Links are not selectable: selection tracks node datum indices, and a link has none of its own.
            selectionState: undefined,
            candidateState: undefined,
        } satisfies CallbackParamRules<AgOrganizationSeriesLinkItemStylerParams<unknown, unknown>>;
    }

    private makeNodeItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean,
        style: NormalisedOrganizationNodeStyle
    ): AgOrganizationSeriesNodeItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
            isCollapsed,
            seriesId,
            highlightState: highlightState == null ? 'none' : _ModuleSupport.toHighlightString(highlightState),
            selectionState: this.getSelectionStateString(datumIndex),
            candidateState: this.getCandidateStateString(datumIndex),
        } satisfies CallbackParamRules<AgOrganizationSeriesNodeItemStylerParams<unknown, unknown>>;
    }

    private makeExpanderItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean,
        style: NormalisedOrganizationSeriesExpanderStyle
    ): AgOrganizationSeriesExpanderItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
            isCollapsed,
            seriesId,
            highlightState: highlightState == null ? 'none' : _ModuleSupport.toHighlightString(highlightState),
            selectionState: this.getSelectionStateString(datumIndex),
            candidateState: this.getCandidateStateString(datumIndex),
        } satisfies CallbackParamRules<AgOrganizationSeriesExpanderItemStylerParams<unknown, unknown>>;
    }

    private makeNodeTextStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        depth: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        isCollapsed: boolean,
        style: NormalisedOrganizationNodeTextStyle
    ): AgOrganizationSeriesNodeTextStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            datum,
            depth,
            isCollapsed,
            seriesId,
            highlightState: highlightState == null ? 'none' : _ModuleSupport.toHighlightString(highlightState),
            selectionState: this.getSelectionStateString(datumIndex),
            candidateState: this.getCandidateStateString(datumIndex),
        } satisfies CallbackParamRules<AgOrganizationSeriesNodeTextStylerParams<unknown, unknown>>;
    }

    private makeNodeTextFormatterParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        isCollapsed: boolean,
        depth: number,
        value: any
    ): AgOrganizationNodeTextFormatterParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            datum,
            depth,
            isCollapsed,
            seriesId,
            value,
        } satisfies CallbackParamRules<AgOrganizationNodeTextFormatterParams<unknown, unknown>>;
    }

    private makeExpanderTextFormatterParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        isCollapsed: boolean,
        depth: number,
        descendantsCount: number,
        childrenCount: number,
        value: any
    ): AgOrganizationExpanderTextFormatterParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            datum,
            depth,
            isCollapsed,
            seriesId,
            allDescendants: descendantsCount,
            directChildren: childrenCount,
            value,
        } satisfies CallbackParamRules<AgOrganizationExpanderTextFormatterParams<unknown, unknown>>;
    }

    // Resolve as a real vertex id first; only a number matching no vertex is treated as a datumSelection index.
    private resolveItemId(itemIdOrIndex: string | number): string | number | undefined {
        if (this.graph.findVertexById(itemIdOrIndex) != null) {
            return itemIdOrIndex;
        }
        if (typeof itemIdOrIndex === 'number') {
            return this.datumSelection.at(itemIdOrIndex)?.datum?.itemId;
        }
        return itemIdOrIndex;
    }

    private getDatumByDatumIndex(datumIndex: number) {
        const nodeDatumIndex = this.convertDatumIndexToNodeDatumIndex(datumIndex);
        if (nodeDatumIndex == null) return;

        return this.datumSelection.at(nodeDatumIndex)?.datum;
    }

    private convertDatumIndexToNodeDatumIndex(datumIndex: number) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        const idValues = dataModel.resolveKeysById(this, 'idValue', processedData);
        const vertex = this.graph.findVertexById(idValues[datumIndex]);
        if (!vertex) return;

        const nodeDatumIndex = this.vertexDatumIndex[vertex.value as string];
        if (nodeDatumIndex == null) return;

        return nodeDatumIndex;
    }
}
