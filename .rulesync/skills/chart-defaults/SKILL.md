---
targets: ['*']
name: chart-defaults
description: 'Find the actual runtime default value of any AG Charts configuration option, and keep JSDoc `Default:` markers accurate. Use when documenting a default, verifying a change has not altered one, writing tests against default behaviour, or auditing whether a TypeScript comment matches the theme template.'
---

# Default Values and Configuration Hierarchy

This guide explains how default values work in AG Charts and how to find the actual runtime defaults for any configuration option.

## Why This Matters

Understanding the default value hierarchy is critical for:

-   **Documentation accuracy**: Must document actual runtime defaults users experience
-   **Code reviews**: Verify changes don't unintentionally alter defaults
-   **Testing**: Write tests against realistic default behaviour
-   **Bug reports**: Understand what users see by default
-   **Breaking changes**: Identify when theme changes affect user experience

## The Three-Tier Default System

AG Charts uses a layered configuration system where each layer can override the previous one:

```
User Configuration
        ↓ (overrides)
Theme Template Defaults ⭐ Runtime Default
        ↓ (overrides)
Code Fallback (`??` at the read site, or a datum factory)
```

### 1. Code Fallback (Base Layer)

**Location**: the code that reads the resolved option, in the series or feature implementation

**Purpose**: The value used when neither the theme nor the user supplies one

**Examples**:

```typescript
// packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts
placement ?? 'inside-center',
```

```typescript
// packages/ag-charts-enterprise/src/features/annotations/annotationDatum.ts
export function createLineTextDatum(): LineTextDatum {
    return { ...createFontFields(), label: '', position: 'top', alignment: 'left' };
}
```

**Important**: These are **NOT** what users typically experience. The theme usually supplies the option, so the fallback never runs. `createAnnotationDatum()` in `annotations.ts` applies the options on top of the factory's datum, and the line annotation theme (`lineText` in `annotationsTheme.ts`) sets `alignment: 'center'`, so `'left'` above is not the default to document.

A fallback is the runtime default only when the theme leaves the option unset. Bar `crisp` is absent from the bar theme template, so `barSeries.ts` computes it with `checkCrisp(...)` when the user does not set it.

---

### 2. Theme Template Defaults (Runtime Layer) ⭐

**Location**: `packages/ag-charts-{community,enterprise}/src/**/*Module.ts`

**Purpose**: The actual out-of-the-box defaults users experience

**Example**:

```typescript
// packages/ag-charts-enterprise/src/series/sankey/sankeyModule.ts
export const SankeySeriesModule: SeriesModuleDefinition<AgSankeySeriesOptions> = {
    type: 'series',
    name: 'sankey',
    // ...
    themeTemplate: {
        series: {
            label: {
                spacing: 10, // ✅ This is the ACTUAL runtime default
            },
            node: {
                spacing: { $if: [{ $greaterThan: [{ $path: './minSpacing' }, 20] }, { $path: './minSpacing' }, 20] },
                minSpacing: 0,
                width: 10,
            },
        },
    },
};
```

**Critical**: This is the layer that matters for users. When documenting defaults or testing behaviour, use these values.

A theme value may be an operator expression rather than a literal. `node.spacing` above resolves to `20` unless the user sets `minSpacing` above 20; `{ $ref: 'fontSize' }` and `{ $palette: 'fills' }` resolve from the theme's parameters and palette. Document what the expression resolves to with no user options.

---

### 3. User Configuration (Override Layer)

**Location**: User's chart options

**Purpose**: Final overrides provided by the developer

**Example**:

```typescript
const options = {
    series: [
        {
            type: 'sankey',
            node: {
                spacing: 30, // ✅ Overrides theme default of 20
            },
        },
    ],
};
```

---

## Finding Defaults: Step-by-Step Process

When you need to verify the default value of a property:

### Step 1: Identify the Module File

Find the module that registers the series or feature by its `name`:

```bash
grep -rlE "name: 'sankey'," packages/ag-charts-{community,enterprise}/src --include='*Module.ts'
# Result: packages/ag-charts-enterprise/src/series/sankey/sankeyModule.ts
```

### Step 2: Check the Theme Templates

Open the module file and look for the `themeTemplate` object. Follow any spread constants (`...COMMON_SERIES_THEME_DEFAULTS`, `...STROKE_STYLE_THEME_DEFAULTS` from `ag-charts-core/src/config/themeUtil.ts`) and `mergeDefaults(...)` arguments (`commonAxisThemeTemplate` from `ag-charts-core/src/config/axisThemeTemplate.ts`), as these carry defaults too.

