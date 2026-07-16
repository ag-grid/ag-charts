import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    type Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    computeLegendBBox,
    deproxy,
    expectNonBlank,
    extractImageData,
    getLegendModule,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { data as heatmapData } from './map-layering-fixtures/heatmap-floating/data';
import { topology as heatmapTopology } from './map-layering-fixtures/heatmap-floating/topology';
import { cityData } from './map-layering-fixtures/routing/cityData';
import { cityTopology } from './map-layering-fixtures/routing/cityTopology';
import { routeTopology } from './map-layering-fixtures/routing/routeTopology';
import { topology as routingTopology } from './map-layering-fixtures/routing/topology';

const shapeData = routingTopology.features.map((feature) => ({ name: feature.properties.name }));
const routeData = routeTopology.features.map((feature) => ({ name: feature.properties.name }));

// map-series-test/routing: three layers (map-shape counties + map-line routes + map-marker cities)
// sharing one projection, each with its own legend entry.
const ROUTING_EXAMPLE: AgChartOptions = {
    data: shapeData,
    legend: { enabled: true },
    series: [
        {
            type: 'map-shape',
            topology: routingTopology,
            data: shapeData,
            idKey: 'name',
            fill: '#badc58',
            legendItemName: 'Counties',
        },
        {
            type: 'map-line',
            topology: routeTopology,
            data: routeData,
            idKey: 'name',
            labelKey: 'name',
            stroke: '#4834d4',
            strokeWidth: 5,
            legendItemName: 'Route',
        },
        {
            type: 'map-marker',
            topology: cityTopology,
            data: cityData,
            idKey: 'name',
            labelKey: 'name',
            sizeKey: 'population',
            sizeName: 'Population',
            fill: '#ff7979',
            fillOpacity: 0.5,
            stroke: '#eb4d4b',
            strokeWidth: 1,
            shape: 'circle',
            size: 48,
            maxSize: 72,
            legendItemName: 'Cities',
        },
    ],
};

// map-series-test/heatmap-floating: a map-shape-background base under a colour-keyed map-shape,
// with a floating gradient legend positioned over the plot area.
const HEATMAP_FLOATING_EXAMPLE: AgChartOptions = {
    data: heatmapData,
    topology: heatmapTopology,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-shape',
            title: 'Access to Clean Fuels',
            idKey: 'name',
            colorKey: 'value',
            colorName: '% of population',
        },
    ],
    gradientLegend: {
        position: {
            placement: 'left-bottom',
            floating: true,
            xOffset: 300,
            yOffset: -30,
        },
        gradient: {
            preferredLength: 150,
            thickness: 4,
        },
        scale: {
            padding: 30,
            label: {
                fontSize: 10,
                formatter: (p) => p.value + '%',
            },
        },
    },
};

describe('Map layering', () => {
    setupMockConsole();
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);
        expectNonBlank(ctx.snapshot());
        expect(extractImageData(ctx)).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const imagesDiffer = (a: ImageData, b: ImageData): boolean => {
        if (a.data.length !== b.data.length) return true;
        for (let i = 0; i < a.data.length; i++) {
            if (a.data[i] !== b.data[i]) return true;
        }
        return false;
    };

    // Locate a legend item by its label text and click its centre, driving the full
    // legend-click pipeline (which re-renders), rather than poking series state directly.
    const clickLegendItem = async (label: string) => {
        const items = getLegendModule(chart as Chart).itemSelection.nodes();
        const item = items.find((node) => (node.datum as any)?.label?.text === label);
        expect(item, `legend item '${label}'`).toBeDefined();
        const legendBBox = computeLegendBBox(chart as Chart);
        const x = legendBBox.x + (item as any).translationX + 5;
        const y = legendBBox.y + legendBBox.height / 2;
        await clickAction(x, y)(chart);
        await waitForChartStability(chart);
    };

    // Re-enabling a layer via a legend click leaves a highlight on the item; clear it so the
    // restored render matches the pristine composed layout.
    const clearLegendHighlight = async () => {
        for (const { legend } of (chart as Chart).modulesManager.legends()) {
            (chart as Chart).ctx.highlightManager.updateHighlight((legend as any).id);
        }
        await waitForChartStability(chart);
    };

    describe('routing (map-shape + map-line + map-marker)', () => {
        it('renders all three layers composed in a single projection', async () => {
            const options: AgChartOptions = { ...ROUTING_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // One legend entry per layer confirms the three series are laid out together.
            const legendItems = getLegendModule(chart as Chart).itemSelection.nodes();
            expect(legendItems).toHaveLength(3);

            await compare();
        });

        // Each layer's legend entry must toggle only its own series, guarding against a
        // legend-entry -> wrong-layer mapping regression.
        it.each([
            { label: 'Counties', index: 0 },
            { label: 'Route', index: 1 },
            { label: 'Cities', index: 2 },
        ])('toggling the $label legend entry hides and restores only series[$index]', async ({ label, index }) => {
            const options: AgChartOptions = { ...ROUTING_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            expect(chart.series.every((series: any) => series.visible)).toBe(true);

            const composed = ctx.snapshot();

            await clickLegendItem(label);
            // Only the matching layer hides; the other two stay visible.
            for (const [i, series] of chart.series.entries()) {
                expect(series.visible).toBe(i !== index);
            }
            // The hidden layer must actually leave the rendered output.
            expect(imagesDiffer(composed, ctx.snapshot())).toBe(true);

            await clickLegendItem(label);
            expect(chart.series.every((series: any) => series.visible)).toBe(true);
            await clearLegendHighlight();
            // Restoring returns to the exact composed layout.
            expect(imagesDiffer(composed, ctx.snapshot())).toBe(false);
        });

        it('hiding a layer greys its legend entry and removes it from the plot', async () => {
            const options: AgChartOptions = { ...ROUTING_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            await clickLegendItem('Cities');
            expect(chart.series[2].visible).toBe(false);
            await compare();
        });
    });

    describe('heatmap with floating gradient legend', () => {
        it('renders the map-shape-background base under a colour-keyed map-shape with a floating gradient legend', async () => {
            const options: AgChartOptions = { ...HEATMAP_FLOATING_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // The floating gradient legend is present and both layers are laid out.
            expect((chart as Chart).modulesManager.getModule('gradientLegend')).toBeDefined();
            expect((chart as Chart).series).toHaveLength(2);

            await compare();
        });
    });
});
