import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import base from '../../eslint.config.mjs';

export default [
    ...base,
    {
        plugins: {
            'react-hooks': reactHooksPlugin,
        },
        rules: reactHooksPlugin.configs.recommended.rules,
    },
    {
        // seeds/ is generated from src/demos (already linted here) and carries its own tsconfigs.
        ignores: ['dist/', 'seeds/', 'e2e/parity/results/', 'test-results/', 'playwright-report/'],
    },
    {
        languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
    },
    {
        // The Playwright specs, the parity harness and their configs run in Node, typed by their own
        // tsconfig rather than the app's.
        files: ['e2e/**/*.ts', 'playwright.config.ts', 'playwright.parity.config.ts'],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: false,
                project: './tsconfig.e2e.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        // Node scripts outside any tsconfig: lint them untyped, as Node code.
        files: ['tools/**/*.mjs', 'e2e/**/*.mjs'],
        ...tseslint.configs.disableTypeChecked,
        languageOptions: {
            ...tseslint.configs.disableTypeChecked.languageOptions,
            globals: globals.node,
        },
        rules: {
            ...tseslint.configs.disableTypeChecked.rules,
            // Needs type information, which these files have none of.
            'aglint/change-detection': 'off',
        },
    },
    {
        rules: {
            'no-eval': 'error',
            'no-console': 'error',
            'import-x/consistent-type-specifier-style': 'off',
        },
    },
];
