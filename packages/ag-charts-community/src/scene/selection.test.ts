import { describe, expect, it } from '@jest/globals';

import { Selection } from './selection';
import { Node } from './node';

class TestNode extends Node {}

describe('selection', () => {
    it('should create an empty selection', () => {
        const selection = new Selection(new TestNode(), TestNode);
        expect(selection.nodes()).toHaveLength(0);
    });

    describe('without getDatumId', () => {
        it('should update with new data', () => {
            const selection = new Selection(new TestNode(), TestNode);
            const data = ['a', 'b', 'c'];
            selection.update(data);

            expect(selection.nodes()).toHaveLength(data.length);
            selection.each((node, datum, index) => {
                expect(node).toBeInstanceOf(TestNode);
                expect(datum).toBe(data[index]);
            });
        });

        describe('with automatic garbage collection', () => {
            it('should remove data', () => {
                const selection = new Selection(new TestNode(), TestNode);
                const data = ['a', 'b', 'c'];
                const changedData = ['a', 'c'];
                selection.update(data);
                selection.update(changedData);

                expect(selection.nodes()).toHaveLength(changedData.length);
                selection.each((node, datum, index) => {
                    expect(node).toBeInstanceOf(TestNode);
                    expect(datum).toBe(changedData[index]);
                });
            });

            it('should remove and add data', () => {
                const selection = new Selection(new TestNode(), TestNode);
                const data = ['a', 'b', 'c'];
                const changedData = ['a', 'c'];
                selection.update(data);
                selection.update(changedData);
                selection.update(data);

                expect(selection.nodes()).toHaveLength(data.length);
                selection.each((node, datum, index) => {
                    expect(node).toBeInstanceOf(TestNode);
                    expect(datum).toBe(data[index]);
                });
            });
        });

        describe('with manual garbage collection', () => {
            it('should not remove data', () => {
                const selection = new Selection(new TestNode(), TestNode, false);
                const data = ['a', 'b', 'c'];
                const changedData = ['a', 'c'];

                // The expected data includes the lingering data at the end that has yet to be garbage collected. While
                // the remaining data has overwritten earlier indices.
                const expectedData = ['a', 'c', 'c'];

                selection.update(data);
                selection.update(changedData);

                expect(selection.nodes()).toHaveLength(expectedData.length);
                selection.each((node, datum, index) => {
                    expect(node).toBeInstanceOf(TestNode);
                    expect(datum).toBe(expectedData[index]);
                });
            });

            it('when garbage collected it should remove data', () => {
                const selection = new Selection(new TestNode(), TestNode, false);
                const data = ['a', 'b', 'c'];
                const changedData = ['a', 'c'];
                selection.update(data);
                selection.update(changedData);
                selection.cleanup();

                expect(selection.nodes()).toHaveLength(changedData.length);
                selection.each((node, datum, index) => {
                    expect(node).toBeInstanceOf(TestNode);
                    expect(datum).toBe(changedData[index]);
                });
            });
        });
    });

    describe('with getDatumId and manual garbage collection', () => {
        it('should update with new data', () => {
            const selection = new Selection(new TestNode(), TestNode, false);
            const data = [
                { key: 'a', value: 0 },
                { key: 'b', value: 1 },
                { key: 'c', value: 2 },
            ];
            selection.update(data, undefined, (datum) => datum.key);

            expect(selection.nodes()).toHaveLength(data.length);
            selection.each((node, datum, index) => {
                expect(node).toBeInstanceOf(TestNode);
                expect(datum.value).toBe(data[index].value);
            });
        });

        it('should update datums by id rather than index and maintain order', () => {
            const selection = new Selection(new TestNode(), TestNode, false);
            const data = [
                { key: 'a', value: 0 },
                { key: 'b', value: 1 },
                { key: 'c', value: 2 },
            ];
            selection.update(data, undefined, (datum) => datum.key);

            const changedData = [
                { key: 'a', value: 0 },
                { key: 'c', value: 2 },
                { key: 'b', value: 3 },
            ];
            selection.update(changedData, undefined, (datum) => datum.key);

            const expectedData = [
                { key: 'a', value: 0 },
                { key: 'b', value: 3 },
                { key: 'c', value: 2 },
            ];

            expect(selection.nodes()).toHaveLength(expectedData.length);
            selection.each((node, datum, index) => {
                expect(node).toBeInstanceOf(TestNode);
                expect(datum.value).toBe(expectedData[index].value);
            });
        });

        it('should not remove data', () => {
            const selection = new Selection(new TestNode(), TestNode, false);
            const data = [
                { key: 'a', value: 0 },
                { key: 'b', value: 1 },
                { key: 'c', value: 2 },
            ];
            selection.update(data, undefined, (datum) => datum.key);

            const changedData = [
                { key: 'a', value: 0 },
                { key: 'c', value: 2 },
            ];
            selection.update(changedData, undefined, (datum) => datum.key);

            expect(selection.nodes()).toHaveLength(data.length);
            selection.each((node, datum, index) => {
                expect(node).toBeInstanceOf(TestNode);
                expect(datum.value).toBe(data[index].value);
            });
        });

        it('when garbage collected it should remove data', () => {
            const selection = new Selection(new TestNode(), TestNode, false);
            const data = [
                { key: 'a', value: 0 },
                { key: 'b', value: 1 },
                { key: 'c', value: 2 },
            ];
            selection.update(data, undefined, (datum) => datum.key);

            const changedData = [
                { key: 'a', value: 0 },
                { key: 'c', value: 2 },
            ];
            selection.update(changedData, undefined, (datum) => datum.key);

            selection.cleanup();

            expect(selection.nodes()).toHaveLength(changedData.length);
            selection.each((node, datum, index) => {
                expect(node).toBeInstanceOf(TestNode);
                expect(datum.value).toBe(changedData[index].value);
            });
        });
    });
});
