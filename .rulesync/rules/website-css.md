---
root: false
targets: ['*']
description: 'CSS architecture and design system for the AG Charts website including dark mode support'
globs: ['packages/ag-charts-website/src/**/*.scss', 'packages/ag-charts-website/src/**/*.css', 'external/ag-website-shared/src/design-system/**/*.scss']
---

# Website CSS & Styling Guide

This guide explains the CSS architecture and design system used by the AG Charts website (`ag-charts-website`).

## Design System Location

The website's design system is defined in a shared external package:

```
external/ag-website-shared/src/design-system/
├── _root.scss          # CSS custom properties (variables)
├── _core.scss          # Core SCSS variables and mixins
└── ...
```

The main file is `_root.scss` which defines all CSS custom properties used across the website.

## CSS Custom Properties

### How Variables Are Organized

The design system uses CSS custom properties (variables) organized into semantic categories:

```scss
:root {
    // Abstract colors (raw palette)
    --color-gray-50: #f9fafb;
    --color-gray-100: #f2f4f7;
    // ... through gray-950

    --color-brand-50: #f4f8ff;
    --color-brand-100: #e5effd;
    // ... through brand-950

    // Semantic colors (use these in components)
    --color-bg-primary: var(--color-white);
    --color-fg-primary: var(--color-gray-900);
    --color-border-primary: var(--color-gray-300);
}
```

### Color Palette Reference

#### Gray Scale

| Variable           | Light Mode | Hex       |
| ------------------ | ---------- | --------- |
| `--color-gray-25`  | Lightest   | `#fcfcfd` |
| `--color-gray-50`  |            | `#f9fafb` |
| `--color-gray-100` |            | `#f2f4f7` |
| `--color-gray-200` |            | `#eaecf0` |
| `--color-gray-300` |            | `#d0d5dd` |
| `--color-gray-400` |            | `#98a2b3` |
| `--color-gray-500` |            | `#667085` |
| `--color-gray-600` |            | `#475467` |
| `--color-gray-700` |            | `#344054` |
| `--color-gray-800` |            | `#182230` |
| `--color-gray-900` |            | `#101828` |
| `--color-gray-950` | Darkest    | `#0c111d` |

#### Brand Colors (Blue)

| Variable            | Hex       |
| ------------------- | --------- |
| `--color-brand-50`  | `#f4f8ff` |
| `--color-brand-100` | `#e5effd` |
| `--color-brand-200` | `#d4e3f8` |
| `--color-brand-300` | `#a9c5ec` |
| `--color-brand-400` | `#3d7acd` |
| `--color-brand-500` | `#0e4491` |
| `--color-brand-600` | `#0042a1` |
| `--color-brand-700` | `#00388f` |
| `--color-brand-800` | `#002e7e` |
| `--color-brand-900` | `#00246c` |
| `--color-brand-950` | `#001a5a` |

#### Warning Colors (Orange/Yellow)

| Variable              | Hex       |
| --------------------- | --------- |
| `--color-warning-50`  | `#fffaeb` |
| `--color-warning-100` | `#fef0c7` |
| `--color-warning-200` | `#fedf89` |
| `--color-warning-300` | `#fec84b` |
| `--color-warning-400` | `#fdb022` |
| `--color-warning-500` | `#f79009` |
| `--color-warning-600` | `#dc6803` |
| `--color-warning-700` | `#b54708` |
| `--color-warning-800` | `#93370d` |
| `--color-warning-900` | `#7a2e0e` |
| `--color-warning-950` | `#4e1d09` |

#### Special Colors

| Variable           | Hex                                  | Usage                 |
| ------------------ | ------------------------------------ | --------------------- |
| `--color-success`  | `#28a745` (light) / `#64ea82` (dark) | Success states        |
| `--color-positive` | `#28a745`                            | Positive indicators   |
| `--color-negative` | `#dc3545`                            | Error/negative states |

## Dark Mode

### How Dark Mode Works

Dark mode is triggered by the `data-dark-mode="true"` attribute on the `<html>` element:

```scss
html[data-dark-mode='true'] {
    --color-bg-primary: color-mix(in srgb, var(--color-gray-800), var(--color-gray-900) 50%);
    --color-fg-primary: var(--color-white);
    // ... other overrides
}
```

### Key Dark Mode Colors

| Semantic Variable          | Light Mode | Dark Mode                                |
| -------------------------- | ---------- | ---------------------------------------- |
| `--color-bg-primary`       | `#ffffff`  | Mix of `#182230` + `#101828` ≈ `#141d2c` |
| `--color-bg-secondary`     | `#f9fafb`  | `#344054`                                |
| `--color-bg-tertiary`      | `#f2f4f7`  | `#182230`                                |
| `--color-fg-primary`       | `#101828`  | `#ffffff`                                |
| `--color-fg-secondary`     | `#344054`  | `#d0d5dd`                                |
| `--color-border-primary`   | `#d0d5dd`  | `#344054`                                |
| `--color-border-secondary` | `#eaecf0`  | Mix of `#344054` + bg-primary            |
| `--color-link`             | `#0e4491`  | `#a9c5ec`                                |

