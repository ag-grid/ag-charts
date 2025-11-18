import { first } from 'ag-charts-core';

import type { BandedDomainConfig } from '../../dataDomain';
import type {
    InternalDefinition,
    ProcessedData,
    ReducerBandKey,
    ReducerOutputPropertyDefinition,
    ScopeId,
} from '../../dataModelTypes';
import { REDUCER_BANDS } from '../../dataModelTypes';
import type { BandIndexMap } from '../utils/bandedStructure';
import { isScoped } from '../utils/helpers';
import { BandedReducer, type ReducerContext } from './bandedReducer';

/**
 * Extended reducer context with scope information.
 */
export interface ReducerContextWithScope extends ReducerContext {
    scopeId: ScopeId | undefined;
}

export interface ReducerEvaluationOptions {
    reuseCleanBands?: boolean;
    beforeEvaluate?: (bandManager: BandedReducer, context: ReducerContextWithScope) => void;
}

/**
 * Manages reducer evaluation with band-based caching.
 * Symmetrical to DomainManager which manages domain computation with band-based caching.
 *
 * Responsibilities:
 * - Creating and managing BandedReducer instances per reducer property
 * - Creating reducer contexts from processed data
 * - Orchestrating reducer evaluation lifecycle
 * - Applying index map updates to reducer bands
 * - Collecting optimization metadata
 * - Providing utility methods for non-banded reducer evaluation
 */
export class ReducerManager {
    private readonly bandingConfig: BandedDomainConfig;

    constructor(bandingConfig: BandedDomainConfig = {}) {
        this.bandingConfig = bandingConfig;
    }

    /**
     * Evaluates a reducer over a specific range of data indices.
     * Used for non-banded reducer evaluation (fallback path).
     *
     * This is a static utility method for cases where banding is not applicable
     * (e.g., grouped data, small datasets, reducers that don't support banding).
     *
     * @param def Reducer definition with initial value
     * @param reducer Reducer function to apply
     * @param context Reducer context with data and keys
     * @param startIndex Starting index (inclusive)
     * @param endIndex Ending index (exclusive)
     * @returns Accumulated reducer result for the range
     */
    static evaluateRange(
        def: ReducerOutputPropertyDefinition,
        reducer: ReturnType<ReducerOutputPropertyDefinition['reducer']>,
        context: ReducerContext,
        startIndex: number,
        endIndex: number
    ): unknown {
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

    /**
     * Evaluates a banded reducer and returns the aggregated result.
     * Symmetrical to DomainManager.recomputeDomains().
     *
     * @param def Reducer definition
     * @param processedData Processed data containing raw data and keys
     * @param options Evaluation options including band reuse settings
     * @returns Aggregated reducer result
     */
    evaluate(
        def: ReducerOutputPropertyDefinition & InternalDefinition<false>,
        processedData: ProcessedData<any>,
        options: ReducerEvaluationOptions = {}
    ): unknown {
        const context = this.createContext(def, processedData);
        if (!context) {
            return undefined;
        }

        // Ensure reducer bands map exists
        processedData[REDUCER_BANDS] ??= new Map<ReducerBandKey, BandedReducer>();
        const reducerBands = processedData[REDUCER_BANDS];

        const property = def.property as ReducerBandKey;
        let bandManager = reducerBands.get(property);
        if (!bandManager) {
            bandManager = new BandedReducer(this.bandingConfig);
            reducerBands.set(property, bandManager);
        }

        if (bandManager.getBandCount() === 0) {
            bandManager.initializeBands(context.rawData.length);
        }

        // Apply optional pre-evaluation hooks (e.g., index map updates for incremental processing)
        options.beforeEvaluate?.(bandManager, context);

        bandManager.captureStatsBeforeProcessing();

        // Delegate to BandedReducer methods (symmetrical to BandedDomain usage)
        bandManager.evaluateFromData(def, context, options.reuseCleanBands ?? false);
        return bandManager.getResult(def);
    }

    /**
     * Applies index map transformations to all reducer bands.
     * Symmetrical to DomainManager's band update logic.
     *
     * @param processedData Processed data containing reducer bands
     * @param indexMap Index map with splice operations and updated indices
     */
    applyIndexMap(processedData: ProcessedData<any>, indexMap: BandIndexMap): void {
        const reducerBands = processedData[REDUCER_BANDS];
        if (!reducerBands) return;

        for (const bandManager of reducerBands.values()) {
            bandManager.applyIndexMap(indexMap);
        }
    }

    /**
     * Creates a reducer context from processed data.
     * Extracts raw data and key columns for the appropriate scope.
     * Symmetrical to domain context creation in DomainManager.
     *
     * @param def Reducer definition
     * @param processedData Processed data
     * @returns Reducer context with scope information, or undefined if not applicable
     */
    private createContext<D extends object>(
        def: ReducerOutputPropertyDefinition & InternalDefinition<false>,
        processedData: ProcessedData<D>
    ): ReducerContextWithScope | undefined {
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
}
