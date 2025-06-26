const equals = (_newValue: any, _oldValue: any): boolean => false;

// Stub ag-charts-community classes
class Node {};
class SeriesProperties<_T> {};

// Stub ag-charts-community decorators
export function SceneChangeDetection() {
    return (_target: any, _context: ClassFieldDecoratorContext) => {};
}
export function SceneArrayChangeDetection() {
    return (_target: any, _context: ClassFieldDecoratorContext) => {};
}
export function SceneObjectChangeDetection(_options?: { equals?: (a: any, b: any) => boolean }) {
    return (_target: any, _context: ClassFieldDecoratorContext) => {};
}
export function Property() {
    return (_target: any, _context: ClassFieldDecoratorContext) => {};
}

class TestSceneChangeDetection extends Node {
    @SceneChangeDetection() requiredString: string = '';
    @SceneChangeDetection() optionalString?: string;
    @SceneChangeDetection() requiredNumber: number = 0;
    @SceneChangeDetection() optionalNumber?: number;
    @SceneChangeDetection() requiredBoolean: boolean = true;
    @SceneChangeDetection() optionalBoolean?: boolean;
    @SceneChangeDetection() requiredObject: object = {};
    @SceneChangeDetection() optionalObject?: object;
    @SceneChangeDetection() requiredAnyArray: any[] = [];
    @SceneChangeDetection() optionalAnyArray?: any[];
    @SceneChangeDetection() requiredObjectArray: object[] = [];
    @SceneChangeDetection() optionalObjectArray?: object[];
    @SceneChangeDetection() requiredNumberArray: number[] = [];
    @SceneChangeDetection() optionalNumberArray?: number[];
    @SceneChangeDetection() requiredObjectTuple: [string, string, string] = ['a', 'b', 'c'];
    @SceneChangeDetection() optionalObjectTuple?: [string, string, string];

    @SceneChangeDetection() requiredUnion1: number | readonly [number, number] = 0;
    @SceneChangeDetection() optionalUnion1?: number | readonly [number, number];
    @SceneChangeDetection() requiredUnion2: number | readonly string[] = 0;
    @SceneChangeDetection() optionalUnion2?: number | readonly string[];
    @SceneChangeDetection() requiredUnion3: object | readonly [number, number] = {};
    @SceneChangeDetection() optionalUnion3?: object | readonly [number, number];
    @SceneChangeDetection() requiredUnion4: object | readonly string[] = ['a', 'b', 'c'];
    @SceneChangeDetection() optionalUnion4?: object | readonly string[];
    @SceneChangeDetection() requiredUnion5: object | readonly boolean[] | string = [true, false];
    @SceneChangeDetection() optionalUnion5?: object | readonly boolean[] | string;
    @SceneChangeDetection() requiredUnion6: object | object[] = {};
    @SceneChangeDetection() optionalUnion6?: object | object[];
}

class TestSceneObjectChangeDetection extends Node {
    @SceneObjectChangeDetection({ equals }) requiredObject: object = {};
    @SceneObjectChangeDetection({ equals }) optionalObject?: object;
    @SceneObjectChangeDetection({ equals }) requiredString: string = '';
    @SceneObjectChangeDetection({ equals }) optionalString?: string;
    @SceneObjectChangeDetection({ equals }) requiredNumber: number = 0;
    @SceneObjectChangeDetection({ equals }) optionalNumber?: number;
    @SceneObjectChangeDetection({ equals }) requiredBoolean: boolean = true;
    @SceneObjectChangeDetection({ equals }) optionalBoolean?: boolean;
    @SceneObjectChangeDetection({ equals }) requiredObjectArray: object[] = [];
    @SceneObjectChangeDetection({ equals }) optionalObjectArray?: object[];
    @SceneObjectChangeDetection({ equals }) requiredObjectTuple: [boolean, boolean] = [false, true];
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
    @SceneObjectChangeDetection({ equals }) requiredUnion6: object | object[] = {};
    @SceneObjectChangeDetection({ equals }) optionalUnion6?: object | object[];
}

