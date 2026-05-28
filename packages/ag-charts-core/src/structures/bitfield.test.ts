import { Bitfield } from './bitfield';
import type { Bit } from './bitfield';

describe('Bitfield (larger scale tests)', () => {
    test('length', () => {
        const bf = new Bitfield(2048);
        expect(bf.length).toBe(2048);
    });

    test('unaligned length', () => {
        const bf = new Bitfield(100);
        expect(bf.length).toBe(100);
    });

    test('initial state is all zeros', () => {
        const bf = new Bitfield(2048);

        for (let i = 0; i < bf.length; i++) {
            expect(bf.getBit(i)).toBe(0);
        }
    });

    test('setBit / getBit across full range', () => {
        const bf = new Bitfield(2048);

        for (let i = 0; i < bf.length; i += 3) {
            bf.setBit(i);
        }

        for (let i = 0; i < bf.length; i++) {
            const expected = i % 3 === 0 ? 1 : 0;
            expect(bf.getBit(i)).toBe(expected as Bit);
        }
    });

    test('unsetBit clears correctly across words', () => {
        const bf = new Bitfield(2024);

        // set everything
        for (let i = 0; i < bf.length; i++) {
            bf.setBit(i);
        }

        // clear every 4th bit
        for (let i = 0; i < bf.length; i += 4) {
            bf.unsetBit(i);
        }

        for (let i = 0; i < bf.length; i++) {
            const expected = i % 4 === 0 ? 0 : 1;
            expect(bf.getBit(i)).toBe(expected as Bit);
        }
    });

    test('toggleBit behaves consistently over large range', () => {
        const bf = new Bitfield(2048);

        for (let i = 0; i < bf.length; i++) {
            if (i % 7 === 0) bf.toggleBit(i);
        }

        for (let i = 0; i < bf.length; i++) {
            const expected = i % 7 === 0 ? 1 : 0;
            expect(bf.getBit(i)).toBe(expected as Bit);
        }

        // toggle again → should all be zero
        for (let i = 0; i < bf.length; i++) {
            if (i % 7 === 0) bf.toggleBit(i);
        }

        for (let i = 0; i < bf.length; i++) {
            expect(bf.getBit(i)).toBe(0);
        }
    });

    test('fill (aligned large range)', () => {
        const bf = new Bitfield(2048);

        bf.fill(1, 64, 1024); // aligned on word boundaries

        for (let i = 0; i < bf.length; i++) {
            const expected = i >= 64 && i < 1024 ? 1 : 0;
            expect(bf.getBit(i)).toBe(expected as Bit);
        }
    });

    test('fill (unaligned large range across many words)', () => {
        const bf = new Bitfield(2048);

        bf.fill(1, 13, 1900);

        for (let i = 0; i < bf.length; i++) {
            const expected = i >= 13 && i < 1900 ? 1 : 0;
            expect(bf.getBit(i)).toBe(expected as Bit);
        }
    });

    test('fill clear large region inside set region', () => {
        const bf = new Bitfield(2048);

        bf.fill(1, 0, bf.length);
        bf.fill(0, 300, 1700);

        for (let i = 0; i < bf.length; i++) {
            const expected = i < 300 || i >= 1700 ? 1 : 0;
            expect(bf.getBit(i)).toBe(expected as Bit);
        }
    });

    test('multiple overlapping fills', () => {
        const bf = new Bitfield(2048);

        bf.fill(1, 100, 1500);
        bf.fill(1, 400, 1800);
        bf.fill(0, 1200, 1300);

        for (let i = 0; i < bf.length; i++) {
            let expected = 0;

            if ((i >= 100 && i < 1500) || (i >= 400 && i < 1800)) {
                expected = 1;
            }

            if (i >= 1200 && i < 1300) {
                expected = 0;
            }

            expect(bf.getBit(i)).toBe(expected as Bit);
        }
    });

    test('boundary stress: crossing many word boundaries', () => {
        const SIZE = 2048;
        const bf = new Bitfield(2048);

        // spans many Uint32 words with messy alignment
        bf.fill(1, 7, SIZE - 13);

        for (let i = 0; i < bf.length; i++) {
            const expected = i >= 7 && i < SIZE - 13 ? 1 : 0;
            expect(bf.getBit(i)).toBe(expected as Bit);
        }
    });
});
