import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
    type AgGaugeOptions,
    type AgLinearGaugeOptions,
    type AgMapMarkerSeriesOptions,
    type AgRadialGaugeOptions,
    type AgStandaloneChartOptions,
    type _ModuleSupport,
} from 'ag-charts-community';
import {
    HIGH_VOLUME_COUNT,
    deproxy,
    errorFrom,
    expectWarningsCalls,
    getLegendItemNodes,
    getSeriesAt,
    getSeriesContextNodeData,
    getSeriesNodeData,
    getSeriesRect,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { BBox, Group, type Node, Sector, Shape, type Text } from 'ag-charts-core';

import { FlowProportionDatumType } from '../series/flow-proportion/flowDatumIndex';
import { FunnelConnector } from '../series/funnel/funnelConnector';
import { HeatmapSeries } from '../series/heatmap/heatmapSeries';
import { type HierarchyNode } from '../series/hierarchy/hierarchySeries';
import { HlcSeries } from '../series/hlc/hlcSeries';
import { type HlcMarkerDatum } from '../series/hlc/hlcUtil';
import { LinearGaugeSeries } from '../series/linear-gauge/linearGaugeSeries';
import { type MapMarkerNodeDatum, MapMarkerSeries } from '../series/map-marker/mapMarkerSeries';
import { ukData } from '../series/map-test/ukData';
import ukTopology from '../series/map-test/ukTopology.json';
import { OhlcSeries } from '../series/ohlc/ohlcSeries';
import { OrganizationNode } from '../series/organization/organizationNode';
import { OrganizationSeries } from '../series/organization/organizationSeries';
import { RadialGaugeSeries } from '../series/radial-gauge/radialGaugeSeries';
import { WaterfallSeries } from '../series/waterfall/waterfallSeries';
import {
    destroyChart,
    getEnterpriseSelectionNodes,
    getFlowHighlightNode,
    getFlowLinkData,
    getFlowNodeData,
    getFunnelConnectorNodes,
    getHeatmapCellMethods,
    getHierarchyNodeLabel,
    getHlcAggregationFilter,
    getHlcBandEdgeData,
    getHlcHighlightData,
    getLegendHighlightCallerIds,
    getLegendItemSuppressHighlight,
    getLegendItemTranslationX,
    getLinearGaugeRects,
    getMapMarkerSizeRange,
    getMapMarkerStyleSize,
    getMapShapeLabelAspectRatio,
    getNavigatorMiniChartSeriesTypes,
    getNetworkContentBBox,
    getNetworkSeriesRect,
    getNetworkViewport,
    getOrganizationCardContentHeight,
    getOrganizationCardTexts,
    getOrganizationCards,
    getOrganizationGraph,
    getOrganizationLinks,
    getOrganizationNodeDatumIndex,
    getPlacedLabelData,
    getRadarAreaGroups,
    getSeriesAreaFocusDatum,
    getSeriesGroup,
    getSeriesInstance,
    getSeriesLabelTexts,
    getStageHighlightNode,
    getTreemapNodeLayout,
} from './enterpriseSeriesAccessors';
import { getHierarchyRootNode } from './seriesAccessors';
import { collectShapes, createEnterpriseChart, prepareEnterpriseTestOptions } from './utils';

describe('enterprise series test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const ORG_DATA = [
        { id: 'ceo', name: 'Alice', job: 'CEO', location: 'London', parentId: null },
        { id: 'cto', name: 'Bob', job: 'CTO', location: 'Paris', parentId: 'ceo' },
        { id: 'cfo', name: 'Carol', job: 'CFO', parentId: 'ceo' },
    ];

    const orgOptions = (): AgChartOptions => ({
        data: ORG_DATA,
        series: [
            {
                type: 'organization',
                idKey: 'id',
                parentIdKey: 'parentId',
                node: { title: { key: 'name' }, subtitle: { key: 'job' }, labels: [{ key: 'location' }] },
            },
        ],
    });

    const titleOnlyOrgOptions = (): AgChartOptions => ({
        data: ORG_DATA,
        series: [{ type: 'organization', idKey: 'id', parentIdKey: 'parentId', node: { title: { key: 'name' } } }],
    });

    const sunburstOptions = (series: object = {}): AgChartOptions => ({
        data: [
            {
                name: 'Root',
                children: [
                    { name: 'A', size: 3 },
                    { name: 'B', size: 2 },
                ],
            },
        ],
        series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size', ...series }],
        animation: { enabled: false },
    });

    const chordOptions = (): AgChartOptions => ({
        data: [
            { from: 'A', to: 'B', size: 5 },
            { from: 'B', to: 'C', size: 4 },
        ],
        series: [{ type: 'chord', fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
    });

    const sankeyOptions = (): AgStandaloneChartOptions => ({
        data: [
            { from: 'A', to: 'B', size: 5 },
            { from: 'B', to: 'C', size: 4 },
        ],
        series: [{ type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
    });

    describe('getSeriesInstance (organization)', () => {
        it('returns the organization series, from a chart or its proxy', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const series = getSeriesInstance(chart, OrganizationSeries);

            expect(series).toBeInstanceOf(OrganizationSeries);
            expect(getSeriesInstance(deproxy(chart), OrganizationSeries)).toBe(series);
        });

        it('fails for a series that is not an organization series', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getSeriesInstance(chart!, OrganizationSeries))?.name).toBe('AssertionError');
        });
    });

    describe('getOrganizationGraph', () => {
        it('returns the graph the series built, with a vertex for each row', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const graph = getOrganizationGraph(chart);

            for (const { id } of ORG_DATA) {
                expect(graph.findVertexById(id)).toBeDefined();
            }
            expect(graph.findVertexById('missing')).toBeUndefined();
        });

        it('fails for a series that is not an organization series', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getOrganizationGraph(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getOrganizationNodeDatumIndex', () => {
        it('returns the selection index of the node drawn for a vertex', async () => {
            chart = await createEnterpriseChart(orgOptions());
            const graph = getOrganizationGraph(chart);

            const indices = ORG_DATA.map(({ id }) => getOrganizationNodeDatumIndex(chart!, graph.findVertexById(id)!));

            expect(indices).toEqual([0, 1, 2]);
        });

        it('returns undefined for a vertex the series draws no node for', async () => {
            chart = await createEnterpriseChart(orgOptions());
            const [{ datum: rootLink }] = getOrganizationLinks(chart);

            expect(getOrganizationNodeDatumIndex(chart, rootLink.from)).toBeUndefined();
        });

        it('fails for a series that is not an organization series', async () => {
            chart = await createEnterpriseChart(orgOptions());
            const vertex = getOrganizationGraph(chart).findVertexById('ceo')!;
            chart.destroy();
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getOrganizationNodeDatumIndex(chart!, vertex))?.name).toBe('AssertionError');
        });
    });

    describe('getOrganizationCards', () => {
        it('returns a card for each row, in selection order, with the datum it was drawn for', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const cards = getOrganizationCards(chart);

            expect(cards.map(({ datum }) => datum.itemId)).toEqual(['ceo', 'cto', 'cfo']);
            expect(cards.every(({ node }) => node instanceof OrganizationNode)).toBe(true);
            expect(cards.every(({ datum }) => datum.collapsedByAncestor === false)).toBe(true);
        });

        it('flags the cards below a collapsed card', async () => {
            chart = await createEnterpriseChart({ ...orgOptions(), initialState: { collapsed: ['ceo'] } });

            const collapsed = getOrganizationCards(chart)
                .filter(({ datum }) => datum.collapsedByAncestor)
                .map(({ datum }) => datum.itemId);

            expect(collapsed).toEqual(['cto', 'cfo']);
        });

        it('fails for a series that draws no cards', async () => {
            chart = await createEnterpriseChart(chordOptions());

            expect(errorFrom(() => getOrganizationCards(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getOrganizationLinks', () => {
        it('returns a link from the series root and from each parent to its children', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const links = getOrganizationLinks(chart).map(
                ({ datum }) => `${String(datum.from.value)}->${String(datum.to.value)}`
            );

            expect(links).toEqual(['root->ceo', 'ceo->cto', 'ceo->cfo']);
        });

        it('hides the links below a collapsed card', async () => {
            chart = await createEnterpriseChart({ ...orgOptions(), initialState: { collapsed: ['ceo'] } });

            const visibility = getOrganizationLinks(chart).map(({ node }) => node.visible);

            expect(visibility).toEqual([true, false, false]);
        });

        it('fails for a series that draws no links', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getOrganizationLinks(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getOrganizationCardTexts', () => {
        it('returns the title, subtitle and label text a card rendered', async () => {
            chart = await createEnterpriseChart(orgOptions());
            const [ceo] = getOrganizationCards(chart);

            expect(getOrganizationCardTexts(ceo.node)).toEqual({
                title: 'Alice',
                subtitle: 'CEO',
                labels: ['London'],
            });
        });

        it('leaves a tier undefined when the card has no text for it', async () => {
            chart = await createEnterpriseChart(titleOnlyOrgOptions());
            const [ceo] = getOrganizationCards(chart);

            expect(getOrganizationCardTexts(ceo.node)).toEqual({ title: 'Alice', subtitle: undefined, labels: [] });
        });

        it('returns no text for a card that has not been laid out', () => {
            expect(getOrganizationCardTexts(new OrganizationNode())).toEqual({
                title: undefined,
                subtitle: undefined,
                labels: [],
            });
        });

        it('fails when what the card holds as its title is not text', () => {
            const card = new OrganizationNode();
            Reflect.set(card, 'titleNode', new Group());

            expect(errorFrom(() => getOrganizationCardTexts(card))?.name).toBe('AssertionError');
        });
    });

    describe('getOrganizationCardContentHeight', () => {
        it('returns a height that grows with the tiers a card lays out', async () => {
            chart = await createEnterpriseChart(orgOptions());
            const [withTiers] = getOrganizationCards(chart);
            const withTiersHeight = getOrganizationCardContentHeight(withTiers.node);
            chart.destroy();

            chart = await createEnterpriseChart(titleOnlyOrgOptions());
            const [titleOnly] = getOrganizationCards(chart);
            const titleOnlyHeight = getOrganizationCardContentHeight(titleOnly.node);

            expect(titleOnlyHeight).toBeGreaterThan(0);
            expect(withTiersHeight).toBeGreaterThan(titleOnlyHeight);
        });

        it('fails for a card that has not been laid out', () => {
            expect(errorFrom(() => getOrganizationCardContentHeight(new OrganizationNode()))?.name).toBe(
                'AssertionError'
            );
        });
    });

    describe('getNetworkViewport', () => {
        it('returns the scale and translation the series applies to its content', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const viewport = getNetworkViewport(chart);

            // Content that fits the series rect is shown at full size, centred in it.
            const content = getNetworkContentBBox(chart);
            const { width, height } = getNetworkSeriesRect(chart);
            expect(Object.keys(viewport)).toHaveLength(4);
            expect(viewport.scalingX).toBeCloseTo(1, 5);
            expect(viewport.scalingY).toBeCloseTo(1, 5);
            expect(viewport.translationX).toBeCloseTo(width / 2 - (content.x + content.width / 2), 3);
            expect(viewport.translationY).toBeCloseTo(height / 2 - (content.y + content.height / 2), 3);
        });

        it('follows a zoom of the chart', async () => {
            // Content that already fits the canvas refuses a zoom-in, so use a chart that overflows it.
            const data = [
                { id: 'ceo', name: 'Alice', job: 'CEO', location: 'London', parentId: null as string | null },
            ];
            for (let i = 0; i < 12; i++) {
                data.push({ id: `r${i}`, name: `Report ${i}`, job: 'Engineer', location: 'Paris', parentId: 'ceo' });
            }
            chart = await createEnterpriseChart({ ...orgOptions(), data });
            const before = getNetworkViewport(chart);

            deproxy(chart).ctx.zoomManager?.updateZoom(
                { source: 'state-change', sourceDetail: 'unspecified' },
                { x: { min: 0.4, max: 0.6 }, y: { min: 0.4, max: 0.6 } }
            );
            await waitForChartStability(chart);

            expect(getNetworkViewport(chart)).not.toEqual(before);
        });

        it('fails for a series that is not a network series', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getNetworkViewport(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getNetworkContentBBox', () => {
        it('returns the bounds of the laid out cards', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const bbox = getNetworkContentBBox(chart);

            const cards = getOrganizationCards(chart).map(({ node }) => node.getBBox());
            const left = Math.min(...cards.map(({ x }) => x));
            const top = Math.min(...cards.map(({ y }) => y));
            const right = Math.max(...cards.map(({ x, width }) => x + width));
            const bottom = Math.max(...cards.map(({ y, height }) => y + height));
            expect(bbox).toBeInstanceOf(BBox);
            expect(bbox.x).toBeCloseTo(left, 3);
            expect(bbox.y).toBeCloseTo(top, 3);
            expect(bbox.x + bbox.width).toBeCloseTo(right, 3);
            expect(bbox.y + bbox.height).toBeCloseTo(bottom, 3);
        });

        it('fails when the layout placed nothing', async () => {
            chart = await createEnterpriseChart({ ...orgOptions(), data: [] });
            expectWarningsCalls().toEqual([[expect.stringContaining('No matches were found')]]);

            expect(errorFrom(() => getNetworkContentBBox(chart!))?.name).toBe('AssertionError');
        });

        it('fails for a series that is not a network series', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getNetworkContentBBox(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getNetworkSeriesRect', () => {
        it('returns the rect the chart gave the series, which is the chart series rect', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const rect = getNetworkSeriesRect(chart);

            expect(rect).toBeInstanceOf(BBox);
            expect(rect).toEqual(getSeriesRect(chart));
        });

        it('fails for a series that is not a network series', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getNetworkSeriesRect(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getTreemapNodeLayout', () => {
        const treemapOptions = (series: object = {}): AgChartOptions => ({
            data: [
                {
                    name: 'Group',
                    children: [
                        { name: 'Leaf A', detail: 'Detail A', size: 3 },
                        { name: 'Leaf B', detail: 'Detail B', size: 2 },
                    ],
                },
            ],
            series: [{ type: 'treemap', labelKey: 'name', secondaryLabelKey: 'detail', sizeKey: 'size', ...series }],
            animation: { enabled: false },
        });

        const nodes = () => {
            const out: HierarchyNode[] = [];
            getHierarchyRootNode(chart!)?.walk((node: HierarchyNode) => out.push(node));
            return out;
        };

        it('returns the box, padding and title of a group and the labels and box of a tile', async () => {
            chart = await createEnterpriseChart(treemapOptions());
            const [, group, leafA, leafB] = nodes().map(getTreemapNodeLayout);

            expect(group.bbox).toBeInstanceOf(BBox);
            expect(group.label?.text).toBe('Group');
            expect(group.padding?.top).toBeGreaterThan(group.padding?.bottom ?? Infinity);
            expect(group.groupTitleLabelHeight).toBeGreaterThan(0);
            // The tiles share the group's box between them, side by side or stacked.
            expect(leafA.bbox).toBeInstanceOf(BBox);
            expect(leafB.bbox).toBeInstanceOf(BBox);
            expect(leafA.bbox!.width * leafA.bbox!.height).toBeGreaterThan(leafB.bbox!.width * leafB.bbox!.height);
            expect(leafA.label?.text).toBe('Leaf A');
            expect(leafA.secondaryLabel?.text).toBe('Detail A');
            expect(leafA.label!.y).toBeLessThan(leafA.secondaryLabel!.y);
            expect(leafA.label!.fontSize).toBeGreaterThan(0);
            expect(leafA.label!.lineHeight).toBeGreaterThan(0);
            expect(leafA.groupTitleLabelHeight).toBeUndefined();
        });

        it('returns `undefined` for a label the series laid out nothing for', async () => {
            chart = await createEnterpriseChart(treemapOptions({ tile: { label: { enabled: false } } }));
            const [, , leafA] = nodes().map(getTreemapNodeLayout);

            expect(leafA.bbox).toBeInstanceOf(BBox);
            expect(leafA.label).toBeUndefined();
            expect(leafA.secondaryLabel?.text).toBe('Detail A');
        });

        it('fails for a node that is not a treemap node', async () => {
            chart = await createEnterpriseChart(sunburstOptions());
            const [root] = nodes();

            expect(errorFrom(() => getTreemapNodeLayout(root))?.name).toBe('AssertionError');
        });
    });

    describe('getSeriesGroup', () => {
        it.each(['sectorGroup', 'scalingGroup'] as const)('returns the %s of a sunburst series', async (name) => {
            chart = await createEnterpriseChart(sunburstOptions());

            const group = getSeriesGroup(chart, name);

            expect(group).toBeInstanceOf(Group);
            expect(group.children().next().done).toBe(false);
        });

        it('returns the sectors the sunburst series drew from its sector group', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            const sectors = Array.from(getSeriesGroup(chart, 'sectorGroup').children());

            // The series root is drawn as well as its three rows.
            expect(sectors).toHaveLength(4);
            expect(sectors.every((sector) => sector instanceof Sector)).toBe(true);
        });

        it('returns the inner labels group, empty until the series has inner labels', async () => {
            chart = await createEnterpriseChart(sunburstOptions());
            expect(Array.from(getSeriesGroup(chart, 'innerLabelsGroup').children())).toHaveLength(0);
            chart.destroy();

            chart = await createEnterpriseChart(
                sunburstOptions({ innerRadiusRatio: 0.4, innerLabels: [{ text: 'Total' }] })
            );
            expect(Array.from(getSeriesGroup(chart, 'innerLabelsGroup').children())).toHaveLength(1);
        });

        it.each(['nodeGroup', 'linkGroup'] as const)('returns the %s of a flow-proportion series', async (name) => {
            chart = await createEnterpriseChart(sankeyOptions());

            const shapes = collectShapes(getSeriesGroup(chart, name));

            // Three nodes, two links.
            expect(shapes).toHaveLength(name === 'nodeGroup' ? 3 : 2);
        });

        it.each(['highlightNodeGroup', 'highlightLinkGroup'] as const)(
            'returns the %s of a flow-proportion series, empty until something is highlighted',
            async (name) => {
                chart = await createEnterpriseChart(sankeyOptions());

                expect(Array.from(getSeriesGroup(chart, name).children())).toHaveLength(0);
            }
        );

        it('returns the label group of a polar series', async () => {
            chart = await createEnterpriseChart({
                data: [
                    { subject: 'Maths', score: 7 },
                    { subject: 'Physics', score: 4 },
                    { subject: 'Biology', score: 3 },
                ],
                series: [{ type: 'radar-line', angleKey: 'subject', radiusKey: 'score', label: { enabled: true } }],
            });

            const labels = Array.from(getSeriesGroup(chart, 'labelGroup').children());

            expect(labels).toHaveLength(3);
        });

        it('fails for a group the series does not have', async () => {
            chart = await createEnterpriseChart(orgOptions());

            expect(errorFrom(() => getSeriesGroup(chart!, 'sectorGroup'))?.name).toBe('AssertionError');
        });
    });

    describe('getSeriesLabelTexts', () => {
        it('returns the text nodes a treemap drew for its groups and tiles', async () => {
            chart = await createEnterpriseChart({
                data: [
                    {
                        name: 'Group',
                        children: [
                            { name: 'Leaf A', size: 3 },
                            { name: 'Leaf B', size: 2 },
                        ],
                    },
                ],
                series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size' }],
                animation: { enabled: false },
            });

            const texts = getSeriesLabelTexts(chart)
                .filter(({ visible }) => visible)
                .map(({ text }) => text);

            expect(texts).toEqual(expect.arrayContaining(['Group', 'Leaf A', 'Leaf B']));
        });
    });

    describe('getEnterpriseSelectionNodes', () => {
        it('returns the link nodes of a network series', async () => {
            chart = await createEnterpriseChart(orgOptions());

            expect(getEnterpriseSelectionNodes(chart, 'linkSelection')).toHaveLength(3);
        });

        it('returns the centre circle of a sunburst series with a hole', async () => {
            chart = await createEnterpriseChart(
                sunburstOptions({ innerRadiusRatio: 0.4, innerCircle: { fill: 'red' } })
            );

            expect(getEnterpriseSelectionNodes(chart, 'innerCircleSelection')).toHaveLength(1);
        });

        it('returns no centre circle for a sunburst series without a hole', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(getEnterpriseSelectionNodes(chart, 'innerCircleSelection')).toEqual([]);
        });

        it('fails for a selection the series does not have', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getEnterpriseSelectionNodes(chart!, 'linkSelection'))?.name).toBe('AssertionError');
        });
    });

    describe('getFlowNodeData', () => {
        it('returns the node datums of a sankey series', async () => {
            chart = await createEnterpriseChart(sankeyOptions());

            const ids = getFlowNodeData(chart).map(({ id }) => String(id));

            ids.sort((a, b) => a.localeCompare(b));
            expect(ids).toEqual(['A', 'B', 'C']);
        });

        it('returns the node datums of a chord series, and no link datums among them', async () => {
            chart = await createEnterpriseChart(chordOptions());

            const nodes = getFlowNodeData(chart);

            const ids = nodes.map(({ id }) => String(id));
            ids.sort((a, b) => a.localeCompare(b));
            expect(ids).toEqual(['A', 'B', 'C']);
            expect(nodes.every(({ type }) => type === FlowProportionDatumType.Node)).toBe(true);
        });

        it('types the geometry a series adds to its node datums', async () => {
            chart = await createEnterpriseChart(sankeyOptions());

            const nodes = getFlowNodeData<{ x: number; width: number }>(chart);

            expect(nodes).toHaveLength(3);
            expect(nodes.every(({ x, width }) => Number.isFinite(x) && width > 0)).toBe(true);
        });

        it('fails for a series that keeps no node data context', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getFlowNodeData(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getFlowLinkData', () => {
        it('returns the link datums of a sankey series', async () => {
            chart = await createEnterpriseChart(sankeyOptions());

            const links = getFlowLinkData(chart).map(({ fromNode, toNode }) => `${fromNode.id}->${toNode.id}`);

            links.sort((a, b) => a.localeCompare(b));
            expect(links).toEqual(['A->B', 'B->C']);
        });

        it('returns the link datums of a chord series, and no node datums among them', async () => {
            chart = await createEnterpriseChart(chordOptions());

            const links = getFlowLinkData(chart);

            const names = links.map(({ fromNode, toNode }) => `${fromNode.id}->${toNode.id}`);
            names.sort((a, b) => a.localeCompare(b));
            expect(names).toEqual(['A->B', 'B->C']);
            expect(links.every(({ type }) => type === FlowProportionDatumType.Link)).toBe(true);
        });

        it('fails for a series that keeps no node data context', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getFlowLinkData(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getFlowHighlightNode', () => {
        it('returns undefined while nothing is highlighted', async () => {
            chart = await createEnterpriseChart(sankeyOptions());

            expect(getFlowHighlightNode(chart)).toBeUndefined();
        });

        it.each([
            ['node', getFlowNodeData],
            ['link', getFlowLinkData],
        ] as const)('returns the highlight-layer copy of the highlighted %s', async (kind, getDatums) => {
            chart = await createEnterpriseChart(sankeyOptions());
            const { ctx, id } = deproxy(chart);
            const datum = getDatums(chart)[0];

            ctx.highlightManager.updateHighlight(id, datum);
            await waitForChartStability(chart);

            const highlighted = getFlowHighlightNode(chart);
            expect(highlighted).toBeInstanceOf(Shape);
            expect(highlighted?.datum).toMatchObject({ itemId: datum.itemId });
            const layer = kind === 'node' ? 'highlightNodeGroup' : 'highlightLinkGroup';
            expect(Array.from(getSeriesGroup(chart, layer).children())).toContain(highlighted);
        });

        it('works for a chord series', async () => {
            chart = await createEnterpriseChart(chordOptions());
            const { ctx, id } = deproxy(chart);
            const [node] = getFlowNodeData(chart);

            ctx.highlightManager.updateHighlight(id, node);
            await waitForChartStability(chart);

            expect(getFlowHighlightNode(chart)?.datum).toMatchObject({ itemId: node.itemId });
        });
    });
});

describe('funnel, pyramid and heatmap test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const STAGES = [
        { group: 'Qualify', value: 7910 },
        { group: 'Develop', value: 8170 },
        { group: 'Propose', value: 7260 },
        { group: 'Close', value: 4460 },
    ];

    const stageOptions: Record<'funnel' | 'cone-funnel' | 'pyramid', AgChartOptions> = {
        funnel: { data: STAGES, series: [{ type: 'funnel', stageKey: 'group', valueKey: 'value' }] },
        'cone-funnel': { data: STAGES, series: [{ type: 'cone-funnel', stageKey: 'group', valueKey: 'value' }] },
        pyramid: { data: STAGES, series: [{ type: 'pyramid', stageKey: 'group', valueKey: 'value' }] },
    };

    const heatmapOptions = (colorScale: object = {}): AgChartOptions => ({
        data: [
            { year: '2020', person: 'A', spending: 10 },
            { year: '2020', person: 'B', spending: 20 },
            { year: '2021', person: 'A', spending: 30 },
            { year: '2021', person: 'B', spending: 40 },
        ],
        series: [{ type: 'heatmap', xKey: 'year', yKey: 'person', colorKey: 'spending', colorScale }],
    });

    describe('getStageHighlightNode', () => {
        it.each(['funnel', 'cone-funnel', 'pyramid'] as const)(
            'returns the highlight-layer copy of the highlighted %s stage',
            async (type) => {
                chart = await createEnterpriseChart(stageOptions[type]);
                const { ctx, id } = deproxy(chart);
                const datum = getSeriesContextNodeData(chart).nodeData[1];

                ctx.highlightManager.updateHighlight(id, datum);
                await waitForChartStability(chart);

                const highlighted = getStageHighlightNode(chart);
                expect(highlighted).toBeInstanceOf(Shape);
                expect(Array.from(getSeriesAt(chart).highlightNodeGroup.children())).toContain(highlighted);
            }
        );

        it('picks the copy of the stage that is highlighted, not another', async () => {
            chart = await createEnterpriseChart(stageOptions.funnel);
            const { ctx, id } = deproxy(chart);
            const { nodeData } = getSeriesContextNodeData(chart);

            ctx.highlightManager.updateHighlight(id, nodeData[2]);
            await waitForChartStability(chart);

            expect(getStageHighlightNode(chart)?.datum).toMatchObject({ datumIndex: nodeData[2].datumIndex });
        });

        it('fails when the highlighted datum has no datumIndex to match on', async () => {
            chart = await createEnterpriseChart(stageOptions.funnel);
            const { ctx, id } = deproxy(chart);
            // `datumIndex` is required by the type; the cast builds the datum a series that omits it would highlight.
            const unindexed = { ...getSeriesContextNodeData(chart).nodeData[0], datumIndex: undefined as never };

            ctx.highlightManager.updateHighlight(id, unindexed);
            await waitForChartStability(chart);

            expect(errorFrom(() => getStageHighlightNode(chart!))?.name).toBe('AssertionError');
        });

        it('returns undefined while the series has drawn no copy of the highlight', async () => {
            chart = await createEnterpriseChart(stageOptions.funnel);
            const { ctx, id } = deproxy(chart);

            // The highlight layer is redrawn on the next frame.
            ctx.highlightManager.updateHighlight(id, getSeriesContextNodeData(chart).nodeData[0]);

            expect(getStageHighlightNode(chart)).toBeUndefined();
        });

        it('fails while nothing is highlighted', async () => {
            chart = await createEnterpriseChart(stageOptions.funnel);

            expect(errorFrom(() => getStageHighlightNode(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getFunnelConnectorNodes', () => {
        it.each(['funnel', 'cone-funnel'] as const)(
            'returns the connectors between the stages of a %s',
            async (type) => {
                chart = await createEnterpriseChart(stageOptions[type]);

                const connectors = getFunnelConnectorNodes(chart);

                expect(connectors).toHaveLength(STAGES.length - 1);
                expect(connectors.every((connector) => connector instanceof FunnelConnector)).toBe(true);
            }
        );

        it('fails for a series that keeps no connectors', async () => {
            chart = await createEnterpriseChart(stageOptions.pyramid);

            expect(errorFrom(() => getFunnelConnectorNodes(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getSeriesGroup (funnel connectors)', () => {
        it('returns the group a funnel series draws its connectors into', async () => {
            chart = await createEnterpriseChart(stageOptions.funnel);

            const group = getSeriesGroup(chart, 'connectorNodeGroup');

            expect(group).toBeInstanceOf(Group);
            expect(Array.from(group.children())).toEqual(getFunnelConnectorNodes(chart));
        });

        it('fails for a series that keeps no connector group', async () => {
            chart = await createEnterpriseChart(stageOptions.pyramid);

            expect(errorFrom(() => getSeriesGroup(chart!, 'connectorNodeGroup'))?.name).toBe('AssertionError');
        });
    });

    describe('getLegendItemSuppressHighlight', () => {
        it('is true for the bin items of a discrete colour scale', async () => {
            chart = await createEnterpriseChart(
                heatmapOptions({ mode: 'discrete', fills: [{ color: 'blue', stop: 25 }, { color: 'red' }] })
            );

            const items = getLegendItemNodes(chart);

            expect(items.length).toBeGreaterThan(0);
            expect(items.map(getLegendItemSuppressHighlight)).toEqual(items.map(() => true));
        });

        it('fails for a datum whose suppressHighlight is neither true nor absent', () => {
            const item = { datum: { id: 'item', suppressHighlight: false }, label: {}, symbolsGroup: {} };

            expect(() => getLegendItemSuppressHighlight(item)).toThrow('got false');
        });

        it('is undefined for an item that highlights its series', async () => {
            chart = await createEnterpriseChart({
                data: STAGES,
                series: [{ type: 'bar', xKey: 'group', yKey: 'value' }],
                legend: { enabled: true },
            });

            expect(getLegendItemNodes(chart).map(getLegendItemSuppressHighlight)).toEqual([undefined]);
        });
    });

    describe('getHeatmapCellMethods', () => {
        it('exposes the per-cell methods of the heatmap series prototype', () => {
            const methods = getHeatmapCellMethods();

            expect(methods).toBe(HeatmapSeries.prototype);
            expect(methods.getItemStyle).toBeTypeOf('function');
            expect(methods.updateNodeDatum).toBeTypeOf('function');
        });

        it.each(['getItemStyle', 'updateNodeDatum'] as const)('lets a test spy on %s', async (method) => {
            const spy = vi.spyOn(getHeatmapCellMethods(), method);
            try {
                chart = await createEnterpriseChart(heatmapOptions());

                expect(spy).toHaveBeenCalledTimes(4);
            } finally {
                spy.mockRestore();
            }
        });
    });
});

describe('enterprise series test accessors (label and shadow tests)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const sunburstOptions = (): AgChartOptions => ({
        data: [{ name: 'Root', children: [{ name: 'A', size: 3 }] }],
        series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size' }],
    });

    const flowOptions = (type: 'sankey' | 'chord'): AgChartOptions => ({
        data: [
            { from: 'A', to: 'B', size: 5 },
            { from: 'B', to: 'C', size: 4 },
        ],
        series: [{ type, fromKey: 'from', toKey: 'to', sizeKey: 'size' }],
    });

    const mapMarkerOptions = (): AgChartOptions => ({
        data: ukData,
        topology: ukTopology,
        series: [{ type: 'map-shape-background' }, { type: 'map-marker', idKey: 'name' }],
    });

    describe('getEnterpriseSelectionNodes (series-specific selections)', () => {
        const pyramidOptions = (): AgChartOptions => ({
            data: [
                { stage: 'Visits', value: 100 },
                { stage: 'Paid', value: 20 },
            ],
            series: [{ type: 'pyramid', stageKey: 'stage', valueKey: 'value' }],
        });

        it.each(['sankey', 'chord'] as const)('returns the nodes and links a %s series drew in place', async (type) => {
            chart = await createEnterpriseChart(flowOptions(type));

            const nodes = getEnterpriseSelectionNodes(chart, 'nodeSelection');
            const links = getEnterpriseSelectionNodes(chart, 'linkSelection');

            expect(nodes.map(({ datum }) => datum)).toEqual(getFlowNodeData(chart));
            expect(links.map(({ datum }) => datum)).toEqual(getFlowLinkData(chart));
        });

        it('returns the highlight and focus copies of the hovered item, and none while nothing is hovered', async () => {
            chart = await createEnterpriseChart(flowOptions('sankey'));
            expect(getEnterpriseSelectionNodes(chart, 'highlightNodeSelection')).toEqual([]);

            const { ctx, id } = deproxy(chart);
            const [hovered] = getFlowNodeData(chart);
            ctx.highlightManager.updateHighlight(id, hovered);
            await waitForChartStability(chart);

            const highlighted = getEnterpriseSelectionNodes(chart, 'highlightNodeSelection');
            expect(highlighted.map(({ datum }) => datum)).toEqual([hovered]);
            const focused = getEnterpriseSelectionNodes(chart, 'focusNodeSelection');
            expect(focused.map(({ datum }) => datum)).toContain(hovered);
            // The link copies are selections of their own: the hovered node has links, so they are not empty.
            expect(getEnterpriseSelectionNodes(chart, 'focusLinkSelection').length).toBeGreaterThan(0);
            expect(getEnterpriseSelectionNodes(chart, 'highlightLinkSelection')).toEqual([]);
        });

        it('returns a marker node for each datum of the map-marker series at the index', async () => {
            chart = await createEnterpriseChart(mapMarkerOptions());

            const markers = getEnterpriseSelectionNodes<_ModuleSupport.Marker<{ idValue: string }>>(
                chart,
                'markerSelection',
                1
            );

            expect(markers).toHaveLength(ukData.length);
            const byName = (a: string, b: string) => a.localeCompare(b);
            expect(markers.map(({ datum }) => String(datum?.idValue)).sort(byName)).toEqual(
                ukData.map(({ name }) => name).sort(byName)
            );
        });

        it('returns the stage label of each stage of a pyramid series', async () => {
            chart = await createEnterpriseChart(pyramidOptions());

            const labels = getEnterpriseSelectionNodes<Text>(chart, 'stageLabelSelection');

            expect(labels.map(({ text }) => text)).toEqual(['Visits', 'Paid']);
        });

        it.each(['markerSelection', 'stageLabelSelection', 'nodeSelection'] as const)(
            'fails for a series that has no %s',
            async (name) => {
                chart = await createEnterpriseChart(sunburstOptions());

                expect(errorFrom(() => getEnterpriseSelectionNodes(chart!, name))?.name).toBe('AssertionError');
            }
        );
    });

    describe('getPlacedLabelData', () => {
        const rangeAreaOptions = (): AgChartOptions => ({
            data: [{ x: 'A', low: 20, high: 80 }],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left', min: 0, max: 100 },
            },
            series: [
                {
                    type: 'range-area',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: { enabled: true, placement: 'outside' },
                },
            ],
        });

        it('returns the labels the series placed, with the point each is anchored to', async () => {
            chart = await createEnterpriseChart(rangeAreaOptions());

            const labels = getPlacedLabelData(chart);

            expect(labels).toHaveLength(2);
            for (const { y, height, datum } of labels) {
                expect(y).toEqual(expect.any(Number));
                expect(height).toBeGreaterThan(0);
                expect(datum.point.y).toEqual(expect.any(Number));
            }
        });

        it('fails for a series that places no labels', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getPlacedLabelData(chart!))?.name).toBe('AssertionError');
        });
    });
});

describe('enterprise series test accessors (label fit tests)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const sunburstOptions = (): AgChartOptions => ({
        data: [{ name: 'Root', children: [{ name: 'A', size: 3 }] }],
        series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size' }],
    });

    const treemapOptions = (): AgChartOptions => ({
        data: [
            { name: 'A', note: 'First', size: 10 },
            { name: 'B', note: 'Second', size: 6 },
        ],
        series: [{ type: 'treemap', labelKey: 'name', secondaryLabelKey: 'note', sizeKey: 'size' }],
    });

    describe('getHierarchyNodeLabel', () => {
        it('returns the text of the labels a treemap tile was laid out with, and no radius', async () => {
            chart = await createEnterpriseChart(treemapOptions());

            const leaves: HierarchyNode[] = [];
            getHierarchyRootNode(chart)?.walk((node) => {
                if (node.children.length === 0) leaves.push(node);
            });

            expect(leaves.map((leaf) => String(getHierarchyNodeLabel(leaf, 'label')?.text))).toEqual(['A', 'B']);
            expect(leaves.map((leaf) => String(getHierarchyNodeLabel(leaf, 'secondaryLabel')?.text))).toEqual([
                'First',
                'Second',
            ]);
            expect(getHierarchyNodeLabel(leaves[0], 'label')?.radius).toBeUndefined();
        });

        it('returns the radius a sunburst label sits at', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            const labelled: HierarchyNode[] = [];
            getHierarchyRootNode(chart)?.walk((node) => {
                if (getHierarchyNodeLabel(node, 'label') != null) labelled.push(node);
            });

            expect(labelled.length).toBeGreaterThan(0);
            for (const node of labelled) {
                expect(getHierarchyNodeLabel(node, 'label')?.radius).toEqual(expect.any(Number));
            }
        });

        it('returns undefined for a label the node was not laid out with', async () => {
            chart = await createEnterpriseChart({
                data: [{ name: 'A', size: 10 }],
                series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size' }],
            });

            const [leaf] = getHierarchyRootNode(chart)?.children ?? [];

            expect(getHierarchyNodeLabel(leaf, 'secondaryLabel')).toBeUndefined();
        });

        it('fails for a node that has no such property', () => {
            expect(errorFrom(() => getHierarchyNodeLabel({} as HierarchyNode, 'label'))?.name).toBe('AssertionError');
        });
    });

    describe('gauge accessors', () => {
        const createGauge = async (options: AgGaugeOptions) => {
            const gauge = AgCharts.createGauge(prepareEnterpriseTestOptions({ ...options, width: 400, height: 100 }));
            await waitForChartStability(gauge);
            return gauge;
        };
        const linearGauge: AgGaugeOptions = {
            type: 'linear-gauge',
            direction: 'horizontal',
            value: 50,
            scale: { min: 0, max: 100 },
            label: { enabled: true, text: 'Level' },
            targets: [{ value: 30, text: 'Target' }],
        };

        it.each(['targetLabelSelection', 'tickSelection'] as const)(
            'getEnterpriseSelectionNodes returns the gauge nodes of its %s',
            async (name) => {
                chart = await createGauge(linearGauge);

                const nodes = getEnterpriseSelectionNodes<Text>(chart, name);

                expect(nodes.length).toBeGreaterThan(0);
                if (name === 'targetLabelSelection') expect(nodes.map(({ text }) => text)).toEqual(['Target']);
                else expect(nodes.every(({ visible }) => typeof visible === 'boolean')).toBe(true);
            }
        );

        it('getEnterpriseSelectionNodes fails for gauge selections of a series that is not a gauge', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getEnterpriseSelectionNodes(chart!, 'tickSelection'))?.name).toBe('AssertionError');
        });

        it('getLinearGaugeRects returns the gauge rect, which lies within the series rect', async () => {
            chart = await createGauge(linearGauge);

            const { gaugeRect, seriesRect } = getLinearGaugeRects(chart);

            expect(seriesRect.width).toBeGreaterThan(0);
            expect(gaugeRect.width).toBeGreaterThan(0);
            expect(gaugeRect.width).toBeLessThanOrEqual(seriesRect.width);
        });

        it('getLinearGaugeRects fails for a series that is not a linear gauge', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getLinearGaugeRects(chart!))?.name).toBe('AssertionError');
        });
    });

    describe('getMapShapeLabelAspectRatio', () => {
        const mapShapeOptions = (label: string): AgChartOptions => ({
            topology: ukTopology,
            series: [
                {
                    type: 'map-shape',
                    data: [{ name: 'England', label }],
                    idKey: 'name',
                    labelKey: 'label',
                    label: { fontSize: 12 },
                },
            ],
        });

        it('returns a ratio that grows with the width of the label text', async () => {
            chart = await createEnterpriseChart(mapShapeOptions('Short'));
            const narrow = getMapShapeLabelAspectRatio(chart, 'England');
            chart.destroy();

            chart = await createEnterpriseChart(mapShapeOptions('A considerably longer label'));
            const wide = getMapShapeLabelAspectRatio(chart, 'England');

            expect(wide).toBeGreaterThan(narrow);
        });

        it('fails for a shape the series laid no label out for', async () => {
            chart = await createEnterpriseChart(mapShapeOptions('Short'));

            expect(errorFrom(() => getMapShapeLabelAspectRatio(chart!, 'Atlantis'))?.name).toBe('AssertionError');
        });
    });
});

