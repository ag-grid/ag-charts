# ESLint Auto-Fix Tool

Analyze ESLint violations or fix a specific rule in isolation.

## Usage

### Report Mode (No Arguments)

```
/lint-fix
```

Shows top ESLint violations by count with recommendations.

### Fix Mode (With Rule Name)

```
/lint-fix <rule-name>
```

**Examples:**

-   `/lint-fix unicorn/no-zero-fractions`
-   `/lint-fix unicorn/prefer-number-properties`
-   `/lint-fix unicorn/no-array-for-each`

---

## Instructions for AI Agent

### When Invoked WITHOUT Arguments (Report Mode)

1. **Run ESLint and analyze violations:**

    ```bash
    nx run-many -t lint:eslint 2>&1 | tee /tmp/eslint-output.txt
    ```

2. **Count violations by rule:**

    ```bash
    grep -oE 'unicorn/[a-z-]+|@typescript-eslint/[a-z-]+|no-[a-z-]+|sonarjs/[a-z-]+' /tmp/eslint-output.txt | sort | uniq -c | sort -rn | head -20
    ```

3. **Generate a formatted report showing:**

    - Top 10-15 violations ranked by count
    - Which rules are auto-fixable (✅) vs manual (❌)
    - Recommended next rule to fix (highest count auto-fixable)
    - Brief description of what each rule fixes
    - Total warning/error count

4. **Format output as a table:**

    ```markdown
    ## ESLint Violations Report

    | Rank | Rule                             | Count | Auto-Fix | Description                           |
    | ---- | -------------------------------- | ----- | -------- | ------------------------------------- |
    | 1    | unicorn/prefer-number-properties | 170   | ✅       | Use Number.\* APIs instead of globals |
    | 2    | unicorn/no-array-for-each        | 166   | ✅       | Prefer for...of over .forEach()       |
    | 3    | no-negated-condition             | 37    | ❌       | Prefer positive conditions            |

    ...
    ```

5. **Provide actionable recommendation:**

    ```markdown
    ### 🎯 Recommended Next Fix

    **`unicorn/prefer-number-properties`** - 170 violations

    -   Auto-fixable: ✅ Yes
    -   Changes: `isNaN()` → `Number.isNaN()`, `parseInt()` → `Number.parseInt()`
    -   Impact: Better global scope hygiene
    -   Risk: Low - semantically equivalent

    **To fix:** `/lint-fix unicorn/prefer-number-properties`
    ```

6. **Include summary statistics:**
    - Total warnings across all packages
    - Percentage of auto-fixable violations
    - Reference to `eslint-warnings-summary.md` for detailed tracking

---

### When Invoked WITH a Rule Name (Fix Mode)

Execute the isolated auto-fix procedure:

#### 1. Backup Config

```bash
cp eslint.config.mjs eslint.config.mjs.backup
```

#### 2. Modify `eslint.config.mjs`

**A. In `sonarjsConfig` export (~line 40-78):**

-   Set ALL rules to `0` (disabled)
-   Set ONLY the target rule to `2` (error level for auto-fix)

**B. In main config rules (~line 122-176):**

-   Set ALL rules to `0`

**C. In other sections:**

-   Set `no-restricted-properties` to `0` (~line 165-171)

Example modification:

```javascript
// In sonarjsConfig:
rules: {
    // TEMPORARY: All rules disabled except TARGET for isolated auto-fix
    'sonarjs/cognitive-complexity': 0,
    'sonarjs/no-duplicate-string': 0,
    // ... all other rules set to 0 ...

    'TARGET_RULE': 2,  // ONLY THIS RULE ENABLED
}
```

#### 3. Run Auto-Fix

```bash
nx run-many -t lint:eslint --fix 2>&1 | tee /tmp/eslint-fix-output.txt
```

#### 4. Restore Config

```bash
mv eslint.config.mjs.backup eslint.config.mjs
```

#### 5. Format & Verify

