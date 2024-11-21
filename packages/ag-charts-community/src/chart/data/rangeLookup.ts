const minIndex = (i: number) => i * 2;
const maxIndex = (i: number) => i * 2 + 1;

export class RangeLookup {
    private readonly maxLevelSize: number;
    private buffer: Float64Array | undefined = undefined;

    constructor(private readonly values: { highValues: number[]; lowValues: number[] }) {
        const { highValues } = values;
        const sizePower = 32 - Math.clz32(highValues.length);
        let maxLevelSize = 1 << sizePower;
        if (highValues.length === maxLevelSize / 2) {
            maxLevelSize = maxLevelSize >>> 1;
        }
        this.maxLevelSize = maxLevelSize;
    }

    private getBuffer() {
        let { buffer } = this;
        if (buffer != null) return buffer;

        const {
            maxLevelSize,
            values: { highValues, lowValues },
        } = this;

        buffer = new Float64Array((maxLevelSize * 2 - 1) * 2).fill(NaN);

        for (let i = 0; i < lowValues.length; i += 1) {
            buffer[minIndex(maxLevelSize + i - 1)] = Number(lowValues[i]);
        }
        for (let i = 0; i < highValues.length; i += 1) {
            buffer[maxIndex(maxLevelSize + i - 1)] = Number(highValues[i]);
        }

        for (let size = (maxLevelSize / 2) | 0; size >= 1; size = (size / 2) | 0) {
            const start = (size - 1) | 0;
            const end = (start + size) | 0;
            for (let i = 0; i < size; i += 1) {
                const nodeIndex = start + i;
                const leftIndex = end + i * 2;
                const rightIndex = leftIndex + 1;

                const aMin = buffer[minIndex(leftIndex)];
                const bMin = buffer[minIndex(rightIndex)];
                buffer[minIndex(nodeIndex)] = !Number.isFinite(bMin) || aMin < bMin ? aMin : bMin;

                const aMax = buffer[maxIndex(leftIndex)];
                const bMax = buffer[maxIndex(rightIndex)];
                buffer[maxIndex(nodeIndex)] = !Number.isFinite(bMax) || aMax > bMax ? aMax : bMax;
            }
        }

        this.buffer = buffer;

        return buffer;
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
            const min = buffer[minIndex(bufferIndex)];
            const max = buffer[maxIndex(bufferIndex)];
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
        const { maxLevelSize } = this;
        const range: [number, number] = [Infinity, -Infinity];
        const buffer = this.getBuffer();
        this.computeRangeInto(buffer, start, end, 0, 0, maxLevelSize, range);
        return range;
    }

    get range(): [number, number] {
        const buffer = this.getBuffer();
        return [buffer[minIndex(0)], buffer[maxIndex(0)]];
    }
}
