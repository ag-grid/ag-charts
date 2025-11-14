import { Logger, first, isNegative, iterate } from 'ag-charts-core';

import { BandedDomain, ContinuousDomain, DiscreteDomain, type IDataDomain } from '../../dataDomain';
import type { InternalDatumPropertyDefinition, ProcessedData, ProcessedValue, ProcessorFn } from '../../dataModelTypes';
import { DOMAIN_BANDS } from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';
import type { ScopeCacheManager } from '../utils/scopeCache';
import { DomainInitializer } from './domainInitializer';

/**
 * Specialized function type for processing property values.
 * Generated per property definition to eliminate branching and optimize hot paths.
 */
export type SpecializedProcessValueFn = (datum: unknown, idx: number, valueScopes: string | string[]) => ProcessedValue;

/**
 * Helper: Tracks missing values for a property definition across scopes.
 * Named function for profiler visibility.
 */
function trackMissingValue(missing: Map<string, number>, valueScopes: string | string[]): void {
    if (typeof valueScopes === 'string') {
        missing.set(valueScopes, (missing.get(valueScopes) ?? 0) + 1);
    } else {
        for (const scope of valueScopes) {
            missing.set(scope, (missing.get(scope) ?? 0) + 1);
        }
    }
}

/**
 * Helper: Handles invalid value case - sets result, optionally extends domain, logs warning.
 * Named function for profiler visibility.
 */
function handleInvalidValue(
    reusableResult: ProcessedValue,
    hasInvalidValue: boolean,
    invalidValue: any,
    domain: IDataDomain,
    def: InternalDatumPropertyDefinition<any>,
    value: any,
    mode: string
): void {
    reusableResult.valid = false;

    if (hasInvalidValue) {
        reusableResult.value = invalidValue;
        domain.extend(invalidValue);
        return;
    }

    if (mode !== 'integrated') {
        Logger.warnOnce(
            `invalid value of type [${typeof value}] for [${def.scopes} / ${def.id}] ignored:`,
            `[${value}]`
        );
    }
    reusableResult.value = undefined;
}

/**
 * Helper: Checks validation and handles invalid case if validation fails.
 * Returns the result object if validation failed (caller should return early),
 * or null if validation passed (caller should continue processing).
 * Named function for profiler visibility.
 */
function processValidationCheck(
    validation: ((value: any, datum: any, index: number) => boolean) | undefined,
    valueInDatum: boolean,
    value: any,
    datum: any,
    idx: number,
    reusableResult: ProcessedValue,
    hasInvalidValue: boolean,
    invalidValue: any,
    domain: IDataDomain,
    def: InternalDatumPropertyDefinition<any>,
    mode: string
): ProcessedValue | null {
    if (validation && valueInDatum && validation(value, datum, idx) === false) {
        reusableResult.missing = false;
        handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
        return reusableResult;
    }
    return null;
}

/**
 * Helper: Handles missing value tracking logic.
 * Sets the missing flag and tracks missing values if needed.
 * Named function for profiler visibility.
 */
function handleMissingTracking(
    valueInDatum: boolean,
    hasMissingValue: boolean,
    missing: Map<string, number>,
    valueScopes: string | string[],
    reusableResult: ProcessedValue
): void {
    reusableResult.missing = !valueInDatum;
    if (!valueInDatum && !hasMissingValue) {
        trackMissingValue(missing, valueScopes);
    }
}

/**
 * Helper: Sets valid result and extends domain.
 * Final step for successful value processing.
 * Named function for profiler visibility.
 */
function setValidResult(value: any, reusableResult: ProcessedValue, domain: IDataDomain): ProcessedValue {
    reusableResult.valid = true;
    reusableResult.value = value;
    domain.extend(value);
    return reusableResult;
}

/**
 * Manages domain computation and processing for the DataModel.
 * Handles both discrete and continuous domains, including banded domain optimization
 * and value processing during data transformation.
 */
export class DomainManager<D extends object, K extends keyof D & string> {
    private readonly initializer: DomainInitializer<K>;
    private readonly scopeCacheManager: ScopeCacheManager<K>;

    constructor(
        private readonly ctx: DataModelContext<D, K>,
        initializer: DomainInitializer<K>,
        scopeCacheManager: ScopeCacheManager<K>
    ) {
        this.initializer = initializer;
        this.scopeCacheManager = scopeCacheManager;
    }

