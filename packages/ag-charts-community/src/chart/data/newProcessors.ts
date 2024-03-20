import type { GroupValueProcessDefinition, ReducerProcessDefinition } from './dataModel';

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
