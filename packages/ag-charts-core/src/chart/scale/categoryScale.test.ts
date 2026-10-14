import { describe, expect, test } from 'vitest';

import { CategoryScale } from './categoryScale';
import { GroupedCategoryScale } from './groupedCategoryScale';

describe('CategoryScale', () => {
    test('initial state', () => {
        const scale = new CategoryScale();

        expect(scale.domain).toEqual([]);
        expect(scale.range).toEqual([0, 1]);
        expect(scale.paddingInner).toBe(0);
        expect(scale.paddingOuter).toBe(0);
        expect(scale.padding).toBe(0);
    });

    test('no implicit domain construction', () => {
        const scale = new CategoryScale();

        expect(scale.convert('B')).toBe(Number.NaN);
        expect(scale.convert('C')).toBe(Number.NaN);
        expect(scale.convert('A')).toBe(Number.NaN);

        expect(scale.domain).toEqual([]);
    });

    test('basic band scale', () => {
        const scale = new CategoryScale();

        scale.domain = ['A', 'B', 'C', 'D', 'E'];
        scale.range = [0, 500];

        expect(scale.convert('A')).toBe(0);
        expect(scale.convert('B')).toBe(100);
        expect(scale.convert('C')).toBe(200);
        expect(scale.convert('D')).toBe(300);
        expect(scale.convert('E')).toBe(400);

        expect(scale.bandwidth).toBe(100);
    });

    test('date band scale', () => {
        const scale = new CategoryScale();

        scale.domain = [new Date('2020'), new Date('2021'), new Date('2022'), new Date('2023'), new Date('2024')];
        scale.range = [0, 500];

        expect(scale.convert(new Date('2020'))).toBe(0);
        expect(scale.convert(new Date('2021'))).toBe(100);
        expect(scale.convert(new Date('2022'))).toBe(200);
        expect(scale.convert(new Date('2023'))).toBe(300);
        expect(scale.convert(new Date('2024'))).toBe(400);

        expect(scale.bandwidth).toBe(100);
    });

    test('inner padding', () => {
        const scale = new CategoryScale();

        scale.domain = ['A', 'B', 'C', 'D', 'E'];
        scale.range = [0, 500];
        scale.paddingInner = 1;

        expect(scale.convert('A')).toBe(0);
        expect(scale.convert('B')).toBe(125);
        expect(scale.convert('C')).toBe(250);
        expect(scale.convert('D')).toBe(375);
        expect(scale.convert('E')).toBe(500);
    });

    test('inner padding with single value', () => {
        const scale = new CategoryScale();

        scale.domain = ['A'];
        scale.range = [0, 500];
        scale.paddingInner = 0.5;

        expect(scale.convert('A')).toBe(0);
    });

    test('outer padding', () => {
        const scale = new CategoryScale();

        scale.domain = ['A', 'B', 'C', 'D', 'E'];
        scale.range = [0, 500];
        scale.paddingOuter = 0.06;

        expect(scale.convert('A')).toBe(5.859375);
        expect(scale.convert('B')).toBe(103.515625);
        expect(scale.convert('C')).toBe(201.171875);
        expect(scale.convert('D')).toBe(298.828125);
        expect(scale.convert('E')).toBe(396.484375);
    });

    test('padding', () => {
        const scale = new CategoryScale();

        scale.domain = ['A', 'B', 'C', 'D', 'E'];
        scale.range = [0, 500];
        scale.paddingInner = 1;
        scale.paddingOuter = 0.5;

        expect(scale.convert('A')).toBe(50);
        expect(scale.convert('B')).toBe(150);
        expect(scale.convert('C')).toBe(250);
        expect(scale.convert('D')).toBe(350);
        expect(scale.convert('E')).toBe(450);

        expect(scale.bandwidth).toBe(0);
    });

    test('round', () => {
        const scale = new CategoryScale();

        scale.domain = ['A', 'B', 'C', 'D', 'E'];
        scale.range = [0, 500];
        scale.paddingOuter = 0.06;
        scale.round = true;

        // `round` yields whole-pixel band widths, but band origins stay exact so bands stay centred.
        expect(scale.convert('A')).toBe(7.5);
        expect(scale.convert('B')).toBe(104.5);
        expect(scale.convert('C')).toBe(201.5);
        expect(scale.convert('D')).toBe(298.5);
        expect(scale.convert('E')).toBe(395.5);

        expect(scale.bandwidth).toBe(97);
    });

    describe('normalizeDomains', () => {
        test('de-duplicates categories', () => {
            expect(new CategoryScale().normalizeDomains({ domain: ['A', 'A'] })).toEqual({
                domain: ['A'],
                animatable: true,
            });
            expect(new CategoryScale().normalizeDomains({ domain: ['A', 'B', 'C', 'A'] })).toEqual({
                domain: ['A', 'B', 'C'],
                animatable: true,
            });
            expect(new CategoryScale().normalizeDomains({ domain: ['A', 'B', 'C'] }, { domain: ['C'] })).toEqual({
                domain: ['A', 'B', 'C'],
                animatable: true,
            });
        });

        test('animatable', () => {
            expect(new CategoryScale().normalizeDomains({ domain: ['A', 'B', 'C'] }, { domain: ['C', 'B'] })).toEqual({
                domain: ['A', 'B', 'C'],
                animatable: false,
            });
        });

        test('retains referential equality for a single, ordered domain', () => {
            const domain = ['A', 'B', 'C'];
            expect(new CategoryScale().normalizeDomains({ domain }).domain).toBe(domain);
        });
    });

    describe('invertWithPercentage', () => {
        const newScale = () => {
            const scale = new CategoryScale();
            scale.domain = ['A', 'B', 'C', 'D', 'E'];
            scale.range = [0, 500];
            return scale;
        };

        test('returns the fractional position within a band', () => {
            const scale = newScale();

            expect(scale.invertWithPercentage(0)).toEqual({ value: 'A', groupPercentage: 0 });
            expect(scale.invertWithPercentage(50)).toEqual({ value: 'A', groupPercentage: 0.5 });
            expect(scale.invertWithPercentage(25)).toEqual({ value: 'A', groupPercentage: 0.25 });
            expect(scale.invertWithPercentage(75)).toEqual({ value: 'A', groupPercentage: 0.75 });
            expect(scale.invertWithPercentage(120)).toEqual({ value: 'B', groupPercentage: 0.2 });
        });

        test('round-trips against the forward convert path', () => {
            const scale = newScale();
            const width = scale.bandwidth;

            for (const position of [0, 25, 75, 120, 230]) {
                const grouping = scale.invertWithPercentage(position)!;
                expect(grouping).toBeDefined();
                const forward = scale.convert(grouping.value) + width * grouping.groupPercentage;
                expect(forward).toBeCloseTo(position);
            }
        });

        test('returns undefined for an empty domain', () => {
            expect(new CategoryScale().invertWithPercentage(50)).toBeUndefined();
        });
    });
});