    /**
     * Recomputes all domains from processed data.
     * Uses BandedDomain optimization for continuous domains to avoid full rescans.
     */
    recomputeDomains(processedData: ProcessedData<D>): void {
        const startTime = this.ctx.debug.check() ? performance.now() : 0;
        const bandedDomains = processedData[DOMAIN_BANDS];
        let bandStats: { totalBands: number; dirtyBands: number; totalData: number } | undefined;

        const keyDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain> = new Map();
        const valueDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain> = new Map();

        for (const keyDef of this.ctx.keys) {
            keyDomains.set(keyDef, this.initializer.setupDomainForDefinition(keyDef, bandedDomains));
        }

        for (const valueDef of this.ctx.values) {
            valueDomains.set(valueDef, this.initializer.setupDomainForDefinition(valueDef, bandedDomains));
        }

        // Initialize bands for key domains first (this determines band structure)
        // Only initialize if bands don't exist yet or if data size has changed significantly
        // During reprocessing, bands are already adjusted by updateBandsForChanges()
        for (const [keyDefIndex, keyDef] of this.ctx.keys.entries()) {
            const keysMap = processedData.keys[keyDefIndex];
            const domain = keyDomains.get(keyDef)!;
            const maxKeyLength = Math.max(...Array.from(keysMap.values()).map((keys) => keys.length));
            this.initializer.initializeBandedDomain(domain, maxKeyLength, String(keyDef.property));
        }

        // Initialize bands for value domains
        for (const [valueDefIndex, valueDef] of this.ctx.values.entries()) {
            const column = processedData.columns[valueDefIndex];
            const domain = valueDomains.get(valueDef)!;
            this.initializer.initializeBandedDomain(domain, column.length, String(valueDef.property));
        }

        // Collect pre-scan band statistics (after initialization, before extending domains)
        // This shows how many bands WILL BE scanned, not how many are currently dirty
        // Always collect these stats so they're available for testing
        const preScanDomainStats = new Map<IDataDomain, ReturnType<BandedDomain['getStats']>>();
        if (bandedDomains.size > 0) {
            bandStats = {
                totalBands: 0,
                dirtyBands: 0,
                totalData: 0,
            };

            for (const domain of bandedDomains.values()) {
                if (domain instanceof BandedDomain) {
                    const stats = domain.getStats();
                    // Store per-domain stats for metadata collection
                    preScanDomainStats.set(domain, stats);
                    // Aggregate for logging
                    bandStats.totalBands += stats.bandCount;
                    bandStats.dirtyBands += stats.dirtyBandCount;
                    bandStats.totalData = Math.max(bandStats.totalData, stats.dataSize);
                }
            }
        }

        // Extend key domains from keys arrays
        for (const [keyDefIndex, keyDef] of this.ctx.keys.entries()) {
            const keysMap = processedData.keys[keyDefIndex];
            const domain = keyDomains.get(keyDef)!;

            // Extend domain from each scope
            for (const scope of keyDef.scopes ?? []) {
                const keys = keysMap.get(scope);
                if (!keys) continue;

                // Use invalidKeys (not invalidData) to only skip items with invalid keys
                // This matches processData() behavior where valid keys contribute to domain
                // even if their corresponding values are invalid
                const invalidKeys = processedData.invalidKeys?.get(scope);
                this.initializer.extendDomainFromData(domain, keys, invalidKeys);
            }
        }

        // Extend value domains from columns arrays
        for (const [valueDefIndex, valueDef] of this.ctx.values.entries()) {
            const column = processedData.columns[valueDefIndex];
            const domain = valueDomains.get(valueDef)!;
            const columnScope = first(valueDef.scopes);
            const invalidData = processedData.invalidData?.get(columnScope);

            this.initializer.extendDomainFromData(domain, column, invalidData);
        }

        processedData.domain.keys = this.ctx.keys.map((keyDef) => {
            const domain = keyDomains.get(keyDef)!;
            const result = domain.getDomain();
            // Ignore starting values
            if (ContinuousDomain.is(domain) && result[0] > result[1]) {
                return [];
            }
            return result;
        });

        processedData.domain.values = this.ctx.values.map((valueDef) => {
            const domain = valueDomains.get(valueDef)!;
            const result = domain.getDomain();
            // Ignore starting values
            if (ContinuousDomain.is(domain) && result[0] > result[1]) {
                return [];
            }
            return result;
        });

        // Rebuild domain.groups for grouped data
        if (processedData.type === 'grouped') {
            processedData.domain.groups = processedData.groups.map((group) => group.keys);
        }

        // Always collect banding metadata for testing (pass per-domain pre-scan stats)
        this.collectDomainBandingMetadata(processedData, keyDomains, valueDomains, bandedDomains, preScanDomainStats);

        // Log performance metrics when debug is enabled
        if (this.ctx.debug.check() && startTime > 0) {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (bandStats && bandStats.totalBands > 0) {
                const scanRatio = bandStats.dirtyBands / bandStats.totalBands;
                const dataScanned = Math.round(scanRatio * bandStats.totalData);
                this.ctx.debug(
                    `recomputeDomains with banding: ${duration.toFixed(2)}ms, ` +
                        `bands: ${bandStats.dirtyBands}/${bandStats.totalBands} dirty, ` +
                        `data scanned: ~${dataScanned}/${bandStats.totalData} (${(scanRatio * 100).toFixed(1)}%)`
                );
            } else {
                this.ctx.debug(`recomputeDomains: ${duration.toFixed(2)}ms (no banding)`);
            }
        }
    }

