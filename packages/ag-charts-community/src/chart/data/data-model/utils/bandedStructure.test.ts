import { describe, expect, it } from '@jest/globals';

import {
    type BandConfig,
    type BandLike,
    adjustBandForInsertion,
    adjustBandForRemoval,
    calculateIdealBandSize,
    calculateTargetBandCount,
    filterEmptyBands,
    initializeBandArray,
    markBandDirtyAtIndex,
} from './bandedStructure';

// Test helper to create a simple band
function createBand(startIndex: number, endIndex: number, isDirty = false): BandLike {
    return { startIndex, endIndex, isDirty };
}

describe('bandOperations', () => {
    describe('adjustBandForInsertion', () => {
        it('shifts band when insertion is before it', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForInsertion(band, 50, 10, false);

            expect(band.startIndex).toBe(110);
            expect(band.endIndex).toBe(210);
            expect(wasDirty).toBe(false); // Band data unchanged
        });

        it('extends band when insertion is within it', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForInsertion(band, 150, 10, false);

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(210);
            expect(wasDirty).toBe(true); // Band data changed
        });

        it('extends last band when insertion is at its end', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForInsertion(band, 200, 10, true);

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(210);
            expect(wasDirty).toBe(true); // Band data changed
        });

        it('does not extend non-last band when insertion is at its end', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForInsertion(band, 200, 10, false);

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(200);
            expect(wasDirty).toBe(false); // Band data unchanged
        });

        it('does nothing when insertion is after the band', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForInsertion(band, 250, 10, false);

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(200);
            expect(wasDirty).toBe(false);
        });
    });

    describe('adjustBandForRemoval', () => {
        it('shifts band when removal is before it', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForRemoval(band, 50, 20);

            expect(band.startIndex).toBe(80);
            expect(band.endIndex).toBe(180);
            expect(wasDirty).toBe(false); // Band data unchanged
        });

        it('does nothing when removal is after the band', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForRemoval(band, 250, 20);

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(200);
            expect(wasDirty).toBe(false);
        });

        it('collapses band when removal fully contains it', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForRemoval(band, 50, 200);

            expect(band.startIndex).toBe(50);
            expect(band.endIndex).toBe(50);
            expect(wasDirty).toBe(true); // Band data changed
        });

        it('shrinks band when removal overlaps its start', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForRemoval(band, 50, 80); // Removes 50-130

            expect(band.startIndex).toBe(50);
            expect(band.endIndex).toBe(120); // 200 - 80 = 120 (30 items remain from original 100)
            expect(wasDirty).toBe(true);
        });

        it('shrinks band when removal overlaps its end', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForRemoval(band, 150, 80); // Removes 150-230

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(150); // Only items 100-150 remain
            expect(wasDirty).toBe(true);
        });

        it('shrinks band when removal is within it', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForRemoval(band, 150, 20); // Removes 150-170

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(180); // 200 - 20 = 180
            expect(wasDirty).toBe(true);
        });

        it('handles removal at band start index', () => {
            const band = createBand(100, 200);
            const wasDirty = adjustBandForRemoval(band, 100, 20);

            expect(band.startIndex).toBe(100);
            expect(band.endIndex).toBe(180);
            expect(wasDirty).toBe(true);
        });

        it('guards against negative indices when shifting', () => {
            const band = createBand(10, 50);
            adjustBandForRemoval(band, 0, 20);

            expect(band.startIndex).toBe(0); // Math.max(0, 10 - 20) = 0
            expect(band.endIndex).toBeGreaterThanOrEqual(band.startIndex);
        });
    });

    describe('calculateTargetBandCount', () => {
        it('uses 1000 items per band as baseline', () => {
            expect(calculateTargetBandCount(5000, 2)).toBe(5); // ceil(5000/1000) = 5
            expect(calculateTargetBandCount(3500, 2)).toBe(4); // ceil(3500/1000) = 4
        });

        it('respects minimum band count', () => {
            expect(calculateTargetBandCount(500, 5)).toBe(5); // Uses minBandCount
            expect(calculateTargetBandCount(100, 10)).toBe(10);
        });

        it('handles edge cases', () => {
            expect(calculateTargetBandCount(0, 1)).toBe(1);
            expect(calculateTargetBandCount(1, 1)).toBe(1);
            expect(calculateTargetBandCount(1000, 1)).toBe(1); // Exactly 1000 = 1 band
            expect(calculateTargetBandCount(1001, 1)).toBe(2); // Just over 1000 = 2 bands
        });
    });

    describe('calculateIdealBandSize', () => {
        it('divides data evenly across target bands', () => {
            expect(calculateIdealBandSize(1000, 10)).toBe(100);
            expect(calculateIdealBandSize(5000, 5)).toBe(1000);
        });

        it('rounds up for uneven divisions', () => {
            expect(calculateIdealBandSize(1000, 3)).toBe(334); // ceil(1000/3)
            expect(calculateIdealBandSize(100, 7)).toBe(15); // ceil(100/7)
        });

        it('handles edge cases', () => {
            expect(calculateIdealBandSize(0, 1)).toBe(1); // Math.max(1, ...)
            expect(calculateIdealBandSize(1, 1)).toBe(1);
            expect(calculateIdealBandSize(1, 10)).toBe(1);
        });
    });

    describe('filterEmptyBands', () => {
        it('removes bands where endIndex <= startIndex', () => {
            const bands = [
                createBand(0, 100),
                createBand(100, 100), // Empty (equal)
                createBand(100, 200),
                createBand(300, 250), // Empty (end < start, should not happen but guard against it)
                createBand(200, 300),
            ];

            const filtered = filterEmptyBands(bands);

            expect(filtered).toHaveLength(3);
            expect(filtered[0]).toMatchObject({ startIndex: 0, endIndex: 100 });
            expect(filtered[1]).toMatchObject({ startIndex: 100, endIndex: 200 });
            expect(filtered[2]).toMatchObject({ startIndex: 200, endIndex: 300 });
        });

        it('returns empty array when all bands are empty', () => {
            const bands = [createBand(100, 100), createBand(200, 200)];

            const filtered = filterEmptyBands(bands);

            expect(filtered).toHaveLength(0);
        });

        it('returns original array when no bands are empty', () => {
            const bands = [createBand(0, 100), createBand(100, 200)];

            const filtered = filterEmptyBands(bands);

            expect(filtered).toHaveLength(2);
        });
    });

    describe('initializeBandArray', () => {
        const config: BandConfig = {
            enableBanding: true,
            minDataSizeForBanding: 1000,
            targetBandCount: 10,
        };

        it('creates single band for small datasets', () => {
            const bands = initializeBandArray(500, config, (start, end) => createBand(start, end, true));

            expect(bands).toHaveLength(1);
            expect(bands[0]).toMatchObject({ startIndex: 0, endIndex: 500, isDirty: true });
        });

        it('creates single band when banding is disabled', () => {
            const disabledConfig = { ...config, enableBanding: false };
            const bands = initializeBandArray(5000, disabledConfig, (start, end) => createBand(start, end, true));

            expect(bands).toHaveLength(1);
            expect(bands[0]).toMatchObject({ startIndex: 0, endIndex: 5000 });
        });

        it('creates multiple bands for large datasets', () => {
            const bands = initializeBandArray(10000, config, (start, end) => createBand(start, end, true));

            expect(bands.length).toBeGreaterThan(1);
            expect(bands[0].startIndex).toBe(0);
            expect(bands[bands.length - 1].endIndex).toBe(10000);
        });

        it('creates contiguous bands with no gaps', () => {
            const bands = initializeBandArray(5000, config, (start, end) => createBand(start, end, true));

            for (let i = 1; i < bands.length; i++) {
                expect(bands[i].startIndex).toBe(bands[i - 1].endIndex);
            }
        });

        it('creates approximately equal-sized bands', () => {
            const bands = initializeBandArray(10000, config, (start, end) => createBand(start, end, true));

            const sizes = bands.map((b) => b.endIndex - b.startIndex);
            const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;

            // All bands should be within 50% of average size
            for (const size of sizes) {
                expect(size).toBeGreaterThan(avgSize * 0.5);
                expect(size).toBeLessThan(avgSize * 1.5);
            }
        });

        it('uses custom factory function', () => {
            interface CustomBand extends BandLike {
                customValue: string;
            }

            const bands = initializeBandArray<CustomBand>(2000, config, (start, end) => ({
                startIndex: start,
                endIndex: end,
                isDirty: false,
                customValue: `band-${start}`,
            }));

            expect(bands[0].customValue).toBe('band-0');
            expect(bands[0].isDirty).toBe(false);
        });
    });

    describe('markBandDirtyAtIndex', () => {
        it('marks the band containing the index as dirty', () => {
            const bands = [createBand(0, 100), createBand(100, 200), createBand(200, 300)];

            markBandDirtyAtIndex(bands, 150);

            expect(bands[0].isDirty).toBe(false);
            expect(bands[1].isDirty).toBe(true);
            expect(bands[2].isDirty).toBe(false);
        });

        it('marks first band when index is at start', () => {
            const bands = [createBand(0, 100), createBand(100, 200)];

            markBandDirtyAtIndex(bands, 0);

            expect(bands[0].isDirty).toBe(true);
            expect(bands[1].isDirty).toBe(false);
        });

        it('does not mark band when index is at its end boundary', () => {
            const bands = [createBand(0, 100), createBand(100, 200)];

            markBandDirtyAtIndex(bands, 100);

            expect(bands[0].isDirty).toBe(false);
            expect(bands[1].isDirty).toBe(true); // Index 100 belongs to second band
        });

        it('does nothing when index is outside all bands', () => {
            const bands = [createBand(0, 100), createBand(100, 200)];

            markBandDirtyAtIndex(bands, 300);

            expect(bands[0].isDirty).toBe(false);
            expect(bands[1].isDirty).toBe(false);
        });

        it('stops after finding the containing band (performance)', () => {
            const bands = [createBand(0, 100), createBand(100, 200), createBand(200, 300)];

            // Even if we somehow had overlapping bands (shouldn't happen),
            // it would only mark the first match
            markBandDirtyAtIndex(bands, 50);

            expect(bands[0].isDirty).toBe(true);
        });
    });
});
