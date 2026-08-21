export type Bit = 0 | 1;

// `index >>> 5` gives the word offset (divide by 32); `index & 31` gives the bit offset (modulo 32).

export class Bitfield {
    private readonly buffer: Uint32Array;

    constructor(readonly length: number) {
        this.buffer = new Uint32Array(Math.ceil(length / 32));
    }

    clear(): void {
        this.buffer.fill(0);
    }

    getBit(index: number): Bit {
        return ((this.buffer[index >>> 5] >>> (index & 31)) & 1) as Bit;
    }

    setBit(index: number): void {
        this.buffer[index >>> 5] |= 1 << (index & 31);
    }

    unsetBit(index: number): void {
        this.buffer[index >>> 5] &= ~(1 << (index & 31));
    }

    toggleBit(index: number): void {
        this.buffer[index >>> 5] ^= 1 << (index & 31);
    }

    fill(value: Bit, startIndex: number, endIndex: number): void {
        if (startIndex >= endIndex) return;

        const startWord = startIndex >>> 5;
        const startBit = startIndex & 31;
        const endWord = endIndex >>> 5;
        const endBit = endIndex & 31;

        if (startWord === endWord) {
            // Create mask of all the bits that need to be set
            // (e.g. mask = 00...01110 for startBit=1, endBit=4).
            const mask = ((1 << (endBit - startBit)) - 1) << startBit;
            if (value) {
                this.buffer[startWord] |= mask;
            } else {
                this.buffer[startWord] &= ~mask;
            }
            return;
        }

        /**
         * There's three parts to fill up:
         *
         * [ partial start ][ full words ][ partial end ]
         *
         * Partial start/end can be empty if startIndex and endIndex are multiples of 32 respectively.
         */

        // Fill start word, partial (startBit!=0) or full (startBit==0)
        const startMask = 0xffffffff << startBit;
        if (value) {
            this.buffer[startWord] |= startMask;
        } else {
            this.buffer[startWord] &= ~startMask;
        }

        // Fill intermediate full-words quickly:
        this.buffer.fill(0xffffffff * value, startWord + 1, endWord);

        // Fill end word
        const endMask = (1 << endBit) - 1;
        if (value) {
            this.buffer[endWord] |= endMask;
        } else {
            this.buffer[endWord] &= ~endMask;
        }
    }
}
