import type { JsModelSelectionProperty, JsObjectPropertiesViewConfig, JsObjectSelection } from '../types';
import { getTopLevelSelectionChanged } from './getTopLevelSelectionChanged';
import type { JsonModel, JsonModelProperty } from './model';

const emptyModel = {
    properties: {},
} as JsonModel;

const itemModel = {
    type: 'model',
    tsType: '',
    properties: {
        item1: {} as JsonModelProperty,
        itemOther: {} as JsonModelProperty,
    },
} as JsonModel;

describe('getTopLevelSelectionChanged', () => {
    it('is true if changing from root', () => {
        const selectionRoot = {
            type: 'model',
            isRoot: true,
            path: [],
            model: emptyModel,
        } as JsObjectSelection;
        const selectionNonRoot = {
            type: 'property',
            path: ['parent'],
            propName: 'something',
            model: emptyModel,
        } as JsObjectSelection;

        expect(
            getTopLevelSelectionChanged({
                selection: selectionRoot,
                topLevelSelection: selectionRoot,
                newSelection: selectionNonRoot,
                model: emptyModel,
            }).hasChanged
        ).toEqual(true);
        expect(
            getTopLevelSelectionChanged({
                selection: selectionRoot,
                topLevelSelection: selectionNonRoot,
                newSelection: selectionRoot,
                model: emptyModel,
            }).hasChanged
        ).toEqual(true);
    });

    it('is false if changing from root to root', () => {
        const selectionRoot = {
            isRoot: true,
            path: [] as string[],
        } as JsObjectSelection;

        expect(
            getTopLevelSelectionChanged({
                selection: selectionRoot,
                topLevelSelection: selectionRoot,
                newSelection: selectionRoot,
                model: emptyModel,
            }).hasChanged
        ).toEqual(false);
    });

    it('top level selection changes are based on propName', () => {
        const selection1 = {
            isRoot: true,
            path: [] as string[],
            propName: 'selection1',
        } as JsObjectSelection;
        const selection2 = {
            isRoot: true,
            path: [] as string[],
            propName: 'selection2',
        } as JsObjectSelection;

        expect(
            getTopLevelSelectionChanged({
                selection: selection1,
                topLevelSelection: selection1,
                newSelection: selection1,
                model: emptyModel,
            }).hasChanged
        ).toEqual(false);

        expect(
            getTopLevelSelectionChanged({
                selection: selection1,
                topLevelSelection: selection1,
                newSelection: selection2,
                model: emptyModel,
            }).hasChanged
        ).toEqual(true);

        expect(
            getTopLevelSelectionChanged({
                selection: selection2,
                topLevelSelection: selection2,
                newSelection: selection1,
                model: emptyModel,
            }).hasChanged
        ).toEqual(true);
    });

    it('is false for same path and different prop name', () => {
        const topLevelSelection1 = {
            path: ['item1'],
            propName: 'item2',
        } as JsObjectSelection;
        const selection1 = {
            path: ['item1', 'item2'],
            propName: 'selection1',
        } as JsObjectSelection;
        const selection2 = {
            path: ['item1', 'item2'],
            propName: 'selection2',
        } as JsObjectSelection;

        expect(
            getTopLevelSelectionChanged({
                selection: selection1,
                topLevelSelection: topLevelSelection1,
                newSelection: selection2,
                model: itemModel,
            }).hasChanged
        ).toEqual(false);
    });

    it('is false for same path and same prop name', () => {
        const topSelection1 = {
            path: ['item1'],
            propName: 'item2',
        } as JsObjectSelection;
        const selection1 = {
            path: ['item1', 'item2'],
            propName: 'selection1',
        } as JsObjectSelection;

        expect(
            getTopLevelSelectionChanged({
                selection: selection1,
                topLevelSelection: topSelection1,
                newSelection: selection1,
                model: itemModel,
            }).hasChanged
        ).toEqual(false);
    });

    it('is false for child path', () => {
        const topSelection1 = {
            path: ['item1'],
            propName: 'item2',
        } as JsObjectSelection;
        const selection1 = {
            path: ['item1', 'item2'],
            propName: 'selection1',
        } as JsObjectSelection;
        const selection2 = {
            path: ['item1', 'item2', 'item3'],
            propName: 'selection2',
        } as JsObjectSelection;

        expect(
            getTopLevelSelectionChanged({
                selection: selection1,
                topLevelSelection: topSelection1,
                newSelection: selection2,
                model: itemModel,
            }).hasChanged
        ).toEqual(false);
    });

    it('is true for different path', () => {
        const topSelection1 = {
            path: ['item1'],
            propName: 'item2',
        } as JsObjectSelection;
        const selection1 = {
            path: ['item1', 'item2'],
            propName: 'selection1',
        } as JsObjectSelection;
        const selection2 = {
            path: ['itemOther', 'itemOther2', 'itemOther3'],
            propName: 'selection2',
        } as JsObjectSelection;

        expect(
            getTopLevelSelectionChanged({
                selection: selection1,
                topLevelSelection: topSelection1,
                newSelection: selection2,
                model: itemModel,
            }).hasChanged
        ).toEqual(true);
    });

    it('is true for selection with different should limit children value', () => {
        const topSelection1 = {
            path: ['item1'],
            propName: 'item2',
        } as JsObjectSelection;
        const selection1 = {
            path: ['item1'],
        } as JsModelSelectionProperty;
        const selection2 = {
            path: ['item1'],
            propName: 'selection',
        } as JsObjectSelection;
        const config: JsObjectPropertiesViewConfig = {
            limitChildrenProperties: ['item1'],
        };

        expect(
            getTopLevelSelectionChanged({
                selection: selection1,
                topLevelSelection: topSelection1,
                newSelection: selection2,
                model: itemModel,
                config,
            }).hasChanged
        ).toEqual(true);
    });
});
