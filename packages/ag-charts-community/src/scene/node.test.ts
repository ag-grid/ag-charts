import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from 'ag-charts-core';

import { BBox } from './bbox';
import { Group } from './group';
import { Node, type RenderContext } from './node';

class TestNode<D = any> extends Group<D> {
    protected override computeBBox(): BBox | undefined {
        return BBox.merge(Array.from(this.children(), (c) => c.getBBox()));
    }
}

class FixedTestNode<D = any> extends Node<D> {
    public constructor(private readonly bbox: BBox) {
        super();
    }
    protected override computeBBox(): BBox | undefined {
        return this.bbox.clone();
    }
}

describe('Node', () => {
    describe('getBBox()', () => {
        it('should cache BBox reference from Node.computeBBox()', () => {
            const bboxRef = BBox.zero.clone().grow(20);
            const testee = new FixedTestNode(bboxRef);
            const result = testee.getBBox();

            expect(result).not.toBe(bboxRef);
            expect(testee.getBBox()).toBe(result);
        });

        it('should clear BBox reference on markDirty()', () => {
            const bboxRef = BBox.zero.clone().grow(20);
            const testee = new FixedTestNode(bboxRef);
            const result = testee.getBBox();

            expect(result).not.toBe(bboxRef);

            testee.markDirty('test');
            expect(testee.getBBox()).not.toBe(result);
        });

        it('should clear BBox reference on 2nd markDirty()', () => {
            const bboxRef = BBox.zero.clone().grow(20);
            const testee = new FixedTestNode(bboxRef);
            testee.getBBox(); // Populate cache.
            testee.markDirty('test');

            const result = testee.getBBox();
            testee.markDirty('test');
            expect(testee.getBBox()).not.toBe(result);
        });

        describe('with child nodes', () => {
            it('should clear BBox reference on child add', () => {
                const bboxRef = BBox.zero.clone().grow(20);
                const child = new FixedTestNode(bboxRef);
                const testee = new TestNode();

                const result = testee.getBBox();
                expect(result).not.toBe(bboxRef);
                expect(testee.getBBox()).toBe(result);

                testee.appendChild(child);
                expect(testee.getBBox()).not.toBe(result);
            });

            it('should clear BBox reference on child remove', () => {
                const bboxRef = BBox.zero.clone().grow(20);
                const testee = new TestNode();
                const child = testee.appendChild(new FixedTestNode(bboxRef));

                const result = testee.getBBox();
                expect(result).not.toBe(bboxRef);
                expect(testee.getBBox()).toBe(result);

                child.remove();
                expect(testee.getBBox()).not.toBe(result);
            });

            it('should clear BBox reference on child markDirty()', () => {
                const bboxRef = BBox.zero.clone().grow(20);
                const testee = new TestNode();
                const child = testee.appendChild(new FixedTestNode(bboxRef));

                const result = testee.getBBox();
                expect(result).not.toBe(bboxRef);
                expect(testee.getBBox()).toBe(result);

                child.markDirty('test');
                expect(testee.getBBox()).not.toBe(result);
            });

            it('should clear BBox reference on child double markDirty()', () => {
                const bboxRef = BBox.zero.clone().grow(20);
                const testee = new TestNode();
                const child = testee.appendChild(new FixedTestNode(bboxRef));

                const result = testee.getBBox();
                expect(result).not.toBe(bboxRef);
                expect(testee.getBBox()).toBe(result);

                child.markDirty('test');
                const result2 = testee.getBBox();
                expect(result2).not.toBe(result);

                child.markDirty('test');
                expect(testee.getBBox()).not.toBe(result);
                expect(testee.getBBox()).not.toBe(result2);
            });
        });
    });
});

class ThrowingNode extends Node {
    protected override computeBBox(): BBox | undefined {
        return undefined;
    }
    override render(): void {
        throw new Error('render boom');
    }
}

function stubRenderCtx(logger?: Logger): RenderContext {
    return {
        ctx: { save() {}, restore() {} } as unknown as CanvasRenderingContext2D,
        direction: 'ltr',
        width: 100,
        height: 100,
        devicePixelRatio: 1,
        logger,
        debugNodes: {},
    };
}

describe('isolatedRender logger routing', () => {
    afterEach(() => vi.restoreAllMocks());

    it('routes render errors to the render-context logger when one is provided', () => {
        const logger = new Logger();
        const scoped = vi.spyOn(logger, 'warnOnce').mockImplementation(() => {});
        const fallback = vi.spyOn(Logger.default, 'warnOnce').mockImplementation(() => {});

        new ThrowingNode().isolatedRender(stubRenderCtx(logger));

        expect(scoped).toHaveBeenCalledOnce();
        expect(fallback).not.toHaveBeenCalled();
    });

    it('falls back to Logger.default when the render context carries no logger', () => {
        const fallback = vi.spyOn(Logger.default, 'warnOnce').mockImplementation(() => {});

        new ThrowingNode().isolatedRender(stubRenderCtx());

        expect(fallback).toHaveBeenCalledOnce();
    });
});
