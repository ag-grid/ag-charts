import type { AgDataTransaction } from 'ag-charts-types';

import { Debug } from '../../util/debug';
import {
    applyRemoveByReference,
    findIndicesInOriginalArray,
    mapToCanonicalReferences,
    normaliseRemoveReferences,
} from './transactionUtils';

type DataTransaction<T> = AgDataTransaction<T>;

const debug = Debug.create(true, 'data-set');

/**
 * Describes what happens to a contiguous range of original indices.
 */
export type IndexSegment =
    | { type: 'preserved'; sourceStartIndex: number; count: number; destStartIndex: number }
    | { type: 'removed'; sourceStartIndex: number; count: number };

/**
 * Describes new items inserted into the final array (not from original array).
 */
export interface Insertion {
    /** Where in the final array this insertion occurs */
    destIndex: number;
    /** How many new items are inserted */
    count: number;
}

/**
 * Tracks transformations from original array indices to final array indices.
 * Enables efficient mapping and iteration over preserved/removed segments.
 */
export interface IndexTransformationMap {
    /** Original array length before any transactions */
    originalLength: number;

    /** Final array length after all transactions */
    finalLength: number;

    /**
     * Segments describing the fate of original indices.
     * Sorted by sourceStartIndex. Non-overlapping.
     */
    segments: IndexSegment[];

    /** New items to insert (not from original array), sorted by destIndex */
    insertions: Insertion[];
}

/**
 * Abstract description of changes to be applied to source data.
 * Provides precise index mapping for optimized incremental updates.
 */
export interface DataChangeDescription {
    /** Map from original to final indices */
    indexMap: IndexTransformationMap;

    /** Get all indices that were removed from the original array */
    getRemovedIndices(): number[];

    /** Iterate over all preserved segments */
    forEachPreservedSegment(callback: (segment: Extract<IndexSegment, { type: 'preserved' }>) => void): void;
}

/**
 * Encapsulates chart data with support for transactional updates.
 *
 * DataSet wraps a raw data array and manages pending transactions (append, prepend, remove operations)
 * that can be committed incrementally for high-performance data updates.
 *
 * @example
 * ```typescript
 * // Create a DataSet from raw data
 * const dataSet = new DataSet([{ x: 1, y: 2 }, { x: 2, y: 4 }]);
 *
 * // Apply transactions
 * dataSet.addTransaction({ append: [{ x: 3, y: 6 }] });
 * dataSet.commitPendingTransactions();
 * ```
 */
export class DataSet<T = unknown> {
    public readonly data: T[];
    private readonly pendingTransactions: DataTransaction<T>[];

    private cachedChangeDescription?: DataChangeDescription;

    constructor(data: T[], pendingTransactions: DataTransaction<T>[] = []) {
        this.data = data;
        this.pendingTransactions = pendingTransactions;
    }

    /**
     * Adds a new transaction to the pending queue.
     * Automatically invalidates the change description cache.
     */
    addTransaction(transaction: DataTransaction<T>): void {
        this.pendingTransactions.push(transaction);
        this.cachedChangeDescription = undefined;
    }

    /**
     * Wraps raw data array in a DataSet, or returns undefined if data is null/undefined.
     */
    static wrap<T>(data?: T[]): DataSet<T> | undefined {
        if (data == null) return undefined;
        return new DataSet<T>(data);
    }

    /**
     * Creates an empty DataSet with no data.
     */
    static empty<T = unknown>(): DataSet<T> {
        return new DataSet<T>([]);
    }

    /**
     * Type guard to check if a value is a DataSet instance.
     */
    static isDataSet(value: unknown): value is DataSet<any> {
        return value instanceof DataSet;
    }

    /**
     * Returns the net size of the data after applying all pending transactions.
     * This calculates the final data length without mutating the underlying array.
     *
     * Note: This assumes transactions don't have duplicate updates in a single transaction
     * (e.g. removing or adding the same item multiple times).
     */
    netSize(): number {
        if (!this.hasPendingTransactions()) {
            return this.data.length;
        }

        let netLength = this.data.length;

        for (const transaction of this.pendingTransactions) {
            const removeRefs = normaliseRemoveReferences(transaction.remove);
            netLength -= removeRefs.length;

            if (Array.isArray(transaction.prepend)) {
                netLength += transaction.prepend.length;
            }
            if (Array.isArray(transaction.append)) {
                netLength += transaction.append.length;
            }
        }

        return Math.max(0, netLength);
    }

