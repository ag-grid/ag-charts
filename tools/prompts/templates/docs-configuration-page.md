# Documentation Template: Configuration Page

This template provides a standard structure for documenting AG Charts configuration areas that have multiple types or modes (e.g., Axes Types, Formatters, Data Handling).

**When to use**: When documenting a configuration area with multiple distinct types or modes.

**Pattern**: Overview → Default Behavior → Type 1 → Type 2 → ... → API Reference

---

## Template Structure

Replace `[ConfigArea]` with the configuration area name (e.g., "Axis Types", "Formatters").
Replace `[config-area]` with the kebab-case name (e.g., "axes-types", "formatters").
Replace `[ConfigType]` with PascalCase for TypeScript interfaces.

---

````markdown
---
title: '[ConfigArea]'
description: '[Description of what this configuration area controls]. Use [mention different types/modes]. [Brief overview of capabilities].'
---

[Opening paragraph: Overview of the configuration area and its purpose]

[Detailed explanation of what this configuration area controls and when users need it.]

## Default Behavior

[Explanation of how things work without explicit configuration]

In most cases, [explanation of automatic/default behavior]. By default, [describe the default choices made by the library].

[Optional: Explain when users need to explicitly configure this area]

```js format="snippet"
{
    // Explicit configuration (if needed)
    [config-area]: [
        {
            type: '[default-type]',
            [minimal configuration],
        },
    ],
}
```
````

## [Type/Mode 1 Name]

[Description of this type/mode and when to use it]

[Detailed explanation of what this type does, its characteristics, and use cases]

{% chartExampleRunner title="[Type Name]" name="[type-example]" type="generated" /%}

```js format="snippet"
{
    [config-area]: [
        {
            type: '[type-name]',
            [configuration options],
        },
    ],
}
```

[Explanation of the configuration:]

-   [Key point about this type's behavior]
-   [When to use this type]
-   [Important characteristics or limitations]

For a full list of configuration options see [[Type] Options](#reference-Ag[ConfigType][Type]Options).

### [Sub-feature of Type 1]

[If this type has important sub-features or variations]

[Explanation of sub-feature]

```js format="snippet"
{
    [config-area]: [
        {
            type: '[type-name]',
            [sub-feature configuration],
        },
    ],
}
```

## [Type/Mode 2 Name]

[Repeat pattern for second type/mode]

[Description and use cases]

{% chartExampleRunner title="[Type Name]" name="[type-example]" type="generated" /%}

```js format="snippet"
{
    [config-area]: [
        {
            type: '[type-name]',
            [configuration options],
        },
    ],
}
```

[Explanation and important notes]

{% note %}
[Important notes specific to this type, limitations, or gotchas]
{% /note %}

For a full list of configuration options see [[Type] Options](#reference-Ag[ConfigType][Type]Options).

## [Type/Mode 3 Name]

[Continue pattern for each type/mode in the configuration area]

## [Advanced Topic/Special Case]

[Optional: If there are advanced uses or special cases worth highlighting]

[Explanation of advanced usage]

{% chartExampleRunner title="[Advanced Feature]" name="[advanced-example]" type="generated" /%}

```js format="snippet"
{
    [config-area]: [
        {
            [advanced configuration],
        },
    ],
}
```

## API Reference

{% tabs %}

{% tabItem id="Ag[ConfigType][Type1]Options" label="[Type 1 Name]" %}
{% apiReference id="Ag[ConfigType][Type1]Options" /%}
{% /tabItem %}

{% tabItem id="Ag[ConfigType][Type2]Options" label="[Type 2 Name]" %}
{% apiReference id="Ag[ConfigType][Type2]Options" /%}
{% /tabItem %}

{% tabItem id="Ag[ConfigType][Type3]Options" label="[Type 3 Name]" %}
{% apiReference id="Ag[ConfigType][Type3]Options" /%}
{% /tabItem %}

[Add tab for each type/mode documented]

{% /tabs %}

## Next Up

[Optional: Link to related configuration or next logical topic]

Continue to the next section to learn about [[Related Topic]](./[related-topic]/).

```

---

## Checklist for Configuration Pages

Before finalizing your configuration documentation:

- [ ] Overview explains what the configuration area controls
- [ ] Default behavior documented (what happens without configuration)
- [ ] Each type/mode has: description, example, code snippet, notes
- [ ] Use cases clearly explained for each type
- [ ] Differences between types highlighted
- [ ] All examples exist in `_examples/` folder
- [ ] All examples are framework-compatible (no `@ag-skip-fws`)
- [ ] Configuration snippets use `format="snippet"`
- [ ] Cross-links to related configuration areas
- [ ] Important notes/warnings for each type
- [ ] API Reference at end with tab for each type
- [ ] Description in frontmatter uses `$framework` placeholder

---

## Examples of Configuration Pages

Reference these existing configuration pages for patterns:

- **`axes-types`**: Documents Category, Grouped Category, Number, Log, Time axes
- **`formatters`**: Documents global formatter, property formatters, format strings
- **`layout`**: Documents sizing, padding, component spacing

---

## Common Configuration Page Structures

### For Type-Based Configuration (e.g., Axes Types)

Each type gets a major section with:
- Type description and use cases
- Visual example
- Configuration code
- Behavioral notes
- Link to API reference

**Pattern**:
```

## Overview

## Default Behavior

## Type 1

## Type 2

## Type 3

...

## API Reference (tabs for each type)

```

### For Mode-Based Configuration (e.g., Formatters)

Group by formatting approach:
- Global formatters
- Property-specific formatters
- Format strings

**Pattern**:
```

## Overview

## Default Behavior

## Approach 1 (e.g., Global Formatter)

## Approach 2 (e.g., Property Formatters)

## Approach 3 (e.g., Format Strings)

## API Reference

```

### For Hierarchical Configuration (e.g., Layout)

Group by what's being configured:
- Chart-level sizing
- Padding configuration
- Component spacing

**Pattern**:
```

## Overview

## Chart Sizing

### Fixed Dimensions

### Auto-sizing

## Padding

### Chart Padding

### Series Area Padding

## Component Spacing

## API Reference

````

---

## Common Configuration Type Comparisons

When documenting multiple types, help users understand the differences:

**Comparison Table** (use when types are similar):
```markdown
| Feature | Type 1 | Type 2 | Type 3 |
|---------|--------|--------|--------|
| Use Case | [brief] | [brief] | [brief] |
| Scale | [type] | [type] | [type] |
| Best For | [use] | [use] | [use] |
````

**When to Use Which** (list format):

```markdown
-   Use **[Type 1]** when [use case description]
-   Use **[Type 2]** when [use case description]
-   Use **[Type 3]** when [use case description]
```

**Visual Comparison** (show types side-by-side):

```markdown
{% chartExampleRunner title="[Type] Comparison" name="[comparison-example]" type="generated" /%}
```

---

## Important Notes for Configuration Pages

### Technical Accuracy

Configuration pages are often highly technical. Ensure:

-   Property names exactly match TypeScript definitions
-   Default behaviors are correctly described
-   Limitations and edge cases are documented
-   Type constraints are explained (e.g., log axis must be positive/negative)

### Progressive Complexity

Start with simplest type/mode first:

1. Most common/default type
2. Related variations
3. Advanced or specialized types
4. Edge cases or special configurations

### Cross-Referencing

Link extensively to related areas:

-   Related configuration (e.g., axes → series)
-   Features that use this configuration (e.g., formatters → tooltips)
-   Related documentation (e.g., time axes → time data handling)
