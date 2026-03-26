import type { Debug } from 'ag-charts-core';

import type { ChartMode } from '../../chartMode';
import type { BandedDomainConfig } from '../dataDomain';
import type {
    AggregatePropertyDefinition,
    GroupValueProcessorDefinition,
    InternalDatumPropertyDefinition,
    InternalDefinition,
    ProcessorOutputPropertyDefinition,
    PropertyDefinition,
    PropertyValueProcessorDefinition,
    ReducerOutputPropertyDefinition,
} from '../dataModelTypes';

/**
 * DataModelContext bundles shared state and configuration for DataModel subsystems.
 *
 * PURPOSE:
 * - Reduces constructor parameter counts across data model classes
 * - Makes dependencies explicit and easier to understand
 * - Simplifies adding new shared infrastructure in the future
 * - Improves testability by allowing easy context mocking
 *
 * CONTENTS:
 * - Property definition arrays (keys, values, aggregates, processors, etc.)
 * - Configuration (debug logger, chart mode, options)
 * - Infrastructure (scope cache for property lookups)
 *
 * USAGE:
 * Create once in DataModel constructor, then pass to all subsystem classes
 * that need access to shared state/configuration.
 */
export interface DataModelContext<D extends object, K extends keyof D & string> {
    // ===== Property Definitions =====
    /** Key property definitions for data grouping/indexing */
    keys: InternalDatumPropertyDefinition<K>[];

    /** Value property definitions for data visualization */
    values: InternalDatumPropertyDefinition<K>[];

    /** Aggregate property definitions for computing derived values */
    aggregates: (AggregatePropertyDefinition<D, K> & InternalDefinition<false>)[];

    /** Group-level value processors that operate on grouped data */
    groupProcessors: (GroupValueProcessorDefinition<D, K> & InternalDefinition<false>)[];

    /** Property-level value processors that transform individual values */
    propertyProcessors: (PropertyValueProcessorDefinition<D> & InternalDefinition<true>)[];

    /** Reducer output definitions for derived calculated properties */
    reducers: (ReducerOutputPropertyDefinition & InternalDefinition<false>)[];

    /** Processor output definitions for transformed properties */
    processors: (ProcessorOutputPropertyDefinition & InternalDefinition<false>)[];

    // ===== Configuration =====
    /** Debug logger for development/troubleshooting */
    debug: Debug.DebugLogger;

    /** Chart operating mode (standalone/integrated) */
    mode: ChartMode;

    /** Optional configuration for banded domain optimization */
    bandingConfig?: BandedDomainConfig;

    /** Whether to suppress dot notation in property field names */
    suppressFieldDotNotation: boolean;

    // ===== Infrastructure =====
    /**
     * Scope cache: Maps scope IDs to property definition lookups.
     * Enables fast resolution of property definitions by ID within a scope.
     */
    scopeCache: Map<string, Map<string, PropertyDefinition<any> & InternalDefinition<false>>>;
}
