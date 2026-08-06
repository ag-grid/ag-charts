type Interval = { start: number; end: number };

/**
 * Simple interval set data structure.
 *
 * This class has a preference for append ranges at the end. This is because when `dataSelection.ts` loops through
 * hit-tested nodes, it typically loops in a way that keeps the datum-indices ordered from smallest to largest (although
 * this is not actually guaranteed).
 *
 * There's no guarantee that none of the generated `values()` intervals overlap; This is intentional to avoid some
 * potentionally unnecessary mutations to the internal interval-set array.
 *
 * `start` and `end` are both inclusive.
 */
export class IntervalSet {
    private readonly intervals: Interval[] = [];

    add(start: number, end: number) {
        if (start > end) return;

        const intervals = this.intervals;

        // FAST PATH: empty
        if (intervals.length === 0) {
            intervals.push({ start, end });
            return;
        }

        // FAST PATH: extend / merge last interval (most common case)
        const last = intervals.at(-1)!;

        if (end + 1 < last.start) {
            // New interval is completely after last → append
            intervals.push({ start, end });
            return;
        } else if (start <= last.end + 1) {
            // Overlaps or touches last → merge into last
            last.start = Math.min(last.start, start);
            last.end = Math.max(last.end, end);
            return;
        }

        // SLOW PATH: insert somewhere earlier (rare)
        let newStart = start;
        let newEnd = end;
        let insertIndex = intervals.length;

        // Walk backwards to find merge/insert region
        for (let i = intervals.length - 1; i >= 0; i--) {
            const interval = intervals[i];

            if (interval.end + 1 < newStart) {
                // Found insertion point
                insertIndex = i + 1;
                break;
            }

            if (newEnd + 1 < interval.start) {
                // No overlap, keep moving left
                continue;
            }

            // Merge
            newStart = Math.min(newStart, interval.start);
            newEnd = Math.max(newEnd, interval.end);
            insertIndex = i;
        }

        // In-place replacement
        intervals.splice(insertIndex, intervals.length - insertIndex, {
            start: newStart,
            end: newEnd,
        });
    }

    has(index: number): boolean {
        // Iterate from the end (most likely place to find it)
        for (let i = this.intervals.length - 1; i >= 0; i--) {
            const interval = this.intervals[i];
            if (interval.start <= index && interval.end >= index) {
                return true;
            }
        }
        return false;
    }

    *values(): Iterable<Interval> {
        yield* this.intervals;
    }

    clear() {
        this.intervals.length = 0;
    }
}