```bash
# Format all changes
nx format

# Verify fix worked (should output 0)
nx run-many -t lint:eslint 2>&1 | grep 'TARGET_RULE' | wc -l

# Check what changed
git status --short
git diff --stat
```

#### 6. Review Changes

Review the changes and ensure:

-   Only code relating to the target rule is changed.
-   Codebase formatting conventions are maintained.

#### 7. Verify Changes Built and Passed Tests

Verify the changes built and passed tests:

```bash
nx build
nx lint
nx test
nx blt
```

#### 8. Report Results

Provide a comprehensive summary:

-   **Violations fixed:** Before count → After count (0)
-   **Files modified:** N files
-   **Test results:** All passing ✅ / X failing ❌
-   **Example changes:** Show 1-2 representative diff snippets
-   **Total impact:** X% reduction in total warnings

Example format:

```markdown
## ✅ Fix Complete: `<RULE_NAME>`

### Summary

-   **Violations Fixed:** 175 → 0
-   **Files Modified:** 43
-   **Tests:** ✅ All passing
-   **Impact:** 22% reduction in total warnings

### Example Changes

\`\`\`diff

-   { temperature: 10.0, lower: 8.0 }

*   { temperature: 10, lower: 8 }
    \`\`\`
```

#### 9. Prepare Commit Message

Generate commit message (DO NOT commit automatically):

```
Fix <RULE_NAME> ESLint warnings

- Fixed N violations across M files
- Changes: <brief description of what changed>
- All tests passing
- No functional changes, formatting only
```

**Wait for user confirmation before committing.**

---

## Common Rules Reference

| Rule                               | Auto-Fix | What It Changes           | Example                                        |
| ---------------------------------- | -------- | ------------------------- | ---------------------------------------------- |
| `unicorn/no-zero-fractions`        | ✅       | Remove `.0` from integers | `10.0` → `10`                                  |
| `unicorn/prefer-number-properties` | ✅       | Use `Number.*` APIs       | `isNaN()` → `Number.isNaN()`                   |
| `unicorn/no-array-for-each`        | ✅       | Convert to `for...of`     | `.forEach(x => ...)` → `for (const x of arr)`  |
| `unicorn/prefer-export-from`       | ✅       | Direct re-export          | `import X; export {X}` → `export {X} from 'y'` |
| `unicorn/prefer-math-trunc`        | ✅       | Use `Math.trunc()`        | `x \| 0` → `Math.trunc(x)`                     |
| `unicorn/prefer-at`                | ✅       | Use `.at()` method        | `arr[arr.length-1]` → `arr.at(-1)`             |
| `unicorn/prefer-global-this`       | ✅       | Standardize global        | `window`/`global` → `globalThis`               |
| `unicorn/prefer-includes`          | ✅       | Use `.includes()`         | `.indexOf(x) !== -1` → `.includes(x)`          |
| `unicorn/prefer-dom-node-remove`   | ✅       | Use `.remove()`           | `parent.removeChild(node)` → `node.remove()`   |
| `no-negated-condition`             | ❌       | Prefer positive logic     | Manual review required                         |

---

## Important Notes

-   ✅ **One rule at a time** - Never enable multiple rules simultaneously
-   ✅ **Verify thoroughly** - Always check test results before committing
-   ✅ **Track progress** - Update `eslint-warnings-summary.md` after each fix
-   ✅ **Review changes** - Use `git diff` to spot-check automated fixes
-   ⚠️ **Manual rules** - Rules marked ❌ require case-by-case review
-   📊 **Monitor impact** - Track total warning reduction over time

---

## Troubleshooting

### Issue: Fix changes unrelated code

**Solution:** Verify ALL other rules are disabled in both `sonarjsConfig` AND main config `rules` section.

### Issue: Rule violations still present after fix

**Solution:** Ensure target rule is set to `2` (error), not `1` (warning). Only errors trigger auto-fix.

### Issue: Tests fail after auto-fix

**Solution:** Review specific changes with `git diff`, check if semantic meaning changed unexpectedly.