    /**
     * Creates a specialized processValue function optimized for key properties with validation.
     * Eliminates all branching for the most common key property case (~30% of calls).
     */
    private createSpecializedProcessValue_Key_Validation(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        validation: (value: any, datum: any, index: number) => boolean
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const mode = this.ctx.mode;

        if (accessor) {
            // Key with accessor (rare case)
            const accessorFn = accessor;
            return function processValue_Key_Validation_Accessor(
                datum: unknown,
                idx: number,
                valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;

                // Keys cannot be null/undefined
                if (!valueInDatum || value == null || validation(value, datum, idx) === false) {
                    reusableResult.missing = !valueInDatum;

                    if (!valueInDatum && !hasMissingValue) {
                        trackMissingValue(missing, valueScopes);
                    }

                    handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
                    return reusableResult;
                }

                reusableResult.missing = false;
                reusableResult.valid = true;
                reusableResult.value = value;
                domain.extend(value);
                return reusableResult;
            };
        }

        // Key without accessor (most common key case)
        return function processValue_Key_Validation_Direct(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            const value = valueInDatum ? (datum as any)[property] : missingValue;

            // Keys cannot be null/undefined
            if (!valueInDatum || value == null || validation(value, datum as any, idx) === false) {
                reusableResult.missing = !valueInDatum;

                if (!valueInDatum && !hasMissingValue) {
                    trackMissingValue(missing, valueScopes);
                }

                handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
                return reusableResult;
            }

            reusableResult.missing = false;
            reusableResult.valid = true;
            reusableResult.value = value;
            domain.extend(value);
            return reusableResult;
        };
    }

    /**
     * Creates a specialized processValue function optimized for value properties with validation.
     * Eliminates branching for the most common value property case (~50% of calls).
     */
    private createSpecializedProcessValue_Value_Validation(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        validation: (value: any, datum: any, index: number) => boolean
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const mode = this.ctx.mode;

        if (accessor) {
            // Value with accessor
            const accessorFn = accessor;
            return function processValue_Value_Validation_Accessor(
                datum: unknown,
                idx: number,
                valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;

                const validationFailed = processValidationCheck(
                    validation,
                    valueInDatum,
                    value,
                    datum,
                    idx,
                    reusableResult,
                    hasInvalidValue,
                    invalidValue,
                    domain,
                    def,
                    mode
                );
                if (validationFailed !== null) return validationFailed;

                handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);
                return setValidResult(value, reusableResult, domain);
            };
        }

