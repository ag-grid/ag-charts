import { clipSpanX } from './lineInterpolation';

describe('lineInterpolation', () => {
    describe('clipSpanX', () => {
        it('Should clip a linear span', () => {
            const out = clipSpanX(
                {
                    type: 'linear',
                    moveTo: true,
                    x0: 2,
                    y0: 3,
                    x1: 7,
                    y1: 8,
                },
                3,
                6
            );

            expect(out).toEqual({
                type: 'linear',
                moveTo: true,
                x0: 3,
                y0: 4,
                x1: 6,
                y1: 7,
            });
        });

        it('Should clip a step span before stepX', () => {
            const out = clipSpanX(
                {
                    type: 'step',
                    moveTo: true,
                    x0: 2,
                    y0: 3,
                    x1: 7,
                    y1: 8,
                    stepX: 5,
                },
                3,
                4
            );

            expect(out).toEqual({
                type: 'step',
                moveTo: true,
                x0: 3,
                y0: 3,
                x1: 4,
                y1: 3,
                stepX: 4,
            });
        });

        it('Should clip a step span after stepX', () => {
            const out = clipSpanX(
                {
                    type: 'step',
                    moveTo: true,
                    x0: 2,
                    y0: 3,
                    x1: 7,
                    y1: 8,
                    stepX: 5,
                },
                6,
                7
            );

            expect(out).toEqual({
                type: 'step',
                moveTo: true,
                x0: 6,
                y0: 8,
                x1: 7,
                y1: 8,
                stepX: 6,
            });
        });

        it('Should clip a step span containing stepX', () => {
            const out = clipSpanX(
                {
                    type: 'step',
                    moveTo: true,
                    x0: 2,
                    y0: 3,
                    x1: 7,
                    y1: 8,
                    stepX: 5,
                },
                4,
                6
            );

            expect(out).toEqual({
                type: 'step',
                moveTo: true,
                x0: 4,
                y0: 3,
                x1: 6,
                y1: 8,
                stepX: 5,
            });
        });

        it('Should clip a cubic span', () => {
            const out = clipSpanX(
                {
                    type: 'cubic',
                    moveTo: true,
                    cp0x: 2,
                    cp0y: 3,
                    cp1x: 4,
                    cp1y: 3,
                    cp2x: 5,
                    cp2y: 8,
                    cp3x: 7,
                    cp3y: 8,
                },
                4,
                5
            );

            expect(out).toEqual({
                type: 'cubic',
                moveTo: true,
                // These values were confirmed in Figma
                cp0x: 3.987326979637146,
                cp0y: 4.66492760181427,
                cp1x: 4.327235408592969,
                cp1y: 5.193321248050779,
                cp2x: 4.6558979595192795,
                cp2y: 5.777944284434852,
                cp3x: 4.9954322327809635,
                cp3y: 6.308208709142058,
            });
        });
    });
});
