type Interval = { start: number; end: number };

export class IntervalSet {
    private intervals: Interval[] = [];

    add(start: number, end: number) {
        if (start > end) return;

        let newStart = start;
        let newEnd = end;

        const result: Interval[] = [];
        let inserted = false;

        // Iterate from the end (more likely insertion point)
        for (let i = this.intervals.length - 1; i >= 0; i--) {
            const interval = this.intervals[i];

            if (interval.end + 1 < newStart) {
                // Completely before new interval (no overlap)
                result.push(interval);
            } else if (newEnd + 1 < interval.start) {
                // Completely after new interval (no overlap)
                if (!inserted) {
                    result.push({ start: newStart, end: newEnd });
                    inserted = true;
                }
                result.push(interval);
            } else {
                // Overlapping or adjacent → merge
                newStart = Math.min(newStart, interval.start);
                newEnd = Math.max(newEnd, interval.end);
            }
        }

        if (!inserted) {
            result.push({ start: newStart, end: newEnd });
        }

        this.intervals = result;
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