Then check contribution-level theme templates. A module that owns an option path outside its own location declares it in `contributes`, and each contribution can carry its own `themeTemplate`, merged at that path:

```typescript
// packages/ag-charts-enterprise/src/features/background-regions/backgroundRegionsModule.ts
contributes: [
    {
        path: 'seriesArea.backgroundRegions',
        options: arrayOfDefs<AgSeriesAreaBackgroundRegion>({ /* ... */ }),
        themeTemplate: backgroundRegionsTheme,
    },
],
```

So the defaults for `seriesArea.backgroundRegions` are in `backgroundRegionsTheme.ts`, not in `SeriesAreaModule`. To find a contribution for an option path:

```bash
grep -rn "path: 'seriesArea.backgroundRegions'" packages/ag-charts-{community,enterprise}/src
```

**If the property exists in a theme template**: This is the runtime default ✅

**If the property is NOT in any theme template**: Continue to Step 3

### Step 3: Fall Back to the Code

If no theme template sets the property, find where the implementation reads it and look for a `??` fallback, or the datum factory that initialises it. That value, or the computed behaviour when the option is unset (as with bar `crisp`), is what users see.

### Step 4: Verify TypeScript Comments Match

Check the TypeScript interface comments:

```typescript
// packages/ag-charts-types/src/series/standalone/sankeyOptions.ts
export interface AgSankeySeriesNodeOptions<TDatum, TContext = ContextDefault> extends AgSankeySeriesNodeStyle {
    /**
     * Spacing between the nodes.
     *
     * Default: `20` // ← Should match the themeTemplate value
     */
    spacing?: PixelSize;
}
```

**If the comment doesn't match the theme template**: The comment is stale and needs updating.

### JSDoc formatting: `Default:` must be its own paragraph

The `Default:` marker **must** be separated from the description prose by a blank `*` line inside the JSDoc block. If it sits inline with the description, the docs-site API reference renders it as body text rather than as a labelled default.

```typescript
// ✅ GOOD — Default: rendered as a labelled default in the API reference
/**
 * Spacing between the nodes.
 *
 * Default: `20`
 */
spacing?: PixelSize;

// ❌ BAD — Default: swallowed into the description prose
/** Spacing between the nodes. Default: `20` */
spacing?: PixelSize;
```

This applies to every option in `packages/ag-charts-types` regardless of description length — even a one-sentence description must promote the `Default:` marker to its own paragraph.

---

## Common Module Locations

| Feature Type        | Module Path Pattern                                                   | Example                                                         |
| ------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| Series (Community)  | `packages/ag-charts-community/src/chart/series/**/*Module.ts`         | `cartesian/barSeriesModule.ts`, `cartesian/lineSeriesModule.ts` |
| Series (Enterprise) | `packages/ag-charts-enterprise/src/series/**/*Module.ts`              | `sankey/sankeyModule.ts`, `waterfall/waterfallModule.ts`        |
| Axis                | `packages/ag-charts-community/src/module/axis-modules/*AxisModule.ts` | `categoryAxisModule.ts`, `numberAxisModule.ts`                  |
| Annotations         | `packages/ag-charts-enterprise/src/features/annotations/*`            | `annotationsModule.ts`, `annotationsTheme.ts`                   |
| Legend              | `packages/ag-charts-community/src/chart/legend/*Module.ts`            | `legendModule.ts`                                               |
| Enterprise features | `packages/ag-charts-enterprise/src/features/**/*Module.ts`            | `context-menu/contextMenuModule.ts`                             |
| Shared theme parts  | `packages/ag-charts-core/src/config/`                                 | `chartThemeTemplate.ts`, `axisThemeTemplate.ts` (merged into chart-type and axis modules) |

---

## Summary

**Key Takeaways**:

1. ⭐ **Theme templates define runtime defaults** - start here
2. Check contribution-level theme templates as well as the module-level one
3. Code fallbacks (`??`, datum factories) apply only when no theme sets the option
4. Always verify TypeScript comments match theme templates
5. Document what users actually see, not internal fallback values

**Quick Workflow**:

```
Need default? → Check *Module.ts themeTemplate (module and contributions) → If not there, check the code fallback (`??` at the read site, or datum factory) → Document that value
```
