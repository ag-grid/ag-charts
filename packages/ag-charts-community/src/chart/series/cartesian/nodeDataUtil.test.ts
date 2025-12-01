import { describe, expect, it } from '@jest/globals';

import {
    computeBandwidthOffset,
    computeScaleRange,
    computeVisibleRangeWithBypass,
    resolveIncrementalUpdateState,
    trimIncrementalNodes,
    updateSpanPoints,
} from './nodeDataUtil';

describe('nodeDataUtil', () => {
    describe('computeScaleRange', () => {
        it('should compute range from positive values', () => {
            expect(computeScaleRange({ range: [0, 800] })).toBe(800);
        });

        it('should compute range with negative start', () => {
            expect(computeScaleRange({ range: [-100, 700] })).toBe(800);
        });

        it('should compute range when reversed (end < start)', () => {
            expect(computeScaleRange({ range: [800, 0] })).toBe(800);
        });

        it('should return 0 for equal values', () => {
            expect(computeScaleRange({ range: [400, 400] })).toBe(0);
        });
    });

    describe('computeBandwidthOffset', () => {
        it('should return half of bandwidth', () => {
            expect(computeBandwidthOffset({ bandwidth: 40 })).toBe(20);
        });

        it('should return 0 when no bandwidth', () => {
            expect(computeBandwidthOffset({})).toBe(0);
        });

        it('should return 0 when bandwidth is undefined', () => {
            expect(computeBandwidthOffset({ bandwidth: undefined })).toBe(0);
        });

        it('should return 0 when bandwidth is 0', () => {
            expect(computeBandwidthOffset({ bandwidth: 0 })).toBe(0);
        });
    });

    describe('resolveIncrementalUpdateState', () => {
        it('should enable incremental updates when both conditions met', () => {
            const existingNodes = [{ x: 1 }, { x: 2 }];
            const result = resolveIncrementalUpdateState({ type: 'update' }, existingNodes);
            expect(result.canIncrementallyUpdate).toBe(true);
            expect(result.nodes).toBe(existingNodes); // Same reference
        });

        it('should disable when changeDescription is null', () => {
            const existingNodes = [{ x: 1 }];
            const result = resolveIncrementalUpdateState(null, existingNodes);
            expect(result.canIncrementallyUpdate).toBe(false);
            expect(result.nodes).toEqual([]);
        });

        it('should disable when existingNodeData is undefined', () => {
            const result = resolveIncrementalUpdateState({ type: 'update' }, undefined);
            expect(result.canIncrementallyUpdate).toBe(false);
            expect(result.nodes).toEqual([]);
        });

        it('should disable when both are missing', () => {
            const result = resolveIncrementalUpdateState(null, undefined);
            expect(result.canIncrementallyUpdate).toBe(false);
            expect(result.nodes).toEqual([]);
        });

        it('should work with empty existing array', () => {
            const existingNodes: object[] = [];
            const result = resolveIncrementalUpdateState({}, existingNodes);
            expect(result.canIncrementallyUpdate).toBe(true);
            expect(result.nodes).toBe(existingNodes);
        });
    });

    describe('computeVisibleRangeWithBypass', () => {
        it('should bypass for small datasets (< 1000)', () => {
            const result = computeVisibleRangeWithBypass([100, 200], 500);
            expect(result).toEqual([0, 500]);
        });

        it('should bypass at threshold boundary (999)', () => {
            const result = computeVisibleRangeWithBypass([100, 200], 999);
            expect(result).toEqual([0, 999]);
        });

        it('should use visible range for large datasets (>= 1000)', () => {
            const result = computeVisibleRangeWithBypass([100, 200], 1000);
            expect(result).toEqual([100, 200]);
        });

        it('should apply padding for large datasets', () => {
            const result = computeVisibleRangeWithBypass([100, 200], 1000, 10);
            expect(result).toEqual([90, 210]);
        });

        it('should clamp padding to 0 at start', () => {
            const result = computeVisibleRangeWithBypass([5, 200], 1000, 10);
            expect(result).toEqual([0, 210]);
        });

        it('should clamp padding to totalCount at end', () => {
            const result = computeVisibleRangeWithBypass([100, 995], 1000, 10);
            expect(result).toEqual([90, 1000]);
        });

        it('should handle zero padding explicitly', () => {
            const result = computeVisibleRangeWithBypass([100, 200], 2000, 0);
            expect(result).toEqual([100, 200]);
        });
    });

    describe('trimIncrementalNodes', () => {
        it('should trim array when nodeIndex is less than length', () => {
            const nodes = [1, 2, 3, 4, 5];
            trimIncrementalNodes(true, nodes, 3);
            expect(nodes).toEqual([1, 2, 3]);
        });

        it('should not trim when canIncrementallyUpdate is false', () => {
            const nodes = [1, 2, 3, 4, 5];
            trimIncrementalNodes(false, nodes, 3);
            expect(nodes).toEqual([1, 2, 3, 4, 5]);
        });

        it('should not trim when nodeIndex equals length', () => {
            const nodes = [1, 2, 3];
            trimIncrementalNodes(true, nodes, 3);
            expect(nodes).toEqual([1, 2, 3]);
        });

        it('should not trim when nodeIndex is greater than length', () => {
            const nodes = [1, 2, 3];
            trimIncrementalNodes(true, nodes, 5);
            expect(nodes).toEqual([1, 2, 3]);
        });

        it('should handle empty array', () => {
            const nodes: number[] = [];
            trimIncrementalNodes(true, nodes, 0);
            expect(nodes).toEqual([]);
        });
    });

    describe('updateSpanPoints', () => {
        it('should start a new span with first point', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [];
            updateSpanPoints(spanPoints, { x: 1 }, false);
            expect(spanPoints).toEqual([[{ x: 1 }]]);
        });

        it('should add point to existing span', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [[{ x: 1 }]];
            updateSpanPoints(spanPoints, { x: 2 }, false);
            expect(spanPoints).toEqual([[{ x: 1 }, { x: 2 }]]);
        });

        it('should start new span after a break', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [[{ x: 1 }], { skip: 1 }];
            updateSpanPoints(spanPoints, { x: 2 }, false);
            expect(spanPoints).toEqual([[{ x: 1 }], { skip: 1 }, [{ x: 2 }]]);
        });

        it('should add break when point is undefined and not connecting missing data', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [[{ x: 1 }]];
            updateSpanPoints(spanPoints, undefined, false);
            expect(spanPoints).toEqual([[{ x: 1 }], { skip: 0 }]);
        });

        it('should increment skip counter for consecutive missing data', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [[{ x: 1 }], { skip: 0 }];
            updateSpanPoints(spanPoints, undefined, false);
            expect(spanPoints).toEqual([[{ x: 1 }], { skip: 1 }]);
        });

        it('should not add break when connectMissingData is true', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [[{ x: 1 }]];
            updateSpanPoints(spanPoints, undefined, true);
            expect(spanPoints).toEqual([[{ x: 1 }]]);
        });

        it('should handle null point same as undefined', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [[{ x: 1 }]];
            updateSpanPoints(spanPoints, null, false);
            expect(spanPoints).toEqual([[{ x: 1 }], { skip: 0 }]);
        });

        it('should start break when spanPoints is empty', () => {
            const spanPoints: Array<{ x: number }[] | { skip: number }> = [];
            updateSpanPoints(spanPoints, undefined, false);
            expect(spanPoints).toEqual([{ skip: 0 }]);
        });
    });
});
