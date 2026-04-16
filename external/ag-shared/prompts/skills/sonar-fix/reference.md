# Sonar-Fix Reference

## Component Key Reference

SonarCloud uses these component keys:

-   `ag-charts-community-latest` (default) - Community package
-   `ag-charts-enterprise-latest` - Enterprise package
-   Additional packages may be added in the future

The API returns paths like:

```
ag-charts-community-latest:packages/ag-charts-core/src/utils/validation.ts
```

Strip the prefix to get the actual file path:

```
packages/ag-charts-core/src/utils/validation.ts
```

---

## Important Notes

### Safety and Verification

-   ✅ **Always format after changes:** Use `yarn nx format` to ensure consistency
-   ✅ **Verify each batch:** Run lint and type checks for affected packages
-   ✅ **Commit frequently:** One commit per batch for easy rollback
-   ✅ **Read file context:** Always read surrounding code before making changes
-   ✅ **Preserve style:** Match existing code style and patterns
-   ❌ **Never batch-modify** without reading each file individually
-   ❌ **Don't fix issues blindly** - verify they still exist in current code
-   ❌ **Avoid complex refactors** in quick-fix mode - flag for separate tasks

### When to Skip Issues

-   **Already fixed:** Issue no longer exists in current codebase
-   **Documented exceptions:** Issue matches a pattern in the rule guide's "Important Exceptions" section
-   **Generated code:** Files with generation markers or in generated directories
-   **Test-specific patterns:** Some patterns are acceptable in tests
-   **Complex refactoring needed:** Effort > 15 minutes per issue
-   **Requires architectural changes:** Better as dedicated task

**For documented exceptions:** Always add a skip reason in the progress file noting which exception pattern matched, e.g., "Skipped: matches globalThis.window exception in S7741"

### Error Recovery

If verification fails:

1. Review the specific errors
2. Attempt to fix the introduced issues
3. Re-run verification
4. If unable to fix within 2-3 attempts:
    - Revert the entire batch: `git reset --hard HEAD~1`
    - Report to user which batch failed and why
    - Continue with next batch if user confirms

### Testing Recommendations

After fixing significant numbers of issues:

```bash
# Run core tests
nx test ag-charts-community
nx test ag-charts-enterprise

# Run builds
nx build ag-charts-community
nx build ag-charts-enterprise

# Run benchmarks if performance-related rules were fixed
nx benchmark ag-charts-community -- -t "pattern"
```

---

## Common Issues & Troubleshooting

### Issue: WebFetch returns incomplete data

**Solution:**

-   Check if `paging.total > paging.pageSize`
-   Fetch additional pages with `&p=2`, `&p=3`, etc.
-   Combine results from all pages

### Issue: File path not found

**Solution:**

-   Verify the component prefix was stripped correctly
-   Check if file was moved/deleted since SonarCloud scan
-   Skip the issue and note it in the report

### Issue: Fix breaks tests

**Solution:**

-   Review the specific fix pattern used
-   Check if the code had hidden side effects
-   Revert the change and add to "requires manual review" list
-   Note the issue in final report

### Issue: Too many issues in one rule

**Solution:**

-   Process in smaller batches (use the limit parameter)
-   Run `/sonar-fix HIGH 20` multiple times
-   Focus on specific packages if needed

### Issue: SonarCloud API rate limiting

**Solution:**

-   The API is public and unauthenticated, rate limits are generous
-   If hit, wait briefly and retry
-   Reduce batch size to minimize API calls

---

## Workflow Summary

```
┌──────────────────────────────────────┐
│ /sonar-fix or /sonar-fix HIGH 30    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Phase -1: Ensure Fresh Cache         │
│  - Check if cache exists & fresh     │
│  - If stale/missing: Download ALL    │
│    issues with pagination (500/page) │
│  - Combine into JSON + TSV           │
│  - Save metadata                     │
└──────────────┬───────────────────────┘
               │
               ├──────────────┬────────────────┐
               │              │                │
               ▼              ▼                ▼
      [Report Mode]    [Fix Mode]     [Cache Valid]
               │              │                │
               ▼              ▼                └──> Continue
┌──────────────────┐ ┌──────────────────────┐
│ Load from cache  │ │ Load & filter cache  │
│ Parse w/ jq      │ │ Verify issues exist  │
│ Group by rule    │ │ Check branch status  │
│ Calculate stats  │ │ Filter to verified   │
│ Show report      │ │ Group by rule        │
└──────────────────┘ └─────────┬────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │ Present Plan         │
                     │ → User Approval      │
                     └─────────┬────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │ For Each Batch:      │
                     │  1. Read rule guide  │
                     │  2. Fix issues       │
                     │  3. Track progress   │
                     │  4. Format code      │
                     │  5. Verify           │
                     │  6. Commit           │
                     │  7. Update progress  │
                     └─────────┬────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │ Generate Final Report│
                     │  - Read progress file│
                     │  - Show accurate stats│
                     │  - List commits      │
                     └──────────────────────┘
```

---

## Integration with Existing Workflows

This command complements existing tools:

-   **`/lint-fix`** - For ESLint rules (local linting)
-   **`/sonar-fix`** - For SonarCloud issues (cloud-based static analysis)
-   **`/pr-review`** - For reviewing PRs (can check if SonarCloud issues were addressed)

Consider running both `/lint-fix` and `/sonar-fix` as part of regular code quality maintenance.
