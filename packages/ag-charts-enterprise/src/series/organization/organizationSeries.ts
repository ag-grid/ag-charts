import {
    type AgActiveItemState,
    type AgCollapsedChangeEventSource,
    type AgNetworkSeriesTreeLayoutDirection,
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
    type BoxBounds,
    type CallbackParamRules,
    ChartUpdateType,
    type DeepRequired,
    type DynamicContext,
    type Normalised,
    type NormalisedColorType,
    type NormalisedTextOrSegments,
    Vertex,
    boxCollides,
    boxContains,
    clamp,
    mergeDefaults,
    toPlainText,
} from 'ag-charts-core';

import { NetworkLinkNode } from '../network/networkLinkNode';
import { AbstractNetworkSeries } from '../network/networkSeries';
import { NetworkStackedLayout, type NetworkStackedLayoutUpdateOptions } from '../network/networkStackedLayout';
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
    OrganizationVertexID,
} from './organizationTypes';

const { keyProperty, valueProperty } = _ModuleSupport;

/** Highlight part naming the expander pill, as distinct from the card behind it. */
const EXPANDER_HIGHLIGHT_PART = 'expander';

interface DatumCallbackState {
    allChildren: number;
    depth: number;
    directChildren: number;
    isCollapsed: boolean;
}

