import { type BandLike, BandedStructure, type BandedStructureConfig } from './data-model/utils/bandedStructure';

export interface IDataDomain<D = any> {
    extend(val: any): void;
    getDomain(): D[];
}

// Define sortable order type alias for clarity and reuse.
type SortOrder = 1 | -1;

export class DiscreteDomain implements IDataDomain {
    // Set-based storage (default mode)
    private readonly domain = new Set();
    private readonly dateTimestamps = new Set<number>();
    private hasDateValues = false;

    // Sorted array storage (optimized mode for sorted unique data)
    private sortedValues: unknown[] | null = null;
    private sortOrder: SortOrder | undefined = undefined;
    private isSortedUnique: boolean = false;

    static is(value: unknown): value is DiscreteDomain {
        return value instanceof DiscreteDomain;
    }

    /**
     * Configure domain for sorted unique mode.
     * When enabled, uses a single array for O(1) append.
     * Call this before extending with data.
     */
    setSortedUniqueMode(sortOrder: 1 | -1, isUnique: boolean): void {
        if (isUnique) {
            this.isSortedUnique = true;
            this.sortOrder = sortOrder;
            this.sortedValues = [];
        }
    }

    extend(val: any) {
        if (this.isSortedUnique && this.sortedValues) {
            // Sorted unique mode: store values directly without conversion
            // Null deduplication is handled in getDomain()
            this.sortedValues.push(val);
            if (val instanceof Date) {
                this.hasDateValues = true;
            }
        } else if (val instanceof Date) {
            // Set mode: convert Date to timestamp for proper deduplication
            this.hasDateValues = true;
            this.dateTimestamps.add(val.valueOf());
        } else {
            this.domain.add(val);
        }
    }

    getDomain() {
        if (this.isSortedUnique && this.sortedValues) {
            // Sorted mode: return array directly - values stored as-is
            // Deduplicate nulls and Invalid Dates (they represent invalid data and may appear from multiple bands)
            let hasSeenInvalid = false;
            return this.sortedValues.filter((v) => {
                // Check for null/undefined
                if (v == null) {
                    if (hasSeenInvalid) return false;
                    hasSeenInvalid = true;
                    return true;
                }
                // Check for Invalid Date (Date object with NaN timestamp)
                if (v instanceof Date && Number.isNaN(v.valueOf())) {
                    if (hasSeenInvalid) return false;
                    hasSeenInvalid = true;
                }
                return true;
            });
        }

        // Set-based path: convert timestamps back to Date objects
        if (this.hasDateValues) {
            const dates = Array.from(this.dateTimestamps, (ts) => new Date(ts));
            if (this.domain.size > 0) {
                return [...dates, ...Array.from(this.domain)];
            }
            return dates;
        }
        return Array.from(this.domain);
    }

    /** Returns true if this domain contains Date values stored as timestamps */
    isDateDomain(): boolean {
        return this.hasDateValues;
    }

    /** Returns true if this domain is in sorted unique mode */
    isSortedUniqueMode(): boolean {
        return this.isSortedUnique;
    }

    /** Returns the sort order if in sorted mode, undefined otherwise */
    getSortOrder(): SortOrder | undefined {
        return this.sortOrder;
    }

    /** Merges another DiscreteDomain's values into this one */
    mergeFrom(other: DiscreteDomain): void {
        // Fast path: both domains are in sorted unique mode with same sort order
        if (
            this.isSortedUnique &&
            other.isSortedUnique &&
            this.sortOrder === other.sortOrder &&
            this.sortOrder !== undefined &&
            other.sortedValues
        ) {
            if (other.hasDateValues) {
                this.hasDateValues = true;
            }
            this.sortedValues ??= [];
            // O(n) array concatenation - null deduplication is handled in getDomain()
            this.sortedValues.push(...other.sortedValues);
            return;
        }

        // Slow path: fall back to Set-based merge
        this.convertToSetMode();

        if (other.hasDateValues) {
            this.hasDateValues = true;
        }

        if (other.isSortedUnique && other.sortedValues) {
            // Other is in sorted mode - add values to appropriate Sets
            for (const val of other.sortedValues) {
                if (val instanceof Date) {
                    this.dateTimestamps.add(val.valueOf());
                } else {
                    this.domain.add(val);
                }
            }
        } else {
            // Other is in Set mode
            for (const ts of other.dateTimestamps) {
                this.dateTimestamps.add(ts);
            }
            for (const val of other.domain) {
                this.domain.add(val);
            }
        }
    }

