import {
    COMPILER_OPTION_ENUMS,
    COMPILER_OPTION_NAMES,
    getCompilerOptions,
    resolveCompilerOptions,
} from '@utils/example-modules/transformExampleModule';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';

import { getTranspilerOptions } from './BrowserTranspiler';

const CLIENT_PATH = join(__dirname, '../../../../../public/example-runner/example-runner.js');
const clientSource = readFileSync(CLIENT_PATH, 'utf8');

describe('example-runner.js runTranspiled', () => {
    test('carries the same enum map the options are named against', () => {
        const match = clientSource.match(/const COMPILER_OPTION_ENUMS = \{([^}]*)\};/);
        expect(match, 'COMPILER_OPTION_ENUMS not found in example-runner.js').not.toBeNull();

        const inClient = Object.fromEntries(
            Array.from(match![1].matchAll(/(\w+): '([^']*)'/g), ([, name, value]) => [name, value])
        );

        expect(inClient).toEqual({ ...COMPILER_OPTION_ENUMS });
    });

    test('names every enum option, so the page says what it selects', () => {
        for (const name of Object.keys(COMPILER_OPTION_NAMES)) {
            if (name in COMPILER_OPTION_ENUMS) {
                expect(typeof COMPILER_OPTION_NAMES[name], name).toBe('string');
            }
        }
    });

    test('resolves the names the page carries to the options the server transpiles with', () => {
        expect(resolveCompilerOptions(ts, COMPILER_OPTION_NAMES)).toEqual(getCompilerOptions(ts));
    });
});

describe('getTranspilerOptions', () => {
    const options = getTranspilerOptions('main.ts');

    test('names the entry file relative to the page, which is where it is served', () => {
        expect(options.entry).toBe('./main.ts');
    });

    test('survives the round trip through the page as JSON, since that is how it travels', () => {
        expect(JSON.parse(JSON.stringify(options))).toEqual(options);
    });

    test('carries the regex sources rather than regexes, which JSON cannot express', () => {
        for (const key of ['specifierRegex', 'cssImportRegex', 'assetRegex', 'moduleExtensionRegex'] as const) {
            expect(typeof options[key], key).toBe('string');
            expect(() => new RegExp(options[key])).not.toThrow();
        }
    });

    test('carries the stylesheet loader name the server-side transform emits calls to', () => {
        expect(options.stylesheetLoaderName).toBe('__agLoadStylesheet');
    });
});
