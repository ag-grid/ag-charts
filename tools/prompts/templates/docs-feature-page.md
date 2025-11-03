# Documentation Template: Feature Page

This template provides a standard structure for documenting AG Charts features that apply across multiple series types (e.g., Tooltips, Legend, Themes, Zoom, Annotations).

**When to use**: When documenting a chart-wide feature that is not specific to a single series type.

**Pattern**: Default Behavior → Modes → Configuration → Customization → API Reference

---

## Template Structure

Replace `[FeatureName]` with the actual feature name (e.g., "Tooltip", "Legend", "Theme").
Replace `[feature-name]` with the kebab-case feature name (e.g., "tooltips", "legend", "themes").
Replace `[FeatureType]` with PascalCase for TypeScript interfaces (e.g., "Tooltip", "Legend", "Theme").

---

```markdown
---
title: '[FeatureName]s'
description: '[Brief description of what the feature does]. Customise [key aspects]. [Mention key capabilities]. [Note any special behaviors].'
enterprise: false  # Set to true if enterprise-only
---

[Opening paragraph: Clearly explain what the feature does and why users need it]

[FeatureName]s [description of what they enable or provide for users].

## Default [FeatureName]

[Explanation of how the feature works out of the box, without configuration]

{% chartExampleRunner title="Default [FeatureName]" name="default-[feature-name]" type="generated" /%}

[Explanation of what's shown in the example]

```js format="snippet"
{
    [minimal configuration if needed, or show that no configuration is required],
}
```

In this [example/configuration]:

-   [Key point about default behavior]
-   [Additional point about default behavior]
-   [Note about when/how default behavior applies]

[Cross-reference related concepts or configuration]

## [Feature] Modes

[If the feature has different operation modes, document them here]

[Explanation of available modes and when to use each]

{% chartExampleRunner title="[Feature] Mode" name="[feature-name]-mode" type="generated" /%}

```js format="snippet"
{
    [feature-name]: {
        mode: '[mode-value]', // or other mode options
    },
}
```

The options for `mode` are:

-   `'[mode1]'` - [description of what this mode does]
-   `'[mode2]'` - [description of what this mode does]
-   `'[mode3]'` - [description of what this mode does]

[Additional explanation or examples of mode behavior]

## [Configuration Area 1]

[e.g., Position, Size, Layout, Behavior, etc.]

[Explanation of this configuration area]

{% chartExampleRunner title="[Configuration Name]" name="[configuration-example]" type="generated" /%}

```js format="snippet"
{
    [feature-name]: {
        [configuration options],
    },
}
```

[Additional explanation, including:]
-   [How the configuration affects behavior]
-   [When to use this configuration]
-   [Important notes or gotchas]

### [Sub-configuration 1]

[If configuration area has multiple aspects, break into subsections]

[Explanation of this specific aspect]

```js format="snippet"
{
    [feature-name]: {
        [specific configuration],
    },
}
```

### [Sub-configuration 2]

[Repeat pattern for related sub-configurations]

## [Configuration Area 2]

[Repeat pattern for each major configuration area]

## [Feature] [Special Behavior]

[If the feature has special behaviors worth highlighting separately]
[e.g., Pagination, Interaction, Events, etc.]

[Explanation of the special behavior]

{% chartExampleRunner title="[Special Behavior Name]" name="[behavior-example]" type="generated" /%}

[Detailed explanation of how this works]

```js format="snippet"
{
    [feature-name]: {
        [behavior configuration],
    },
}
```

In the above example:

-   [Key point about behavior]
-   [Additional interaction or usage notes]

## Customisation

[Introduction to customization options]

{% chartExampleRunner title="[Feature] Customisation" name="[feature-name]-customisation" type="generated" /%}

### [Customization Method 1]

[e.g., Using CSS Styles, Renderer Functions, Configuration Options]

[Explanation of this customization approach]

```css
[CSS example if applicable]
```

or

```js format="snippet"
{
    [feature-name]: {
        [customization configuration],
    },
}
```

[Additional notes about this customization method]

### [Customization Method 2]

[e.g., Modifying Content, Custom Templates, etc.]

[Explanation and examples]

```js format="snippet"
{
    [feature-name]: {
        renderer: function (params) {
            [example renderer code]
        },
    },
}
```

In this configuration:

-   [Explanation of parameters or inputs]
-   [Explanation of return value or output]
-   [Additional notes or cross-references]

## [Feature] Events

[If the feature emits or responds to events]

[Explanation of available events and how to use them]

```js format="snippet"
{
    listeners: {
        [eventName]: (event) => {
            [example event handler]
        },
    },
}
```

[Cross-reference to events documentation if applicable]

## API Reference

{% tabs %}

{% tabItem id="AgChart[FeatureType]Options" label="[Feature] Options" %}
{% apiReference id="AgChart[FeatureType]Options" /%}
{% /tabItem %}

[If there are related interfaces, add additional tabs]
{% tabItem id="Ag[Related][Feature]Options" label="[Related Feature Name]" %}
{% apiReference id="Ag[Related][Feature]Options" /%}
{% /tabItem %}

{% /tabs %}
```

---

## Checklist for Feature Pages

Before finalizing your feature documentation:

- [ ] Opening paragraph explains what the feature does and why it's useful
- [ ] Default behavior documented first
- [ ] Different modes/variations documented with examples
- [ ] Major configuration areas covered
- [ ] Customization options explained
- [ ] All examples exist in `_examples/` folder
- [ ] All examples are framework-compatible (no `@ag-skip-fws`)
- [ ] Configuration snippets use `format="snippet"`
- [ ] Cross-links to related features
- [ ] Events documented if applicable
- [ ] API Reference at end with correct interface name(s)
- [ ] Description in frontmatter uses `$framework` placeholder
- [ ] Enterprise-only features marked with `enterprise: true`

---

## Examples of Feature Pages

Reference these existing feature pages for patterns:

- **`tooltips`**: Shows modes, position, customization with CSS and renderers, interaction
- **`legend`**: Shows layout/placement, floating, padding, pagination, customization, events
- **`themes`**: Shows stock themes, palette, parameters, overrides, Figma integration
- **`zoom`**: Shows different zoom modes, configuration, events

---

## Common Feature Page Sections

**For Interactive Features** (tooltips, zoom, context-menu, etc.):
- Default [Feature]
- [Feature] Modes (if applicable)
- Position/Placement
- Interaction/Behavior
- Customisation
- Events
- API Reference

**For Visual Features** (legend, title, background, etc.):
- Default [Feature]
- Layout/Placement
- Size/Constraints
- Customisation (styling)
- API Reference

**For Configuration Features** (themes, formatters, locale, etc.):
- Overview/Concept
- Basic Usage
- Advanced Configuration
- Customisation
- Examples by Use Case
- API Reference

**Common Configuration Areas**:
- Position/Placement
- Size/Dimensions
- Visibility/Toggle
- Styling (colors, fonts, borders)
- Behavior/Interaction
- Events/Callbacks

**Common Customization Sections**:
- Using CSS Styles
- Renderer Functions
- Formatter Functions
- Configuration Options
- Theme Overrides

