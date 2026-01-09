---
root: false
targets: ['*']
description: 'Understanding the three-tier default system and theme configuration in AG Charts'
globs: ['**/*Module.ts', '**/*Properties.ts', '**/*Options.ts']
---

# Default Values and Configuration Hierarchy

This guide explains how default values work in AG Charts and how to find the actual runtime defaults for any configuration option.

## Why This Matters

Understanding the default value hierarchy is critical for:

-   **Documentation accuracy**: Must document actual runtime defaults users experience
-   **Code reviews**: Verify changes don't unintentionally alter defaults
-   **Testing**: Write tests against realistic default behavior
-   **Bug reports**: Understand what users see by default
-   **Breaking changes**: Identify when theme changes affect user experience

## The Three-Tier Default System

AG Charts uses a layered configuration system where each layer can override the previous one:

```
User Configuration
        ↓ (overrides)
Theme Template Defaults ⭐ Runtime Default
        ↓ (overrides)
Property Decorator Defaults
```

### 1. Property Decorator Defaults (Base Layer)

**Location**: `packages/ag-charts-{community,enterprise}/src/**/*Properties.ts`

**Purpose**: Fallback defaults when no theme is applied

**Example**:

```typescript
// sankeySeriesProperties.ts
export class SankeySeriesNodeProperties {
    @Property
    spacing: number = 1; // Base default (rarely used)

    @Property
    alignment: 'left' | 'right' | 'center' | 'justify' = 'justify';
}
```

**Important**: These are **NOT** what users typically experience. They're fallback values that are usually overridden by theme templates.

---

### 2. Theme Template Defaults (Runtime Layer) ⭐

**Location**: `packages/ag-charts-{community,enterprise}/src/**/*Module.ts`

**Purpose**: The actual out-of-the-box defaults users experience

**Example**:

```typescript
// sankeyModule.ts
export const SankeyModule = {
    type: 'series',
    identifier: 'sankey',
    themeTemplate: {
        series: {
            node: {
                spacing: 20, // ✅ This is the ACTUAL runtime default
                width: 10, // ✅ Overrides Properties.ts value of 1
            },
            label: {
                spacing: 10, // ✅ Overrides Properties.ts value of 1
            },
        },
    },
};
```

**Critical**: This is the layer that matters for users. When documenting defaults or testing behavior, use these values.

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

Find the module that registers the series/feature:

```bash
# For a series
find packages/ag-charts-{community,enterprise}/src/series -name "*Module.ts" | grep <seriesName>

# For Sankey series example
find packages/ag-charts-enterprise/src/series -name "*Module.ts" | grep sankey
# Result: packages/ag-charts-enterprise/src/series/sankey/sankeyModule.ts
```

### Step 2: Check the Theme Template

Open the module file and look for the `themeTemplate` object:

```typescript
export const SankeyModule = {
    themeTemplate: {
        series: {
            node: {
                spacing: 20, // ← Actual runtime default
                minSpacing: 0,
                width: 10,
            },
        },
    },
};
```

**If the property exists in themeTemplate**: This is the runtime default ✅

**If the property is NOT in themeTemplate**: Continue to Step 3

### Step 3: Fallback to @Property Decorator

If the property isn't in the theme template, check the Properties class:

```typescript
// sankeySeriesProperties.ts
export class SankeySeriesNodeProperties {
    @Property
    strokeWidth: number = 1; // Used as default (not overridden in theme)
}
```

### Step 4: Verify TypeScript Comments Match

Check the TypeScript interface comments:

```typescript
// sankeyOptions.ts
export interface AgSankeySeriesNodeOptions {
    /**
     * Spacing between the nodes.
     *
     * Default: `20` // ← Should match themeTemplate value
     */
    spacing?: PixelSize;
}
```

**If the comment doesn't match the theme template**: The comment is stale and needs updating.

---

## Common Module Locations

| Feature Type            | Module Path Pattern                                        | Example                                                  |
| ----------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Series (Community)      | `packages/ag-charts-community/src/series/**/*Module.ts`    | `bar/barModule.ts`, `line/lineModule.ts`                 |
| Series (Enterprise)     | `packages/ag-charts-enterprise/src/series/**/*Module.ts`   | `sankey/sankeyModule.ts`, `waterfall/waterfallModule.ts` |
| Axis                    | `packages/ag-charts-community/src/axes/**/*Module.ts`      | `axis/axisModule.ts`                                     |
| Annotations             | `packages/ag-charts-enterprise/src/features/annotations/*` | `annotationsModule.ts`                                   |
| Legend                  | `packages/ag-charts-community/src/chart/legend/*Module.ts` | `legendModule.ts`                                        |
| Interactive Annotations | `packages/ag-charts-enterprise/src/features/**/*Module.ts` | `contextMenu/contextMenuModule.ts`                       |
| Global themes           | `packages/ag-charts-community/src/chart/themes/`           | `chartTheme.ts`, `defaultThemeTemplates.ts`              |

---

## Summary

**Key Takeaways**:

1. ⭐ **Theme templates define runtime defaults** - start here
2. Property decorators are fallbacks, not user-facing defaults
3. Always verify TypeScript comments match theme templates
4. Module files (`*Module.ts`) are the source of truth for defaults
5. Document what users actually see, not internal fallback values

**Quick Workflow**:

```
Need default? → Check *Module.ts theme → If not there, check @Property decorator → Document that value
```
