import { describe, expect, it } from '@jest/globals';

import { BandManager } from './bandManager';

describe('BandManager', () => {
    it('creates a single band for small datasets', () => {
        const manager = new BandManager();
        manager.initializeBands(500);

        const bands = manager.getBands();
        expect(bands).toHaveLength(1);
        expect(bands[0]).toMatchObject({ startIndex: 0, endIndex: 500, isDirty: true });
    });

    it('splits large datasets into multiple contiguous bands', () => {
        const manager = new BandManager({ minDataSizeForBanding: 100, targetBandCount: 4 });
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
        const manager = new BandManager({ minDataSizeForBanding: 100, targetBandCount: 4 });
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
        const manager = new BandManager({ minDataSizeForBanding: 100, targetBandCount: 4 });
        manager.initializeBands(400);
        manager.getBands().forEach((band) => (band.isDirty = false));

        manager.handleRemoval(50, 80);

        const dirtyBands = manager.getBands().filter((band) => band.isDirty);
        expect(dirtyBands.length).toBeGreaterThan(0);
        expect(manager.getBands()[0].startIndex).toBe(0);
        const totalCoverage = manager.getBands().reduce((acc, band) => acc + (band.endIndex - band.startIndex), 0);
        expect(totalCoverage).toBe(320);
    });

    it('reports efficient dirty ratios for rolling window updates', () => {
        const manager = new BandManager({ targetBandCount: 10 });
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
});