    /**
     * Checks if there are any pending transactions waiting to be committed.
     */
    hasPendingTransactions(): boolean {
        return this.pendingTransactions.length > 0;
    }

    /**
     * Commits all pending transactions by applying them to the underlying data array in-place.
     * This mutates the data array and clears the pending transactions queue.
     *
     * Transactions are applied in order: remove, then prepend, then append.
     */
    commitPendingTransactions(): void {
        if (!this.hasPendingTransactions()) {
            return;
        }

        const beforeLength = this.data.length;
        if (debug.check()) {
            debug('DataSet.commitPendingTransactions() - starting', { beforeLength });
        }

        for (const transaction of this.pendingTransactions) {
            const { prepend, append } = transaction;
            if (Array.isArray(prepend) && prepend.length) {
                this.data.unshift(...prepend);
            }
            if (Array.isArray(append) && append.length) {
                this.data.push(...append);
            }

            const removeRefs = normaliseRemoveReferences(transaction.remove);
            if (removeRefs.length > 0) {
                const canonical = mapToCanonicalReferences(this.data, removeRefs);
                if (debug.check()) {
                    debug('DataSet.commitPendingTransactions() - removing rows', {
                        requested: removeRefs.length,
                        canonical: canonical.length,
                    });
                }
                applyRemoveByReference(this.data, canonical);
            }
        }

        this.pendingTransactions.length = 0;
        this.cachedChangeDescription = undefined;

        if (debug.check()) {
            debug('DataSet.commitPendingTransactions() - final length', { afterLength: this.data.length });
        }
    }

    merge(data: T[]): DataSet<T> {
        return this.data === data ? this : new DataSet<T>(data);
    }

    /**
     * Returns an abstract description of the changes represented by pending transactions.
     * The result is cached until pendingTransactions is modified.
     *
     * @returns Change description with precise index mapping, or undefined if no pending transactions.
     */
    getChangeDescription(): DataChangeDescription | undefined {
        // Return cached result if available
        if (this.cachedChangeDescription != null) {
            return this.cachedChangeDescription;
        }

        if (!this.hasPendingTransactions()) {
            return undefined;
        }

        // Build the index transformation map
        const indexMap = this.buildIndexMap();

        // Create the change description with helper methods
        const changeDescription: DataChangeDescription = {
            indexMap,

            getRemovedIndices(): number[] {
                const removed: number[] = [];
                for (const segment of indexMap.segments) {
                    if (segment.type === 'removed') {
                        for (let i = 0; i < segment.count; i++) {
                            removed.push(segment.sourceStartIndex + i);
                        }
                    }
                }
                return removed;
            },

            forEachPreservedSegment(callback: (segment: Extract<IndexSegment, { type: 'preserved' }>) => void): void {
                for (const segment of indexMap.segments) {
                    if (segment.type === 'preserved') {
                        callback(segment);
                    }
                }
            },
        };

        this.cachedChangeDescription = changeDescription;
        return changeDescription;
    }

    /**
     * Builds the index transformation map by sequentially applying all pending transactions.
     */
    private buildIndexMap(): IndexTransformationMap {
        const originalLength = this.data.length;
        let segments: IndexSegment[] = [
            { type: 'preserved', sourceStartIndex: 0, count: originalLength, destStartIndex: 0 },
        ];
        const insertions: Insertion[] = [];
        let currentLength = originalLength;

        for (const transaction of this.pendingTransactions) {
            // 1. Apply prepends: Insert at beginning, shift everything right
            if (Array.isArray(transaction.prepend) && transaction.prepend.length > 0) {
                const count = transaction.prepend.length;
                insertions.push({ destIndex: 0, count });
                this.shiftSegmentsRight(segments, 0, count);
                currentLength += count;
            }

            // 2. Apply appends: Insert at current end
            if (Array.isArray(transaction.append) && transaction.append.length > 0) {
                const count = transaction.append.length;
                insertions.push({ destIndex: currentLength, count });
                currentLength += count;
            }

            // 3. Apply removes: Find indices, split segments, mark removed
            const removeRefs = normaliseRemoveReferences(transaction.remove);
            if (removeRefs.length > 0) {
                const canonical = mapToCanonicalReferences(this.data, removeRefs);
                const indicesToRemove = findIndicesInOriginalArray(this.data, canonical);

                segments = this.applyRemovals(segments, indicesToRemove);
                currentLength -= indicesToRemove.length;
            }
        }

        return {
            originalLength,
            finalLength: currentLength,
            segments: this.mergeAdjacentSegments(segments),
            insertions: this.sortInsertions(insertions),
        };
    }

