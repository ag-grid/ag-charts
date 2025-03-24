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
}

export class Test_SceneArrayChangeDetection {
    @SceneArrayChangeDetection() requiredAnyArray: any[] = [];
    @SceneArrayChangeDetection() optionalAnyArray?: any[];
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
