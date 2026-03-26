import { first, iterate } from 'ag-charts-core';

import { BandedDomain, ContinuousDomain, DiscreteDomain, type IDataDomain } from '../../dataDomain';
import {
    DOMAIN_BANDS,
    type InternalDatumPropertyDefinition,
    KEY_SORT_ORDERS,
    type ProcessedData,
    type ProcessedValue,
    type ProcessorFn,
    type SortOrderEntry,
} from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';
import type { ScopeCacheManager } from '../utils/scopeCache';
import { DomainInitializer } from './domainInitializer';
import { ProcessValueFactory, type SpecializedProcessValueFn } from './processValueFactory';

/**
 * Checks if two scope arrays overlap (have any common elements).
 * If either array is empty or undefined, they are considered universal (match everything).
 */
function scopesOverlap(scopes1?: string[], scopes2?: string[]): boolean {
    if (!scopes1 || !scopes2 || scopes1.length === 0 || scopes2.length === 0) {
        return true;
    }
    return scopes1.some((s) => scopes2.includes(s));
}

/**
 * Finds a key definition that matches a value definition for domain sharing.
 * A match occurs when:
 * - Same property name
 * - Same valueType ('category' for discrete domains)
 * - Overlapping scopes
 * - Same validation function (if present)
 */
function findMatchingKeyDef<K extends string>(
    valueDef: InternalDatumPropertyDefinition<K>,
    keyDefs: InternalDatumPropertyDefinition<K>[]
): InternalDatumPropertyDefinition<K> | undefined {
    // Only match discrete/category domains (continuous domains don't benefit from sharing)
    if (valueDef.valueType !== 'category') return undefined;

    for (const keyDef of keyDefs) {
        if (keyDef.property !== valueDef.property) continue;
        if (keyDef.valueType !== valueDef.valueType) continue;
        if (!scopesOverlap(keyDef.scopes, valueDef.scopes)) continue;
        // Don't share if validation functions differ
        if (keyDef.validation !== valueDef.validation) continue;
        return keyDef;
    }
    return undefined;
}

/**
 * Manages domain computation and processing for the DataModel.
 * Handles both discrete and continuous domains, including banded domain optimization
 * and value processing during data transformation.
 */
export class DomainManager<D extends object, K extends keyof D & string> {
    private readonly initializer: DomainInitializer<K>;
    private readonly scopeCacheManager: ScopeCacheManager<K>;
    private readonly processValueFactory: ProcessValueFactory<D, K>;

    constructor(
        private readonly ctx: DataModelContext<D, K>,
        initializer: DomainInitializer<K>,
        scopeCacheManager: ScopeCacheManager<K>
    ) {
        this.initializer = initializer;
        this.scopeCacheManager = scopeCacheManager;
        this.processValueFactory = new ProcessValueFactory(ctx);
    }

