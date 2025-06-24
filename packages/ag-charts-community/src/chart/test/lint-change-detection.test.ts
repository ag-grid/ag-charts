import {
    SceneArrayChangeDetection,
    SceneChangeDetection,
    SceneObjectChangeDetection,
} from '../../scene/changeDetectable';
import { Node } from '../../scene/node';
import { Property } from '../../util/properties';
import { SeriesProperties } from '../series/seriesProperties';

const equals = (_newValue: any, _oldValue: any): boolean => false;

class TestSceneChangeDetection extends Node {
    @SceneChangeDetection() requiredString: string = '';
    @SceneChangeDetection() optionalString?: string;
    @SceneChangeDetection() requiredNumber: number = 0;
    @SceneChangeDetection() optionalNumber?: number;
    @SceneChangeDetection() requiredBoolean: boolean = true;
    @SceneChangeDetection() optionalBoolean?: boolean;
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredObject: object = {};
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalObject?: object;
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredAnyArray: any[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalAnyArray?: any[];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredObjectArray: object[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalObjectArray?: object[];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredNumberArray: number[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalNumberArray?: number[];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredObjectTuple: [string, string, string] = ['a', 'b', 'c'];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalObjectTuple?: [string, string, string];

    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredUnion1: number | readonly [number, number] = 0;
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalUnion1?: number | readonly [number, number];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredUnion2: number | readonly string[] = 0;
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalUnion2?: number | readonly string[];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredUnion3: object | readonly [number, number] = {};
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalUnion3?: object | readonly [number, number];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredUnion4: object | readonly string[] = ['a', 'b', 'c'];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalUnion4?: object | readonly string[];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredUnion5: object | readonly boolean[] | string = [true, false];
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalUnion5?: object | readonly boolean[] | string;
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() requiredUnion6: object | object[] = {};
    // eslint-disable-next-line aglint/change-detection
    @SceneChangeDetection() optionalUnion6?: object | object[];
}

class TestSceneObjectChangeDetection extends Node {
    @SceneObjectChangeDetection({ equals }) requiredObject: object = {};
    @SceneObjectChangeDetection({ equals }) optionalObject?: object;
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) requiredString: string = '';
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) optionalString?: string;
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) requiredNumber: number = 0;
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) optionalNumber?: number;
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) requiredBoolean: boolean = true;
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) optionalBoolean?: boolean;
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) requiredObjectArray: object[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) optionalObjectArray?: object[];
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) requiredObjectTuple: [boolean, boolean] = [false, true];
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) optionalObjectTuple?: [boolean, boolean];

    @SceneObjectChangeDetection({ equals }) requiredUnion1: number | readonly [number, number] = 0;
    @SceneObjectChangeDetection({ equals }) optionalUnion1?: number | readonly [number, number];
    @SceneObjectChangeDetection({ equals }) requiredUnion2: number | readonly string[] = 0;
    @SceneObjectChangeDetection({ equals }) optionalUnion2?: number | readonly string[];
    @SceneObjectChangeDetection({ equals }) requiredUnion3: object | readonly [number, number] = {};
    @SceneObjectChangeDetection({ equals }) optionalUnion3?: object | readonly [number, number];
    @SceneObjectChangeDetection({ equals }) requiredUnion4: object | readonly string[] = ['a', 'b', 'c'];
    @SceneObjectChangeDetection({ equals }) optionalUnion4?: object | readonly string[];
    @SceneObjectChangeDetection({ equals }) requiredUnion5: object | readonly boolean[] | string = [true, false];
    @SceneObjectChangeDetection({ equals }) optionalUnion5?: object | readonly boolean[] | string;
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) requiredUnion6: object | object[] = {};
    // eslint-disable-next-line aglint/change-detection
    @SceneObjectChangeDetection({ equals }) optionalUnion6?: object | object[];
}

class TestSceneArrayChangeDetection extends Node {
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredString: string = '';
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalString?: string;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredNumber: number = 0;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalNumber?: number;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredBoolean: boolean = true;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalBoolean?: boolean;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredObject: object = {};
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalObject?: object;

    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredMutableAnyArray: any[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalMutableAnyArray?: any[];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredReadonlyAnyArray: readonly any[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalReadonlyAnyArray?: readonly any[];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredMutableAnyTuple: [any, any, any] = [78, 'mystring', false];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalMutableAnyTuple?: [any, any, any];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredReadonlyAnyTuple: readonly [any, any, any] = [78, 'mystring', false];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalReadonlyAnyTuple?: readonly [any, any, any];

    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredMutableObjectArray: object[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalMutableObjectArray?: object[];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredReadonlyObjectArray: readonly object[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalReadonlyObjectArray?: readonly object[];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredMutableObjectTuple: [object, number, string] = [{}, 7, 's'];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalMutableObjectTuple?: [object, number, string, boolean];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredReadonlyObjectTuple: readonly [object, number, string] = [{}, 7, 's'];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalReadonlyObjectTuple?: readonly [object, number, string, boolean];

    @SceneArrayChangeDetection() requiredReadonlyNumberArray: readonly number[] = [];
    @SceneArrayChangeDetection() optionalReadonlyNumberArray?: readonly number[];
    @SceneArrayChangeDetection() requiredReadonlyNumberTuple: readonly [number, number] = [0, 0];
    @SceneArrayChangeDetection() optionalReadonlyNumberTuple?: readonly [number, number];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredMutableNumberArray: number[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalMutableNumberArray?: number[] = [];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredMutableNumberTuple: [number, number] = [0, 0];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalMutableNumberTuple?: [number, number];

    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredUnion1: number | readonly [number, number] = 0;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalUnion1?: number | readonly [number, number];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredUnion2: number | readonly string[] = 0;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalUnion2?: number | readonly string[];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredUnion3: object | readonly [number, number] = {};
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalUnion3?: object | readonly [number, number];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredUnion4: object | readonly string[] = ['a', 'b', 'c'];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalUnion4?: object | readonly string[];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredUnion5: object | readonly boolean[] | string = [true, false];
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalUnion5?: object | readonly boolean[] | string;
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() requiredUnion6: object | object[] = {};
    // eslint-disable-next-line aglint/change-detection
    @SceneArrayChangeDetection() optionalUnion6?: object | object[];
}

abstract class TestIgnoredDecorator extends SeriesProperties<any> {
    @Property lineDash?: number[];
    @Property node: object[] = [];
}

describe('aglint/change-detection', () => {
    // no tests needed: checks are done by ESLint

    test('', () => {
        // mute "unused class" errors;
        TestSceneChangeDetection satisfies object;
        TestSceneObjectChangeDetection satisfies object;
        TestSceneArrayChangeDetection satisfies object;
        TestIgnoredDecorator satisfies object;
    });
});
