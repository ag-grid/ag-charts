import { describe, expect, it } from '@jest/globals';

import { type AggregationFilterBase, AggregationManager } from './aggregationManager';

interface MockFilter extends AggregationFilterBase {
    maxRange: number;
}

function createMockFilters(): MockFilter[] {
    return [{ maxRange: 100 }, { maxRange: 500 }, { maxRange: 1000 }];
}

function seedFilters(manager: AggregationManager<MockFilter>, dataLength: number): void {
    // Set _dataLength first (this discards any existing filters, which is fine for seeding).
    manager.markStale(dataLength);
    // Then populate filters via aggregate.
    manager.aggregate({ computeFull: () => createMockFilters(), targetRange: 0 });
}

describe('AggregationManager', () => {
    describe('markStale()', () => {
        it('should discard filters on large increase (1000 -> 5000)', () => {
            const manager = new AggregationManager<MockFilter>();
            seedFilters(manager, 1000);
            expect(manager.filters).toBeDefined();

            manager.markStale(5000);
            expect(manager.filters).toBeUndefined();
        });

        it('should discard filters on large decrease (10000 -> 1000)', () => {
            const manager = new AggregationManager<MockFilter>();
            seedFilters(manager, 10000);
            expect(manager.filters).toBeDefined();

            manager.markStale(1000);
            expect(manager.filters).toBeUndefined();
        });

        it('should preserve filters on small change (1000 -> 1200)', () => {
            const manager = new AggregationManager<MockFilter>();
            seedFilters(manager, 1000);
            expect(manager.filters).toBeDefined();

            manager.markStale(1200);
            expect(manager.filters).toBeDefined();
        });

        it('should discard filters on exact 2x boundary (1000 -> 2000)', () => {
            const manager = new AggregationManager<MockFilter>();
            seedFilters(manager, 1000);
            expect(manager.filters).toBeDefined();

            manager.markStale(2000);
            expect(manager.filters).toBeUndefined();
        });

        it('should discard filters on exact 0.5x boundary (2000 -> 1000)', () => {
            const manager = new AggregationManager<MockFilter>();
            seedFilters(manager, 2000);
            expect(manager.filters).toBeDefined();

            manager.markStale(1000);
            expect(manager.filters).toBeUndefined();
        });

        it('should discard filters on first call (initial state)', () => {
            const manager = new AggregationManager<MockFilter>();
            manager.aggregate({ computeFull: () => createMockFilters(), targetRange: 0 });
            expect(manager.filters).toBeDefined();

            manager.markStale(1000);
            expect(manager.filters).toBeUndefined();
        });

        it('should discard filters at every >=2x step in a multi-step drift sequence', () => {
            const manager = new AggregationManager<MockFilter>();

            // Step 1: initial seed at 1000
            seedFilters(manager, 1000);

            // Step 2: 1000 -> 10000 (10x increase) — must discard
            manager.aggregate({ computeFull: () => createMockFilters(), targetRange: 0 });
            manager.markStale(10000);
            expect(manager.filters).toBeUndefined();

            // Step 3: 10000 -> 1000 (10x decrease) — must discard
            manager.aggregate({ computeFull: () => createMockFilters(), targetRange: 0 });
            manager.markStale(1000);
            expect(manager.filters).toBeUndefined();

            // Step 4: 1000 -> 100000 (100x increase) — must discard
            manager.aggregate({ computeFull: () => createMockFilters(), targetRange: 0 });
            manager.markStale(100000);
            expect(manager.filters).toBeUndefined();

            // Step 5: 100000 -> 1000 (100x decrease) — must discard
            manager.aggregate({ computeFull: () => createMockFilters(), targetRange: 0 });
            manager.markStale(1000);
            expect(manager.filters).toBeUndefined();
        });

        it('should mark existing filters as stale on small change', () => {
            const manager = new AggregationManager<MockFilter>();
            seedFilters(manager, 1000);

            manager.markStale(1200);
            const filters = manager.filters as (MockFilter & { stale?: boolean })[];
            expect(filters).toBeDefined();
            expect(filters.every((f) => f.stale === true)).toBe(true);
        });
    });
});
