let env = 'unknown';
if (process.env.CI != null) {
  env = 'ci';
} else if (process.env.NX_TASK_TARGET_PROJECT != null) {
  env = 'nx-task';
}

module.exports = {
  extends: ['../../.eslintrc.json', 'plugin:sonarjs/recommended'],
  ignorePatterns: ['!**/*', '.dependency-cruiser.js', '.eslintrc.js'],
  rules: {
    // Show this warning in IDE and PRs, but not when running at command line (to reduce clutter).
    'sonarjs/cognitive-complexity': env !== 'nx-task' ? 1 : 0,
    '@nx/dependency-checks': 1,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
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
      files: ['*.test.ts', '*.test.tsx', '**/test/*.ts'],
      rules: {
        'sonarjs/no-duplicate-string': 0,
      },
    },
  ],
};
