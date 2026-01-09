---
paths: '**/__image_snapshots__/**, **/e2e/**/*.png'
---

# Batch Image Diff Review

This skill helps review large batches of modified image snapshots by filtering out sub-pixel and subtle color differences that aren't visually significant.

## When to Use

-   After running E2E or visual regression tests that update many snapshots
-   When git shows hundreds of modified PNG files that need review
-   To identify which snapshot changes are meaningful vs. noise

## Tool Location

`tools/analyze-snapshot-diffs.mjs`

## Basic Usage

```bash
# Default: 0.3 color threshold, 1% pixel threshold
node tools/analyze-snapshot-diffs.mjs

# Lower color threshold for more sensitivity
node tools/analyze-snapshot-diffs.mjs --color-threshold=0.2

# Lower pixel threshold to see more files
node tools/analyze-snapshot-diffs.mjs --pixel-threshold=0.1

# Show all files with any difference
node tools/analyze-snapshot-diffs.mjs --pixel-threshold=0 --verbose

# Skip HTML report generation
node tools/analyze-snapshot-diffs.mjs --no-html
```

## Threshold Guidance

### Color Threshold (per-pixel sensitivity)

Controls how different two pixels must be to count as "different":

| Value    | Use Case                                                      |
| -------- | ------------------------------------------------------------- |
| **0.3**  | Default - ignores subtle anti-aliasing and opacity variations |
| **0.2**  | More sensitive - catches slight color shifts                  |
| **0.1**  | Pixelmatch default - catches most visible differences         |
| **0.05** | Very sensitive - catches nearly all differences               |

### Pixel Threshold (file-level filter)

Controls the minimum % of pixels that must differ for a file to be "significant":

| Value     | Use Case                               |
| --------- | -------------------------------------- |
| **1%**    | Default - only clearly visible changes |
| **0.1%**  | Catches smaller localised changes      |
| **0.01%** | Very sensitive                         |
| **0%**    | Show any file with any difference      |

## Output

1. **Console summary**: Categorised counts (identical, negligible, minor, significant)
2. **HTML report**: `/tmp/snapshot-analysis.html` with side-by-side comparisons
3. **Diff images**: Red pixels showing changes (saved to `/tmp/snapshot-diffs/`)

## Categories

| Category        | Pixel Difference | Typical Cause                           |
| --------------- | ---------------- | --------------------------------------- |
| **Identical**   | 0%               | No change (with current thresholds)     |
| **Negligible**  | <0.1%            | Sub-pixel anti-aliasing, font rendering |
| **Minor**       | 0.1-1%           | Small localised changes                 |
| **Significant** | >1%              | Visible changes requiring review        |

## Typical Workflow

1. Run with defaults to get overview:

    ```bash
    node tools/analyze-snapshot-diffs.mjs
    ```

2. If too few results, lower thresholds iteratively:

    ```bash
    node tools/analyze-snapshot-diffs.mjs --color-threshold=0.2
    node tools/analyze-snapshot-diffs.mjs --pixel-threshold=0.1
    ```

3. Review HTML report for significant changes

4. For files that are acceptable, commit the updated snapshots

5. For files with unexpected changes, investigate the cause

## How It Works

1. Gets list of modified PNG files from `git status`
2. For each file, loads working copy and HEAD version
3. Compares using `pixelmatch` with configurable colour threshold
4. Categorises by % of differing pixels
5. Generates HTML report with before/after/diff images (base64 embedded)

## Dependencies

Uses packages already in the repo:

-   `pixelmatch` - pixel-level image comparison
-   `pngjs` - PNG encoding/decoding
