import { first } from 'ag-charts-core';

import type {
    InternalDefinition,
    ProcessedData,
    ReducerOutputPropertyDefinition,
    ScopeId,
} from '../../dataModelTypes';
import { isScoped } from '../utils/helpers';

export interface ReducerContext {
    scopeId: ScopeId | undefined;
    rawData: unknown[];
    keyColumns: unknown[][];
    keysParam: unknown[];
}

export function createReducerContext<D extends object>(
    def: ReducerOutputPropertyDefinition & InternalDefinition<false>,
    processedData: ProcessedData<D>
): ReducerContext | undefined {
    if (processedData.type !== 'ungrouped') {
        return undefined;
    }

    const scopeId = isScoped(def) ? def.scopes[0] : first(processedData.dataSources.keys());
    if (scopeId == null) {
        return undefined;
    }

    const rawData = processedData.dataSources.get(scopeId)?.data ?? [];
    const keyColumns = processedData.keys
        .map((column: Map<ScopeId, unknown[]>) => column.get(scopeId))
        .filter((column): column is unknown[] => column != null);
    const keysParam = keyColumns.map((): unknown => undefined);

    return { scopeId, rawData, keyColumns, keysParam };
}

export function evaluateReducerRange(
    def: ReducerOutputPropertyDefinition,
    reducer: ReturnType<ReducerOutputPropertyDefinition['reducer']>,
    context: ReducerContext,
    startIndex: number,
    endIndex: number
) {
    let accValue: any = def.initialValue;
    const { keyColumns, keysParam, rawData } = context;
    const clampedEnd = Math.min(endIndex, rawData.length);

    for (let datumIndex = startIndex; datumIndex < clampedEnd; datumIndex += 1) {
        for (let keyIdx = 0; keyIdx < keysParam.length; keyIdx++) {
            keysParam[keyIdx] = keyColumns[keyIdx]?.[datumIndex];
        }
        accValue = reducer(accValue, keysParam);
    }

    return accValue;
}
