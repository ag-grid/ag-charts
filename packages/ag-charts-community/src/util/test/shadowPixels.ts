import { Rect } from 'ag-charts-core';

export const BLACK = [0, 0, 0, 255];

export type Pixel = number[];

/** A shadow of half-opaque red with no blur, so that the alpha of a pixel is the strength of the shadow cast on it. */
export const redHalfShadow = (xOffset: number, yOffset = 0) => ({
    enabled: true,
    color: 'rgba(255, 0, 0, 0.5)',
    xOffset,
    yOffset,
    blur: 0,
});

export const isHalfRed = (pixel: Pixel) =>
    pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 0 && Math.abs(pixel[3] - 128) <= 1;

export const box = (x: number, y: number, width: number, height: number, mixin: Partial<Rect> = {}) => {
    const node = new Rect();
    Object.assign(node, { x, y, width, height, fill: 'black', stroke: undefined, strokeWidth: 0, ...mixin });
    return node;
};
