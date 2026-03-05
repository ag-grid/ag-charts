---
root: false
targets: ['*']
description: 'Testing strategies, best practices, and philosophy for AG Charts development'
globs: ['**/*.test.ts', '**/*.spec.ts', '**/test/**', '**/__tests__/**']
---

# Testing Guide

This guide covers testing strategies, best practices, and philosophy for AG Charts development.

## Testing Strategy

-   **Unit tests**: Jest with jsdom environment and image snapshots
-   **E2E tests**: Playwright for website interaction testing
-   **Benchmarks**: Performance regression testing with memory profiling
-   **Visual regression**: Canvas rendering snapshot comparisons

## Testing Best Practices

-   **Test real implementations, not helpers**: Avoid creating test helper functions that duplicate production logic. Instead, test the actual implementation through its public API (e.g., using `DataSet` to test data operations rather than a helper function that reimplements the logic).
-   **Look for existing patterns first**: Before writing new tests, review similar existing tests to maintain consistency in:
    -   Verification patterns (e.g., if similar tests verify domains, yours should too)
    -   Test structure and organization
    -   Assertion styles and completeness
-   **Test completeness checklist**:
    -   Do similar tests verify more properties that this one should also verify?
    -   Are all important outputs verified (data, keys, columns, domains, metadata, etc.)?
    -   Does this test exercise the real code path users will hit?
-   **Naming clarity**: Variable and parameter names should clearly convey intent, especially for boolean flags (e.g., `columnNeedValueOf` is clearer than `columnValueTypes` for a boolean array).

## Test Philosophy

-   **Test behavior, not implementation**: Focus on what the code does, not how it does it
-   **Use parameterized tests**: Consolidate similar test cases with `test.each()`
-   **Avoid brittle assertions**: Don't assert exact array indices or internal state unless necessary
-   **Keep tests focused**: One behavior per test, clear test names
-   **Simplify test helpers**: Prefer simple operation counters over complex tracking mechanisms

## Code Quality Tools

-   **ESLint**: Comprehensive setup with TypeScript rules, SonarJS, and custom AG Charts rules
-   **TypeScript**: Strict type checking with multiple tsconfig files for different build targets
-   **Nx**: Advanced caching and task orchestration for optimal build performance

## Essential Test Commands

-   `yarn nx test <package>` – execute Jest suites for the affected package
-   `yarn nx test <package> --testPathPattern="<file-name>"` - test specific test file
-   `yarn nx test <package> --testPathPattern="<file-name>" --testNamePattern="<test-name>"` - test specific test name in a specific test file
-   `yarn nx e2e <package>` – run Playwright flows when altering website behaviour
-   `yarn nx benchmark <package>` – assess performance regressions; filter via `-- -t "pattern"` when needed

## Baseline Verification

After meaningful chart changes, expect to run:

-   `yarn nx test ag-charts-community`
-   `yarn nx test ag-charts-enterprise`
-   `yarn nx test:e2e ag-charts-website`

## Test Verification Patterns

When writing or modifying tests, review similar tests to ensure consistent verification patterns. For example, if similar tests verify domains, your tests should too.
