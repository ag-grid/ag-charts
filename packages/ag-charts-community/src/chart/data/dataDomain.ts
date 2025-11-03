export interface IDataDomain<D = any> {
    extend(val: any): void;
    getDomain(): D[];
}

export class DiscreteDomain implements IDataDomain {
    private readonly domain = new Set();

    static is(value: unknown): value is DiscreteDomain {
        return value instanceof DiscreteDomain;
    }

    extend(val: any) {
        this.domain.add(val);
    }

    getDomain() {
        return Array.from(this.domain);
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
interface DomainBand<T> {
    /** Starting index (inclusive) of data covered by this band */
    startIndex: number;
    /** Ending index (exclusive) of data covered by this band */
    endIndex: number;
    /** The sub-domain for values in this band */
    subDomain: IDataDomain<T>;
    /** Whether this band needs rescanning due to modifications */
    isDirty: boolean;
}

/**
 * Configuration options for BandedDomain optimization.
 */
export interface BandedDomainConfig {
    /** Minimum data size to activate banding (default: 1000) */
    minDataSizeForBanding?: number;
    /** Target number of bands to create (default: 10) */
    targetBandCount?: number;
    /** Maximum items per band before splitting (default: undefined - no limit) */
    maxBandSize?: number;
    /** Enable banding optimization (default: true) */
    enableBanding?: boolean;
}

// Banding configuration defaults
/* Minimum data size to enable banding optimization (below this, overhead > benefit) */
const DEFAULT_MIN_DATA_SIZE_FOR_BANDING = 1000;
/* Target number of bands to balance granularity vs memory usage */
const DEFAULT_TARGET_BAND_COUNT = 10;

/**
 * A domain implementation that divides data into bands for efficient incremental updates.
 * Each band maintains its own sub-domain, allowing targeted updates without full rescans.
 *
 * Banding trades memory for performance. Each band maintains its own sub-domain,
 * so memory usage scales with targetBandCount × number of properties.
 * For datasets < minDataSizeForBanding, banding is disabled to avoid overhead.
 */
export class BandedDomain<T = any> implements IDataDomain<T> {
    private bands: DomainBand<T>[] = [];
    private readonly config: Required<BandedDomainConfig>;
    private readonly domainFactory: () => IDataDomain<T>;
    private dataSize: number = 0;
    private fullDomainCache: T[] | null = null;
    private readonly isDiscrete: boolean;
    // Tracks when band structure has gaps due to removals and needs rebalancing.
    // Set to true when removing data creates non-contiguous bands.
    // Prevents unnecessary rebalancing when bands are still valid.
    private needsReinitialization: boolean = false;

    constructor(domainFactory: () => IDataDomain<T>, config: BandedDomainConfig = {}, isDiscrete: boolean = false) {
        this.domainFactory = domainFactory;
        this.isDiscrete = isDiscrete;
        this.config = {
            minDataSizeForBanding: config.minDataSizeForBanding ?? DEFAULT_MIN_DATA_SIZE_FOR_BANDING,
            targetBandCount: config.targetBandCount ?? DEFAULT_TARGET_BAND_COUNT,
            maxBandSize: config.maxBandSize ?? Infinity,
            enableBanding: config.enableBanding ?? true,
        };
    }

    /**
     * Initializes or rebalances bands based on current data size.
     */
    initializeBands(dataSize: number): void {
        this.dataSize = dataSize;
        this.fullDomainCache = null;
        this.needsReinitialization = false;

        // Don't use banding for small datasets or if disabled
        if (!this.config.enableBanding || dataSize < this.config.minDataSizeForBanding) {
            this.bands = [
                {
                    startIndex: 0,
                    endIndex: dataSize,
                    subDomain: this.domainFactory(),
                    isDirty: true,
                },
            ];
            return;
        }

        // Calculate optimal band size
        const targetBandCount = this.getTargetBandCount(this.dataSize);
        const bandSize = Math.ceil(dataSize / targetBandCount);

        this.bands = [];
        for (let i = 0; i < targetBandCount; i++) {
            const startIndex = i * bandSize;
            const endIndex = Math.min((i + 1) * bandSize, dataSize);

            this.bands.push({
                startIndex,
                endIndex,
                subDomain: this.domainFactory(),
                isDirty: true,
            });
        }
    }

    /**
     * Finds the band(s) that contain the given index range.
     */
    private findAffectedBands(startIndex: number, endIndex: number): number[] {
        const affected: number[] = [];
        for (let i = 0; i < this.bands.length; i++) {
            const band = this.bands[i];
            if (startIndex < band.endIndex && endIndex > band.startIndex) {
                affected.push(i);
            }
        }
        return affected;
    }

    /**
     * Marks bands as dirty that need rescanning.
     */
    markBandsDirty(startIndex: number, endIndex: number): void {
        const affectedBands = this.findAffectedBands(startIndex, endIndex);
        for (const bandIndex of affectedBands) {
            this.bands[bandIndex].isDirty = true;
        }
        this.fullDomainCache = null;
    }

    /**
     * Handles insertion of new data by adjusting band indices.
     */
    handleInsertion(insertIndex: number, insertCount: number): void {
        this.dataSize += insertCount;
        this.fullDomainCache = null;

        // Adjust band indices for insertions
        for (let i = 0; i < this.bands.length; i++) {
            const band = this.bands[i];
            const isLastBand = i === this.bands.length - 1;

            if (insertIndex < band.startIndex) {
                // Insertion before this band - shift both indices
                band.startIndex += insertCount;
                band.endIndex += insertCount;
            } else if (insertIndex < band.endIndex || (insertIndex === band.endIndex && isLastBand)) {
                // Insertion within this band, or at the exact end of the last band (for appending)
                // Extend end index and mark dirty so it gets rescanned
                band.endIndex += insertCount;
                band.isDirty = true;
            }
            // Insertion after this band - no adjustment needed
        }

        // Check if rebalancing is needed
        this.considerRebalancing();
    }

    /**
     * Handles removal of data by adjusting band indices.
     */
    handleRemoval(removeIndex: number, removeCount: number): void {
        this.dataSize -= removeCount;
        this.fullDomainCache = null;

        // Note: We no longer check if boundary values are being removed and mark all bands dirty.
        // The affected bands (those containing the removed data) will be marked dirty below,
        // and rescanning them will correctly update the domain. This preserves the banding
        // optimization even when removing min/max values (common in scrolling scenarios).

        // Adjust band indices for removals
        for (const band of this.bands) {
            if (removeIndex + removeCount <= band.startIndex) {
                // Removal before this band - shift both indices
                band.startIndex = Math.max(0, band.startIndex - removeCount);
                band.endIndex = Math.max(band.startIndex, band.endIndex - removeCount);
            } else if (removeIndex < band.endIndex) {
                // Removal affects this band
                if (removeIndex <= band.startIndex) {
                    // Removal spans start of band
                    const removedFromBand = Math.min(removeCount, band.endIndex - band.startIndex);
                    band.startIndex = removeIndex;
                    band.endIndex = Math.max(band.startIndex, band.endIndex - removedFromBand);
                } else {
                    // Removal within band
                    band.endIndex = Math.max(band.startIndex, band.endIndex - removeCount);
                }
                band.isDirty = true;
            }
            // Removal after this band - no adjustment needed
        }

        // Remove empty bands
        this.bands = this.bands.filter((band) => band.endIndex > band.startIndex);

        // Check if bands need normalization or reinitialization
        // Bands must form a contiguous range starting at 0
        // Skip for single-band setups (small datasets) as they don't need rebalancing
        let needsNormalization = false;

        if (this.bands.length > 1) {
            // Check if first band doesn't start at 0
            if (this.bands[0].startIndex !== 0) {
                needsNormalization = true;
            }

            // Check for gaps between bands
            for (let i = 1; i < this.bands.length; i++) {
                if (this.bands[i].startIndex !== this.bands[i - 1].endIndex) {
                    // Gap detected - bands are not contiguous
                    // This requires full reinitialization
                    this.needsReinitialization = true;
                    break;
                }
            }
        }

        // Normalize bands if needed (shift to start at 0)
        // Note: Normalization just adjusts indices - band domains remain valid
        if (needsNormalization && !this.needsReinitialization) {
            const offset = this.bands[0].startIndex;
            for (const band of this.bands) {
                band.startIndex -= offset;
                band.endIndex -= offset;
            }
            // Don't set needsReinitialization - normalization preserves band domains
        }

        this.considerRebalancing();
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
     * Considers whether bands should be rebalanced based on current distribution.
     */
    private considerRebalancing(): void {
        // Only rebalance if needsReinitialization flag is set (bands are broken/have gaps)
        // Don't automatically rebalance just because data size changed
        if (!this.needsReinitialization) {
            return;
        }

        // Skip rebalancing for small datasets
        if (this.dataSize < this.config.minDataSizeForBanding) {
            if (this.bands.length > 1) {
                this.initializeBands(this.dataSize);
            }
            return;
        }

        // Check if any band is too large
        if (this.config.maxBandSize < Infinity) {
            const maxSize = Math.max(...this.bands.map((b) => b.endIndex - b.startIndex));
            if (maxSize > this.config.maxBandSize) {
                this.initializeBands(this.dataSize);
                return;
            }
        }

        // Check if band count is significantly off target
        const targetBandCount = this.getTargetBandCount(this.dataSize);
        if (Math.abs(this.bands.length - targetBandCount) > targetBandCount * 0.5) {
            this.initializeBands(this.dataSize);
        }
    }

    private getTargetBandCount(dataSize: number): number {
        return Math.max(this.config.targetBandCount, Math.ceil(dataSize / 1000));
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
            // For discrete domains, merge all unique values
            const combined = new Set<T>();
            for (const band of this.bands) {
                const bandDomain = band.subDomain.getDomain();
                for (const value of bandDomain) {
                    combined.add(value);
                }
            }
            this.fullDomainCache = Array.from(combined);
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
    getStats(): {
        bandCount: number;
        dirtyBandCount: number;
        averageBandSize: number;
        dataSize: number;
        needsReinitialization: boolean;
    } {
        const dirtyCount = this.bands.filter((b) => b.isDirty).length;
        const totalSize = this.bands.reduce((sum, b) => sum + (b.endIndex - b.startIndex), 0);

        return {
            bandCount: this.bands.length,
            dirtyBandCount: dirtyCount,
            averageBandSize: this.bands.length > 0 ? totalSize / this.bands.length : 0,
            dataSize: this.dataSize,
            needsReinitialization: this.needsReinitialization,
        };
    }
}
