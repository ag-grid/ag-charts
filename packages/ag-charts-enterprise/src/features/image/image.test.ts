import { describe, expect, it } from '@jest/globals';

import { _ModuleSupport } from 'ag-charts-community';

import { Image } from './image';

describe('Image', () => {
    describe('Positioning', () => {
        const containerWidth = 300;
        const containerHeight = 200;
        const naturalWidth = 80;
        const naturalHeight = 50;

        const calculatePlacement = (params: {
            left?: number;
            width?: number;
            right?: number;
            top?: number;
            height?: number;
            bottom?: number;
        }) => {
            const image = new Image();

            Object.assign(image, params);

            image.performLayout(containerWidth, containerHeight);

            return _ModuleSupport.calculatePlacement(
                naturalWidth,
                naturalHeight,
                { x: 0, y: 0, width: containerWidth, height: containerHeight },
                params
            );
        };

        it(`By default image has natural size and positioned at the center`, () => {
            const placement = calculatePlacement({});

            expect(placement).toEqual({ x: 110, y: 75, width: 80, height: 50 });
        });

        it(`If left position specified, the image moves left`, () => {
            const placement = calculatePlacement({ left: 20 });

            expect(placement).toEqual({ x: 20, y: 75, width: 80, height: 50 });
        });

        it(`If right position specified, the image moves right`, () => {
            const placement = calculatePlacement({ right: 20 });

            expect(placement).toEqual({ x: 200, y: 75, width: 80, height: 50 });
        });

        it(`If right and left position specified, the image scratched`, () => {
            const placement = calculatePlacement({ left: 50, right: 50 });

            expect(placement).toEqual({ x: 50, y: 37, width: 200, height: 125 });
        });

        it(`If width specified, the image scratched at the center`, () => {
            const placement = calculatePlacement({ width: 160 });

            expect(placement).toEqual({ x: 70, y: 50, width: 160, height: 100 });
        });

        it(`If width and left specified, the image scratched and moved left`, () => {
            const placement = calculatePlacement({ left: 20, width: 160 });

            expect(placement).toEqual({ x: 20, y: 50, width: 160, height: 100 });
        });

        it(`If width and right specified, the image scratched and moved right`, () => {
            const placement = calculatePlacement({ width: 160, right: 20 });

            expect(placement).toEqual({ x: 120, y: 50, width: 160, height: 100 });
        });

        it(`If left, right and width specified, right ignored`, () => {
            const placement = calculatePlacement({ left: 50, width: 200, right: 50 });

            expect(placement).toEqual({ x: 50, y: 37, width: 200, height: 125 });
        });

        it(`If top position specified, the image moves up`, () => {
            const placement = calculatePlacement({ top: 20 });

            expect(placement).toEqual({ x: 110, y: 20, width: 80, height: 50 });
        });

        it(`If bottom position specified, the image moves down`, () => {
            const placement = calculatePlacement({ bottom: 20 });

            expect(placement).toEqual({ x: 110, y: 130, width: 80, height: 50 });
        });

        it(`If top bottom position specified, the image starches`, () => {
            const placement = calculatePlacement({ top: 50, bottom: 50 });

            expect(placement).toEqual({ x: 70, y: 50, width: 160, height: 100 });
        });

        it(`If height and top specified, the image scratches and moves up`, () => {
            const placement = calculatePlacement({ top: 20, height: 100 });

            expect(placement).toEqual({ x: 70, y: 20, width: 160, height: 100 });
        });

        it(`If height and bottom specified, the image scratches`, () => {
            const placement = calculatePlacement({ height: 100, bottom: 20 });

            expect(placement).toEqual({ x: 70, y: 80, width: 160, height: 100 });
        });

        it(`If top, bottom and height specified, bottom ignored`, () => {
            const placement = calculatePlacement({ top: 50, height: 125, bottom: 50 });

            expect(placement).toEqual({ x: 50, y: 50, width: 200, height: 125 });
        });

        it(`If all sides specified, natural proportion ignored`, () => {
            const placement = calculatePlacement({ left: 50, top: 50, right: 50, bottom: 50 });

            expect(placement).toEqual({ x: 50, y: 50, width: 200, height: 100 });
        });

        it(`Width and height specified, natural proportion ignored`, () => {
            const placement = calculatePlacement({ width: 200, height: 100 });

            expect(placement).toEqual({ x: 50, y: 50, width: 200, height: 100 });
        });

        it(`Cross-axes: right and height`, () => {
            const placement = calculatePlacement({ right: 20, height: 100 });

            expect(placement).toEqual({ x: 120, y: 50, width: 160, height: 100 });
        });

        it(`Cross-axes: bottom and width`, () => {
            const placement = calculatePlacement({ width: 160, bottom: 20 });

            expect(placement).toEqual({ x: 70, y: 80, width: 160, height: 100 });
        });
    });
});
