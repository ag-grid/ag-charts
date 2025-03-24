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
