import { describe, expect, it } from 'vitest';

import { Text } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

import { setupMockCanvas } from '../../util/test/mockCanvas';
import { fakeImageLoader, fakeLayersManagerWithCanvas, fakeScene, getRichTextLines } from './sceneFakes';

describe('sceneFakes', () => {
    const canvasCtx = setupMockCanvas();

    it('fakeLayersManagerWithCanvas exposes the canvas it was given', () => {
        const manager = fakeLayersManagerWithCanvas({ width: 200, height: 110, pixelRatio: 2 });
        expect(manager.canvas).toMatchObject({ width: 200, height: 110, pixelRatio: 2 });
    });

    it('fakeScene draws onto the given canvas', () => {
        const scene = fakeScene(canvasCtx.nodeCanvas);
        expect(scene.layersManager.canvas).toBe(canvasCtx.nodeCanvas);
        expect(scene.isRtl).toBe(false);
    });

    it('fakeImageLoader resolves known URIs and reports nothing left to load', () => {
        const image = {};
        const loader = fakeImageLoader({ 'a.png': image });
        expect(loader.loadImage('a.png')).toBe(image);
        expect(loader.loadImage('b.png')).toBeUndefined();
        expect(loader.waitingToLoad()).toBe(false);
    });

    it('getRichTextLines returns one node per laid-out line', () => {
        const text = new Text();
        Object.assign(text, {
            text: [
                { text: 'first', fontSize: 12, fontFamily: 'Verdana' },
                { text: '\nsecond', fontSize: 12, fontFamily: 'Verdana' },
            ],
            textBaseline: 'middle',
            textAlign: 'left',
        });
        text.setScene(fakeScene(canvasCtx.nodeCanvas));
        text.render({
            ctx: canvasCtx.getRenderContext2D(),
            direction: 'ltr',
            width: canvasCtx.nodeCanvas.width,
            height: canvasCtx.nodeCanvas.height,
            devicePixelRatio: 1,
            logger: testLogger,
            debugNodes: {},
        });
        expect(getRichTextLines(text)).toHaveLength(2);
    });
});
