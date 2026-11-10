import { Rect } from 'ag-charts-core';

export const BLACK = [0, 0, 0, 255];

export type Pixel = number[];

/** A shadow of half-opaque red with no blur, so that the alpha of a pixel is the strength of the shadow cast on it. */
export const redHalfShadow = (xOffset: number, yOffset = 0) => ({
    enabled: true,
    fill: 'rgba(255, 0, 0, 0.5)',
    xOffset,
    yOffset,
    blur: 0,
});

/** Whether a pixel is the colour at half strength, as left by the shadow of that colour at half opacity. */
export const isHalf = (pixel: Pixel, [red, green, blue]: readonly [number, number, number]) =>
    pixel[0] === red && pixel[1] === green && pixel[2] === blue && Math.abs(pixel[3] - 128) <= 1;

export const isHalfRed = (pixel: Pixel) => isHalf(pixel, [255, 0, 0]);

export const box = (x: number, y: number, width: number, height: number, mixin: Partial<Rect> = {}) => {
    const node = new Rect();
    Object.assign(node, { x, y, width, height, fill: 'black', stroke: undefined, strokeWidth: 0, ...mixin });
    return node;
};
