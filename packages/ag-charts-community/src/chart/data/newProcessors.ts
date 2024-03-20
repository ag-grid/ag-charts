export interface ProcessorOptions {
    scopeId: string;
    defs: UnifiedProcessDefinition[];
    visible?: boolean;
    groupBy?: 'data' | 'keys' | Function;
}

export type UnifiedProcessDefinition<T extends string = string> = ReducerProcessDefinition<T>;

export interface ReducerProcessDefinition<T extends string> {
    type: 'reducer';
    subtype: T;
    property: string;
}

export interface GroupValueProcessDefinition<T extends string> {
    type: 'group-value-processor';
    subtype: T;
    property: string;
}

export const SmallestIntervalDef: ReducerProcessDefinition<'smallest-interval'> = {
    type: 'reducer',
    subtype: 'smallest-interval',
    property: 'smallestKeyInterval', // redundant?
};

export const GroupNormaliseToDef: GroupValueProcessDefinition<'sort-domain'> = {
    type: 'group-value-processor',
    subtype: 'sort-domain',
    property: 'sortedGroupDomain', // redundant?
};

export const KeyPropertyDef: any = {
    type: 'key',
};

// function sortDomainGroups(domainGroups: ProcessedData<any>['domain']['groups']) {
//     return domainGroups?.slice().sort((a, b) => {
//         for (let i = 0; i < a.length; i++) {
//             const result = a[i] - b[i];
//             if (result !== 0) {
//                 return result;
//             }
//         }
//         return 0;
//     });
// }