// Tick generation swaps in a temporary domain and back; rebuilding the n-entry index on every restore is what
// made category layout cost scale with the data size.
describe('CategoryScale domain index', () => {
    class ProbeScale<D> extends CategoryScale<D> {
        get indexMap() {
            return this.index;
        }
        get isIndexBuilt() {
            return this.indexInitialized;
        }
    }

    const newScale = <D>(domain: D[]) => {
        const scale = new ProbeScale<D>();
        scale.domain = domain;
        scale.range = [0, 1000];
        return scale;
    };

    test('findIndex is correct for the same, an equal and a different domain', () => {
        const domain = ['A', 'B', 'C'];
        const scale = newScale(domain);
        expect(scale.findIndex('B')).toBe(1);

        scale.domain = domain;
        expect(scale.isIndexBuilt).toBe(true);
        expect(scale.findIndex('B')).toBe(1);

        scale.domain = ['A', 'B', 'C'];
        expect(scale.findIndex('C')).toBe(2);

        scale.domain = ['C', 'B'];
        expect(scale.findIndex('C')).toBe(0);
        expect(scale.findIndex('A')).toBeUndefined();
    });

    test('keeps the index across a snapshot, temporary domain and restore', () => {
        const domain = Array.from({ length: 100 }, (_, i) => `c${i}`);
        const scale = newScale(domain);
        expect(scale.findIndex('c42')).toBe(42);
        const index = scale.indexMap;

        const snapshot = scale.snapshotDomain();
        scale.domain = ['c5', 'c6'];
        expect(scale.findIndex('c6')).toBe(1);
        expect(scale.findIndex('c42')).toBeUndefined();
        scale.restoreDomain(snapshot);

        expect(scale.domain).toBe(domain);
        expect(scale.indexMap).toBe(index);
        expect(scale.isIndexBuilt).toBe(true);
        expect(index.size).toBe(100);
        expect(scale.findIndex('c42')).toBe(42);
        expect(scale.findIndex('c5')).toBe(5);
    });

    test('reuses the temporary domain index on a repeated swap of the same array', () => {
        const scale = newScale(['A', 'B', 'C', 'D']);
        scale.findIndex('A');
        const temporary = ['B', 'C'];

        let temporaryIndex: Map<string, number> | undefined;
        for (let i = 0; i < 3; i++) {
            const snapshot = scale.snapshotDomain();
            scale.domain = temporary;
            expect(scale.findIndex('C')).toBe(1);
            temporaryIndex ??= scale.indexMap;
            expect(scale.indexMap).toBe(temporaryIndex);
            scale.restoreDomain(snapshot);
            expect(scale.findIndex('D')).toBe(3);
        }
    });

    test('does not build the index on restore when it was never built', () => {
        const scale = newScale(['A', 'B', 'C']);

        const snapshot = scale.snapshotDomain();
        scale.domain = ['A'];
        expect(scale.findIndex('A')).toBe(0);
        scale.restoreDomain(snapshot);

        expect(scale.isIndexBuilt).toBe(false);
        expect(scale.findIndex('C')).toBe(2);
    });

    test('a domain set after a restore drops the kept temporary index', () => {
        const scale = newScale(['A', 'B', 'C']);
        const temporary = ['B'];

        const snapshot = scale.snapshotDomain();
        scale.domain = temporary;
        scale.restoreDomain(snapshot);

        scale.domain = ['X', 'Y'];
        expect(scale.findIndex('Y')).toBe(1);
        expect(scale.findIndex('B')).toBeUndefined();

        // Setting the temporary array again must index its own contents, not a stale kept index.
        temporary[0] = 'Z';
        scale.domain = temporary;
        expect(scale.findIndex('Z')).toBe(0);
        expect(scale.findIndex('B')).toBeUndefined();
    });

    test('keeps Date categories indexed by time value across the round trip', () => {
        const domain = [new Date('2020'), new Date('2021'), new Date('2022')];
        const scale = newScale(domain);
        expect(scale.findIndex(new Date('2021'))).toBe(1);

        const snapshot = scale.snapshotDomain();
        scale.domain = [new Date('2022'), new Date('2023')];
        expect(scale.findIndex(new Date('2023'))).toBe(1);
        expect(scale.findIndex(new Date('2021'))).toBeUndefined();
        scale.restoreDomain(snapshot);

        expect(scale.findIndex(new Date('2021'))).toBe(1);
        expect(scale.findIndex(new Date('2023'))).toBeUndefined();
    });

    test('keeps object categories indexed by value across the round trip', () => {
        const a = { toString: () => 'a' };
        const b = { toString: () => 'b' };
        const scale = newScale<object>([a, b]);
        expect(scale.findIndex(b)).toBe(1);

        const snapshot = scale.snapshotDomain();
        scale.domain = [b];
        expect(scale.findIndex(b)).toBe(0);
        scale.restoreDomain(snapshot);

        expect(scale.findIndex(a)).toBe(0);
        expect(scale.findIndex(b)).toBe(1);
    });

    test('a restore without a snapshot indexes the restored domain', () => {
        const scale = newScale(['A', 'B']);
        scale.findIndex('A');

        scale.domain = ['C', 'D'];
        scale.restoreDomain(['A', 'B', 'E']);

        expect(scale.findIndex('E')).toBe(2);
        expect(scale.findIndex('C')).toBeUndefined();
    });
});

