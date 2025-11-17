import type { BandedDomainConfig } from '../../dataDomain';

export interface ReducerBand {
    startIndex: number;
    endIndex: number;
    cachedResult: unknown;
    isDirty: boolean;
}

export interface BandManagerStats {
    totalBands: number;
    dirtyBands: number;
    dataSize: number;
    scanRatio: number;
    cacheHits: number;
}

const DEFAULT_MIN_DATA_SIZE_FOR_BANDING = 1000;
const DEFAULT_TARGET_BAND_COUNT = 10;

export class BandManager {
    private bands: ReducerBand[] = [];
    private dataSize: number = 0;
    private readonly config: Required<BandedDomainConfig>;

    constructor(config: BandedDomainConfig = {}) {
        this.config = {
            minDataSizeForBanding: config.minDataSizeForBanding ?? DEFAULT_MIN_DATA_SIZE_FOR_BANDING,
            targetBandCount: config.targetBandCount ?? DEFAULT_TARGET_BAND_COUNT,
            maxBandSize: config.maxBandSize ?? Infinity,
            enableBanding: config.enableBanding ?? true,
        };
    }

    initializeBands(dataSize: number): void {
        this.dataSize = Math.max(0, dataSize);
        this.bands = [];

        if (!this.config.enableBanding || this.dataSize < this.config.minDataSizeForBanding) {
            this.bands.push({
                startIndex: 0,
                endIndex: this.dataSize,
                cachedResult: undefined,
                isDirty: true,
            });
            return;
        }

        const targetBandCount = this.getTargetBandCount(this.dataSize);
        const bandSize = Math.max(1, Math.ceil(this.dataSize / targetBandCount));

        for (let startIndex = 0; startIndex < this.dataSize; startIndex += bandSize) {
            const endIndex = Math.min(startIndex + bandSize, this.dataSize);
            this.bands.push({
                startIndex,
                endIndex,
                cachedResult: undefined,
                isDirty: true,
            });
        }
    }

    handleInsertion(insertIndex: number, insertCount: number): void {
        this.dataSize += insertCount;

        if (this.bands.length === 0) {
            this.initializeBands(this.dataSize);
            return;
        }

        for (let i = 0; i < this.bands.length; i++) {
            const band = this.bands[i];
            const isLastBand = i === this.bands.length - 1;

            if (insertIndex < band.startIndex) {
                band.startIndex += insertCount;
                band.endIndex += insertCount;
            } else if (insertIndex < band.endIndex || (insertIndex === band.endIndex && isLastBand)) {
                band.endIndex += insertCount;
                band.isDirty = true;
            }
        }
    }

    handleRemoval(removeIndex: number, removeCount: number): void {
        if (removeCount <= 0 || this.bands.length === 0) return;

        const effectiveRemoveCount = Math.min(removeCount, Math.max(0, this.dataSize - removeIndex));
        if (effectiveRemoveCount <= 0) return;

        this.dataSize = Math.max(0, this.dataSize - effectiveRemoveCount);
        const removeEnd = removeIndex + effectiveRemoveCount;

        for (const band of this.bands) {
            if (removeEnd <= band.startIndex) {
                band.startIndex = Math.max(0, band.startIndex - effectiveRemoveCount);
                band.endIndex = Math.max(band.startIndex, band.endIndex - effectiveRemoveCount);
            } else if (removeIndex >= band.endIndex) {
                continue;
            } else {
                band.isDirty = true;

                if (removeIndex <= band.startIndex && removeEnd >= band.endIndex) {
                    band.startIndex = removeIndex;
                    band.endIndex = removeIndex;
                } else if (removeIndex <= band.startIndex) {
                    const deletedFromBand = removeEnd - band.startIndex;
                    band.startIndex = removeIndex;
                    band.endIndex = Math.max(band.startIndex, band.endIndex - deletedFromBand);
                } else if (removeEnd >= band.endIndex) {
                    band.endIndex = Math.max(band.startIndex, removeIndex);
                } else {
                    band.endIndex = Math.max(band.startIndex, band.endIndex - effectiveRemoveCount);
                }
            }
        }

        this.bands = this.bands.filter((band) => band.endIndex > band.startIndex);

        if (this.needsReinitialization()) {
            const oldBands = this.bands.map((band) => ({ ...band }));
            this.initializeBands(this.dataSize);
            this.preserveCachedResults(oldBands, this.bands);
        }
    }

    getBands(): ReducerBand[] {
        return this.bands;
    }

    getStats(): BandManagerStats {
        const dirtyBands = this.bands.filter((band) => band.isDirty);
        const cleanBands = this.bands.filter((band) => !band.isDirty && band.cachedResult !== undefined);
        const dirtySpan = dirtyBands.reduce((sum, band) => sum + (band.endIndex - band.startIndex), 0);

        return {
            totalBands: this.bands.length,
            dirtyBands: dirtyBands.length,
            dataSize: this.dataSize,
            scanRatio: this.dataSize > 0 ? dirtySpan / this.dataSize : 0,
            cacheHits: cleanBands.length,
        };
    }

    private needsReinitialization(): boolean {
        if (this.bands.length === 0) {
            return true;
        }

        if (this.bands[0].startIndex !== 0) return true;

        for (let i = 0; i < this.bands.length - 1; i++) {
            if (this.bands[i].endIndex !== this.bands[i + 1].startIndex) {
                return true;
            }
        }

        const lastBand = this.bands[this.bands.length - 1];
        return lastBand.endIndex !== this.dataSize;
    }

    private preserveCachedResults(oldBands: ReducerBand[], newBands: ReducerBand[]): void {
        for (const newBand of newBands) {
            const overlappingOldBands = oldBands.filter(
                (oldBand) => oldBand.startIndex < newBand.endIndex && oldBand.endIndex > newBand.startIndex
            );

            if (overlappingOldBands.length === 1) {
                const oldBand = overlappingOldBands[0];
                if (
                    !oldBand.isDirty &&
                    oldBand.cachedResult !== undefined &&
                    oldBand.startIndex <= newBand.startIndex &&
                    oldBand.endIndex >= newBand.endIndex
                ) {
                    newBand.cachedResult = oldBand.cachedResult;
                    newBand.isDirty = false;
                    continue;
                }
            }

            newBand.cachedResult = undefined;
            newBand.isDirty = true;
        }
    }

    private getTargetBandCount(dataSize: number): number {
        const derivedCount = Math.ceil(dataSize / 1000);
        return Math.max(this.config.targetBandCount, derivedCount);
    }
}
