import { AggregationUpdater } from './aggregationUpdater';
import { DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import type { AggregatePropertyDefinition, DataGroup } from './dataModel';

const sumAggregate: AggregatePropertyDefinition<any, any> = {
    id: 'sum',
    type: 'aggregate',
    aggregateFunction: (values: number[]) => {
        const sum = values.reduce((acc, value) => acc + (typeof value === 'number' ? value : 0), 0);
        return [sum, sum];
    },
    groupAggregateFunction: (next = [0, 0], acc = [0, 0]) => {
        acc[0] += next[0];
        acc[1] += next[1];
        return acc;
    },
    finalFunction: (result) => result,
};

const valueGroupIdxLookup = () => [0];

const keyExtractor = (datum: { key: string }) => [datum.key];

function createGroup(key: string, indices: number[], aggregation: [number, number][] = []): DataGroup {
    return {
        keys: [key],
        datumIndices: [indices.slice()],
        aggregation,
        validScopes: new Set(['scope1']),
    };
}

describe('AggregationUpdater', () => {
    it('does nothing when no changes are present', () => {
        const groups = [createGroup('A', [0, 1], [[0, 30]])];
        const columns = [[10, 20]];
        const changes = DataChangeDescriptorBuilder.create().build();

        AggregationUpdater.updateAggregations(
            groups,
            changes,
            [sumAggregate],
            columns,
            valueGroupIdxLookup,
            (datum) => keyExtractor(datum),
            [[Infinity, -Infinity]]
        );

        expect(groups[0].aggregation?.[0]).toEqual([0, 30]);
    });

    it('recomputes aggregation for groups receiving insertions', () => {
        const groups = [createGroup('A', [0, 1, 2])];
        const columns = [[10, 20, 35]];
        const changes = DataChangeDescriptorBuilder.create().addInsertion(2, { key: 'A' }).build();
        const aggDomains: [number, number][] = [[Infinity, -Infinity]];

        AggregationUpdater.updateAggregations(
            groups,
            changes,
            [sumAggregate],
            columns,
            valueGroupIdxLookup,
            (datum) => keyExtractor(datum),
            aggDomains
        );

        expect(groups[0].aggregation?.[0]).toEqual([65, 65]);
        expect(aggDomains[0]).toEqual([65, 65]);
    });

    it('recomputes aggregations for groups affected by key updates', () => {
        const groups = [
            createGroup('A', [0]),
            createGroup('B', [1, 2]),
        ];
        const columns = [[10, 25, 30]];
        const changes = DataChangeDescriptorBuilder.create()
            .addUpdate(1, { key: 'A' }, { key: 'B' })
            .build();

        AggregationUpdater.updateAggregations(
            groups,
            changes,
            [sumAggregate],
            columns,
            valueGroupIdxLookup,
            (datum) => keyExtractor(datum as { key: string }),
            undefined
        );

        expect(groups.find((group) => group.keys[0] === 'A')?.aggregation?.[0]).toEqual([10, 10]);
        expect(groups.find((group) => group.keys[0] === 'B')?.aggregation?.[0]).toEqual([55, 55]);
    });
});
