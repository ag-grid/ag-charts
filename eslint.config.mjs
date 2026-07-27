import pluginJs from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import lintChangeDetection from './libraries/ag-charts-eslint-rules/rules/change-detection.mjs';
import noUnscopedLogger from './libraries/ag-charts-eslint-rules/rules/no-unscoped-logger.mjs';
import requireExplicitGeneric from './libraries/ag-charts-eslint-rules/rules/require-explicit-generic.mjs';
import requireSharedRenderer from './libraries/ag-charts-eslint-rules/rules/require-shared-renderer.mjs';

// Path fragments of the files sanctioned to call `new Logger()`; everything else uses `ctx.logger` or
// the shared `Logger.default`. Tests construct loggers freely.
// The complete set of files that log without a chart. Each one is here because no chart context
// reaches it — not because threading one was inconvenient. Anything added here needs the same
// justification, and anything that gains a reachable chart context should come off the list.
const SANCTIONED_AMBIENT_LOGGING = [
    '/logging/logger.ts',
    // Pixel-boundary coercion called from everywhere; a logger parameter would be viral.
    '/utils/data/numbers.ts',
    // `BaseProperties.set()`, reached from programmatic property assignment with no chart to hand.
    // Option-driven unknown properties are already reported as validation errors.
    '/state/properties.ts',
    // Cycle detection in the generic JSON walker.
    '/utils/data/json.ts',
    // Runs before any chart exists.
    '/util/browser.ts',
    '/util/time-interop.ts',
    '/chart/mapping/themes.ts',
    '/chart/factory/processModuleOptions.ts',
    // Pure parsers and formatters with no owner.
    '/util/svg.ts',
    '/locale/defaultMessageFormatter.ts',
    // Static `FormatManager.getFormatter`, reached from properties classes with no chart.
    '/chart/formatter/formatManager.ts',
    // Global error interception, by definition not attributable to one chart.
    '/util/listeners.ts',
    // Development-only diagnostics.
    '/scene/sceneDebug.ts',
    // SVG export walks the scene graph outside a render pass.
    '/scene/shape/text.ts',
    // Test helpers.
    '/util/test/mockConsole.ts',
];

const SANCTIONED_LOGGER_CONSTRUCTION = [
    '/logging/logger.ts',
    // The chart's single instance, adopted by the chart context.
    '/module/optionsModule.ts',
    // Only for a Scene with no owning chart (AG Grid sparklines / mini charts).
    '/scene/scene.ts',
    '.test.',
    '.spec.',
];

let env = 'unknown';
if (process.env.CI != null) {
    env = 'ci';
} else if (process.env.NX_TASK_TARGET_PROJECT != null) {
    env = 'nx-task';
}

export const testDefaults = {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
    languageOptions: {
        globals: {
            afterAll: 'readonly',
            afterEach: 'readonly',
            beforeAll: 'readonly',
            beforeEach: 'readonly',
            describe: 'readonly',
            expect: 'readonly',
            it: 'readonly',
            test: 'readonly',
            vi: 'readonly',
        },
    },
    rules: {
        'no-console': 0,
        '@typescript-eslint/no-for-in-array': 0,
        '@typescript-eslint/no-unsafe-assignment': 0,
        '@typescript-eslint/no-unsafe-argument': 0,
        '@typescript-eslint/no-unsafe-call': 0,
        '@typescript-eslint/no-unsafe-member-access': 0,
        'sonarjs/assertions-in-tests': 0,
        'sonarjs/no-empty-test-file': 0,
        'sonarjs/stable-tests': 0,
        'sonarjs/slow-regex': 0,
        'sonarjs/no-duplicate-string': 0,
        'sonarjs/no-nested-functions': 0,
        'sonarjs/pseudo-random': 0,
    },
};

