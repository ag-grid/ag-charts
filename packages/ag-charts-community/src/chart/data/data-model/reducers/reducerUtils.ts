import { first } from 'ag-charts-core';

import type { BandedDomainConfig } from '../../dataDomain';
import type {
    InternalDefinition,
    ProcessedData,
    ReducerBandKey,
    ReducerOutputPropertyDefinition,
    ScopeId,
} from '../../dataModelTypes';
import { isScoped } from '../utils/helpers';
import { BandedReducer } from './bandedReducer';

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

export function evaluateBandedReducer(
    def: ReducerOutputPropertyDefinition,
    bandManager: BandedReducer,
    context: ReducerContext,
    reuseCleanBands: boolean
): unknown {
    const reducerFn = def.reducer();
    const bandResults: any[] = [];

    for (const band of bandManager.getBands()) {
        if (reuseCleanBands && !band.isDirty) {
            bandResults.push(band.cachedResult);
            continue;
        }

        const startIndex = def.needsOverlap && band.startIndex > 0 ? Math.max(0, band.startIndex - 1) : band.startIndex;
        const result = evaluateReducerRange(def, reducerFn, context, startIndex, band.endIndex);
        band.cachedResult = result;
        band.isDirty = false;
        bandResults.push(result);
    }

    return def.combineResults!(bandResults);
}

interface RunBandedReducerOptions {
    reuseCleanBands?: boolean;
    beforeEvaluate?: (bandManager: BandedReducer, context: ReducerContext) => void;
}

/**
 * Shared helper used by full processing and incremental reprocessing paths.
 * Handles context creation, band manager lifecycle, optional change application, and evaluation.
 */
export function runBandedReducer(
    def: ReducerOutputPropertyDefinition & InternalDefinition<false>,
    processedData: ProcessedData<any>,
    reducerBands: Map<ReducerBandKey, BandedReducer>,
    bandingConfig: BandedDomainConfig | undefined,
    options: RunBandedReducerOptions = {}
): unknown {
    const context = createReducerContext(def, processedData);
    if (!context) {
        return undefined;
    }

    const property = def.property as ReducerBandKey;
    let bandManager = reducerBands.get(property);
    if (!bandManager) {
        bandManager = new BandedReducer(bandingConfig ?? {});
        reducerBands.set(property, bandManager);
    }

    if (bandManager.getBands().length === 0) {
        bandManager.initializeBands(context.rawData.length);
    }

    options.beforeEvaluate?.(bandManager, context);

    bandManager.captureStatsBeforeProcessing();

    return evaluateBandedReducer(def, bandManager, context, options.reuseCleanBands ?? false);
}