    /** Converts from sorted array mode to Set mode (one-way transition) */
    private convertToSetMode(): void {
        if (!this.isSortedUnique) return;

        // Move sorted values to appropriate Sets
        if (this.sortedValues) {
            for (const val of this.sortedValues) {
                if (val instanceof Date) {
                    this.dateTimestamps.add(val.valueOf());
                } else {
                    this.domain.add(val);
                }
            }
            this.sortedValues = null;
        }

        this.isSortedUnique = false;
        this.sortOrder = undefined;
    }
}

export class ContinuousDomain<T extends number | Date> implements IDataDomain<T> {
    private domain = [Infinity, -Infinity] as [T, T];

    static is<T extends number | Date = any>(value: unknown): value is ContinuousDomain<T> {
        return value instanceof ContinuousDomain;
    }

    static extendDomain(values: unknown[], domain: [number, number] = [Infinity, -Infinity]) {
        for (const value of values) {
            if (typeof value !== 'number') {
                continue;
            }
            if (domain[0] > value) {
                domain[0] = value;
            }
            if (domain[1] < value) {
                domain[1] = value;
            }
        }
        return domain;
    }

    extend(value: T) {
        if (typeof value !== 'number' && !(value instanceof Date)) {
            return;
        }
        if (this.domain[0] > value) {
            this.domain[0] = value;
        }
        if (this.domain[1] < value) {
            this.domain[1] = value;
        }
    }

    getDomain() {
        return [...this.domain];
    }
}

/**
 * Represents a single band within a BandedDomain.
 * Each band maintains its own sub-domain for a range of data indices.
 */
interface DomainBand<T> extends BandLike {
    /** The sub-domain for values in this band */
    subDomain: IDataDomain<T>;
}

/**
 * Configuration options for BandedDomain optimization.
 * Extends BandedStructureConfig for backward compatibility.
 */
export interface BandedDomainConfig extends BandedStructureConfig {}

/**
 * A domain implementation that divides data into bands for efficient incremental updates.
 * Each band maintains its own sub-domain, allowing targeted updates without full rescans.
 *
 * Banding trades memory for performance. Each band maintains its own sub-domain,
 * so memory usage scales with targetBandCount × number of properties.
 * For datasets < minDataSizeForBanding, banding is disabled to avoid overhead.
 */
export class BandedDomain<T = any> extends BandedStructure<DomainBand<T>> implements IDataDomain<T> {
    private readonly domainFactory: () => IDataDomain<T>;
    private fullDomainCache: T[] | null = null;
    private readonly isDiscrete: boolean;

    // Sort order metadata for optimization (set from KEY_SORT_ORDERS)
    private sortOrder: 1 | -1 | undefined = undefined;
    private isUnique: boolean = false;

    constructor(domainFactory: () => IDataDomain<T>, config: BandedDomainConfig = {}, isDiscrete: boolean = false) {
        super(config);
        this.domainFactory = domainFactory;
        this.isDiscrete = isDiscrete;
    }

    /**
     * Set sort order metadata from KEY_SORT_ORDERS.
     * When data is sorted and unique, enables fast array concatenation in getDomain().
     */
    setSortOrderMetadata(sortOrder: 1 | -1 | undefined, isUnique: boolean): void {
        this.sortOrder = sortOrder;
        this.isUnique = isUnique;
    }

