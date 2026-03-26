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
                cp0x: 3.9996138532587793,
                cp0y: 4.684059639956104,
                cp1x: 4.336630833917063,
                cp1y: 5.209700878594312,
                cp2x: 4.662837504693517,
                cp2y: 5.78939366664167,
                cp3x: 4.999842873879458,
                cp3y: 6.315092962641593,
            });
        });
    });
});