describe('GroupedCategoryScale', () => {
    describe('CRT-992 animatable property', () => {
        test('should be animatable on initial domain set', () => {
            const scale = new GroupedCategoryScale<string[]>();
            expect(scale.animatable).toBe(true);

            scale.domain = [
                ['A', 'B'],
                ['C', 'D'],
            ];
            expect(scale.animatable).toBe(true);
        });

        test('should remain animatable when domain is unchanged', () => {
            const scale = new GroupedCategoryScale<string[]>();

            scale.domain = [
                ['A', 'B'],
                ['C', 'D'],
            ];
            expect(scale.animatable).toBe(true);

            scale.domain = [
                ['A', 'B'],
                ['C', 'D'],
            ];
            expect(scale.animatable).toBe(true);
        });

        test('should not be animatable when domain changes', () => {
            const scale = new GroupedCategoryScale<string[]>();

            scale.domain = [
                ['A', 'B'],
                ['C', 'D'],
            ];
            expect(scale.animatable).toBe(true);

            scale.domain = [
                ['X', 'Y'],
                ['Z', 'W'],
            ];
            expect(scale.animatable).toBe(false);
        });

        test('should handle empty initial domain', () => {
            const scale = new GroupedCategoryScale<string[]>();

            scale.domain = [];
            expect(scale.animatable).toBe(true);

            scale.domain = [['A', 'B']];
            expect(scale.animatable).toBe(false);
        });
    });
});
