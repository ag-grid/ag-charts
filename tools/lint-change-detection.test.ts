import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Stub decorator implementations
function SceneChangeDetection() {
    return function (_target: any, _key: string) {};
}
function ScenePathChangeDetection() {
    return function (_target: any, _key: string) {};
}
function SceneObjectChangeDetection() {
    return function (_target: any, _key: string) {};
}
function SceneArrayChangeDetection() {
    return function (_target: any, _key: string) {};
}

// Test class with decorator usages
export class TestDecoratorUsages {
    @SceneChangeDetection() requiredString: string = '';
    @SceneChangeDetection() optionalString?: string;
    @SceneChangeDetection() requiredNumber: number = 0;
    @SceneChangeDetection() optionalNumber?: number;
    @SceneChangeDetection() requiredBoolean: boolean = true;
    @SceneChangeDetection() optionalBoolean?: boolean;
    @SceneChangeDetection() requiredObject: object = {};
    @SceneChangeDetection() optionalObject?: object;
    @SceneChangeDetection() requiredArray: any[] = [];
    @SceneChangeDetection() optionalArray?: any[];

    @ScenePathChangeDetection() requiredPathString: string = '';
    @ScenePathChangeDetection() optionalPathString?: string;
    @ScenePathChangeDetection() requiredPathNumber: number = 0;
    @ScenePathChangeDetection() optionalPathNumber?: number;
    @ScenePathChangeDetection() requiredPathBoolean: boolean = true;
    @ScenePathChangeDetection() optionalPathBoolean?: boolean;
    @ScenePathChangeDetection() requiredPathObject: object = {};
    @ScenePathChangeDetection() optionalPathObject?: object;
    @ScenePathChangeDetection() requiredPathArray: any[] = [];
    @ScenePathChangeDetection() optionalPathArray?: any[];

    @SceneObjectChangeDetection() requiredObjectDetection: object = {};
    @SceneObjectChangeDetection() optionalObjectDetection?: object;

    @SceneArrayChangeDetection() requiredArrayDetection: any[] = [];
    @SceneArrayChangeDetection() optionalArrayDetection?: any[];
}

describe('lint-change-detection', () => {
    const testFilePath = path.resolve(__dirname, 'lint-change-detection.test.ts');
    const lintScriptPath = path.resolve(__dirname, 'lint-change-detection.js');

    it('should match the expected linting errors snapshot', () => {
        try {
            const output = execSync(`node ${lintScriptPath} ${testFilePath}`, {
                encoding: 'utf-8',
                stdio: 'pipe',
            });
            expect(output).toMatchSnapshot();
        } catch (error: any) {
            expect(error.stdout).toMatchSnapshot();
        }
    });
});
