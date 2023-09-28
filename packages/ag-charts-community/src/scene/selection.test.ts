import { describe, expect, it } from '@jest/globals';
import { Node } from './node';
import { Selection } from './selection';

class TestNode extends Node {}

const expectSelectionToMatchData = (selection: Selection, data: Array<any>) => {
    expect(selection.nodes()).toHaveLength(data.length);
    selection.each((node, datum, index) => {
        expect(node).toBeInstanceOf(TestNode);
        expect(datum).toEqual(data[index]);
    });
};

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

            expectSelectionToMatchData(selection, data);
        });

        describe('with automatic garbage collection', () => {
            it('should remove data', () => {
                const selection = new Selection(new TestNode(), TestNode);
                const data = ['a', 'b', 'c'];
                const changedData = ['a', 'c'];
                selection.update(data);
                selection.update(changedData);

                expectSelectionToMatchData(selection, changedData);
            });

            it('should remove and add data', () => {
                const selection = new Selection(new TestNode(), TestNode);
                const data = ['a', 'b', 'c'];
                const changedData = ['a', 'c'];
                selection.update(data);
                selection.update(changedData);
                selection.update(data);

                expectSelectionToMatchData(selection, data);
            });

            it('for zero datums it should remove data', () => {
                const selection = new Selection(new TestNode(), TestNode);
                const data = ['a', 'b', 'c'];
                const changedData: string[] = [];
                selection.update(data);
                selection.update(changedData);

                expectSelectionToMatchData(selection, changedData);
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

                expectSelectionToMatchData(selection, expectedData);
            });

            it('when garbage collected it should remove data', () => {
                const selection = new Selection(new TestNode(), TestNode, false);
                const data = ['a', 'b', 'c'];
                const changedData = ['a', 'c'];
                selection.update(data);
                selection.update(changedData);
                selection.cleanup();

                expectSelectionToMatchData(selection, changedData);
            });

            it('when garbage collected and zero datums it should remove data', () => {
                const selection = new Selection(new TestNode(), TestNode, false);
                const data = ['a', 'b', 'c'];
                const changedData: string[] = [];
                selection.update(data);
                selection.update(changedData);
                selection.cleanup();

                expectSelectionToMatchData(selection, changedData);
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

            expectSelectionToMatchData(selection, data);
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

            expectSelectionToMatchData(selection, expectedData);
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

            expectSelectionToMatchData(selection, data);
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

            expectSelectionToMatchData(selection, changedData);
        });
    });
});