describe('series, legend and navigator test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const createGauge = async (options: AgLinearGaugeOptions | AgRadialGaugeOptions) => {
        prepareEnterpriseTestOptions(options);
        const gauge = AgCharts.createGauge(options);
        await waitForChartStability(gauge);
        return gauge;
    };

    const HLC_DATA = Array.from({ length: 6 }, (_, i) => ({ x: i, hi: 12 + i, lo: 4 - i, cl: 8 + (i % 3) }));
    const hlcOptions = (extra: Partial<AgCartesianChartOptions> = {}): AgCartesianChartOptions => ({
        data: HLC_DATA,
        series: [{ type: 'hlc', xKey: 'x', highKey: 'hi', lowKey: 'lo', closeKey: 'cl' }],
        axes: { x: { type: 'number' }, y: { type: 'number' } },
        ...extra,
    });

    const markerOptions = (marker: Partial<AgMapMarkerSeriesOptions> = {}): AgChartOptions => ({
        data: ukData,
        topology: ukTopology,
        series: [{ type: 'map-shape-background' }, { type: 'map-marker', idKey: 'name', ...marker }],
    });

    const barOptions = (extra: Partial<AgCartesianChartOptions> = {}): AgChartOptions => ({
        data: [
            { x: 'A', a: 3, b: 4 },
            { x: 'B', a: 5, b: 2 },
        ],
        series: [
            { type: 'bar', xKey: 'x', yKey: 'a' },
            { type: 'bar', xKey: 'x', yKey: 'b' },
        ],
        ...extra,
    });

    describe('getSeriesInstance', () => {
        it.each([
            ['LinearGaugeSeries', LinearGaugeSeries, () => createGauge({ type: 'linear-gauge', value: 30 })],
            ['RadialGaugeSeries', RadialGaugeSeries, () => createGauge({ type: 'radial-gauge', value: 30 })],
            [
                'WaterfallSeries',
                WaterfallSeries,
                () =>
                    createEnterpriseChart({
                        data: [
                            { x: 'A', y: 5 },
                            { x: 'B', y: -2 },
                        ],
                        series: [{ type: 'waterfall', xKey: 'x', yKey: 'y' }],
                    }),
            ],
            ['HlcSeries', HlcSeries, () => createEnterpriseChart(hlcOptions())],
            [
                'OhlcSeries',
                OhlcSeries,
                () =>
                    createEnterpriseChart({
                        data: [
                            { x: 1, o: 3, h: 5, l: 2, c: 4 },
                            { x: 2, o: 4, h: 6, l: 3, c: 5 },
                        ],
                        series: [{ type: 'ohlc', xKey: 'x', openKey: 'o', highKey: 'h', lowKey: 'l', closeKey: 'c' }],
                    }),
            ],
            [
                'MapMarkerSeries',
                MapMarkerSeries,
                () =>
                    createEnterpriseChart({
                        data: ukData,
                        topology: ukTopology,
                        series: [{ type: 'map-marker', idKey: 'name' }],
                    }),
            ],
        ] as const)(
            'returns the %s as its class, and fails for a missing series',
            async (_name, ctor: abstract new (...args: any[]) => object, create) => {
                chart = await create();

                expect(getSeriesInstance(chart, ctor)).toBeInstanceOf(ctor);
                expect(errorFrom(() => getSeriesInstance(chart!, ctor, 5))?.name).toBe('AssertionError');
            }
        );

        it('returns the series at the index it is given', async () => {
            chart = await createEnterpriseChart(
                hlcOptions({
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'hi' },
                        { type: 'hlc', xKey: 'x', highKey: 'hi', lowKey: 'lo', closeKey: 'cl' },
                    ],
                })
            );

            expect(getSeriesInstance(chart, HlcSeries, 1)).toBe(getSeriesAt(chart, 1));
        });

        it('fails for a series of another class', async () => {
            chart = await createEnterpriseChart(barOptions());

            expect(errorFrom(() => getSeriesInstance(chart!, HlcSeries))?.name).toBe('AssertionError');
        });
    });

    describe('destroyChart', () => {
        it('destroys the chart and returns undefined for the test to store', async () => {
            chart = await createEnterpriseChart(barOptions());
            const inner = deproxy(chart);
            expect(inner.destroyed).toBe(false);

            const cleared: unknown = destroyChart(chart);

            expect(cleared).toBeUndefined();
            expect(inner.destroyed).toBe(true);
        });

        it('returns undefined when the test built no chart', () => {
            const cleared: unknown = destroyChart(undefined);

            expect(cleared).toBeUndefined();
        });
    });

    describe('getSeriesAreaFocusDatum', () => {
        it('is undefined before anything is focused and the focused datum after a key press', async () => {
            chart = await createGauge({ type: 'linear-gauge', value: 30 });
            expect(getSeriesAreaFocusDatum(chart)).toBeUndefined();

            const seriesArea = document.querySelector<HTMLElement>('.ag-charts-series-area');
            expect(seriesArea).not.toBeNull();
            seriesArea!.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true })
            );
            await waitForChartStability(chart);

            expect(getSeriesAreaFocusDatum(chart)).toBeDefined();
        });
    });

    describe('legend', () => {
        it('getLegendHighlightCallerIds lists the id of each legend, the category legend first', async () => {
            chart = await createEnterpriseChart(barOptions({ legend: { enabled: true } }));

            const ids = getLegendHighlightCallerIds(chart);
            expect(ids).toHaveLength(2);
            expect(new Set(ids).size).toBe(2);
            expect(ids[0]).toMatch(/^Legend-/);
            expect(ids[1]).toMatch(/^GradientLegend-/);
        });

        it('getLegendItemTranslationX gives each item its own offset along the legend', async () => {
            chart = await createEnterpriseChart(barOptions({ legend: { enabled: true, position: 'bottom' } }));

            const [first, second] = getLegendItemNodes(chart);
            expect(getLegendItemTranslationX(first)).toBeLessThan(getLegendItemTranslationX(second));
        });

        it('getLegendItemTranslationX fails for a node without a translation', () => {
            // A bare object stands in for a node that has no translation to read.
            expect(errorFrom(() => getLegendItemTranslationX({} as Node))?.name).toBe('AssertionError');
        });
    });

    describe('map-marker', () => {
        const SIZED = { sizeKey: 'population', minSize: 10, maxSize: 40 } as const;

        it('getMapMarkerSizeRange returns the range the size values scale into', async () => {
            chart = await createEnterpriseChart(markerOptions(SIZED));

            expect(getMapMarkerSizeRange(chart, 1)).toEqual([10, 40]);
        });

        it('getMapMarkerSizeRange fails for a series without a size scale', async () => {
            chart = await createEnterpriseChart(markerOptions());

            expect(errorFrom(() => getMapMarkerSizeRange(chart!, 0))?.name).toBe('AssertionError');
        });

        it('getMapMarkerStyleSize resolves the size of the marker the series draws for a datum', async () => {
            chart = await createEnterpriseChart(markerOptions(SIZED));

            const nodes = getSeriesContextNodeData<MapMarkerNodeDatum>(chart, 1).nodeData;
            expect(nodes.length).toBeGreaterThan(0);
            for (const node of nodes) {
                expect(getMapMarkerStyleSize(chart, node, false, 1)).toBeCloseTo(node.point.size, 10);
            }
        });

        it('getMapMarkerStyleSize fails for a series that styles no markers', async () => {
            chart = await createEnterpriseChart(markerOptions());
            const [node] = getSeriesContextNodeData<MapMarkerNodeDatum>(chart, 1).nodeData;

            expect(errorFrom(() => getMapMarkerStyleSize(chart!, node, false, 0))?.name).toBe('AssertionError');
        });
    });

    describe('getNavigatorMiniChartSeriesTypes', () => {
        it('lists the series types the mini chart draws', async () => {
            chart = await createEnterpriseChart({
                ...hlcOptions(),
                navigator: { enabled: true, miniChart: { enabled: true } },
            });

            expect(getNavigatorMiniChartSeriesTypes(chart)).toEqual(['hlc']);
        });

        it('is empty while the mini chart is off', async () => {
            chart = await createEnterpriseChart(hlcOptions({ navigator: { enabled: true } }));

            expect(getNavigatorMiniChartSeriesTypes(chart)).toEqual([]);
        });
    });

    describe('hlc', () => {
        it('getHlcAggregationFilter is undefined while the data is not aggregated', async () => {
            chart = await createEnterpriseChart(hlcOptions());

            expect(getHlcAggregationFilter(chart)).toBeUndefined();
        });

        it('getHlcAggregationFilter returns the filter once the data is aggregated', async () => {
            chart = await createEnterpriseChart(
                hlcOptions({
                    data: Array.from({ length: HIGH_VOLUME_COUNT }, (_, i) => ({ x: i, hi: 10, lo: -10, cl: i % 5 })),
                })
            );

            const filter = getHlcAggregationFilter(chart);
            expect(filter?.maxRange).toBeGreaterThan(0);
            expect(filter?.midpointIndices.length).toBeGreaterThan(0);
        });

        it('getHlcHighlightData returns the three values of the datum, or undefined when none match', async () => {
            chart = await createEnterpriseChart(hlcOptions());
            const nodeData = getSeriesNodeData<HlcMarkerDatum>(chart);

            const highlighted = getHlcHighlightData(chart, nodeData, nodeData[3]);
            expect(highlighted?.map(({ itemType }) => itemType)).toEqual(['high', 'low', 'close']);
            expect(new Set(highlighted?.map(({ datum }) => datum))).toEqual(new Set([nodeData[3].datum]));

            expect(getHlcHighlightData(chart, nodeData, { ...nodeData[3], datum: {} })).toBeUndefined();
        });

        it('getHlcBandEdgeData returns the span the bands meet along, and fails for another series', async () => {
            chart = await createEnterpriseChart(hlcOptions());

            const edge = getHlcBandEdgeData(chart);
            expect(edge.length).toBeGreaterThan(0);
            expect(edge[0]).toHaveProperty('yValue0');

            chart.destroy();
            chart = await createEnterpriseChart(barOptions());
            expect(errorFrom(() => getHlcBandEdgeData(chart!))?.name).toBe('AssertionError');
        });
    });
});

