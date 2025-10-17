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

## Detailed Example: Sankey Series node.spacing

Let's trace the default value for `node.spacing` in the Sankey series:

### Layer 1: Property Decorator

```typescript
// sankeySeriesProperties.ts:95
@Property
spacing: number = 1;
```

**Value**: 1

### Layer 2: Theme Template (Overrides Layer 1)

```typescript
// sankeyModule.ts:51
themeTemplate: {
    series: {
        node: {
            spacing: 20,  // ← Overrides the decorator value
        }
    }
}
```

**Value**: 20 ✅ **This is what users get by default**

### Layer 3: User Config (Would Override Layer 2)

```typescript
const options = {
    series: [
        {
            type: 'sankey',
            node: {
                spacing: 30, // ← User override
            },
        },
    ],
};
```

**Value**: 30 (if user provides it)

### TypeScript Interface

```typescript
// sankeyOptions.ts:74-77
/**
 * Spacing between the nodes.
 *
 * Default: `20`  // ✅ Correctly documents the theme template value
 */
spacing?: PixelSize;
```

### Summary Table

| Source                   | Value | Is Runtime Default? |
| ------------------------ | ----- | ------------------- |
| @Property decorator      | 1     | ❌ No               |
| Theme template           | 20    | ✅ Yes              |
| TypeScript comment       | 20    | ✅ Correct          |
| User sees without config | 20    | ✅ This is it       |

---

## Why This Hierarchy Exists

### Design Philosophy

1. **Property Decorators**: Provide safe fallbacks for edge cases where themes aren't loaded
2. **Theme Templates**: Allow consistent styling across all charts without code changes
3. **User Configuration**: Give developers full control to override anything

### Real-World Impact

**Example: Changing node.spacing**

If you change the decorator from `spacing: number = 1` to `spacing: number = 5`:

-   **User impact**: None (theme still uses 20)
-   **Breaking change**: No

If you change the theme template from `spacing: 20` to `spacing: 10`:

-   **User impact**: All Sankey charts get tighter spacing by default
-   **Breaking change**: Yes (visual breaking change)

---

## CLI Commands Quick Reference

```bash
# Find all theme templates in a package
rg "themeTemplate:" packages/ag-charts-enterprise/src --type ts -A 20

# Find a specific property in theme templates
rg "spacing:" packages/ag-charts-{community,enterprise}/src -B 2 -A 1 --type ts | grep -A 3 "themeTemplate"

# Find all modules for a package
find packages/ag-charts-enterprise/src -name "*Module.ts"

# Find series-specific modules
find packages/ag-charts-{community,enterprise}/src/series -name "*Module.ts"

# Search for property definitions with defaults
rg "@Property" packages/ag-charts-enterprise/src/series/sankey --type ts -A 1

# Find TypeScript interface with comments
rg "Default:" packages/ag-charts-types/src --type ts -B 5
```

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Trusting @Property Decorator as Runtime Default

```typescript
// sankeySeriesProperties.ts
@Property
spacing: number = 1;  // ← This is NOT the runtime default!
```

**Problem**: Documentation states default is 1, but users see 20

**Solution**: Always check theme template first

---

### ❌ Pitfall 2: Not Checking Theme Template When Documenting

**Bad Documentation**:

```markdown
The `spacing` property controls node spacing. Default: 1
```

**Good Documentation**:

```markdown
The `spacing` property controls node spacing. Default: 20
```

**How to verify**: Check `sankeyModule.ts` themeTemplate

---

### ❌ Pitfall 3: Stale TypeScript Comments

```typescript
/**
 * Default: `10`  // ← Stale comment
 */
spacing?: number;
```

**Reality**: Theme template has `spacing: 20`

**Solution**: Update TypeScript comments to match theme templates

---

### ❌ Pitfall 4: Assuming Similar Series Have Same Defaults

**Example**: Sankey and Flowchart might have different `node.spacing` defaults

**Solution**: Check each series module individually

---

## Verification Checklist

When reviewing or documenting defaults:

-   [ ] Found the module file (`*Module.ts`)
-   [ ] Checked `themeTemplate` object for the property
-   [ ] If in theme: Used theme value as runtime default
-   [ ] If not in theme: Used `@Property` decorator value
-   [ ] Verified TypeScript comment matches actual default
-   [ ] Updated documentation to reflect runtime default
-   [ ] Added test cases using correct default values

---

## Example: Full Default Verification

Let's verify all defaults for Sankey `node` options:

```typescript
// 1. Check module theme template
// sankeyModule.ts:50-55
themeTemplate: {
    series: {
        node: {
            spacing: 20,          // ✅ Runtime default
            minSpacing: 0,        // ✅ Runtime default
            width: 10,            // ✅ Runtime default
            strokeWidth: {...},   // Complex (conditional default)
        }
    }
}

// 2. Check properties file for any not in theme
// sankeySeriesProperties.ts:93-135
@Property
spacing: number = 1;              // ❌ Overridden by theme (20)

@Property
minSpacing: number = 0;           // ✅ Matches theme

@Property
width: number = 1;                // ❌ Overridden by theme (10)

@Property
alignment: 'justify';             // ✅ Not in theme, this is default

@Property
verticalAlignment: 'center';     // ✅ Not in theme, this is default

@Property
sort: 'auto';                    // ✅ Not in theme, this is default

// 3. Runtime defaults summary
spacing: 20           // From theme
minSpacing: 0         // From theme (matches decorator)
width: 10             // From theme
alignment: 'justify'  // From decorator (not in theme)
verticalAlignment: 'center'  // From decorator (not in theme)
sort: 'auto'         // From decorator (not in theme)
```

---

## For Documentation Reviewers

When reviewing documentation for default values:

1. **Don't trust TypeScript comments alone** - they may be stale
2. **Start with the module file** - check theme template first
3. **Fallback to Properties class** - only if not in theme
4. **Flag discrepancies** - when decorator != theme != docs
5. **Document the hierarchy** - in reports, show all three layers

**Review Template**:

```markdown
### Property: node.spacing

-   **@Property decorator**: 1 (sankeySeriesProperties.ts:95)
-   **Theme template**: 20 (sankeyModule.ts:51) ✅ Runtime default
-   **TypeScript comment**: 20 (sankeyOptions.ts:74) ✅ Correct
-   **Documentation**: Missing default value ⚠️

**Action Required**: Add "Default: 20" to documentation
```

---

## Additional Resources

-   [AG Charts Architecture](https://docs.ag-grid.com/architecture/charts/ag-charts-overview)
-   [Theme Customization Guide](../../../packages/ag-charts-website/src/content/docs/themes/)
-   [Testing Guide](./testing.md) - How to test with correct defaults
-   [Code Quality Guide](./code-quality.md) - Review practices

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
