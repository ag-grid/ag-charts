import type { BBox } from '../../../scene/bbox';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import type { ChartLegendDatum, ChartLegendType } from '../../legendDatum';
import type { SeriesNodeDataContext } from '../series';
import type { SeriesTooltip } from '../seriesTooltip';
import { type HierarchyNode, HierarchySeries } from './hierarchySeries';

class ExampleHierarchySeries extends HierarchySeries<any> {
    override tooltip: SeriesTooltip<any> = null!;

    override getSeriesDomain(_direction: ChartAxisDirection): any[] {
        throw new Error('Method not implemented.');
    }

    override createNodeData(): Promise<SeriesNodeDataContext<any, any>[]> {
        throw new Error('Method not implemented.');
    }

    override update(_opts: { seriesRect?: BBox | undefined }): Promise<void> {
        throw new Error('Method not implemented.');
    }

    override getTooltipHtml(_seriesDatum: any): string {
        throw new Error('Method not implemented.');
    }

    override getLegendData(_legendType: unknown): ChartLegendDatum<any>[] | ChartLegendDatum<ChartLegendType>[] {
        throw new Error('Method not implemented.');
    }
}

describe('hierarchySeries', () => {
    it('Creates a hierarchy', async () => {
        const series = new ExampleHierarchySeries(null!);
        series.sizeKey = 'size';
        series.data = [
            { size: 5, children: [{ size: 1 }, { size: 2 }, { size: 3 }] },
            {
                size: 5,
                children: [
                    { size: 1 },
                    { size: 2, children: [{ size: 4 }, { size: 5 }, { size: 6 }] },
                    { size: 3, children: [{ size: 7 }] },
                ],
            },
        ];
        await series.processData();

        const removeDatum = (node: HierarchyNode<any>) => {
            delete node.datum;
            node.children.forEach(removeDatum);
        };

        removeDatum(series.rootNode);

        expect(series.rootNode).toMatchSnapshot();
        expect(series.sumSize).toBe(5 + 1 + 2 + 3 + 5 + 1 + 2 + 4 + 5 + 6 + 3 + 7);
        expect(series.maxDepth).toBe(3);
    });

    it('Handles an empty dataset', async () => {
        const series = new ExampleHierarchySeries(null!);
        series.data = [];
        await series.processData();

        expect(series.rootNode).toEqual({
            index: 0,
            datum: undefined,
            size: undefined,
            color: undefined,
            children: [],
        });
        expect(series.sumSize).toBe(0);
        expect(series.maxDepth).toBe(0);
    });

    it('Walks tree in pre-order', async () => {
        const series = new ExampleHierarchySeries(null!);
        series.data = [
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
        ];
        await series.processData();

        let index = 0;
        series.walk((node) => {
            expect(node.index).toBe(index);

            if (node.datum != null) {
                expect(node.datum.order).toBe(index);
            }

            index += 1;
        });
        expect(index).toBe(12 + 1);
    });
});
