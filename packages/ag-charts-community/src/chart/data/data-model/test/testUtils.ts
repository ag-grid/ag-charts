import {
    accumulatedValue,
    area as actualArea,
    groupAverage as actualGroupAverage,
    groupCount as actualGroupCount,
    range as actualRange,
    sumValues,
} from '../../aggregateFunctions';
import type { AggregatePropertyDefinition, GroupedData, PropertyId, Scoped } from '../../dataModel';
import { DataModel } from '../../dataModel';
import type { PropertyDefinition } from '../../dataModelTypes';
import { DataSet } from '../../dataSet';
import {
    accumulateGroup as actualAccumulateGroup,
    normaliseGroupTo as actualNormaliseGroupTo,
    normalisePropertyTo as actualNormalisePropertyTo,
    rowCountProperty as actualRowCountProperty,
} from '../../processors';

// Property definition builders
export const rangeKey = (property: string) => ({
    scopes: ['test'],
    property,
    type: 'key' as const,
    valueType: 'range' as const,
});

export const categoryKey = (property: string, scopes = ['test']) => ({
    scopes,
    property,
    type: 'key' as const,
    valueType: 'category' as const,
});

export const categoryKeyAllowNull = (property: string, scopes = ['test']) => ({
    scopes,
    property,
    type: 'key' as const,
    valueType: 'category' as const,
    allowNullKey: true,
    validation: (v: any) => v !== undefined,
});

export const scopedValue = (scope: string[] | string, property: string, groupId?: string, id?: string) => {
    let scopes: string[];
    if (Array.isArray(scope)) {
        scopes = scope;
    } else {
        scopes = [scope];
    }
    return {
        scopes,
        property,
        type: 'value' as const,
        valueType: 'range' as const,
        groupId,
        id,
        useScopedValues: Array.isArray(scope) ? scope.length > 1 : false,
    };
};

export const value = (property: string, groupId?: string, id?: string) => scopedValue('test', property, groupId, id);

export const categoryValue = (property: string) => ({
    scopes: ['test'],
    property,
    type: 'value' as const,
    valueType: 'category' as const,
});

export const accumulatedGroupValues = (properties: string[], groupId: string): (Scoped & PropertyDefinition<any>)[] => [
    ...properties.map((p) => ({ ...accumulatedGroupValue(p, groupId), scopes: ['test'] })),
    { ...actualAccumulateGroup(groupId, 'normal'), scopes: ['test'] },
];

const accumulatedGroupValue = (property: string, groupId: string = property, id?: string) => ({
    ...value(property, groupId, id),
});

export const accumulatedPropertyValue = (property: string, groupId: string = property, id?: string) => ({
    ...value(property, groupId, id),
    processor: accumulatedValue(true),
});

export const sum = (groupId: string): AggregatePropertyDefinition<any, any> => ({
    id: `sum-${groupId}`,
    matchGroupIds: [groupId],
    type: 'aggregate',
    aggregateFunction: (values) => sumValues(values),
});

export const scopedSum = (scopes: string[], groupId: string) => ({ ...sum(groupId), scopes });

export const range = (groupId: string) => ({ ...actualRange(`range-${groupId}`, groupId), scopes: ['test'] });

export const groupAverage = (matchGroupId: string) => ({
    ...actualGroupAverage(`groupAverage-${matchGroupId}`, { matchGroupId }),
    scopes: ['test'],
});

export const rowCountProperty = (prop: string) => ({ ...actualRowCountProperty(prop), scopes: ['test'] });

export const groupCount = () => ({ ...actualGroupCount(`groupCount`), scopes: ['test'] });

export const area = (groupId: string, aggFn: AggregatePropertyDefinition<any, any>) => ({
    ...actualArea(`area-${groupId}`, aggFn),
    scopes: ['test'],
});

export const normaliseGroupTo = (groupId: string, normaliseTo: number) => ({
    ...actualNormaliseGroupTo([groupId], normaliseTo),
    scopes: ['test'],
});

export const normalisePropertyTo = (prop: PropertyId<any>, normaliseTo: [number, number]) => ({
    ...actualNormalisePropertyTo(prop, normaliseTo, 0),
    scopes: ['test'],
});

// JSON serialization helpers
function jsonReplacer(_key: string, val: any): any {
    if (val instanceof Map) {
        return { __type: 'Map', value: Array.from(val.entries()) };
    }
    if (val instanceof Set) {
        return { __type: 'Set', value: Array.from(val) };
    }
    return val;
}

function normalizeForComparison(data: any): any {
    const json = JSON.parse(JSON.stringify(data, jsonReplacer));
    delete json.time;
    delete json.version;
    delete json.optimizations;
    // Exclude changeDescription - it's only present during reprocessData, not processData
    delete json.changeDescription;
    // Exclude diff metadata - it's only generated during reprocessData, not processData
    if (json.reduced?.diff) {
        delete json.reduced.diff;
    }
    // If reduced object is now empty, remove it entirely to match processData output
    if (json.reduced && Object.keys(json.reduced).length === 0) {
        delete json.reduced;
    }
    return json;
}

// Test verification helpers
export function verifyReprocessMatchesBaseline(
    dataModel: DataModel<any, any, any>,
    reprocessedData: any,
    sources: Map<string, DataSet<any>>
): void {
    const baselineData = dataModel.processData(sources);

    const reprocessedNormalized = normalizeForComparison(reprocessedData);
    const baselineNormalized = normalizeForComparison(baselineData);

    expect(reprocessedNormalized).toEqual(baselineNormalized);
}

export function basicDataSet<T>(data: T[], scopes = ['test']) {
    const dataSet = new DataSet(data);
    return new Map([...scopes.map((s) => [s, dataSet] as const)]);
}

export function expectedKeys(expected: unknown[]) {
    return [new Map([['test', expected]])];
}

// Data extraction helpers
export function resolveGroupColumn(result: GroupedData<unknown>, groupIdx: number, columnIdx: number) {
    return result.groups[groupIdx].datumIndices[columnIdx].map(
        (relativeIndex) => result.columns[columnIdx][groupIdx + relativeIndex]
    );
}

export function extractGroupValues(data: GroupedData<unknown>, groupIndex?: number) {
    let groups = data.groups;
    let startGroupIdx = 0;
    if (groupIndex != null) {
        groups = groups.slice(groupIndex, groupIndex + 1);
        startGroupIdx = groupIndex;
    }
    const result = groups.map((g, gidx) => {
        const actualGroupIdx = startGroupIdx + gidx;
        return g.datumIndices[0].map((_, di) =>
            g.datumIndices.map((d, ci) => data.columns[ci][actualGroupIdx + d[di]])
        );
    });
    if (groupIndex != null) {
        return result[0];
    }
    return result;
}

// Domain verification helpers
export function verifyDomain(
    data: any,
    expected: {
        keys?: number[][];
        values?: number[][];
        count?: number;
    }
) {
    if (expected.keys) {
        expect(data.domain.keys).toEqual(expected.keys);
    }
    if (expected.values) {
        expect(data.domain.values).toEqual(expected.values);
    }
    if (expected.count !== undefined) {
        expect(data.input.count).toBe(expected.count);
    }
}
