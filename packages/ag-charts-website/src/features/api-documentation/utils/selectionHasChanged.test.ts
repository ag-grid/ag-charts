import type { JsObjectSelection } from '../types';
import { selectionHasChanged } from './selectionHasChanged';

describe('selectionHasChanged', () => {
    it('is true if changing from root', () => {
        const selectionRoot = {
            isRoot: true,
        } as JsObjectSelection;
        const selectionNonRoot = {} as JsObjectSelection;

        expect(
            selectionHasChanged({
                selection: selectionRoot,
                newSelection: selectionNonRoot,
            })
        ).toEqual(true);
        expect(
            selectionHasChanged({
                selection: selectionNonRoot,
                newSelection: selectionRoot,
            })
        ).toEqual(true);
    });

    it('is false if changing from root to root', () => {
        const selectionRoot = {
            isRoot: true,
            path: [] as string[],
        } as JsObjectSelection;

        expect(
            selectionHasChanged({
                selection: selectionRoot,
                newSelection: selectionRoot,
            })
        ).toEqual(false);
    });

    it('top level selection changes are based on propName', () => {
        const selection1 = {
            path: [] as string[],
            propName: 'selection1',
        } as JsObjectSelection;
        const selection2 = {
            path: [] as string[],
            propName: 'selection2',
        } as JsObjectSelection;

        expect(
            selectionHasChanged({
                selection: selection1,
                newSelection: selection1,
            })
        ).toEqual(false);

        expect(
            selectionHasChanged({
                selection: selection1,
                newSelection: selection2,
            })
        ).toEqual(true);

        expect(
            selectionHasChanged({
                selection: selection2,
                newSelection: selection1,
            })
        ).toEqual(true);
    });

    it('is false for same path and different prop name', () => {
        const selection1 = {
            path: ['item1', 'item2'],
            propName: 'selection1',
        } as JsObjectSelection;
        const selection2 = {
            path: ['item1', 'item2'],
            propName: 'selection2',
        } as JsObjectSelection;

        expect(
            selectionHasChanged({
                selection: selection1,
                newSelection: selection2,
            })
        ).toEqual(false);
    });

    it('is false for same path and same prop name', () => {
        const selection1 = {
            path: ['item1', 'item2'],
            propName: 'selection1',
        } as JsObjectSelection;

        expect(
            selectionHasChanged({
                selection: selection1,
                newSelection: selection1,
            })
        ).toEqual(false);
    });

    it('is true for different path', () => {
        const selection1 = {
            path: ['item1', 'item2'],
            propName: 'selection1',
        } as JsObjectSelection;
        const selection2 = {
            path: ['item1', 'item2', 'item3'],
            propName: 'selection2',
        } as JsObjectSelection;

        expect(
            selectionHasChanged({
                selection: selection1,
                newSelection: selection2,
            })
        ).toEqual(true);
    });
});
