import type { BBox } from '../../../scene/bbox';
import type { ChartLegendDatum, ChartLegendType } from '../../legendDatum';
import type { TooltipContent } from '../../tooltip/tooltip';
import type { SeriesNodeDataContext } from '../series';
import type { SeriesTooltip } from '../seriesTooltip';
import { HierarchySeries } from './hierarchySeries';
import { HierarchySeriesProperties } from './hierarchySeriesProperties';

class ExampleHierarchySeriesProperties extends HierarchySeriesProperties<any> {
    readonly tooltip: SeriesTooltip<any> = null!;
}

class ExampleHierarchySeries extends HierarchySeries<any, any> {
    override properties = new ExampleHierarchySeriesProperties();

    override getSeriesDomain(): number[] {
        throw new Error('Method not implemented.');
    }

    override createNodeData(): Promise<SeriesNodeDataContext<any, any>> {
        throw new Error('Method not implemented.');
    }

    override update(_opts: { seriesRect?: BBox | undefined }): Promise<void> {
        throw new Error('Method not implemented.');
    }

    override getTooltipHtml(_seriesDatum: any): TooltipContent {
        throw new Error('Method not implemented.');
    }

    override getLegendData(_legendType: unknown): ChartLegendDatum<any>[] | ChartLegendDatum<ChartLegendType>[] {
        throw new Error('Method not implemented.');
    }
}

describe('HierarchySeries', () => {
    it('creates a hierarchy', async () => {
        const series = new ExampleHierarchySeries(null!);
        series.properties.sizeKey = 'size';
        series.setChartData([
            { size: 5, children: [{ size: 1 }, { size: 2 }, { size: 3 }] },
            {
                size: 5,
                children: [
                    { size: 1 },
                    { size: 2, children: [{ size: 4 }, { size: 5 }, { size: 6 }] },
                    { size: 3, children: [{ size: 7 }] },
                ],
            },
        ]);
        await series.processData();

        series.rootNode.walk((node: any) => {
            delete node.series;
            delete node.datum;
            delete node.parent;
        });

        expect(series.rootNode).toMatchSnapshot();
        expect(series.rootNode.sumSize).toBe(5 + 1 + 2 + 3 + 5 + 1 + 2 + 4 + 5 + 6 + 3 + 7);
    });

    it('handles an empty dataset', async () => {
        const series = new ExampleHierarchySeries(null!);
        series.setChartData([]);
        await series.processData();

        // @ts-expect-error - Remove circular dependencies because if this test fails, Jest won't be able to print any errors
        delete series.rootNode.series;

        expect(series.rootNode).toEqual({
            index: 0,
            datum: undefined,
            size: 0,
            color: undefined,
            sumSize: 0,
            depth: undefined,
            parent: undefined,
            children: [],
            midPoint: { x: 0, y: 0 },
        });
    });

    it('walks tree in pre-order', async () => {
        const series = new ExampleHierarchySeries(null!);
        series.setChartData([
            {
                order: 1,
                children: [{ order: 2 }, { order: 3 }, { order: 4 }],
            },
            {
                order: 5,
                children: [
                    { order: 6 },
                    { order: 7, children: [{ order: 8 }, { order: 9 }, { order: 10 }] },
                    { order: 11, children: [{ order: 12 }] },
                ],
            },
        ]);
        await series.processData();

        let index = 0;
        series.rootNode.walk((node) => {
            expect(node.index).toBe(index);

            if (node.datum != null) {
                expect(node.datum.order).toBe(index);
            }

            index += 1;
        });
        expect(index).toBe(12 + 1);
    });

    it('checks for subtree inclusion', async () => {
        const series = new ExampleHierarchySeries(null!);
        series.setChartData([
            {
                order: 1,
                children: [{ order: 2 }, { order: 3 }, { order: 4 }],
            },
            {
                order: 5,
                children: [
                    { order: 6 },
                    { order: 7, children: [{ order: 8 }, { order: 9 }, { order: 10 }] },
                    { order: 11, children: [{ order: 12 }] },
                ],
            },
        ]);
        await series.processData();

        const nodes = Array.from(series.rootNode);

        expect(nodes[1].contains(nodes[2])).toBe(true);
        expect(nodes[2].contains(nodes[1])).toBe(false);

        expect(nodes[5].contains(nodes[9])).toBe(true);
        expect(nodes[9].contains(nodes[5])).toBe(false);

        expect(nodes[9].contains(nodes[10])).toBe(false);
        expect(nodes[10].contains(nodes[9])).toBe(false);
    });
});