    /**
     * Creates a new domain band with its own sub-domain instance.
     * Configures sub-domain for sorted mode if applicable.
     */
    protected createBand(startIndex: number, endIndex: number): DomainBand<T> {
        const subDomain = this.domainFactory();

        // Configure sub-domain for sorted unique mode if metadata indicates it
        if (this.isDiscrete && this.sortOrder !== undefined && this.isUnique) {
            if (DiscreteDomain.is(subDomain)) {
                subDomain.setSortedUniqueMode(this.sortOrder, this.isUnique);
            }
        }

        return {
            startIndex,
            endIndex,
            subDomain,
            isDirty: true,
        };
    }

    /**
     * Initializes bands and clears the full domain cache.
     */
    override initializeBands(dataSize: number): void {
        super.initializeBands(dataSize);
        this.fullDomainCache = null;
    }

    /**
     * Handles insertion and clears the full domain cache.
     */
    override handleInsertion(insertIndex: number, insertCount: number): void {
        super.handleInsertion(insertIndex, insertCount);
        this.fullDomainCache = null;
    }

    /**
     * Handles removal and clears the full domain cache.
     */
    override handleRemoval(removeIndex: number, removeCount: number): void {
        super.handleRemoval(removeIndex, removeCount);
        this.fullDomainCache = null;
    }

    /**
     * Split an oversized band into two smaller bands.
     * Override to handle band splitting for large datasets where banding is beneficial.
     */
    protected override splitBand(bandIndex: number, idealSize: number): void {
        // Only split for large datasets where banding is beneficial
        if (this.bands.length > 1) {
            super.splitBand(bandIndex, idealSize);
        }
    }

    /**
     * Marks bands as dirty that need rescanning.
     */
    markBandsDirty(startIndex: number, endIndex: number): void {
        this.markRangeDirty(startIndex, endIndex);
        this.fullDomainCache = null;
    }

    /**
     * Marks all bands as dirty, forcing a full rescan.
     */
    private markAllBandsDirty(): void {
        for (const band of this.bands) {
            band.isDirty = true;
        }
        this.fullDomainCache = null;
    }

    /**
     * Extends the domain with values from specified bands.
     * This is called after dirty bands have been rescanned.
     */
    extendBandsFromData(data: T[], invalidData?: boolean[]): void {
        const dataLength = data.length;
        for (const band of this.bands) {
            if (!band.isDirty) continue;

            // Reset the band's domain with sorted mode configuration if applicable
            // Note: During rolling window updates, sort orders are invalidated BEFORE
            // domain recomputation, so sortOrder will be undefined and sorted mode won't be enabled.
            const subDomain = this.domainFactory();
            if (this.isDiscrete && this.sortOrder !== undefined && this.isUnique) {
                if (DiscreteDomain.is(subDomain)) {
                    subDomain.setSortedUniqueMode(this.sortOrder, this.isUnique);
                }
            }
            band.subDomain = subDomain;
            const { startIndex, endIndex } = band;

            // Scan the band's range
            for (let i = startIndex; i < endIndex && i < dataLength; i++) {
                if (invalidData?.[i]) continue;
                band.subDomain.extend(data[i]);
            }

            band.isDirty = false;
        }
        this.fullDomainCache = null;
    }

    /**
     * Gets the bands that need rescanning.
     */
    getDirtyBands(): DomainBand<T>[] {
        return this.bands.filter((band) => band.isDirty);
    }

    /**
     * Standard IDataDomain interface - extends domain with a single value.
     * Note: This is less efficient than batch operations with bands.
     */
    extend(_value: T): void {
        // For single value extensions, just mark all bands dirty
        // This maintains compatibility but isn't optimized
        this.markAllBandsDirty();
        this.fullDomainCache = null;
    }

    /**
     * Check if all sub-domains support fast sorted concatenation.
     */
    private canUseSortedConcatenation(): boolean {
        if (!this.sortOrder || !this.isUnique || !this.isDiscrete) return false;

        for (const band of this.bands) {
            if (!DiscreteDomain.is(band.subDomain)) return false;
            if (!band.subDomain.isSortedUniqueMode()) return false;
            if (band.subDomain.getSortOrder() !== this.sortOrder) return false;
        }
        return true;
    }