        // Value without accessor (most common value case)
        return function processValue_Value_Validation_Direct(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            const value = valueInDatum ? (datum as any)[property] : missingValue;

            const validationFailed = processValidationCheck(
                validation,
                valueInDatum,
                value,
                datum,
                idx,
                reusableResult,
                hasInvalidValue,
                invalidValue,
                domain,
                def,
                mode
            );
            if (validationFailed !== null) return validationFailed;

            handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);
            return setValidResult(value, reusableResult, domain);
        };
    }

    /**
     * Creates a specialized processValue function for properties with forceValue.
     * Optimized for invisible series (~5-10% of calls).
     */
    private createSpecializedProcessValue_ForceValue(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue
    ): SpecializedProcessValueFn {
        const property = def.property;
        const forceValue = def.forceValue!;

        if (accessor) {
            const accessorFn = accessor;
            return function processValue_ForceValue_Accessor(
                datum: unknown,
                _idx: number,
                _valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;
                const valueNegative = valueInDatum && isNegative(value);
                const forcedValue = valueNegative ? -1 * forceValue : forceValue;

                reusableResult.missing = false;
                reusableResult.valid = true;
                reusableResult.value = forcedValue;
                domain.extend(forcedValue);
                return reusableResult;
            };
        }

        return function processValue_ForceValue_Direct(
            datum: unknown,
            _idx: number,
            _valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            const value = valueInDatum ? (datum as any)[property] : undefined;
            const valueNegative = valueInDatum && isNegative(value);
            const forcedValue = valueNegative ? -1 * forceValue : forceValue;

            reusableResult.missing = false;
            reusableResult.valid = true;
            reusableResult.value = forcedValue;
            domain.extend(forcedValue);
            return reusableResult;
        };
    }

    /**
     * Creates a specialized processValue function for properties with processors.
     * Optimized for data transformations (~5-10% of calls).
     */
    private createSpecializedProcessValue_Processor(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        reusableResult: ProcessedValue,
        processorFns: Map<InternalDatumPropertyDefinition<K>, ProcessorFn>,
        validation: ((value: any, datum: any, index: number) => boolean) | undefined
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const processor = def.processor!;
        const mode = this.ctx.mode;

        if (accessor) {
            const accessorFn = accessor;
            return function processValue_Processor_Accessor(
                datum: unknown,
                idx: number,
                valueScopes: string | string[]
            ): ProcessedValue {
                let value;
                try {
                    value = accessorFn(datum);
                } catch {
                    // Swallow errors
                }
                const valueInDatum = value != null;

                const validationFailed = processValidationCheck(
                    validation,
                    valueInDatum,
                    value,
                    datum,
                    idx,
                    reusableResult,
                    hasInvalidValue,
                    invalidValue,
                    domain,
                    def,
                    mode
                );
                if (validationFailed !== null) return validationFailed;

                handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);

                let processorFn = processorFns.get(def);
                if (processorFn == null) {
                    processorFn = processor();
                    processorFns.set(def, processorFn);
                }
                value = processorFn(value, idx);

                return setValidResult(value, reusableResult, domain);
            };
        }

        return function processValue_Processor_Direct(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            const valueInDatum = property in (datum as any);
            let value = valueInDatum ? (datum as any)[property] : missingValue;

            const validationFailed = processValidationCheck(
                validation,
                valueInDatum,
                value,
                datum,
                idx,
                reusableResult,
                hasInvalidValue,
                invalidValue,
                domain,
                def,
                mode
            );
            if (validationFailed !== null) return validationFailed;

            handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);

            let processorFn = processorFns.get(def);
            if (processorFn == null) {
                processorFn = processor();
                processorFns.set(def, processorFn);
            }
            value = processorFn(value, idx);

            return setValidResult(value, reusableResult, domain);
        };
    }

    /**
     * Creates the generic fallback processValue implementation used for edge cases
     * and for skip mode (no domain extension). Generates a per-definition function
     * so callers can resolve it once and reuse it without additional branching.
     */
    private createGenericProcessValue(
        def: InternalDatumPropertyDefinition<K>,
        accessor: ((datum: any) => any) | undefined,
        domain: IDataDomain,
        processorFns: Map<InternalDatumPropertyDefinition<K>, ProcessorFn>,
        domainMode: 'extend' | 'skip'
    ): SpecializedProcessValueFn {
        const property = def.property;
        const hasMissingValue = 'missingValue' in def;
        const missingValue = def.missingValue;
        const hasInvalidValue = 'invalidValue' in def;
        const invalidValue = def.invalidValue;
        const missing = def.missing;
        const mode = this.ctx.mode;
        const shouldExtendDomain = domainMode === 'extend';
        const reusableResult: ProcessedValue = {
            value: undefined,
            missing: false,
            valid: false,
        };

        return function processValue_Generic(
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            let value;
            let valueInDatum: boolean;

            if (accessor) {
                try {
                    value = accessor(datum);
                } catch {
                    // Swallow errors
                }
                valueInDatum = value != null;
            } else {
                valueInDatum = property in (datum as any);
                value = valueInDatum ? (datum as any)[property] : missingValue;
            }

            if (def.forceValue != null) {
                const valueNegative = valueInDatum && isNegative(value);
                value = valueNegative ? -1 * def.forceValue : def.forceValue;
                valueInDatum = true;
            }

            handleMissingTracking(valueInDatum, hasMissingValue, missing, valueScopes, reusableResult);

            const isKeyWithNullValue = def.type === 'key' && value == null;
            if (isKeyWithNullValue) {
                handleInvalidValue(reusableResult, hasInvalidValue, invalidValue, domain, def, value, mode);
                return reusableResult;
            }

            const validationFailed = processValidationCheck(
                def.validation,
                valueInDatum,
                value,
                datum,
                idx,
                reusableResult,
                hasInvalidValue,
                invalidValue,
                domain,
                def,
                mode
            );
            if (validationFailed !== null) return validationFailed;

            reusableResult.valid = true;

            if (def.processor) {
                let processor = processorFns.get(def);
                if (processor == null) {
                    processor = def.processor();
                    processorFns.set(def, processor);
                }
                value = processor(value, idx);
            }

            if (shouldExtendDomain) {
                domain.extend(value);
            }
            reusableResult.value = value;
            return reusableResult;
        };
    }

    /**
     * Initializes domain processor for value processing during data transformation.
     * Returns domain maps and processing functions used during data extraction.
     * Uses specialized functions per property definition to eliminate branching in hot paths.
     */
    initDataDomainProcessor(domainMode: 'extend' | 'skip') {
        const { keys: keyDefs, values: valueDefs } = this.ctx;

        const scopes = new Set<string>();
        for (const valueDef of valueDefs) {
            if (!valueDef.scopes) continue;
            for (const scope of valueDef.scopes) {
                scopes.add(scope);
            }
        }

        const dataDomain: Map<object, IDataDomain> = new Map();
        const processorFns = new Map<InternalDatumPropertyDefinition<K>, ProcessorFn>();
        let allScopesHaveSameDefs = true;

        const initDataDomain = () => {
            for (const def of iterate(keyDefs, valueDefs)) {
                if (def.valueType === 'category') {
                    dataDomain.set(def, new DiscreteDomain());
                } else {
                    dataDomain.set(def, new ContinuousDomain());
                    allScopesHaveSameDefs &&= (def.scopes?.length ?? 0) === scopes.size;
                }
            }
        };
        initDataDomain();

        const accessors = this.scopeCacheManager.buildAccessors(iterate(keyDefs, valueDefs));

        const processValueFns = new WeakMap<InternalDatumPropertyDefinition<K>, SpecializedProcessValueFn>();
        for (const def of iterate(keyDefs, valueDefs)) {
            const accessor = accessors.get(def.property);
            const domain = dataDomain.get(def)!;
            const reusableResult: ProcessedValue = {
                value: undefined,
                missing: false,
                valid: false,
            };

            let specializedFn: SpecializedProcessValueFn | null = null;

            if (domainMode === 'extend') {
                // Select specialized variant based on definition characteristics
                if (def.forceValue != null) {
                    // ForceValue path (~5-10% of calls)
                    specializedFn = this.createSpecializedProcessValue_ForceValue(
                        def,
                        accessor,
                        domain,
                        reusableResult
                    );
                } else if (def.processor) {
                    // Processor path (~5-10% of calls)
                    specializedFn = this.createSpecializedProcessValue_Processor(
                        def,
                        accessor,
                        domain,
                        reusableResult,
                        processorFns,
                        def.validation
                    );
                } else if (def.validation) {
                    // Validation path (most common ~70-80% of calls)
                    if (def.type === 'key') {
                        // Key with validation (~30% of calls)
                        specializedFn = this.createSpecializedProcessValue_Key_Validation(
                            def,
                            accessor,
                            domain,
                            reusableResult,
                            def.validation
                        );
                    } else {
                        // Value with validation (~50% of calls)
                        specializedFn = this.createSpecializedProcessValue_Value_Validation(
                            def,
                            accessor,
                            domain,
                            reusableResult,
                            def.validation
                        );
                    }
                }
            }

            const processFn =
                specializedFn ?? this.createGenericProcessValue(def, accessor, domain, processorFns, domainMode);
            processValueFns.set(def, processFn);
        }

        function getProcessValue(def: InternalDatumPropertyDefinition<K>): SpecializedProcessValueFn {
            const processFn = processValueFns.get(def);
            if (!processFn) {
                throw new Error('AG Charts - missing processValue function for definition');
            }
            return processFn;
        }

        function processValue(
            def: InternalDatumPropertyDefinition<K>,
            datum: unknown,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue {
            return getProcessValue(def)(datum, idx, valueScopes);
        }

        return { dataDomain, processValue, getProcessValue, initDataDomain, scopes, allScopesHaveSameDefs };
    }

    /**
     * Collects metadata about banded domain optimization for debugging and testing.
     * Stores statistics about domain banding per key and value definition.
     */
    private collectDomainBandingMetadata(
        processedData: ProcessedData<D>,
        keyDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>,
        valueDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>,
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>,
        preScanDomainStats: Map<IDataDomain, ReturnType<BandedDomain['getStats']>>
    ) {
        processedData.optimizations ??= {};

        const keyDefs: Array<{
            property: string;
            applied: boolean;
            reason?: string;
            stats?: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number };
        }> = [];

        const valueDefs: Array<{
            property: string;
            applied: boolean;
            reason?: string;
            stats?: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number };
        }> = [];

        // Collect stats for key definitions
        for (const keyDef of this.ctx.keys) {
            const domain = keyDomains.get(keyDef);
            const bandedDomain = bandedDomains.get(keyDef);
            const isBanded = domain instanceof BandedDomain;

            let reason: string | undefined;
            if (!isBanded) {
                if (keyDef.valueType === 'category') {
                    reason = 'discrete domain';
                } else {
                    reason = 'not configured';
                }
            }

            let stats: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number } | undefined;
            if (isBanded && bandedDomain) {
                // Use pre-scan stats if available (collected before extending domains)
                const domainStats = preScanDomainStats.get(bandedDomain) ?? bandedDomain.getStats();
                const scanRatio = domainStats.bandCount > 0 ? domainStats.dirtyBandCount / domainStats.bandCount : 0;
                stats = {
                    totalBands: domainStats.bandCount,
                    dirtyBands: domainStats.dirtyBandCount,
                    dataSize: domainStats.dataSize,
                    scanRatio,
                };
            }

            keyDefs.push({
                property: String(keyDef.property),
                applied: isBanded,
                reason,
                stats,
            });
        }

        // Collect stats for value definitions
        for (const valueDef of this.ctx.values) {
            const domain = valueDomains.get(valueDef);
            const bandedDomain = bandedDomains.get(valueDef);
            const isBanded = domain instanceof BandedDomain;

            let reason: string | undefined;
            if (!isBanded) {
                if (valueDef.valueType === 'category') {
                    reason = 'discrete domain';
                } else {
                    reason = 'not configured';
                }
            }

            let stats: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number } | undefined;
            if (isBanded && bandedDomain) {
                // Use pre-scan stats if available (collected before extending domains)
                const domainStats = preScanDomainStats.get(bandedDomain) ?? bandedDomain.getStats();
                const scanRatio = domainStats.bandCount > 0 ? domainStats.dirtyBandCount / domainStats.bandCount : 0;
                stats = {
                    totalBands: domainStats.bandCount,
                    dirtyBands: domainStats.dirtyBandCount,
                    dataSize: domainStats.dataSize,
                    scanRatio,
                };
            }

            valueDefs.push({
                property: String(valueDef.property),
                applied: isBanded,
                reason,
                stats,
            });
        }

        processedData.optimizations.domainBanding = {
            keyDefs,
            valueDefs,
        };
    }
}
