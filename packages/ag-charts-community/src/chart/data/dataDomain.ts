import { type BandLike, BandedStructure, type BandedStructureConfig } from './data-model/utils/bandedStructure';

export interface IDataDomain<D = any> {
    extend(val: any): void;
    getDomain(): D[];
}

export class DiscreteDomain implements IDataDomain {
    private readonly domain = new Set();
    private readonly dateTimestamps = new Set<number>();
    private hasDateValues = false;

    static is(value: unknown): value is DiscreteDomain {
        return value instanceof DiscreteDomain;
    }

    extend(val: any) {
        if (val instanceof Date) {
            this.hasDateValues = true;
            this.dateTimestamps.add(val.valueOf());
        } else {
            this.domain.add(val);
        }
    }

    getDomain() {
        if (this.hasDateValues) {
            return Array.from(this.dateTimestamps, (ts) => new Date(ts));
        }
        return Array.from(this.domain);
    }

    /** Returns true if this domain contains Date values stored as timestamps */
    isDateDomain(): boolean {
        return this.hasDateValues;
    }

    /** Merges another DiscreteDomain's values into this one (efficient, no object creation) */
    mergeFrom(other: DiscreteDomain): void {
        if (other.hasDateValues) {
            this.hasDateValues = true;
            for (const ts of other.dateTimestamps) {
                this.dateTimestamps.add(ts);
            }
        }
        if (other.domain.size > 0) {
            for (const val of other.domain) {
                this.domain.add(val);
            }
        }
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

    constructor(domainFactory: () => IDataDomain<T>, config: BandedDomainConfig = {}, isDiscrete: boolean = false) {
        super(config);
        this.domainFactory = domainFactory;
        this.isDiscrete = isDiscrete;
    }

    /**
     * Creates a new domain band with its own sub-domain instance.
     */
    protected createBand(startIndex: number, endIndex: number): DomainBand<T> {
        return {
            startIndex,
            endIndex,
            subDomain: this.domainFactory(),
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

            // Reset the band's domain
            band.subDomain = this.domainFactory();
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

        // For a single band, return its domain directly
        if (this.bands.length === 1) {
            this.fullDomainCache = this.bands[0].subDomain.getDomain();
            return this.fullDomainCache;
        }

        // Combine domains from all bands
        if (this.isDiscrete) {
            // For discrete domains, merge efficiently at the primitive level
            // Since bands have non-overlapping index ranges, we can merge without
            // expensive object-based Set operations
            const firstBand = this.bands[0].subDomain;
            if (DiscreteDomain.is(firstBand)) {
                const combined = new DiscreteDomain();
                for (const band of this.bands) {
                    if (DiscreteDomain.is(band.subDomain)) {
                        combined.mergeFrom(band.subDomain);
                    }
                }
                this.fullDomainCache = combined.getDomain() as T[];
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
