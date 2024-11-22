const MIN = 0;
const MAX = 1;
const SPAN = 2;

export class RangeLookup {
    private readonly maxLevelSize: number;
    private readonly buffer: Float64Array;

    constructor(allValues: number[][]) {
        const dataLength = allValues.reduce((acc, v) => Math.max(acc, v.length), 0);
        const sizePower = 32 - Math.clz32(dataLength);
        let maxLevelSize = 1 << sizePower;
        if (dataLength === maxLevelSize / 2) {
            maxLevelSize = maxLevelSize >>> 1;
        }
        this.maxLevelSize = maxLevelSize;

        const buffer = new Float64Array((maxLevelSize * 2 - 1) * 2).fill(NaN);

        for (const values of allValues) {
            for (let i = 0; i < values.length; i += 1) {
                const value = Number(values[i]);
                const bufferIndex = maxLevelSize + i - 1;
                const bufferMinIndex = ((bufferIndex * SPAN) | 0) + MIN;
                const bufferMaxIndex = ((bufferIndex * SPAN) | 0) + MAX;
                const prevMinValue = buffer[bufferMinIndex];
                const prevMaxValue = buffer[bufferMaxIndex];
                if (!Number.isFinite(prevMinValue) || value < prevMinValue) {
                    buffer[bufferMinIndex] = value;
                }
                if (!Number.isFinite(prevMaxValue) || value > prevMaxValue) {
                    buffer[bufferMaxIndex] = value;
                }
            }
        }

        for (let size = (maxLevelSize / 2) | 0; size >= 1; size = (size / 2) | 0) {
            const start = (size - 1) | 0;
            const end = (start + size) | 0;
            for (let i = 0; i < size; i += 1) {
                const nodeIndex = start + i;
                const leftIndex = end + i * 2;
                const rightIndex = leftIndex + 1;

                const aMin = buffer[((leftIndex * SPAN) | 0) + MIN];
                const bMin = buffer[((rightIndex * SPAN) | 0) + MIN];
                buffer[((nodeIndex * SPAN) | 0) + MIN] = !Number.isFinite(bMin) || aMin < bMin ? aMin : bMin;

                const aMax = buffer[((leftIndex * SPAN) | 0) + MAX];
                const bMax = buffer[((rightIndex * SPAN) | 0) + MAX];
                buffer[((nodeIndex * SPAN) | 0) + MAX] = !Number.isFinite(bMax) || aMax > bMax ? aMax : bMax;
            }
        }

        this.buffer = buffer;
    }

    private computeRangeInto(
        buffer: Float64Array,
        start: number,
        end: number,
        bufferIndex: number,
        currentStart: number,
        step: number,
        into: [number, number]
    ) {
        const currentEnd = currentStart + step - 1;

        if (currentEnd < start || currentStart > end) return into;

        if (currentStart >= start && currentEnd <= end) {
            const min = buffer[((bufferIndex * SPAN) | 0) + MIN];
            const max = buffer[((bufferIndex * SPAN) | 0) + MAX];
            if (Number.isFinite(min)) into[0] = Math.min(into[0], min);
            if (Number.isFinite(max)) into[1] = Math.max(into[1], max);
        } else if (step > 1) {
            bufferIndex = (bufferIndex * 2) | 0;
            step = (step / 2) | 0;
            this.computeRangeInto(buffer, start, end, (bufferIndex + 1) | 0, currentStart, step, into);
            this.computeRangeInto(buffer, start, end, (bufferIndex + 2) | 0, currentStart + step, step, into);
        }

        return into;
    }

    rangeBetween(start: number, end: number) {
        const { maxLevelSize, buffer } = this;
        const range: [number, number] = [Infinity, -Infinity];
        this.computeRangeInto(buffer, start, end, 0, 0, maxLevelSize, range);
        return range;
    }

    get range(): [number, number] {
        const { buffer } = this;
        return [buffer[MIN], buffer[MAX]];
    }
}
