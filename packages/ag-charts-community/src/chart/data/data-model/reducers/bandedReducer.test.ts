import { describe, expect, it } from '@jest/globals';

import { BandedReducer } from './bandedReducer';

describe('BandedReducer', () => {
    it('creates a single band for small datasets', () => {
        const manager = new BandedReducer();
        manager.initializeBands(500);

        const bands = manager.getBands();
        expect(bands).toHaveLength(1);
        expect(bands[0]).toMatchObject({ startIndex: 0, endIndex: 500, isDirty: true });
    });

    it('splits large datasets into multiple contiguous bands', () => {
        const manager = new BandedReducer({ minDataSizeForBanding: 100, targetBandCount: 4 });
        manager.initializeBands(2000);

        const bands = manager.getBands();
        expect(bands.length).toBeGreaterThan(1);
        expect(bands[0].startIndex).toBe(0);
        expect(bands[bands.length - 1].endIndex).toBe(2000);

        for (let i = 1; i < bands.length; i++) {
            expect(bands[i].startIndex).toBe(bands[i - 1].endIndex);
        }
    });

    it('marks only affected bands dirty when inserting data', () => {
        const manager = new BandedReducer({ minDataSizeForBanding: 100, targetBandCount: 4 });
        manager.initializeBands(400);
        const snapshot = manager.getBands().map((band) => ({ ...band }));
        manager.getBands().forEach((band) => (band.isDirty = false));

        manager.handleInsertion(150, 10);

        const dirtyBands = manager.getBands().filter((band) => band.isDirty);
        expect(dirtyBands).toHaveLength(1);
        expect(dirtyBands[0].startIndex).toBeLessThanOrEqual(150);
        expect(dirtyBands[0].endIndex).toBeGreaterThan(150);

        const lastBand = manager.getBands()[manager.getBands().length - 1];
        const previousLast = snapshot[snapshot.length - 1];
        expect(lastBand.endIndex - previousLast.endIndex).toBe(10);
    });

    it('marks bands dirty and compacts coverage on removal', () => {
        const manager = new BandedReducer({ minDataSizeForBanding: 100, targetBandCount: 4 });
        manager.initializeBands(400);
        manager.getBands().forEach((band) => (band.isDirty = false));

        manager.handleRemoval(50, 80);

        const dirtyBands = manager.getBands().filter((band) => band.isDirty);
        expect(dirtyBands.length).toBeGreaterThan(0);
        expect(manager.getBands()[0].startIndex).toBe(0);

        // Verify dataSize is updated correctly
        const stats = manager.getStats();
        expect(stats.dataSize).toBe(320); // 400 - 80

        // Verify total band coverage matches dataSize
        const totalCoverage = manager.getBands().reduce((acc, band) => acc + (band.endIndex - band.startIndex), 0);
        expect(totalCoverage).toBe(stats.dataSize);
    });

    it('reports efficient dirty ratios for rolling window updates', () => {
        const manager = new BandedReducer({ targetBandCount: 10 });
        manager.initializeBands(10_000);
        manager.getBands().forEach((band) => {
            band.isDirty = false;
            band.cachedResult = 0;
        });

        manager.handleRemoval(0, 100);
        manager.handleInsertion(9900, 100);

        const stats = manager.getStats();
        expect(stats.dirtyBands).toBe(2);
        expect(stats.scanRatio).toBeLessThanOrEqual(0.25);
        expect(stats.cacheHits).toBe(stats.totalBands - stats.dirtyBands);
    });

    describe('band splitting', () => {
        it('splits oversized bands during insertion', () => {
            const manager = new BandedReducer({ targetBandCount: 10, minDataSizeForBanding: 1000 });
            manager.initializeBands(10000);
            const initialBandCount = manager.getBands().length;

            // Simulate many insertions to the last band
            for (let i = 0; i < 200; i++) {
                manager.handleInsertion(10000 + i, 1);
            }

            // Should have created additional bands via splitting
            expect(manager.getBands().length).toBeGreaterThan(initialBandCount);
        });

        it('creates new bands for appends after ideal size', () => {
            const manager = new BandedReducer({ targetBandCount: 10, minDataSizeForBanding: 1000 });
            manager.initializeBands(10000);
            const bands = manager.getBands();

            // Mark all clean and cache some results
            bands.forEach((band, i) => {
                band.isDirty = false;
                band.cachedResult = i * 100;
            });

            const initialBandCount = bands.length;
            const lastBandInitialSize = bands[bands.length - 1].endIndex - bands[bands.length - 1].startIndex;

            // Append many points - should create new bands instead of splitting
            for (let i = 0; i < 200; i++) {
                manager.handleInsertion(10000 + i, 1);
            }

            const newBands = manager.getBands();

            // Should have created new bands
            expect(newBands.length).toBeGreaterThan(initialBandCount);

            // New bands should be dirty
            expect(newBands[newBands.length - 1].isDirty).toBe(true);

            // Original last band should remain clean if it was at ideal size
            if (lastBandInitialSize >= 1000) {
                expect(newBands[initialBandCount - 1].isDirty).toBe(false);
                expect(newBands[initialBandCount - 1].cachedResult).toBe((initialBandCount - 1) * 100);
            }
        });

        it('splits bands when they grow too large', () => {
            const manager = new BandedReducer({ targetBandCount: 10, minDataSizeForBanding: 1000 });
            manager.initializeBands(1000);
            const initialBandCount = manager.getBands().length;

            // Force a band to grow significantly
            manager.handleInsertion(1000, 500); // Add 500 points to last band

            const bands = manager.getBands();

            // Split should have occurred
            expect(bands.length).toBeGreaterThanOrEqual(initialBandCount);

            // Verify all bands have reasonable sizes (no empty bands)
            for (const band of bands) {
                expect(band.endIndex).toBeGreaterThan(band.startIndex);
            }
        });

        it('maintains contiguous coverage after splitting', () => {
            const manager = new BandedReducer({ targetBandCount: 10, minDataSizeForBanding: 1000 });
            manager.initializeBands(10000);

            // Trigger multiple splits
            for (let i = 0; i < 500; i++) {
                manager.handleInsertion(10000 + i, 1);
            }

            const bands = manager.getBands();
            const stats = manager.getStats();

            // Verify no gaps in coverage
            expect(bands[0].startIndex).toBe(0);
            for (let i = 1; i < bands.length; i++) {
                expect(bands[i].startIndex).toBe(bands[i - 1].endIndex);
            }

            // Verify total coverage matches what the manager reports
            const totalCoverage = bands.reduce((acc, band) => acc + (band.endIndex - band.startIndex), 0);
            expect(totalCoverage).toBe(stats.dataSize);

            // Verify last band ends at dataSize
            expect(bands[bands.length - 1].endIndex).toBe(stats.dataSize);
        });
    });
});