    /**
     * Concatenate sorted domains efficiently.
     * Only valid when canUseSortedConcatenation() returns true.
     */
    private concatenateSortedDomains(): T[] {
        // Create a combined domain in sorted mode and merge all bands
        const combined = new DiscreteDomain();
        combined.setSortedUniqueMode(this.sortOrder!, this.isUnique);

        for (const band of this.bands) {
            if (DiscreteDomain.is(band.subDomain)) {
                combined.mergeFrom(band.subDomain);
            }
        }

        return combined.getDomain() as T[];
    }

    /**
     * Deduplicate nulls and Invalid Dates in a domain result array.
     * These represent invalid data and may appear from multiple bands.
     */
    private deduplicateNulls(result: T[]): T[] {
        let hasSeenInvalid = false;
        return result.filter((v) => {
            // Check for null/undefined
            if (v == null) {
                if (hasSeenInvalid) return false;
                hasSeenInvalid = true;
                return true;
            }
            // Check for Invalid Date (Date object with NaN timestamp)
            if (v instanceof Date && Number.isNaN(v.valueOf())) {
                if (hasSeenInvalid) return false;
                hasSeenInvalid = true;
            }
            return true;
        });
    }

    /**
     * Combines all band sub-domains to get the overall domain.
     */
    getDomain(): T[] {
        if (this.fullDomainCache !== null) {
            return this.fullDomainCache;
        }

        if (this.bands.length === 0) {
            this.fullDomainCache = [];
            return [];
        }

        // For a single band, return its domain directly (with null deduplication for sorted mode)
        if (this.bands.length === 1) {
            const result = this.bands[0].subDomain.getDomain();
            this.fullDomainCache = this.isDiscrete ? this.deduplicateNulls(result) : result;
            return this.fullDomainCache;
        }

        // Combine domains from all bands
        if (this.isDiscrete) {
            const firstBand = this.bands[0].subDomain;
            if (DiscreteDomain.is(firstBand)) {
                // Fast path: when all sub-domains are sorted unique, use array concatenation
                if (this.canUseSortedConcatenation()) {
                    this.fullDomainCache = this.deduplicateNulls(this.concatenateSortedDomains());
                } else {
                    // Slow path: merge via DiscreteDomain.mergeFrom()
                    const combined = new DiscreteDomain();
                    for (const band of this.bands) {
                        if (DiscreteDomain.is(band.subDomain)) {
                            combined.mergeFrom(band.subDomain);
                        }
                    }
                    this.fullDomainCache = this.deduplicateNulls(combined.getDomain() as T[]);
                }
            } else {
                // Fallback for non-DiscreteDomain sub-domains
                const combined = new Set<T>();
                for (const band of this.bands) {
                    for (const value of band.subDomain.getDomain()) {
                        combined.add(value);
                    }
                }
                this.fullDomainCache = Array.from(combined);
            }
        } else {
            // For continuous domains, find min and max across all bands
            let min: T | undefined;
            let max: T | undefined;

            for (const band of this.bands) {
                const bandDomain = band.subDomain.getDomain();
                if (bandDomain.length === 2) {
                    const [bandMin, bandMax] = bandDomain;
                    if (min === undefined || (bandMin != null && min != null && bandMin < min)) {
                        min = bandMin;
                    }
                    if (max === undefined || (bandMax != null && max != null && bandMax > max)) {
                        max = bandMax;
                    }
                }
            }

            if (min !== undefined && max !== undefined) {
                this.fullDomainCache = [min, max];
            } else {
                this.fullDomainCache = [];
            }
        }

        return this.fullDomainCache;
    }

    /**
     * Returns statistics about the banded domain for debugging.
     */
    override getStats(): {
        bandCount: number;
        dirtyBandCount: number;
        averageBandSize: number;
        dataSize: number;
    } {
        const dirtyCount = this.bands.filter((b) => b.isDirty).length;
        const totalSize = this.bands.reduce((sum, b) => sum + (b.endIndex - b.startIndex), 0);

        return {
            bandCount: this.bands.length,
            dirtyBandCount: dirtyCount,
            averageBandSize: this.bands.length > 0 ? totalSize / this.bands.length : 0,
            dataSize: this.dataSize,
        };
    }
}
