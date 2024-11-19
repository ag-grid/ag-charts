import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import type { SeriesTooltip } from '../seriesTooltip';
import type { SeriesNodeDatum } from '../seriesTypes';
import { HierarchySeries } from './hierarchySeries';
import { HierarchySeriesProperties } from './hierarchySeriesProperties';

class ExampleHierarchySeriesProperties extends HierarchySeriesProperties<never> {
    readonly tooltip: SeriesTooltip<never> = null!;
}

class ExampleHierarchySeries extends HierarchySeries<
    Group,
    ExampleHierarchySeriesProperties,
    { order: number } & SeriesNodeDatum
> {
    override properties = new ExampleHierarchySeriesProperties();

    groupSelection = Selection.select(this.contentGroup, Group);

    override getSeriesDomain(): never {
        throw new Error('Method not implemented.');
    }

    override createNodeData(): never {
        throw new Error('Method not implemented.');
    }

    override update(_opts: never): never {
        throw new Error('Method not implemented.');
    }

    override updateNodes(): never {
        throw new Error('Method not implemented.');
    }

    override updateSelections(): never {
        throw new Error('Method not implemented.');
    }

    override getTooltipHtml(_seriesDatum: never): never {
        throw new Error('Method not implemented.');
    }

    override getLegendData(_legendType: never): never {
        throw new Error('Method not implemented.');
    }

    override computeFocusBounds(_node: never): never {
        throw new Error('Method not implemented.');
    }
}

describe('HierarchySeries', () => {
    it('creates a hierarchy', () => {
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
        series.processData();

        series.rootNode.walk((node: any) => {
            delete node.series;
            delete node.datum;
            delete node.parent;
        });

        expect(series.rootNode).toMatchSnapshot();
        expect(series.rootNode.sumSize).toBe(5 + 1 + 2 + 3 + 5 + 1 + 2 + 4 + 5 + 6 + 3 + 7);
    });

    it('handles an empty dataset', () => {
        const series = new ExampleHierarchySeries(null!);
        series.setChartData([]);
        series.processData();

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

    it('walks tree in pre-order', () => {
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
        series.processData();

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

    it('checks for subtree inclusion', () => {
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
        series.processData();

        const nodes = Array.from(series.rootNode);

        expect(nodes[1].contains(nodes[2])).toBe(true);
        expect(nodes[2].contains(nodes[1])).toBe(false);

        expect(nodes[5].contains(nodes[9])).toBe(true);
        expect(nodes[9].contains(nodes[5])).toBe(false);

        expect(nodes[9].contains(nodes[10])).toBe(false);
        expect(nodes[10].contains(nodes[9])).toBe(false);
    });
});