    /**
     * Shifts all segment destination indices right by a given amount starting from a position.
     */
    private shiftSegmentsRight(segments: IndexSegment[], fromDestIndex: number, shiftAmount: number): void {
        for (const segment of segments) {
            if (segment.type === 'preserved' && segment.destStartIndex >= fromDestIndex) {
                segment.destStartIndex += shiftAmount;
            }
        }
    }

    /**
     * Applies removals to segments by splitting and marking removed ranges.
     */
    private applyRemovals(segments: IndexSegment[], indicesToRemove: number[]): IndexSegment[] {
        if (indicesToRemove.length === 0) {
            return segments;
        }

        const newSegments: IndexSegment[] = [];
        let removeIndex = 0;
        let destOffset = 0; // Track cumulative shift left due to removals

        for (const segment of segments) {
            if (segment.type === 'removed') {
                newSegments.push(segment);
                continue;
            }

            // For preserved segments, check if any removals fall within
            const sourceEnd = segment.sourceStartIndex + segment.count;
            const relevantRemovals: number[] = [];

            while (removeIndex < indicesToRemove.length && indicesToRemove[removeIndex] < sourceEnd) {
                const idx = indicesToRemove[removeIndex];
                if (idx >= segment.sourceStartIndex) {
                    relevantRemovals.push(idx);
                }
                removeIndex++;
            }

            if (relevantRemovals.length === 0) {
                // No removals in this segment, just adjust destination
                newSegments.push({
                    type: 'preserved',
                    sourceStartIndex: segment.sourceStartIndex,
                    count: segment.count,
                    destStartIndex: segment.destStartIndex - destOffset,
                });
            } else {
                // Split segment around removals
                let currentSource = segment.sourceStartIndex;
                let currentDest = segment.destStartIndex - destOffset;

                for (const removalIdx of relevantRemovals) {
                    // Add preserved segment before removal (if any)
                    if (currentSource < removalIdx) {
                        newSegments.push({
                            type: 'preserved',
                            sourceStartIndex: currentSource,
                            count: removalIdx - currentSource,
                            destStartIndex: currentDest,
                        });
                        currentDest += removalIdx - currentSource;
                    }

                    // Add removed segment
                    newSegments.push({
                        type: 'removed',
                        sourceStartIndex: removalIdx,
                        count: 1,
                    });

                    destOffset += 1;
                    currentSource = removalIdx + 1;
                }

                // Add any remaining preserved portion after last removal
                if (currentSource < sourceEnd) {
                    newSegments.push({
                        type: 'preserved',
                        sourceStartIndex: currentSource,
                        count: sourceEnd - currentSource,
                        destStartIndex: currentDest,
                    });
                }
            }
        }

        return newSegments;
    }

    /**
     * Merges adjacent preserved segments with contiguous source and dest ranges.
     */
    private mergeAdjacentSegments(segments: IndexSegment[]): IndexSegment[] {
        if (segments.length <= 1) {
            return segments;
        }

        const merged: IndexSegment[] = [];
        let current = segments[0];

        for (let i = 1; i < segments.length; i++) {
            const next = segments[i];

            // Can only merge two preserved segments
            if (
                current.type === 'preserved' &&
                next.type === 'preserved' &&
                current.sourceStartIndex + current.count === next.sourceStartIndex &&
                current.destStartIndex + current.count === next.destStartIndex
            ) {
                // Merge into current
                current = {
                    type: 'preserved',
                    sourceStartIndex: current.sourceStartIndex,
                    count: current.count + next.count,
                    destStartIndex: current.destStartIndex,
                };
            } else {
                merged.push(current);
                current = next;
            }
        }

        merged.push(current);
        return merged;
    }

    /**
     * Sorts insertions by destination index.
     */
    private sortInsertions(insertions: Insertion[]): Insertion[] {
        return insertions.sort((a, b) => a.destIndex - b.destIndex);
    }
}
