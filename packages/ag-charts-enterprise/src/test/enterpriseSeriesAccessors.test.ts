import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgStandaloneChartOptions } from 'ag-charts-community';
import {
    deproxy,
    errorFrom,
    expectWarningsCalls,
    getSeriesRect,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { BBox, Group, Sector, Shape } from 'ag-charts-core';

import { FlowProportionDatumType } from '../series/flow-proportion/flowDatumIndex';
import type { HierarchyNode } from '../series/hierarchy/hierarchySeries';
import { OrganizationNode } from '../series/organization/organizationNode';
import { OrganizationSeries } from '../series/organization/organizationSeries';
import {
    getEnterpriseSelectionNodes,
    getFlowHighlightNode,
    getFlowLinkData,
    getFlowNodeData,
    getNetworkContentBBox,
    getNetworkSeriesRect,
    getNetworkViewport,
    getOrganizationCardContentHeight,
    getOrganizationCardTexts,
    getOrganizationCards,
    getOrganizationGraph,
    getOrganizationLinks,
    getOrganizationNodeDatumIndex,
    getOrganizationSeriesInstance,
    getSeriesGroup,
    getSeriesLabelTexts,
    getTreemapNodeLayout,
} from './enterpriseSeriesAccessors';
import { getHierarchyRootNode } from './seriesAccessors';
import { collectShapes, createEnterpriseChart } from './utils';

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

    describe('getOrganizationSeriesInstance', () => {
        it('returns the organization series, from a chart or its proxy', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const series = getOrganizationSeriesInstance(chart);

            expect(series).toBeInstanceOf(OrganizationSeries);
            expect(getOrganizationSeriesInstance(deproxy(chart))).toBe(series);
        });

        it('fails for a series that is not an organization series', async () => {
            chart = await createEnterpriseChart(sunburstOptions());

            expect(errorFrom(() => getOrganizationSeriesInstance(chart!))?.name).toBe('AssertionError');
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
