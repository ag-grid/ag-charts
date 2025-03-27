import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Stub decorator implementations
function SceneChangeDetection() {
    return function (_target: any, _key: string) {};
}
function SceneObjectChangeDetection() {
    return function (_target: any, _key: string) {};
}
function SceneArrayChangeDetection() {
    return function (_target: any, _key: string) {};
}
function ProxyProperty(_proxyPath: string) {
    return function (_target: any, _key: string) {};
}

// Test class with decorator usages
export class Test_SceneChangeDetection {
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

export class Test_SceneObjectChangeDetection {
    @SceneObjectChangeDetection() requiredString: string = '';
    @SceneObjectChangeDetection() optionalString?: string;
    @SceneObjectChangeDetection() requiredNumber: number = 0;
    @SceneObjectChangeDetection() optionalNumber?: number;
    @SceneObjectChangeDetection() requiredBoolean: boolean = true;
    @SceneObjectChangeDetection() optionalBoolean?: boolean;
    @SceneObjectChangeDetection() requiredObject: object = {};
    @SceneObjectChangeDetection() optionalObject?: object;
    @SceneObjectChangeDetection() requiredObjectArray: object[] = [];
    @SceneObjectChangeDetection() optionalObjectArray?: object[];
    @SceneObjectChangeDetection() requiredObjectTuple: [boolean, boolean] = [false, true];
    @SceneObjectChangeDetection() optionalObjectTuple?: [boolean, boolean];

    @SceneObjectChangeDetection() requiredUnion1: number | readonly [number, number] = 0;
    @SceneObjectChangeDetection() optionalUnion1?: number | readonly [number, number];
    @SceneObjectChangeDetection() requiredUnion2: number | readonly string[] = 0;
    @SceneObjectChangeDetection() optionalUnion2?: number | readonly string[];
    @SceneObjectChangeDetection() requiredUnion3: object | readonly [number, number] = {};
    @SceneObjectChangeDetection() optionalUnion3?: object | readonly [number, number];
    @SceneObjectChangeDetection() requiredUnion4: object | readonly string[] = ['a', 'b', 'c'];
    @SceneObjectChangeDetection() optionalUnion4?: object | readonly string[];
    @SceneObjectChangeDetection() requiredUnion5: object | readonly boolean[] | string = [true, false];
    @SceneObjectChangeDetection() optionalUnion5?: object | readonly boolean[] | string;
    @SceneObjectChangeDetection() requiredUnion6: object | object[] = {};
    @SceneObjectChangeDetection() optionalUnion6?: object | object[];
}

export class Test_SceneArrayChangeDetection {
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

    @SceneArrayChangeDetection() requiredMutableNumberArray: number[] = [];
    @SceneArrayChangeDetection() optionalMutableNumberArray?: number[] = [];
    @SceneArrayChangeDetection() requiredReadonlyNumberArray: readonly number[] = [];
    @SceneArrayChangeDetection() optionalReadonlyNumberArray?: readonly number[];
    @SceneArrayChangeDetection() requiredMutableNumberTuple: [number, number] = [0, 0];
    @SceneArrayChangeDetection() optionalMutableNumberTuple?: [number, number];
    @SceneArrayChangeDetection() requiredReadonlyNumberTuple: readonly [number, number] = [0, 0];
    @SceneArrayChangeDetection() optionalReadonlyNumberTuple?: readonly [number, number];

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

export class Test_ProxyProperty {
    @ProxyProperty('marker.lineDash') lineDash?: number[];
}

describe('lint-change-detection', () => {
    const testFilePath = 'tools/lint-change-detection.test.ts';
    const lintScriptPath = path.resolve(__dirname, 'lint-change-detection.js');

    it('should match the expected linting errors snapshot', () => {
        let stdout: string | undefined;
        let stderr: string | undefined;
        try {
            stdout = execSync(`node ${lintScriptPath} --relative-path ${testFilePath}`, {
                encoding: 'utf-8',
                stdio: 'pipe',
            });
        } catch (error: any) {
            stdout = error.stdout;
            stderr = error.stderr;
        }
        expect({ stdout, stderr }).toMatchSnapshot();
    });
});
