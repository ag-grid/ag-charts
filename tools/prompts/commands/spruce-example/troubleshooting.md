# Troubleshooting Guide

## 🚨 Quick Fix Reference

| Symptom                                                                        | Cause                  | Solution                              |
| ------------------------------------------------------------------------------ | ---------------------- | ------------------------------------- |
| **TypeScript Errors**                                                          |
| "Property does not exist on type"                                              | Generic AgChartOptions | Use `AgCartesianChartOptions`         |
| "Type 'string' is not assignable"                                              | Missing `as const`     | Add `type: 'bar' as const`            |
| "axes does not exist"                                                          | Wrong chart type       | Use correct type (Cartesian vs Polar) |
| **Visual Issues**                                                              |
| Dark mode broken                                                               | Hardcoded colors       | Remove ALL color values               |
| Fonts inconsistent                                                             | Font overrides         | Remove ALL font properties            |
| Theme not applying                                                             | CSS files present      | Delete all CSS files                  |
| **Validation Failures**                                                        |
| `yarn nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck` fails | Missing axes[].type    | Add `type` to every axis              |
| Compilation errors                                                             | Wrong imports          | Import from ag-charts-enterprise      |

## ❌ ABSOLUTE RULES - NO EXCEPTIONS

### CSS Files

-   **NEVER create styles.css** - Zero tolerance
-   **NO inline styles** in HTML
-   **NO style attributes** on any elements
-   The theme handles ALL visual styling

### Colors & Fonts

```typescript
// ❌ NEVER DO THIS
fill: '#3498DB';
stroke: 'red';
fontSize: 14;
fontWeight: 'bold';
fontFamily: 'Arial';

// ✅ ALWAYS DO THIS
// Remove all color/font properties - let theme handle it
```

## 🔧 TypeScript Solutions

### Use Specific Chart Types

```typescript
// ❌ Too generic
const options: AgChartOptions = { ... };

// ✅ Specific types
import { AgCartesianChartOptions } from 'ag-charts-enterprise';
const options: AgCartesianChartOptions = {
    axes: [...],  // Now properly typed
    series: [...]
};
```

### Always Specify axes[].type

```typescript
axes: [
    {
        type: 'category', // ⚠️ REQUIRED
        position: 'bottom',
    },
    {
        type: 'number', // ⚠️ REQUIRED
        position: 'left',
    },
];
```

## 🎯 When Things Fail

### If `yarn nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck` fails:

1. Check all axes have `type` specified
2. Verify no hardcoded colors/fonts
3. Ensure using correct chart type
4. Remove any CSS files

### If PREVis score decreases:

1. **REVERT all changes immediately**
2. Re-read core-rules.md
3. Focus on structural improvements only

### If dark mode breaks:

1. Search for hex codes (#fff, #000, etc.)
2. Remove ALL color properties
3. Delete any CSS files
4. Let theme handle everything