describe('radar series test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const RADAR_DATA = [
        { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
        { subject: 'Physics', gradeA: 4.3, gradeB: 8.5 },
        { subject: 'Biology', gradeA: 3, gradeB: 6 },
    ];

    const radarAreaOptions = (): AgChartOptions => ({
        data: RADAR_DATA,
        series: [{ type: 'radar-area', angleKey: 'subject', radiusKey: 'gradeA' }],
    });

    const radarLineOptions = (): AgChartOptions => ({
        data: RADAR_DATA,
        series: [
            { type: 'radar-line', angleKey: 'subject', radiusKey: 'gradeA' },
            { type: 'radar-line', angleKey: 'subject', radiusKey: 'gradeB' },
        ],
        legend: { enabled: true },
    });

    describe('getRadarAreaGroups', () => {
        it('returns the group of the filled area and the group of the outline, each with one shape', async () => {
            chart = await createEnterpriseChart(radarAreaOptions());

            const { areaGroup, lineGroup } = getRadarAreaGroups(chart);

            expect(areaGroup).toBeInstanceOf(Group);
            expect(lineGroup).toBeInstanceOf(Group);
            expect(areaGroup).not.toBe(lineGroup);
            expect(collectShapes(areaGroup)).toHaveLength(1);
            expect(collectShapes(lineGroup)).toHaveLength(1);
        });

        it('fails for a series that is not a radar-area series', async () => {
            chart = await createEnterpriseChart(radarLineOptions());

            expect(errorFrom(() => getRadarAreaGroups(chart!))?.name).toBe('AssertionError');
        });
    });
});