class TestSceneArrayChangeDetection extends Node {
    @SceneArrayChangeDetection() requiredString: string = '';
    @SceneArrayChangeDetection() optionalString?: string;
    @SceneArrayChangeDetection() requiredNumber: number = 0;
    @SceneArrayChangeDetection() optionalNumber?: number;
    @SceneArrayChangeDetection() requiredBoolean: boolean = true;
    @SceneArrayChangeDetection() optionalBoolean?: boolean;
    @SceneArrayChangeDetection() requiredObject: object = {};
    @SceneArrayChangeDetection() optionalObject?: object;

    @SceneArrayChangeDetection() requiredMutableAnyArray: any[] = [];
    @SceneArrayChangeDetection() optionalMutableAnyArray?: any[];
    @SceneArrayChangeDetection() requiredReadonlyAnyArray: readonly any[] = [];
    @SceneArrayChangeDetection() optionalReadonlyAnyArray?: readonly any[];
    @SceneArrayChangeDetection() requiredMutableAnyTuple: [any, any, any] = [78, 'mystring', false];
    @SceneArrayChangeDetection() optionalMutableAnyTuple?: [any, any, any];
    @SceneArrayChangeDetection() requiredReadonlyAnyTuple: readonly [any, any, any] = [78, 'mystring', false];
    @SceneArrayChangeDetection() optionalReadonlyAnyTuple?: readonly [any, any, any];

    @SceneArrayChangeDetection() requiredMutableObjectArray: object[] = [];
    @SceneArrayChangeDetection() optionalMutableObjectArray?: object[];
    @SceneArrayChangeDetection() requiredReadonlyObjectArray: readonly object[] = [];
    @SceneArrayChangeDetection() optionalReadonlyObjectArray?: readonly object[];
    @SceneArrayChangeDetection() requiredMutableObjectTuple: [object, number, string] = [{}, 7, 's'];
    @SceneArrayChangeDetection() optionalMutableObjectTuple?: [object, number, string, boolean];
    @SceneArrayChangeDetection() requiredReadonlyObjectTuple: readonly [object, number, string] = [{}, 7, 's'];
    @SceneArrayChangeDetection() optionalReadonlyObjectTuple?: readonly [object, number, string, boolean];

    @SceneArrayChangeDetection() requiredReadonlyNumberArray: readonly number[] = [];
    @SceneArrayChangeDetection() optionalReadonlyNumberArray?: readonly number[];
    @SceneArrayChangeDetection() requiredReadonlyNumberTuple: readonly [number, number] = [0, 0];
    @SceneArrayChangeDetection() optionalReadonlyNumberTuple?: readonly [number, number];
    @SceneArrayChangeDetection() requiredMutableNumberArray: number[] = [];
    @SceneArrayChangeDetection() optionalMutableNumberArray?: number[] = [];
    @SceneArrayChangeDetection() requiredMutableNumberTuple: [number, number] = [0, 0];
    @SceneArrayChangeDetection() optionalMutableNumberTuple?: [number, number];

    @SceneArrayChangeDetection() requiredUnion1: number | readonly [number, number] = 0;
    @SceneArrayChangeDetection() optionalUnion1?: number | readonly [number, number];
    @SceneArrayChangeDetection() requiredUnion2: number | readonly string[] = 0;
    @SceneArrayChangeDetection() optionalUnion2?: number | readonly string[];
    @SceneArrayChangeDetection() requiredUnion3: object | readonly [number, number] = {};
    @SceneArrayChangeDetection() optionalUnion3?: object | readonly [number, number];
    @SceneArrayChangeDetection() requiredUnion4: object | readonly string[] = ['a', 'b', 'c'];
    @SceneArrayChangeDetection() optionalUnion4?: object | readonly string[];
    @SceneArrayChangeDetection() requiredUnion5: object | readonly boolean[] | string = [true, false];
    @SceneArrayChangeDetection() optionalUnion5?: object | readonly boolean[] | string;
    @SceneArrayChangeDetection() requiredUnion6: object | object[] = {};
    @SceneArrayChangeDetection() optionalUnion6?: object | object[];
}

abstract class TestIgnoredDecorator extends SeriesProperties<any> {
    @Property() lineDash?: number[];
    @Property() node: object[] = [];
}
