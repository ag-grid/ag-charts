import { describe, expect, it } from '@jest/globals';

import { BBox } from './bbox';
import { Node, RedrawType } from './node';

class TestNode extends Node {
    protected override computeBBox(): BBox | undefined {
        return BBox.merge(Array.from(this.children(), (c) => c.getBBox()));
    }
}

class FixedTestNode extends Node {
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

            testee.markDirty(RedrawType.TRIVIAL);
            expect(testee.getBBox()).not.toBe(result);
        });

        it('should clear BBox reference on 2nd markDirty()', () => {
            const bboxRef = BBox.zero.clone().grow(20);
            const testee = new FixedTestNode(bboxRef);
            testee.getBBox(); // Populate cache.
            testee.markDirty(RedrawType.TRIVIAL);

            const result = testee.getBBox();
            testee.markDirty(RedrawType.TRIVIAL);
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

                testee.removeChild(child);
                expect(testee.getBBox()).not.toBe(result);
            });

            it('should clear BBox reference on child markDirty()', () => {
                const bboxRef = BBox.zero.clone().grow(20);
                const testee = new TestNode();
                const child = testee.appendChild(new FixedTestNode(bboxRef));

                const result = testee.getBBox();
                expect(result).not.toBe(bboxRef);
                expect(testee.getBBox()).toBe(result);

                child.markDirty(RedrawType.TRIVIAL);
                expect(testee.getBBox()).not.toBe(result);
            });

            it('should clear BBox reference on child double markDirty()', () => {
                const bboxRef = BBox.zero.clone().grow(20);
                const testee = new TestNode();
                const child = testee.appendChild(new FixedTestNode(bboxRef));

                const result = testee.getBBox();
                expect(result).not.toBe(bboxRef);
                expect(testee.getBBox()).toBe(result);

                child.markDirty(RedrawType.TRIVIAL);
                const result2 = testee.getBBox();
                expect(result2).not.toBe(result);

                child.markDirty(RedrawType.TRIVIAL);
                expect(testee.getBBox()).not.toBe(result);
                expect(testee.getBBox()).not.toBe(result2);
            });
        });
    });
});
