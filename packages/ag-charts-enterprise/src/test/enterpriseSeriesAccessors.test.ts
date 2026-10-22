import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgStandaloneChartOptions } from 'ag-charts-community';
import { deproxy, errorFrom, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { BBox, Group, Sector } from 'ag-charts-core';

import { FlowProportionDatumType } from '../series/flow-proportion/flowDatumIndex';
import { OrganizationNode } from '../series/organization/organizationNode';
import { OrganizationSeries } from '../series/organization/organizationSeries';
import {
    getEnterpriseSelectionNodes,
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
} from './enterpriseSeriesAccessors';
import { createEnterpriseChart } from './utils';

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
    });

    describe('getNetworkViewport', () => {
        it('returns the scale and translation the series applies to its content', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const viewport = getNetworkViewport(chart);

            expect(Object.keys(viewport)).toHaveLength(4);
            expect(viewport).toEqual({
                scalingX: expect.any(Number),
                scalingY: expect.any(Number),
                translationX: expect.any(Number),
                translationY: expect.any(Number),
            });
            expect(viewport.scalingX).toBeGreaterThan(0);
            expect(viewport.scalingY).toBe(viewport.scalingX);
            expect(Number.isFinite(viewport.translationX)).toBe(true);
            expect(Number.isFinite(viewport.translationY)).toBe(true);
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

            expect(bbox).toBeInstanceOf(BBox);
            expect(bbox.width).toBeGreaterThan(0);
            expect(bbox.height).toBeGreaterThan(0);
        });
    });

    describe('getNetworkSeriesRect', () => {
        it('returns the rect the series lays out in, within the chart', async () => {
            chart = await createEnterpriseChart(orgOptions());

            const rect = getNetworkSeriesRect(chart);
            const { width, height } = deproxy(chart);

            expect(rect).toBeInstanceOf(BBox);
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.width).toBeLessThanOrEqual(width ?? 0);
            expect(rect.height).toBeGreaterThan(0);
            expect(rect.height).toBeLessThanOrEqual(height ?? 0);
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
    });
});
