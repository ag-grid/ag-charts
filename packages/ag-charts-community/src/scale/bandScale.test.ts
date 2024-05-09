import { describe, expect, it, test } from '@jest/globals';

import { BandScale } from './bandScale';

describe('BandScale', () => {
    test('initial state', () => {
        const scale = new BandScale();

        expect(scale.domain).toEqual([]);
        expect(scale.range).toEqual([0, 1]);
        expect(scale.paddingInner).toBe(0);
        expect(scale.paddingOuter).toBe(0);
        expect(scale.padding).toBe(0);
    });

    test('no implicit domain construction', () => {
        const scale = new BandScale();

        expect(scale.convert('B')).toBe(NaN);
        expect(scale.convert('C')).toBe(NaN);
        expect(scale.convert('A')).toBe(NaN);

        expect(scale.domain).toEqual([]);
    });

    test('basic band scale', () => {
        const scale = new BandScale();

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
        const scale = new BandScale();

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
        const scale = new BandScale();

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
        const scale = new BandScale();

        scale.domain = ['A'];
        scale.range = [0, 500];
        scale.paddingInner = 0.5;

        expect(scale.convert('A')).toBe(0);
    });

    test('outer padding', () => {
        const scale = new BandScale();

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
        const scale = new BandScale();

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
        const scale = new BandScale();

        scale.domain = ['A', 'B', 'C', 'D', 'E'];
        scale.range = [0, 500];
        scale.paddingOuter = 0.06;
        scale.round = true;

        expect(scale.convert('A')).toBe(8);
        expect(scale.convert('B')).toBe(105);
        expect(scale.convert('C')).toBe(202);
        expect(scale.convert('D')).toBe(299);
        expect(scale.convert('E')).toBe(396);

        expect(scale.bandwidth).toBe(97);
    });

    describe('should create ticks', () => {
        const CASES = [
            {
                interval: 0,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: 1,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: 2,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: 3,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: 4,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: -1,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: -2,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: 1.5,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
            {
                interval: -1.5,
                domain: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            },
        ];

        it.each(CASES)(`for interval: $interval domain: $domain case`, ({ interval, domain }) => {
            const scale = new BandScale();

            scale.range = [0, 600];
            scale.domain = domain;
            scale.interval = interval;

            expect(scale.ticks()).toMatchSnapshot();
        });
    });
});
