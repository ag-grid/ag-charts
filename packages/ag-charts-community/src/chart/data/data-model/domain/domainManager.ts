import { Logger, first, isNegative, iterate } from 'ag-charts-core';

import type { DebugLogger } from '../../../../util/debug';
import type { ChartMode } from '../../../chartMode';
import { BandedDomain, ContinuousDomain, DiscreteDomain, type IDataDomain } from '../../dataDomain';
import type { InternalDatumPropertyDefinition, ProcessedData, ProcessedValue, ProcessorFn } from '../../dataModelTypes';
import { DOMAIN_BANDS } from '../../dataModelTypes';
import type { ScopeCacheManager } from '../utils/scopeCache';
import { DomainInitializer } from './domainInitializer';

/**
 * Manages domain computation and processing for the DataModel.
 * Handles both discrete and continuous domains, including banded domain optimization
 * and value processing during data transformation.
 */
export class DomainManager<D extends object, K extends keyof D & string> {
    constructor(
        private readonly initializer: DomainInitializer<K>,
        private readonly scopeCacheManager: ScopeCacheManager<K>,
        private readonly keys: InternalDatumPropertyDefinition<K>[],
        private readonly values: InternalDatumPropertyDefinition<K>[],
        private readonly debug: DebugLogger,
        private readonly mode: ChartMode
    ) {}

    /**
     * Recomputes all domains from processed data.
     * Uses BandedDomain optimization for continuous domains to avoid full rescans.
     */
    recomputeDomains(processedData: ProcessedData<D>): void {
        const startTime = this.debug.check() ? performance.now() : 0;
        const bandedDomains = processedData[DOMAIN_BANDS];
        let bandStats: { totalBands: number; dirtyBands: number; totalData: number } | undefined;

        const keyDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain> = new Map();
        const valueDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain> = new Map();

        for (const keyDef of this.keys) {
            keyDomains.set(keyDef, this.initializer.setupDomainForDefinition(keyDef, bandedDomains));
        }

        for (const valueDef of this.values) {
            valueDomains.set(valueDef, this.initializer.setupDomainForDefinition(valueDef, bandedDomains));
        }

        // Initialize bands for key domains first (this determines band structure)
        // Only initialize if bands don't exist yet or if data size has changed significantly
        // During reprocessing, bands are already adjusted by updateBandsForChanges()
        for (const [keyDefIndex, keyDef] of this.keys.entries()) {
            const keysMap = processedData.keys[keyDefIndex];
            const domain = keyDomains.get(keyDef)!;
            const maxKeyLength = Math.max(...Array.from(keysMap.values()).map((keys) => keys.length));
            this.initializer.initializeBandedDomain(domain, maxKeyLength, String(keyDef.property));
        }

        // Initialize bands for value domains
        for (const [valueDefIndex, valueDef] of this.values.entries()) {
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
        for (const [keyDefIndex, keyDef] of this.keys.entries()) {
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
        for (const [valueDefIndex, valueDef] of this.values.entries()) {
            const column = processedData.columns[valueDefIndex];
            const domain = valueDomains.get(valueDef)!;
            const columnScope = first(valueDef.scopes);
            const invalidData = processedData.invalidData?.get(columnScope);

            this.initializer.extendDomainFromData(domain, column, invalidData);
        }

        processedData.domain.keys = this.keys.map((keyDef) => {
            const domain = keyDomains.get(keyDef)!;
            const result = domain.getDomain();
            // Ignore starting values
            if (ContinuousDomain.is(domain) && result[0] > result[1]) {
                return [];
            }
            return result;
        });

        processedData.domain.values = this.values.map((valueDef) => {
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
        if (this.debug.check() && startTime > 0) {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (bandStats && bandStats.totalBands > 0) {
                const scanRatio = bandStats.dirtyBands / bandStats.totalBands;
                const dataScanned = Math.round(scanRatio * bandStats.totalData);
                this.debug(
                    `recomputeDomains with banding: ${duration.toFixed(2)}ms, ` +
                        `bands: ${bandStats.dirtyBands}/${bandStats.totalBands} dirty, ` +
                        `data scanned: ~${dataScanned}/${bandStats.totalData} (${(scanRatio * 100).toFixed(1)}%)`
                );
            } else {
                this.debug(`recomputeDomains: ${duration.toFixed(2)}ms (no banding)`);
            }
        }
    }

    /**
     * Initializes domain processor for value processing during data transformation.
     * Returns domain maps and processing functions used during data extraction.
     */
    initDataDomainProcessor(domainMode: 'extend' | 'skip') {
        const { keys: keyDefs, values: valueDefs } = this;

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

        const reusableResult: ProcessedValue = {
            value: undefined,
            missing: false,
            valid: false,
        };
        const processValue = (
            def: InternalDatumPropertyDefinition<K>,
            datum: Record<string, any>,
            idx: number,
            valueScopes: string | string[]
        ): ProcessedValue => {
            let valueInDatum: boolean;
            let value;
            if (accessors.has(def.property)) {
                try {
                    value = accessors.get(def.property)!(datum);
                } catch {
                    // Swallow errors - these get reported as missing values to the user later.
                }
                valueInDatum = value != null;
            } else {
                valueInDatum = def.property in datum;
                value = valueInDatum ? datum[def.property] : def.missingValue;
            }

            if (def.forceValue != null) {
                // Maintain sign of forceValue from actual value, this maybe significant later when
                // we account for the value falling into positive/negative buckets.
                const valueNegative = valueInDatum && isNegative(value);
                value = valueNegative ? -1 * def.forceValue : def.forceValue;
                valueInDatum = true;
            }
            reusableResult.missing = !valueInDatum;

            const missingValueDef = 'missingValue' in def;
            if (!valueInDatum && !missingValueDef) {
                if (typeof valueScopes === 'string') {
                    const missCount = def.missing.get(valueScopes) ?? 0;
                    def.missing.set(valueScopes, missCount + 1);
                } else {
                    for (const scope of valueScopes) {
                        const missCount = def.missing.get(scope) ?? 0;
                        def.missing.set(scope, missCount + 1);
                    }
                }
            }

            if (!dataDomain.has(def)) {
                initDataDomain();
            }

            // Keys cannot be null/undefined - mark as invalid
            const isKeyWithNullValue = def.type === 'key' && value == null;

            if ((valueInDatum && def.validation?.(value, datum, idx) === false) || isKeyWithNullValue) {
                reusableResult.valid = false;

                if ('invalidValue' in def) {
                    value = def.invalidValue;
                } else {
                    if (this.mode !== 'integrated') {
                        Logger.warnOnce(
                            `invalid value of type [${typeof value}] for [${def.scopes} / ${def.id}] ignored:`,
                            `[${value}]`
                        );
                    }
                    reusableResult.value = undefined;
                    return reusableResult;
                }
            } else {
                reusableResult.valid = true;
            }

            if (def.processor) {
                let processor = processorFns.get(def);
                if (processor == null) {
                    processor = def.processor();
                    processorFns.set(def, processor);
                }
                value = processor(value, idx);
            }

            if (domainMode === 'extend') {
                dataDomain.get(def)?.extend(value);
            }
            reusableResult.value = value;
            return reusableResult;
        };

        return { dataDomain, processValue, initDataDomain, scopes, allScopesHaveSameDefs };
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
        for (const keyDef of this.keys) {
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
        for (const valueDef of this.values) {
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