### Detecting Dark Mode in JavaScript

```typescript
// Check data attribute (preferred)
const isDark = document.documentElement.getAttribute('data-dark-mode') === 'true';

// Or check for dark mode class (fallback)
const isDark = document.documentElement.classList.contains('dark');
```

### Creating Theme-Aware Components

Use CSS custom properties that react to `data-dark-mode`:

```css
/* Define variables for both modes */
:root {
    --my-component-bg: #ffffff;
    --my-component-text: #101828;
}

[data-dark-mode='true'] {
    --my-component-bg: #182230;
    --my-component-text: #d0d5dd;
}

/* Use variables in component */
.my-component {
    background: var(--my-component-bg);
    color: var(--my-component-text);
}
```

This approach ensures instant theme switching without JavaScript re-rendering.

## Semantic Color Categories

### Background Colors (`--color-bg-*`)

-   `--color-bg-primary`: Main content background
-   `--color-bg-secondary`: Secondary/elevated surfaces
-   `--color-bg-tertiary`: Subtle backgrounds
-   `--color-bg-toolbar`: Toolbar backgrounds
-   `--color-bg-code`: Code block backgrounds

### Foreground/Text Colors (`--color-fg-*`)

-   `--color-fg-primary`: Primary text
-   `--color-fg-secondary`: Secondary/muted text
-   `--color-fg-tertiary`: Subtle text
-   `--color-fg-disabled`: Disabled state text

### Border Colors (`--color-border-*`)

-   `--color-border-primary`: Primary borders
-   `--color-border-secondary`: Subtle borders
-   `--color-border-tertiary`: Very subtle borders

### Link Colors (`--color-link*`)

-   `--color-link`: Default link color
-   `--color-link-hover`: Link hover state

## Component Styling Patterns

### Using SCSS Modules

The website uses CSS/SCSS modules for component styling:

```scss
// MyComponent.module.scss
.container {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    color: var(--color-fg-primary);
}
```

### Example Runner Styling

The example runner has its own CSS variables:

```scss
// ExampleRunner.module.scss
.exampleRunner {
    --example-border-color: color-mix(in srgb, var(--color-border-secondary), var(--color-border-primary));
}

html[data-dark-mode='true'] .exampleRunner {
    --example-border-color: color-mix(in srgb, var(--color-bg-primary), white 10%);
}
```

## Best Practices

### DO:

-   Use semantic variables (`--color-bg-primary`) not raw colors (`--color-gray-50`)
-   Define component-specific variables that reference design system variables
-   Use `[data-dark-mode="true"]` selector for dark mode overrides
-   Test components in both light and dark modes

### DON'T:

-   Hardcode hex colors directly in components
-   Use `prefers-color-scheme` media query (the site uses explicit `data-dark-mode`)
-   Assume light mode is the default without testing dark mode

## Finding Colors

### Quick CLI Commands

```bash
# Find where a semantic variable is defined
grep -r "color-bg-primary:" external/ag-website-shared/

# Find all dark mode overrides
grep -A 100 "data-dark-mode='true'" external/ag-website-shared/src/design-system/_root.scss

# Find usage of a variable
grep -r "var(--color-bg-primary)" packages/ag-charts-website/src/

# Find all color variables
grep "^    --color" external/ag-website-shared/src/design-system/_root.scss
```

### Key Files

| File                                                      | Purpose                             |
| --------------------------------------------------------- | ----------------------------------- |
| `external/ag-website-shared/src/design-system/_root.scss` | All CSS custom properties           |
| `external/ag-website-shared/src/design-system/_core.scss` | SCSS variables, mixins, breakpoints |
| `packages/ag-charts-website/src/stores/themeStore.ts`     | Theme state management              |

## Adding New Theme-Aware Styles

When creating new components or features that need to support both themes:

1. **Define CSS variables** in a `<style>` tag or CSS file:

    ```css
    :root {
        --my-feature-bg: #ffffff;
        --my-feature-border: #d0d5dd;
    }

    [data-dark-mode='true'] {
        --my-feature-bg: #182230;
        --my-feature-border: #344054;
    }
    ```

2. **Use the variables** in your styles:

    ```css
    .my-feature {
        background: var(--my-feature-bg);
        border: 1px solid var(--my-feature-border);
    }
    ```

3. **Choose appropriate colors** from the design system palette (see tables above)

## Related Resources

-   [Examples Guide](./examples.md) - Example styling patterns
-   [Documentation Pages Guide](./docs-pages.md) - Doc page styling