export const sonarjsConfig = [
    sonarjs.configs.recommended,
    {
        files: ['**/*.{js,ts}'],
        rules: {
            // Rules moved from sonarjs to @typescript-eslint.
            '@typescript-eslint/no-redeclare': 2,

            // Make these warnings only; ideally only shown in IDE and PRs - but unused rule errors happen otherwise if not enabled.
            'sonarjs/cognitive-complexity': 1,
            'sonarjs/no-duplicate-string': 1,
            'sonarjs/todo-tag': 1,
            'sonarjs/fixme-tag': 1,
            'sonarjs/function-return-type': 1,
            'sonarjs/no-selector-parameter': 1,
            'sonarjs/redundant-type-aliases': 1,

            // We don't really care about these.
            'sonarjs/new-cap': 0,
            'sonarjs/deprecation': 1,
            'sonarjs/use-type-alias': 1,
            'sonarjs/different-types-comparison': 1,
            'sonarjs/public-static-readonly': 1,
            'sonarjs/regex-complexity': 1,

            // Duplicates @typescript-eslint
            'sonarjs/sonar-no-unused-vars': 0,
            'sonarjs/no-unused-vars': 0,
            'sonarjs/no-redundant-type-constituents': 0,
            'sonarjs/sonar-prefer-optional-chain': 0,
            'sonarjs/no-base-to-string': 0,
            'sonarjs/no-misused-promises': 0,

            // Server/cloud security rules — cannot fire in a browser-only canvas charting library
            // with zero runtime dependencies. Disabled to cut lint time without affecting coverage.
            'sonarjs/aws-apigateway-public-api': 0,
            'sonarjs/aws-ec2-rds-dms-public': 0,
            'sonarjs/aws-ec2-unencrypted-ebs-volume': 0,
            'sonarjs/aws-efs-unencrypted': 0,
            'sonarjs/aws-iam-all-privileges': 0,
            'sonarjs/aws-iam-privilege-escalation': 0,
            'sonarjs/aws-iam-public-access': 0,
            'sonarjs/aws-opensearchservice-domain': 0,
            'sonarjs/aws-rds-unencrypted-databases': 0,
            'sonarjs/aws-restricted-ip-admin-access': 0,
            'sonarjs/aws-s3-bucket-granted-access': 0,
            'sonarjs/aws-sagemaker-unencrypted-notebook': 0,
            'sonarjs/aws-sns-unencrypted-topics': 0,
            'sonarjs/aws-sqs-unencrypted-queue': 0,
            'sonarjs/content-length': 0,
            'sonarjs/content-security-policy': 0,
            'sonarjs/cookie-no-httponly': 0,
            'sonarjs/cors': 0,
            'sonarjs/csrf': 0,
            'sonarjs/disabled-auto-escaping': 0,
            'sonarjs/disabled-resource-integrity': 0,
            'sonarjs/encryption-secure-mode': 0,
            'sonarjs/file-permissions': 0,
            'sonarjs/file-uploads': 0,
            'sonarjs/hashing': 0,
            'sonarjs/hidden-files': 0,
            'sonarjs/insecure-cookie': 0,
            'sonarjs/insecure-jwt-token': 0,
            'sonarjs/no-clear-text-protocols': 0,
            'sonarjs/no-hardcoded-ip': 0,
            'sonarjs/no-hardcoded-passwords': 0,
            'sonarjs/no-hardcoded-secrets': 0,
            'sonarjs/no-ip-forward': 0,
            'sonarjs/no-os-command-from-path': 0,
            'sonarjs/no-unsafe-unzip': 0,
            'sonarjs/no-weak-cipher': 0,
            'sonarjs/os-command': 0,
            'sonarjs/publicly-writable-directories': 0,
            'sonarjs/session-regeneration': 0,
            'sonarjs/unverified-certificate': 0,
            'sonarjs/unverified-hostname': 0,
            'sonarjs/weak-ssl': 0,
            'sonarjs/x-powered-by': 0,
            'sonarjs/xml-parser-xxe': 0,

            // Unicorn rules, as referenced from the SonarCloud documentation.
            'unicorn/prefer-export-from': 2,
            'unicorn/prefer-math-trunc': 2,
            'unicorn/prefer-at': 2,
            'unicorn/prefer-number-properties': 2,
            'unicorn/no-array-for-each': 2,
            'unicorn/prefer-dom-node-remove': 2,
            'unicorn/prefer-global-this': 2,
            'unicorn/prefer-includes': 2,
            'unicorn/no-zero-fractions': 2,
        },
    },
];

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.{js,mjs,cjs,ts}'], linterOptions: { reportUnusedDisableDirectives: 'error' } },
    {
        ignores: [
            '**/node_modules',
            '**/dist',
            '**/typings',
            '**/eslint.config.mjs',
            '**/vitest.*.{cjs,js,ts}',
            '**/benchmarks/*.cjs',
            '**/.dependency-cruiser.js',
            '**/.size-limit.js',
        ],
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        files: ['**/src/**/*'],
        ignores: ['**/src/pages/**'], // Ignore astro pages
        plugins: {
            'check-file': checkFile,
        },
        rules: {
            'check-file/folder-naming-convention': [
                'error',
                {
                    'src/**/!(__mocks__)/': 'KEBAB_CASE',
                },
            ],
        },
    },
    {
        files: ['**/*.{js,ts,tsx,mjs}'],
        plugins: {
            aglint: {
                rules: {
                    'require-explicit-generic': requireExplicitGeneric,
                    'require-shared-renderer': requireSharedRenderer,
                    'change-detection': lintChangeDetection,
                    'no-unscoped-logger': noUnscopedLogger,
                },
            },
            unicorn,
        },
        rules: {
            'no-lonely-if': 2,
            'unicorn/no-negated-condition': 2,
            'no-nested-ternary': 2,
            'no-unneeded-ternary': 2,
            'no-eval': 2,
            'no-console': 2,
            'no-unused-vars': 0,
            'no-case-declarations': 0,
            'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
            'aglint/change-detection': 2,
            // Ban `new Logger()` everywhere but the sanctioned construction sites; the per-package
            // static-emitter ban is layered on below.
            'aglint/no-unscoped-logger': [2, { allowNewIn: SANCTIONED_LOGGER_CONSTRUCTION }],
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/consistent-type-imports': 0,
            '@typescript-eslint/no-redundant-type-constituents': 2,
            '@typescript-eslint/no-floating-promises': 2,
            '@typescript-eslint/no-implied-eval': 2,
            '@typescript-eslint/no-shadow': 2,
            '@typescript-eslint/prefer-as-const': 2,
            '@typescript-eslint/prefer-nullish-coalescing': 2,
            '@typescript-eslint/prefer-optional-chain': 2,
            '@typescript-eslint/prefer-readonly': 2,
            '@typescript-eslint/prefer-ts-expect-error': 2,
            '@typescript-eslint/prefer-literal-enum-member': ['error', { allowBitwiseExpressions: true }],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-for-in-array': 2,
            '@typescript-eslint/restrict-template-expressions': [
                'error',
                {
                    allowArray: true,
                    allowBoolean: true,
                    allowNumber: true,
                    allow: ['Date'],
                },
            ],
            '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],

            // We don't really care about these.
            '@typescript-eslint/no-unsafe-return': 0,
            '@typescript-eslint/no-unsafe-call': 0,
            '@typescript-eslint/no-unsafe-assignment': 0,
            '@typescript-eslint/no-unsafe-function-type': 0,
            '@typescript-eslint/no-unsafe-argument': 0,
            '@typescript-eslint/no-unsafe-member-access': 0,
            '@typescript-eslint/no-base-to-string': 0,
            '@typescript-eslint/no-this-alias': 0,
        },
    },
    {
        files: ['**/*.{js,ts,tsx}'],
        ignores: ['**/*.{spec,test}.ts'],
        rules: {
            'no-restricted-properties': [
                'error',
                {
                    object: 'Object',
                    property: 'entries',
                    message: 'Prefer Object.keys() to Object.entries() for performance reasons.',
                },
                {
                    property: 'stopPropagation',
                    message: 'AG Charts must all bubble events. See AG-16736.',
                },
                {
                    property: 'stopImmediatePropagation',
                    message: 'AG Charts must all bubble events. See AG-16736.',
                },
            ],
        },
    },
    testDefaults,
    {
        files: ['packages/*/tools/*.ts'],
        rules: {
            '@typescript-eslint/consistent-type-imports': 0,
            'no-console': 0,
        },
    },
    {
        files: [
            'packages/ag-charts-core/src/**/*.{ts,tsx}',
            'packages/ag-charts-community/src/**/*.{ts,tsx}',
            'packages/ag-charts-enterprise/src/**/*.{ts,tsx}',
        ],
        ignores: ['**/*.{test,spec}.ts'],
        rules: {
            'aglint/no-unscoped-logger': [
                2,
                {
                    allowNewIn: SANCTIONED_LOGGER_CONSTRUCTION,
                    checkStatic: true,
                    allowAmbientIn: SANCTIONED_AMBIENT_LOGGING,
                },
            ],
        },
    },
];