    /**
     * Recomputes all domains from processed data.
     * Uses BandedDomain optimization for continuous domains to avoid full rescans.
     * Shares domains between keys and values when they reference the same property.
     */
    recomputeDomains(processedData: ProcessedData<D>): void {
        const startTime = this.ctx.debug.check() ? performance.now() : 0;
        const bandedDomains = processedData[DOMAIN_BANDS];
        let bandStats: { totalBands: number; dirtyBands: number; totalData: number } | undefined;

        // Pass KEY_SORT_ORDERS to key domain setup for sorted unique optimization
        const keySortOrders = processedData[KEY_SORT_ORDERS];
        const keyDomains = this.setupDefinitionDomains(this.ctx.keys, bandedDomains, keySortOrders);

        // Build map of value defs that should share domains with key defs
        const valueToKeyDef = new Map<InternalDatumPropertyDefinition<K>, InternalDatumPropertyDefinition<K>>();
        for (const valueDef of this.ctx.values) {
            const matchingKeyDef = findMatchingKeyDef(valueDef, this.ctx.keys);
            if (matchingKeyDef) {
                valueToKeyDef.set(valueDef, matchingKeyDef);
            }
        }

        // Setup value domains, reusing key domains where property matches
        const valueDomains = this.setupValueDomainsWithSharing(
            this.ctx.values,
            bandedDomains,
            keyDomains,
            valueToKeyDef
        );

        // Track which domains are shared (already extended via key processing)
        const sharedDomains = new Set<IDataDomain>();
        for (const [, keyDef] of valueToKeyDef) {
            const sharedDomain = keyDomains.get(keyDef);
            if (sharedDomain) {
                sharedDomains.add(sharedDomain);
            }
        }

        // Initialize bands for key domains first (this determines band structure)
        // Only initialize if bands don't exist yet or if data size has changed significantly
        // During reprocessing, bands are already adjusted by updateBandsForChanges()
        this.initializeDomainBands(
            this.ctx.keys,
            keyDomains,
            (defIndex) => {
                const keysMap = processedData.keys[defIndex];
                return Math.max(...Array.from(keysMap.values()).map((keys) => keys.length));
            },
            (def) => String(def.property)
        );

        // Initialize bands for value domains
        this.initializeDomainBands(
            this.ctx.values,
            valueDomains,
            (defIndex) => processedData.columns[defIndex].length,
            (def) => String(def.property)
        );

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
        this.extendDomainsFromData(
            this.ctx.keys,
            keyDomains,
            (defIndex, scope) => processedData.keys[defIndex]?.get(scope),
            (def) => def.scopes ?? [],
            (scope) => processedData.invalidKeys?.get(scope)
        );

        // Extend value domains from columns arrays (skip shared domains - already extended via keys)
        this.extendDomainsFromData(
            this.ctx.values,
            valueDomains,
            (defIndex, _scope) => processedData.columns[defIndex],
            (def) => [first(def.scopes)],
            (scope) => processedData.invalidKeys?.get(scope),
            sharedDomains
        );

        processedData.domain.keys = this.ctx.keys.map(function mapDomainKeys(keyDef) {
            const domain = keyDomains.get(keyDef)!;
            const result = domain.getDomain();
            // Ignore starting values
            if (ContinuousDomain.is(domain) && result[0] > result[1]) {
                return [];
            }
            return result;
        });

        processedData.domain.values = this.ctx.values.map(function mapDomainValues(valueDef) {
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
     * Creates domain instances for the given definitions, reusing banded domains when available.
     * For key definitions, passes KEY_SORT_ORDERS metadata to enable fast array concatenation.
     */
    private setupDefinitionDomains(
        defs: InternalDatumPropertyDefinition<K>[],
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>,
        keySortOrders?: Map<number, SortOrderEntry>
    ): Map<InternalDatumPropertyDefinition<K>, IDataDomain> {
        const domains: Map<InternalDatumPropertyDefinition<K>, IDataDomain> = new Map();
        for (const [defIndex, def] of defs.entries()) {
            // Look up sort order metadata for key definitions
            const sortOrderEntry = keySortOrders?.get(defIndex);
            domains.set(def, this.initializer.setupDomainForDefinition(def, bandedDomains, sortOrderEntry));
        }
        return domains;
    }

    /**
     * Initializes banded domains for each definition using the provided data length accessor.
     */
    private initializeDomainBands(
        defs: InternalDatumPropertyDefinition<K>[],
        domains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>,
        getDataLength: (defIndex: number) => number,
        getPropertyName: (def: InternalDatumPropertyDefinition<K>) => string
    ): void {
        for (const [defIndex, def] of defs.entries()) {
            const domain = domains.get(def);
            if (!domain) continue;

            const dataLength = getDataLength(defIndex);
            this.initializer.initializeBandedDomain(domain, dataLength, getPropertyName(def));
        }
    }

    /**
     * Extends domains from data sources using a shared traversal.
     * @param skipDomains Optional set of domains to skip (already extended via shared key processing)
     */
    private extendDomainsFromData(
        defs: InternalDatumPropertyDefinition<K>[],
        domains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>,
        getData: (defIndex: number, scope: string) => any[] | undefined,
        getScopes: (def: InternalDatumPropertyDefinition<K>) => string[],
        getInvalid: (scope: string) => boolean[] | undefined,
        skipDomains?: Set<IDataDomain>
    ): void {
        for (const [defIndex, def] of defs.entries()) {
            const domain = domains.get(def);
            if (!domain) continue;

            // Skip domains that are shared with keys (already extended)
            if (skipDomains?.has(domain)) continue;

            for (const scope of getScopes(def)) {
                if (!scope) continue;
                const data = getData(defIndex, scope);
                if (!data) continue;

                const invalid = getInvalid(scope);
                this.initializer.extendDomainFromData(domain, data, invalid);
            }
        }
    }

    /**
     * Sets up value domains, reusing key domains where properties match.
     * This avoids duplicate domain computation for properties that appear as both key and value.
     */
    private setupValueDomainsWithSharing(
        defs: InternalDatumPropertyDefinition<K>[],
        bandedDomains: Map<InternalDatumPropertyDefinition<any>, BandedDomain>,
        keyDomains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>,
        valueToKeyDef: Map<InternalDatumPropertyDefinition<K>, InternalDatumPropertyDefinition<K>>
    ): Map<InternalDatumPropertyDefinition<K>, IDataDomain> {
        const domains = new Map<InternalDatumPropertyDefinition<K>, IDataDomain>();

        for (const def of defs) {
            const matchingKeyDef = valueToKeyDef.get(def);
            if (matchingKeyDef) {
                // Reuse key domain - no new domain creation needed
                const keyDomain = keyDomains.get(matchingKeyDef);
                if (keyDomain) {
                    domains.set(def, keyDomain);
                    continue;
                }
            }

            // Create new domain as before (no sort order metadata for non-shared values)
            domains.set(def, this.initializer.setupDomainForDefinition(def, bandedDomains));
        }
        return domains;
    }

    /**
     * Initializes domain processor for value processing during data transformation.
     * Returns domain maps and processing functions used during data extraction.
     * Uses specialized functions per property definition to eliminate branching in hot paths.
     * Shares domains between keys and values when they reference the same property.
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
            // First, create domains for key definitions
            for (const def of keyDefs) {
                if (def.valueType === 'category') {
                    dataDomain.set(def, new DiscreteDomain());
                } else {
                    dataDomain.set(def, new ContinuousDomain());
                }
            }

            // Then, create domains for value definitions (reusing key domains where matching)
            for (const def of valueDefs) {
                const matchingKeyDef = findMatchingKeyDef(def, keyDefs);
                if (matchingKeyDef) {
                    const keyDomain = dataDomain.get(matchingKeyDef);
                    if (keyDomain) {
                        dataDomain.set(def, keyDomain);
                        allScopesHaveSameDefs &&= (def.scopes?.length ?? 0) === scopes.size;
                        continue;
                    }
                }

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

            const processFn = this.processValueFactory.createProcessValueFn(
                def,
                accessor,
                domain,
                reusableResult,
                processorFns,
                domainMode
            );
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

        const collectDefs = (
            defs: InternalDatumPropertyDefinition<K>[],
            domains: Map<InternalDatumPropertyDefinition<K>, IDataDomain>
        ) => {
            return defs.map((def) => {
                const domain = domains.get(def);
                const bandedDomain = bandedDomains.get(def);
                const isBanded = domain instanceof BandedDomain;

                let reason: string | undefined;
                if (!isBanded) {
                    reason = def.valueType === 'category' ? 'discrete domain' : 'not configured';
                }

                let stats: { totalBands: number; dirtyBands: number; dataSize: number; scanRatio: number } | undefined;
                if (isBanded && bandedDomain) {
                    // Use pre-scan stats if available (collected before extending domains)
                    const domainStats = preScanDomainStats.get(bandedDomain) ?? bandedDomain.getStats();
                    const scanRatio =
                        domainStats.bandCount > 0 ? domainStats.dirtyBandCount / domainStats.bandCount : 0;
                    stats = {
                        totalBands: domainStats.bandCount,
                        dirtyBands: domainStats.dirtyBandCount,
                        dataSize: domainStats.dataSize,
                        scanRatio,
                    };
                }

                return {
                    property: String(def.property),
                    applied: isBanded,
                    reason,
                    stats,
                };
            });
        };

        const keyDefs = collectDefs(this.ctx.keys, keyDomains);
        const valueDefs = collectDefs(this.ctx.values, valueDomains);

        processedData.optimizations.domainBanding = {
            keyDefs,
            valueDefs,
        };
    }
}