type OrganizationLayoutUpdateOptions = NetworkTreeLayoutUpdateOptions<OrganizationVertex, OrganizationEdge> &
    NetworkStackedLayoutUpdateOptions<OrganizationVertex, OrganizationEdge>;

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

    private stackedLayout?: NetworkStackedLayout<OrganizationVertex, OrganizationEdge>;

    /** Source-data index of the node whose expander pill the pointer is currently over. */
    private hoveredExpanderDatumIndex?: number;

    private hasAnyKeyedValue = false;

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(ctx);

        this.cleanup.register(ctx.eventsHub.on('highlight:change', (event) => this.onHighlightChange(event)));
    }

    createNetworkGraph() {
        return new OrganizationGraph(this.ctx.logger);
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

    override isVertexCollapsed(vertex: Vertex<OrganizationVertex, OrganizationEdge>): boolean {
        const itemId = vertex.value;
        return typeof itemId === 'string' && this.ctx.collapsedManager.isCollapsed(itemId);
    }

    override getCollapsedState(itemId: string | number) {
        return this.ctx.collapsedManager.isCollapsed(itemId);
    }

    async processData(dataController: _ModuleSupport.DataController) {
        this.hasAnyKeyedValue = false;

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

    override get hasData() {
        return this.hasAnyKeyedValue;
    }

    createNodeData() {
        const nodeData: OrganizationDatum[] = [];
        const linkData: OrganizationLinkDatum[] = [];

        if (this.rootVertex) {
            const vertices = this.graph.neighboursWithEdgeValue(this.rootVertex, 'child');
            if (vertices) {
                for (const vertex of vertices as Vertex<OrganizationVertex, OrganizationEdge>[]) {
                    linkData.push({ from: this.rootVertex, to: vertex });
                    this.createNodeDataFromVertex(nodeData, linkData, vertex, false, 1);
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
            const { collapsedByAncestor } = datum;
            node.visible = !collapsedByAncestor;
            if (collapsedByAncestor) return;

            const datumIndex = this.graph.findNeighbourValue(datum.vertex, 'datumIndex') as number;
            const depth = this.graph.findNeighbourValue(datum.vertex, 'depth') as number;
            const allChildren = this.graph.findNeighbourValue(datum.vertex, 'descendants') as number;
            const directChildren = this.graph.neighboursWithEdgeValue(datum.vertex, 'child')?.length ?? 0;

            const isHighlight = highlightedDatum?.datumIndex === datum.datumIndex;
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            // A leaf id present in `collapsedManager` hides nothing, so reporting it as collapsed
            // would mislead styler consumers about the rendered tree state.
            const isCollapsed =
                allChildren > 0 && datum.itemId != null && this.ctx.collapsedManager.isCollapsed(datum.itemId);

            const datumState: DatumCallbackState = {
                depth,
                allChildren,
                directChildren,
                isCollapsed,
            };

            const isExpanderHovered = this.hoveredExpanderDatumIndex === datumIndex;

            const styles = this.getNodeStyle(datumIndex, isHighlight, highlightState, datumState, isExpanderHovered);
            node.opacity = this.getNodeOpacity(datumIndex, isHighlight, highlightState);

            const fields = this.resolveVertexFields(datum.vertex);
            const title = this.formatText(fields.title, this.properties.node.title.formatter, datumIndex, datumState);
            const subtitle = this.formatText(
                fields.subtitle,
                this.properties.node.subtitle.formatter,
                datumIndex,
                datumState
            );
            const labels = fields.labels?.map((label, index) =>
                this.formatText(label, this.properties.node.labels[index]?.formatter, datumIndex, datumState)
            );

            let defaultExpanderText = '';
            if (styles.expander.text.showAllChildren && styles.expander.text.showDirectChildren) {
                defaultExpanderText = `${directChildren} / ${allChildren}`;
            } else if (styles.expander.text.showAllChildren) {
                defaultExpanderText = `${allChildren}`;
            } else if (styles.expander.text.showDirectChildren) {
                defaultExpanderText = `${directChildren}`;
            }
            const expanderText =
                this.formatText(defaultExpanderText, this.properties.expander.text.formatter, datumIndex, datumState) ??
                defaultExpanderText;

            node.update(
                { image: fields.image, title, subtitle, labels },
                expanderText,
                allChildren,
                styles,
                isCollapsed,
                this.ctx.domManager.isRtl,
                this.getNetworkTreeLayoutDirection()
            );
        });
    }

    updateLinkNodes(
        linkSelection: _ModuleSupport.Selection<OrganizationLinkDatum, NetworkLinkNode<OrganizationLinkDatum>>
    ) {
        linkSelection.each((node, datum) => {
            const fromIndex = this.graph.findNeighbourValue(datum.from, 'datumIndex') as number;
            const toIndex = this.graph.findNeighbourValue(datum.to, 'datumIndex') as number;

            const parentDatumIndex = this.getNodeDatumIndex(datum.from);
            const parentItemId =
                parentDatumIndex == null ? undefined : this.contextNodeData?.nodeData[parentDatumIndex].itemId;
            const visible = parentItemId == null || !this.ctx.collapsedManager.isCollapsed(parentItemId);

            node.visible = visible;
            if (visible) {
                const styles = this.getLinkStyle(fromIndex, toIndex);
                node.update(styles);
            }
        });
    }

    positionDatumNode(node: OrganizationNode, bbox: _ModuleSupport.BBox, regularBBox?: _ModuleSupport.BBox) {
        node.translationX = bbox.x;
        node.translationY = bbox.y;

        if (regularBBox) {
            node.updateBBox(regularBBox, this.getNetworkTreeLayoutDirection());
            node.realign(regularBBox);
        }

        const fullBBox = node.getFullBBox();

        // Add the bbox positions together to ensure the offset from expander is taken into account.
        return new _ModuleSupport.BBox(bbox.x + fullBBox.x, bbox.y + fullBBox.y, fullBBox.width, fullBBox.height);
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

    expandNetworkToItem(itemId: OrganizationVertexID, source: AgCollapsedChangeEventSource) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return;

        const id = this.resolveItemId(itemId);
        if (id == null) return;

        let vertex = this.graph.findVertexById(id);
        if (!vertex) return;

        // The root has no datumIndex; the whole ancestry is expanded so the active node is visible.
        const ids: OrganizationVertexID[] = [];
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

    expandItem(itemId: OrganizationVertexID, source: AgCollapsedChangeEventSource) {
        const id = this.resolveItemId(itemId);
        if (id == null) return false;

        const changed = this.ctx.collapsedManager.expand([id], this.id, source);
        if (changed) {
            this.markNodeDataDirty();
        }
        return changed;
    }

    collapseItem(itemId: OrganizationVertexID, source: AgCollapsedChangeEventSource) {
        const id = this.resolveItemId(itemId);
        if (id == null) return false;

        const changed = this.ctx.collapsedManager.collapseAppend([id], this.id, source);
        if (changed) {
            this.markNodeDataDirty();
        }
        return changed;
    }

    private isExpanderTarget(target: _ModuleSupport.Node<unknown> | undefined): boolean {
        const Expander: number = OrganizationNodeTag.Expander;
        return target?.tag === Expander;
    }

    // The manager has already performed the pick; this hook only names the part it hit.
    override getHighlightPart(target: _ModuleSupport.Node<unknown> | undefined): string | undefined {
        return this.isExpanderTarget(target) ? EXPANDER_HIGHLIGHT_PART : undefined;
    }

    // The highlight carries the hovered part while the pointer is over the pill, and drops it the
    // moment it is not.
    private onHighlightChange(event: _ModuleSupport.HighlightChangeEvent) {
        const { currentHighlight, currentHighlightPart } = event;
        const datumIndex =
            currentHighlight?.series === this &&
            currentHighlightPart === EXPANDER_HIGHLIGHT_PART &&
            typeof currentHighlight.datumIndex === 'number'
                ? currentHighlight.datumIndex
                : undefined;

        this.setHoveredExpanderDatumIndex(datumIndex);
    }

    private setHoveredExpanderDatumIndex(datumIndex: number | undefined) {
        if (this.hoveredExpanderDatumIndex === datumIndex) return;

        this.hoveredExpanderDatumIndex = datumIndex;
        // SERIES_UPDATE is the stage that re-runs `updateDatumNodes`, where expander paint is resolved;
        // SCENE_RENDER sits downstream of it and would not repaint.
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SERIES_UPDATE });
    }

    // A pointer click toggles collapse only on the expander pill, which `clickToExpand` widens to the
    // whole card. Keyboard activations carry no pointer target, so they toggle only when it is enabled.
    override hasBuiltinListener(target: _ModuleSupport.Node<unknown> | undefined): boolean {
        return this.isExpanderTarget(target) || this.properties.node.clickToExpand;
    }

    // Expanding is a distinct interaction from activating a node, so the expander pill keeps its
    // clicks to itself; a card-body click still fires the node events even when it also toggles.
    override firesUserClickListeners(target: _ModuleSupport.Node<unknown> | undefined): boolean {
        return !this.isExpanderTarget(target);
    }

    override pickFocus(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.PickFocusOutputs | undefined {
        const nodeData = this.contextNodeData?.nodeData;
        if (!nodeData?.length) return;

        const currentNodeIdx = clamp(0, opts.datumIndex - opts.datumIndexDelta, nodeData.length - 1);
        const currentVertex = nodeData[currentNodeIdx]?.vertex;
        if (!currentVertex) return;

        const next = this.resolveFocusVertex(currentVertex, opts.datumIndexDelta, opts.otherIndexDelta);
        if (!next) return;

        const nextDatumIdx = this.getNodeDatumIndex(next);
        if (nextDatumIdx == null) return;

        const node = this.datumSelection.at(nextDatumIdx);
        if (!node) return;

        const bounds = _ModuleSupport.Transformable.toCanvas(node, node.getFullBBox());
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

    override getDatumAriaMeta(datum: OrganizationDatum, _description: string) {
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
            return {
                text: this.ctx.localeManager.t('ariaAnnounceOrgChartLeaf', {
                    description,
                    level: depth,
                    posInSet,
                    setSize,
                }),
                instructions: undefined,
            };
        }

        const itemId = vertex.value as string;
        const isCollapsed = this.ctx.collapsedManager.isCollapsed(itemId);
        const collapsedState = this.ctx.localeManager.t(isCollapsed ? 'ariaOrgChartCollapsed' : 'ariaOrgChartExpanded');
        // Enter/Space only toggle when `clickToExpand` is enabled (see `hasBuiltinListener`).
        const instructions = [
            this.ctx.localeManager.t(isCollapsed ? 'ariaDescriptionExpandNode' : 'ariaDescriptionCollapseNode'),
        ];
        if (this.properties.node.clickToExpand) {
            instructions.push(this.ctx.localeManager.t('ariaDescriptionToggleNode'));
        }
        // Locale tooling has no `[plural]` annotation, so split the key by child count.
        const key = childCount === 1 ? 'ariaAnnounceOrgChartParentSingular' : 'ariaAnnounceOrgChartParent';
        return {
            text: this.ctx.localeManager.t(key, {
                description,
                level: depth,
                posInSet,
                setSize,
                childCount,
                collapsedState,
            }),
            instructions,
        };
    }

    findNodeDatum(itemId: AgActiveItemState['itemId']): OrganizationDatum | undefined {
        const id = this.resolveItemId(itemId);
        if (id == null) return undefined;

        const vertex = this.graph.findVertexById(id);
        if (!vertex) return undefined;

        return this.createNodeDatumFromVertex(vertex, false);
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
        return node.getShapeBBox();
    }

    // Hit-test the card only: the default full-bbox predicate also spans the expander pill's overhang,
    // so a drag-rect touching only the pill would wrongly pick the node.
    protected override pickNodesInBBoxPredicate() {
        const { containment } = this.properties.selection;
        return (selectionBox: BoxBounds, node: _ModuleSupport.Node): boolean => {
            // The card is the only selectable target; a node without one is never a hit.
            if (!(node instanceof OrganizationNode)) return false;
            const cardBox = _ModuleSupport.Transformable.toCanvas(node, node.getShapeBBox());
            return containment === 'all'
                ? boxContains(selectionBox, cardBox.x, cardBox.y, cardBox.width, cardBox.height)
                : boxCollides(selectionBox, cardBox.x, cardBox.y, cardBox.width, cardBox.height);
        };
    }

    protected override makeLayoutUpdateOptions(): OrganizationLayoutUpdateOptions {
        const {
            properties: { node, expander, innerSpacing, outerSpacing, depthSpacing, layout },
        } = this;

        return {
            ...super.makeLayoutUpdateOptions(),
            nodeHeight: node.height,
            nodeWidth: node.width,
            nodeMaxHeight: node.maxHeight,
            nodeMaxWidth: node.maxWidth,

            regularDimensions: true,
            hiddenOnCollapse: true,

            direction: this.getNetworkTreeLayoutDirection(),
            depthSpacing: depthSpacing ?? 0,
            innerSpacing: innerSpacing ?? 0,
            outerSpacing: outerSpacing ?? 0,

            verticalSpacingExtra: expander.enabled
                ? (expander.text.fontSize + expander.padding.top + expander.padding.bottom + expander.strokeWidth) / 2
                : 0,

            linkIndentation: layout.linkIndentation,
            nodeIndentation: layout.nodeIndentation,
            stackFromDepth: layout.stackFromDepth,

            getLayout:
                layout.type === 'stacked'
                    ? (vertex) => {
                          const depth = this.graph.findNeighbourValue(vertex, 'depth') as number | undefined;
                          if (depth == null || depth < layout.stackFromDepth - 1) return;

                          this.stackedLayout ??= new NetworkStackedLayout();
                          return this.stackedLayout;
                      }
                    : () => undefined,
        };
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

    // Returns `undefined` for a no-op so focus stays put; ArrowDown on a collapsed node expands it.
    private resolveFocusVertex(
        current: Vertex<OrganizationVertex, OrganizationEdge>,
        siblingDelta: number,
        depthDelta: number
    ): Vertex<OrganizationVertex, OrganizationEdge> | undefined {
        if (depthDelta > 0) {
            const itemId = current.value as string;
            if (this.ctx.collapsedManager.isCollapsed(itemId)) {
                this.expandItem(itemId, 'user-interaction');
                this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
            }
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
        this.hasAnyKeyedValue = this.graph.build(
            idValues,
            parentIdValues,
            imageValues,
            titleValues,
            subtitleValues,
            labelsValues,
            this.rootVertex
        );

        if (!this.hasAnyKeyedValue) {
            this.ctx.logger.warnOnce(
                `None of [title.key], [subtitle.key], [image.key] or [labels[].key] were found in the data for [${this.id}].`
            );
        }

        this.graph.computeDescendants(this.getRootVertices());
    }

    private createNodeDataFromVertex(
        nodeData: OrganizationDatum[],
        linkData: OrganizationLinkDatum[],
        vertex: Vertex<OrganizationVertex, OrganizationEdge>,
        collapsedByAncestor: boolean,
        depth: number
    ) {
        const nodeDatumIndex = nodeData.length;
        this.setNodeDatumIndex(vertex, nodeDatumIndex);

        this.graph.addEdge(vertex, this.graph.addVertex(depth), 'depth');

        const nodeDatum = this.createNodeDatumFromVertex(vertex, collapsedByAncestor);
        nodeData.push(nodeDatum);

        const children = this.graph.neighboursWithEdgeValue(vertex, 'child') as
            | Vertex<OrganizationVertex, OrganizationEdge>[]
            | undefined;
        if (!children) return;

        collapsedByAncestor ||= this.ctx.collapsedManager.isCollapsed(vertex.value as string);

        for (const childVertex of children) {
            const linkDatum: OrganizationLinkDatum = {
                from: vertex,
                to: childVertex,
            };

            linkData.push(linkDatum);

            this.createNodeDataFromVertex(nodeData, linkData, childVertex, collapsedByAncestor, depth + 1);
        }
    }

    private formatText(
        text: NormalisedTextOrSegments | undefined,
        formatter: RichFormatter<AgOrganizationNodeTextFormatterParams> | undefined,
        datumIndex: number | undefined,
        datumState: DatumCallbackState
    ) {
        const { dataModel, processedData } = this;
        if (!formatter || !dataModel || !processedData || datumIndex == null) return text;

        return (
            this.callWithContext(
                formatter,
                this.makeNodeTextFormatterParams(dataModel, processedData, datumIndex, datumState, text)
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

    private createNodeDatumFromVertex(
        vertex: Vertex<OrganizationVertex, OrganizationEdge>,
        collapsedByAncestor: boolean
    ): OrganizationDatum {
        const datumIndex = this.graph.findNeighbourValue(vertex, 'datumIndex') as number;
        const userDatum = this.processedData?.dataSources.get(this.id)?.data?.[datumIndex];
        return {
            series: this,
            datum: userDatum,
            itemId: vertex.value as string,
            datumIndex,
            vertex,
            collapsedByAncestor,
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
        datumIndex: number,
        isHighlight: boolean,
        highlightState: _ModuleSupport.HighlightState | undefined,
        datumState: DatumCallbackState,
        isExpanderHovered: boolean
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
            highlightState,
            datumState
        );

        style.title = this.getNodeTextItemStylerStyle(
            titleStyler,
            style.title,
            'title',
            dataModel,
            processedData,
            datumIndex,
            highlightState,
            datumState
        );
        style.subtitle = this.getNodeTextItemStylerStyle(
            subtitleStyler,
            style.subtitle,
            'subtitle',
            dataModel,
            processedData,
            datumIndex,
            highlightState,
            datumState
        );

        style.expander = this.getExpanderItemStylerStyle(
            expanderStyler,
            style.expander,
            dataModel,
            processedData,
            datumIndex,
            highlightState,
            datumState
        );

        // Applied after the styler so hovering does not re-invoke the user's callback with hover-shifted
        // params, and so the hovered treatment wins over whatever the styler returned.
        if (isExpanderHovered) {
            style.expander = this.applyExpanderHoverStyle(style.expander);
        }

        let labelIndex = 0;
        for (const { itemStyler: labelStyler } of this.properties.node.labels) {
            style.labels[labelIndex] = this.getNodeTextItemStylerStyle(
                labelStyler,
                style.labels[labelIndex],
                _ModuleSupport.createDatumId('label', labelIndex),
                dataModel,
                processedData,
                datumIndex,
                highlightState,
                datumState
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

    private applyExpanderHoverStyle(
        style: NormalisedOrganizationSeriesExpanderStyle
    ): NormalisedOrganizationSeriesExpanderStyle {
        const { hoverStyle } = this.properties.expander;
        return {
            ...style,
            fill: hoverStyle.fill ?? style.fill,
            fillOpacity: hoverStyle.fillOpacity ?? style.fillOpacity,
            lineDash: hoverStyle.lineDash ?? style.lineDash,
            lineDashOffset: hoverStyle.lineDashOffset ?? style.lineDashOffset,
            stroke: hoverStyle.stroke ?? style.stroke,
            strokeOpacity: hoverStyle.strokeOpacity ?? style.strokeOpacity,
            text: {
                ...style.text,
                color: hoverStyle.text.color ?? style.text.color,
                fontWeight: hoverStyle.text.fontWeight ?? style.text.fontWeight,
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
        highlightState: _ModuleSupport.HighlightState | undefined,
        datumState: DatumCallbackState
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, 'node', datumState.isCollapsed),
            () => {
                const params = this.makeNodeItemStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    highlightState,
                    datumState,
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
        highlightState: _ModuleSupport.HighlightState | undefined,
        datumState: DatumCallbackState
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, 'expander', datumState.isCollapsed),
            () => {
                const params = this.makeExpanderItemStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    highlightState,
                    datumState,
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
        highlightState: _ModuleSupport.HighlightState | undefined,
        datumState: DatumCallbackState
    ) {
        if (!styler || !dataModel || !processedData || datumIndex == null) {
            return style;
        }

        const overrides = this.cachedDatumCallback(
            _ModuleSupport.createDatumId(this.id, datumIndex, datumIdSuffix, datumState.isCollapsed),
            () => {
                const params = this.makeNodeTextStylerParams(
                    dataModel,
                    processedData,
                    datumIndex,
                    highlightState,
                    datumState,
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
        highlightState: _ModuleSupport.HighlightState | undefined,
        datumState: DatumCallbackState,
        style: NormalisedOrganizationNodeStyle
    ): AgOrganizationSeriesNodeItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            ...datumState,
            datum,
            seriesId,
            highlightState: highlightState == null ? 'none' : _ModuleSupport.toHighlightString(highlightState),
            selectionState: this.getSelectionStateString(datumIndex),
            candidateState: this.getCandidateStateString(datumIndex),
            // Internal unset sentinels (NaN/Infinity) must reach styler consumers as undefined.
            width: Number.isNaN(style.width) ? undefined : style.width,
            height: Number.isNaN(style.height) ? undefined : style.height,
            maxWidth: Number.isFinite(style.maxWidth) ? style.maxWidth : undefined,
            maxHeight: Number.isFinite(style.maxHeight) ? style.maxHeight : undefined,
        } satisfies CallbackParamRules<AgOrganizationSeriesNodeItemStylerParams<unknown, unknown>>;
    }

    private makeExpanderItemStylerParams(
        _dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        highlightState: _ModuleSupport.HighlightState | undefined,
        datumState: DatumCallbackState,
        style: NormalisedOrganizationSeriesExpanderStyle
    ): AgOrganizationSeriesExpanderItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            ...datumState,
            datum,
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
        highlightState: _ModuleSupport.HighlightState | undefined,
        datumState: DatumCallbackState,
        style: NormalisedOrganizationNodeTextStyle
    ): AgOrganizationSeriesNodeTextStylerParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...style,
            ...datumState,
            datum,
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
        datumState: DatumCallbackState,
        value: any
    ): AgOrganizationNodeTextFormatterParams<unknown, unknown> {
        const { id: seriesId } = this;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];

        return {
            ...datumState,
            datum,
            seriesId,
            value,
        } satisfies CallbackParamRules<AgOrganizationNodeTextFormatterParams<unknown, unknown>>;
    }

    // Resolve as a real vertex id first; only a number matching no vertex is treated as a datumSelection index.
    private resolveItemId(itemIdOrIndex: string | number): OrganizationVertexID | undefined {
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

        const nodeDatumIndex = this.getNodeDatumIndex(vertex);
        if (nodeDatumIndex == null) return;

        return nodeDatumIndex;
    }

    private getNetworkTreeLayoutDirection(): AgNetworkSeriesTreeLayoutDirection {
        const { direction, reverse } = this.properties;
        if (reverse) {
            return direction === 'horizontal' ? 'left' : 'up';
        }
        return direction === 'horizontal' ? 'right' : 'down';
    }
}
