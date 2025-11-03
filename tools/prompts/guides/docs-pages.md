# Documentation Pages Guide

This guide provides comprehensive guidance for creating high-quality, consistent AG Charts documentation pages. It covers page types, structure, components, patterns, and writing guidelines.

## Table of Contents

-   [Documentation Page Types](#documentation-page-types)
-   [Standard Page Structure](#standard-page-structure)
-   [Markdoc Components Reference](#markdoc-components-reference)
-   [Content Patterns](#content-patterns)
-   [Writing Guidelines](#writing-guidelines)
-   [Example Integration](#example-integration)
-   [Cross-Referencing](#cross-referencing)
-   [API Reference Integration](#api-reference-integration)

## Documentation Page Types

AG Charts documentation is organized into five primary page types, each with distinct structure and purpose:

### 1. Series Pages

Document individual chart series types (e.g., Bar, Line, Pie, Area, Scatter).

**Purpose**: Teach users how to create and customize a specific chart type.

**Examples**: `bar-series`, `line-series`, `pie-series`, `area-series`

**Key Characteristics**:

-   Focus on visual representation of data
-   Progressive complexity (simple → variations → customization)
-   Emphasize data handling and formatting
-   Heavy use of visual examples

### 2. Feature Pages

Document chart features that apply across multiple series types (e.g., Tooltips, Legend, Themes, Zoom).

**Purpose**: Explain how to configure and use chart-wide features.

**Examples**: `tooltips`, `legend`, `themes`, `zoom`, `annotations`

**Key Characteristics**:

-   Feature-centric, not series-specific
-   Show how feature works across different contexts
-   Include configuration modes and variations
-   Demonstrate customization options

### 3. Configuration Pages

Document configuration areas that define chart structure (e.g., Axes, Layout).

**Purpose**: Provide comprehensive reference for configuration options.

**Examples**: `axes-types`, `layout`, `formatters`

**Key Characteristics**:

-   Organized by configuration type or variant
-   Technical and reference-oriented
-   Each section covers one type/mode
-   Less narrative, more examples

### 4. Getting Started Pages

Tutorial-style pages for new users (e.g., Quick Start, Installation).

**Purpose**: Help users get started quickly with minimal friction.

**Examples**: `quick-start`, `installation`, `create-a-basic-chart`

**Key Characteristics**:

-   Step-by-step instructions
-   Minimal assumptions about prior knowledge
-   Focus on immediate success
-   Simple, complete examples

### 5. Reference Pages

Technical reference and migration documentation (e.g., API Reference, Migration Guides).

**Purpose**: Provide detailed technical specifications and upgrade paths.

**Examples**: `migration`, `upgrade-to-ag-charts-*`, `licensing`

**Key Characteristics**:

-   Dense technical information
-   Often use specialized components (`majorTable`, etc.)
-   Version-specific content
-   Less example-focused, more specification-focused

## Standard Page Structure

### Frontmatter

All documentation pages begin with YAML frontmatter:

```yaml
---
title: 'Page Title'
description: '$framework Page description that uses $framework placeholder'
enterprise: true # Optional: mark enterprise-only features
hidden: false # Optional: hide from navigation
hideSideMenu: false # Optional: hide right-side navigation
hidePageMenu: false # Optional: hide left-side navigation
largeExamples: false # Optional: make examples very large
---
```

**Frontmatter Fields**:

-   `title` (required): Page title shown in navigation and browser tab
-   `description` (optional but recommended): SEO description, shown in search results
    -   Use `$framework` placeholder which gets replaced with "JavaScript", "React", "Angular", or "Vue" based on context
    -   Example: `'$framework Bar Charts visualise numerical data with proportional bars.'`
-   `enterprise` (optional): Set to `true` for enterprise-only features
-   `hidden` (optional): Set to `true` to hide page from navigation (use sparingly)
-   `hideSideMenu` (optional): Hide the right-side navigation menu with page headings
-   `hidePageMenu` (optional): Hide the left-side documentation navigation
-   `largeExamples` (optional): Make all examples on page display in larger format

### Opening Content

Immediately after frontmatter, start with an opening paragraph that:

1. **Clearly states what the feature/series does**
2. **Explains the primary use case**
3. **Uses plain language without jargon**

**Good Example** (Bar Series):

```markdown
A Bar Series visualises numerical data with proportional bars that can be grouped or stacked, and displayed in either
vertical or horizontal layouts.
```

**Good Example** (Legend):

```markdown
A Legend aids in matching visual elements in the chart to their corresponding series or data categories.
```

**Bad Example** (too technical):

```markdown
The Bar Series class extends AbstractSeriesNode and implements IBarSeries to provide bar chart rendering capabilities.
```

### Section Organization

Organize content in logical progression from simple to complex:

#### For Series Pages:

1. **Simple [Series Name]** - Basic usage
2. **Variations** - Different modes (horizontal, stacked, normalized, etc.)
3. **Customization** - Visual styling (colors, labels, markers)
4. **Data** - Data format requirements, missing data handling
5. **API Reference** - Technical specifications

#### For Feature Pages:

1. **Default Behavior** - How it works out of the box
2. **Basic Configuration** - Simple customization
3. **Modes/Variations** - Different feature modes
4. **Advanced Features** - Complex configurations
5. **Customization** - Styling and rendering
6. **API Reference** - Technical specifications

#### For Configuration Pages:

1. **Overview** - What this configuration area controls
2. **Type/Mode 1** - Description, example, code
3. **Type/Mode 2** - Description, example, code
4. **...** - Continue for each type
5. **API Reference** - All relevant interfaces

## Markdoc Components Reference

### chartExampleRunner

Embeds interactive chart examples in documentation.

**Purpose**: Display live, interactive chart examples that users can view and interact with.

**Attributes**:

-   `title` (required): Example title shown above the chart
-   `name` (required): Example folder name (must match `_examples/` subfolder)
-   `type` (optional): Usually `"generated"` for documentation examples
-   `isInline` (optional): Boolean, default `true`
-   `initialLoadDeferred` (optional): Boolean, default `false` - defer loading until visible
-   `options` (optional): Object with additional options like `exampleHeight`

**Usage**:

```markdown
{% chartExampleRunner title="Simple Bar" name="simple-bar" type="generated" /%}
```

**With custom height**:

```markdown
{% chartExampleRunner title="Large Example" name="custom-example" type="generated" options={ "exampleHeight": 800 } /%}
```

**Important Notes**:

-   The `name` must match an existing folder in `_examples/` directory adjacent to the `.mdoc` file
-   Examples must be created following the [Examples Guide](./examples.md)
-   All public documentation examples MUST be framework-compatible (no `@ag-skip-fws`)

**When to Use**:

-   After explaining a concept, show it in action
-   Use frequently - examples are the primary learning tool
-   Place examples BEFORE detailed configuration explanations
-   One example per major feature or variation

### apiReference

Displays TypeScript API documentation for interfaces.

**Purpose**: Show detailed API specifications extracted from TypeScript definitions.

**Attributes**:

-   `id` (required): TypeScript interface name (e.g., `"AgBarSeriesOptions"`)
-   `include` (optional): Array of property names to include
-   `exclude` (optional): Array of property names to exclude
-   `prioritise` (optional): Array of property names to show first
-   `hideHeader` (optional): Boolean, hide the interface name header
-   `hideRequired` (optional): Boolean, hide required field indicators
-   `specialTypes` (optional): Object mapping type names to special handling

**Usage**:

```markdown
{% apiReference id="AgBarSeriesOptions" /%}
```

**With prioritized properties**:

```markdown
{% apiReference id="AgLineSeriesOptions" prioritise=["type", "xKey", "yKey"] /%}
```

**With tabs** (for multiple related interfaces):

```markdown
{% tabs %}

{% tabItem id="AgBarSeriesOptions" label="Bar Series" %}
{% apiReference id="AgBarSeriesOptions" /%}
{% /tabItem %}

{% tabItem id="AgBarSeriesStyle" label="Bar Series Style" %}
{% apiReference id="AgBarSeriesStyle" /%}
{% /tabItem %}

{% /tabs %}
```

**Important Notes**:

-   The `id` must match a TypeScript interface name in `packages/ag-charts-types/`
-   API reference sections always go at the END of the page
-   Use tabs when multiple related interfaces exist

**When to Use**:

-   Always at the end of documentation pages
-   For comprehensive API coverage
-   When users need technical reference details

### tabs / tabItem

Organize related content in tabbed interface.

**Purpose**: Group multiple related pieces of content without overwhelming the page.

**Attributes**:

-   `tabs`: No attributes, container only
-   `tabItem`:
    -   `id` (required): Unique identifier for the tab
    -   `label` (required): Display text on the tab

**Usage**:

```markdown
{% tabs %}

{% tabItem id="simple" label="Simple Example" %}
Content for first tab goes here.
{% /tabItem %}

{% tabItem id="advanced" label="Advanced Example" %}
Content for second tab goes here.
{% /tabItem %}

{% /tabs %}
```

**Common Patterns**:

```markdown
{% tabs %}

{% tabItem id="AgBarSeriesOptions" label="Bar Series" %}
{% apiReference id="AgBarSeriesOptions" /%}
{% /tabItem %}

{% tabItem id="AgLineSeriesOptions" label="Line Series" %}
{% apiReference id="AgLineSeriesOptions" /%}
{% /tabItem %}

{% /tabs %}
```

**Important Notes**:

-   Tabs must be properly closed with `{% /tabs %}`
-   Each `tabItem` must be properly closed with `{% /tabItem %}`
-   Tab IDs should be unique within the page
-   Most commonly used for API reference sections with multiple related interfaces

**When to Use**:

-   API reference sections with multiple related interfaces
-   Multiple variations of similar content
-   When content would be too long if shown all at once
-   NOT for simple content that can be shown linearly

### note / warning / idea

Display callout boxes for important information.

**Purpose**: Highlight important information, warnings, or helpful tips.

**Attributes**: None (content only)

**Usage**:

**Note** (general information):

```markdown
{% note %}
Configuration options are merged with default values from the theme.
{% /note %}
```

**Warning** (important cautions):

```markdown
{% warning %}
The domain of a log axis should be strictly positive or strictly negative.
{% /warning %}
```

**Idea** (helpful tips):

```markdown
{% idea %}
Use `cornerRadius` to create rounded bar corners for a modern look.
{% /idea %}
```

**When to Use**:

-   `note`: General important information users should know
-   `warning`: Potential pitfalls, breaking changes, or critical limitations
-   `idea`: Best practices, optimization tips, or helpful suggestions

**When NOT to Use**:

-   Don't overuse - too many callouts reduce their effectiveness
-   Don't use for content that should be in main text
-   Don't use for trivial information

### Code Blocks

Display code snippets with syntax highlighting.

**Purpose**: Show configuration examples and code snippets.

**Syntax**:

````markdown
```js format="snippet"
{
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sales' },
    ],
}
```
````

**Important**:

-   Always use `format="snippet"` for configuration objects
-   Use `js` language for JavaScript/TypeScript configuration
-   Use `ts` for TypeScript-specific examples
-   Use `html` for HTML markup
-   Use `css` for CSS styles
-   Use `bash` for command-line examples

**Configuration Snippets**:

-   Show ONLY relevant configuration
-   Use `// ...` to indicate omitted parts
-   Focus on the feature being documented
-   Keep snippets focused and minimal

**Good Example**:

````markdown
```js format="snippet"
{
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'iphone', stacked: true },
        { type: 'bar', xKey: 'quarter', yKey: 'mac', stacked: true },
    ],
}
```
````

**Bad Example** (too much code):

````markdown
```js format="snippet"
{
    container: document.getElementById('myChart'),
    autoSize: true,
    title: { text: 'Sales Data' },
    subtitle: { text: 'Q1-Q4 2023' },
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'iphone', yName: 'iPhone', fill: '#007bff', stacked: true },
        { type: 'bar', xKey: 'quarter', yKey: 'mac', yName: 'Mac', fill: '#28a745', stacked: true },
    ],
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    legend: { enabled: true },
}
```
````

### videoSection

Embed YouTube videos in documentation.

**Purpose**: Provide video tutorials and demonstrations.

**Attributes**:

-   `id` (required): YouTube video ID
-   `title` (required): Video title

**Usage**:

```markdown
{% videoSection id="LsTOBSXs-aY" title="Theming Charts with Variables and Tokens" %}
Additional description text can go here, including links to [related content](./other-page/).
{% /videoSection %}
```

**When to Use**:

-   Tutorial content
-   Complex feature demonstrations
-   Supplementary learning material

**When NOT to Use**:

-   As primary documentation (text + examples should stand alone)
-   For simple features that don't need video explanation

### link

Create links with automatic framework-aware URL transformation.

**Purpose**: Link to other documentation pages with correct framework prefix.

**Attributes**:

-   `href` (required): Relative or absolute URL
-   `isExternal` (optional): Boolean, opens in new tab

**Usage**:

```markdown
See the [Tooltip](./tooltips/) documentation for more details.

Visit [AG Grid](https://ag-grid.com/) for our data grid library. {% link href="https://ag-grid.com/" isExternal=true /%}
```

**Important Notes**:

-   Use relative paths for internal links (e.g., `./tooltips/`, `./axes-types/`)
-   Framework prefix is automatically added (`/charts/react/tooltips/`, etc.)
-   External links should use `isExternal=true` to open in new tab

### imageCaption

Display images with captions.

**Purpose**: Show images with descriptive captions.

**Attributes**:

-   `imagePath` (required): Path to image relative to public assets
-   `alt` (required): Alt text for accessibility
-   `constrained` (optional): Boolean, constrain image size
-   `centered` (optional): Boolean, center the image

**Usage**:

```markdown
{% imageCaption imagePath="resources/AG-Charts-Figma-Banner.png" alt="AG Charts Figma" constrained=true centered=true /%}
```

### kbd

Display keyboard shortcuts.

**Purpose**: Show keyboard keys in styled format.

**Usage**:

```markdown
Press {% kbd %}Ctrl{% /kbd %}+{% kbd %}C{% /kbd %} to copy.
```

### Other Components

#### enterpriseIcon

Mark enterprise-only features inline.

**Usage**:

```markdown
Advanced tooltips {% enterpriseIcon /%} are available in AG Charts Enterprise.
```

#### br

Force line break (use sparingly).

**Usage**:

```markdown
First line{% br /%}Second line
```

## Content Patterns

### Series Pages Pattern

All series pages follow this structure:

#### 1. Opening (Required)

-   Brief description of what the series does
-   Primary use case

```markdown
A Bar Series visualises numerical data with proportional bars that can be grouped or stacked, and displayed in either
vertical or horizontal layouts.
```

#### 2. Simple [Series Name] (Required)

-   Example first, then explanation
-   Basic configuration
-   Explain required properties (`xKey`, `yKey`, etc.)

```markdown
## Simple Bar

{% chartExampleRunner title="Simple Bar" name="simple-bar" type="generated" /%}

To create a Bar Series, use the `bar` series type.

[code snippet showing basic configuration]

In this configuration:

-   `xKey` defines the categories, and is mapped to the [Category Axis](./axes-types/#category).
-   `yKey` provides the numerical values, corresponding to the [Number Axis](./axes-types/#number).
-   `yName` configures display names, reflected in [Tooltip Titles](./tooltips/) and [Legend Items](./legend/).
```

#### 3. Variations (Optional)

-   Show different modes/configurations
-   Each variation gets its own subsection
-   Common variations: Horizontal, Stacked, Normalized, Grouped

```markdown
## Horizontal Bar

{% chartExampleRunner title="Horizontal Bars" name="horizontal-bar" type="generated" /%}

To show a Horizontal Bar Series, set `direction: 'horizontal'`.

[code snippet]
```

#### 4. Customization (Optional)

-   Visual styling options
-   Labels, markers, colors, etc.
-   Group related customizations

```markdown
## Customisation

### Corner Radius

{% chartExampleRunner title="Customising Corner Radius" name="customising-corner-radius" type="generated" /%}

The corner radius can be customised with the `cornerRadius` property.

[code snippet]
```

#### 5. Data (Optional)

-   Data format requirements
-   Missing data handling
-   Continuous data options

```markdown
## Data

### Missing Data

{% chartExampleRunner title="Line Series with Incomplete Data" name="gap-line" type="generated" /%}

-   Data points with a `yKey` value of positive or negative `Infinity`, `null`, `undefined` or `NaN` will be rendered as a gap.
-   Set `connectMissingData: true` to draw a connecting line between points either side of a missing point.
```

#### 6. API Reference (Required)

-   Always at the end
-   Use tabs for multiple related interfaces

```markdown
## API Reference

{% tabs %}

{% tabItem id="AgBarSeriesOptions" label="Bar Series" %}
{% apiReference id="AgBarSeriesOptions" /%}
{% /tabItem %}

{% /tabs %}
```

### Feature Pages Pattern

Feature pages focus on chart-wide capabilities:

#### 1. Opening (Required)

-   What the feature does
-   Why users need it

```markdown
Tooltips allow users to see extra contextual information without overcrowding the chart.
```

#### 2. Default [Feature] (Required)

-   How it works out of the box
-   Example first

```markdown
## Default Tooltip

The tooltip content is based on the data values and keys of the series.

{% chartExampleRunner title="Default Tooltip" name="default-tooltip" type="generated" /%}

[explanation of default behavior]
```

#### 3. Feature Modes (Optional)

-   Different operation modes
-   Each mode gets subsection

```markdown
## Tooltip Modes

By default a shared tooltip will be used for most cartesian charts containing 3 or fewer series.

{% chartExampleRunner title="Tooltip Mode" name="tooltip-mode" type="generated" /%}

The options for `mode` are:

-   `single` - shows a title, symbol and data values for a single series.
-   `shared` - shows a merged tooltip, combining the tooltips of all series.
-   `compact` - shows fewer data fields and uses less padding.
```

#### 4. Configuration Options (Optional)

-   Key configuration areas
-   Position, size, behavior, etc.

```markdown
## Tooltip Position

The tooltip is anchored to the node. Use `tooltip.position.anchorTo`, and optionally `tooltip.position.placement`, to change this.

{% chartExampleRunner title="Tooltip Position" name="tooltip-position" type="generated" /%}

[code snippet and explanation]
```

#### 5. Customisation (Optional)

-   Styling options
-   CSS classes
-   Renderer functions

```markdown
## Customisation

### Using CSS Styles

{% chartExampleRunner title="Default Tooltip with Custom Styling" name="default-tooltip-styling" type="generated" /%}

The default tooltip uses the following CSS classes...
```

#### 6. API Reference (Required)

```markdown
## API Reference

{% tabs %}

{% tabItem id="AgChartTooltip" label="Chart Tooltip Options" %}
{% apiReference id="AgChartTooltipOptions" /%}
{% /tabItem %}

{% tabItem id="AgSeriesTooltip" label="Series Tooltip Options" %}
{% apiReference id="AgSeriesTooltip" /%}
{% /tabItem %}

{% /tabs %}
```

### Configuration Pages Pattern

Configuration pages are more reference-oriented:

#### 1. Opening (Required)

-   Overview of configuration area
-   When/why users need it

```markdown
The horizontal (X) and vertical (Y) lines in cartesian charts are referred to as chart axes, and they serve to illustrate
the relationships between data points on the graph. This section discusses the different axis types.
```

#### 2. Default Behavior (Optional)

-   How things work without explicit configuration

```markdown
In most cases, specifying an axis type is unnecessary as an appropriate axis will be inferred from the data and series type used in the chart.
By default, the x-axis uses a [Category](#category) or [Time](#time) axis, whilst the y axis defaults to a [Number](#number) axis.
```

#### 3. Type/Mode Sections (Required)

-   One section per configuration type
-   Each with: description, example, code, notes

````markdown
## Category

A category axis is used to display distinct categories or groups of data in a chart.

[detailed explanation]

```js format="snippet"
{
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
    ],
}
```
````

For a full list of configuration options see [Category Axis Options](#reference-AgCategoryAxisOptions).

````

#### 4. API Reference (Required)
- Tab for each type/mode

```markdown
## API Reference

{% tabs %}

{% tabItem id="AgCategoryAxisOptions" label="Category Axis" %}
{% apiReference id="AgCategoryAxisOptions" /%}
{% /tabItem %}

{% tabItem id="AgNumberAxisOptions" label="Number Axis" %}
{% apiReference id="AgNumberAxisOptions" /%}
{% /tabItem %}

{% /tabs %}
````

## Writing Guidelines

### Framework Agnostic

**Always use `$framework` placeholder** in descriptions:

**Good**:

```markdown
description: '$framework Bar Charts visualise numerical data with proportional bars.'
```

**Bad**:

```markdown
description: 'React Bar Charts visualise numerical data with proportional bars.'
```

The `$framework` placeholder is automatically replaced with "JavaScript", "React", "Angular", or "Vue" at render time based on the current framework context.

### Progressive Disclosure

**Start simple, progress to complex**:

1. Show basic usage first
2. Then variations
3. Then customization
4. Then advanced features

**Don't** overwhelm users with all options at once.

### Examples First

**Show working example BEFORE explaining configuration**:

**Good**:

```markdown
## Simple Bar

{% chartExampleRunner title="Simple Bar" name="simple-bar" type="generated" /%}

To create a Bar Series, use the `bar` series type.

[configuration snippet]
```

**Bad**:

```markdown
## Simple Bar

To create a Bar Series, use the `bar` series type and provide xKey and yKey properties.

[long explanation of all properties]

{% chartExampleRunner title="Simple Bar" name="simple-bar" type="generated" /%}
```

### Consistent Naming

**Use exact API names** in headings and text:

**Good**:

```markdown
Use the `strokeWidth` property to control line thickness.
```

**Bad**:

```markdown
Use the stroke width setting to control line thickness.
```

### Property Explanations

When explaining configuration properties:

**Use bulleted lists** for multiple related properties:

```markdown
In this configuration:

-   `xKey` defines the categories, and is mapped to the [Category Axis](./axes-types/#category).
-   `yKey` provides the numerical values, corresponding to the [Number Axis](./axes-types/#number).
-   `yName` configures display names, reflected in [Tooltip Titles](./tooltips/) and [Legend Items](./legend/).
```

**Cross-link** to relevant documentation:

-   Link to related features
-   Link to API reference sections
-   Link to related series types

### Default Values

**Mention defaults only when relevant** to understanding:

**Good** (default affects behavior):

```markdown
By default, callout labels won't be displayed for sectors with a value of `0`. Set `calloutLabel.minAngle = 0` to show these.
```

**Bad** (unnecessary default):

```markdown
The default value of `strokeWidth` is `1`.
```

**Important**: When documenting defaults, verify against the three-tier default system:

1. Check theme template in `*Module.ts` files (actual runtime default)
2. Fallback to `@Property` decorator if not in theme
3. Ensure TypeScript comments match runtime default

See the [Default Values Guide](./defaults.md) for complete details.

### Code Quality

**Configuration snippets**:

-   Show ONLY relevant configuration
-   Use proper TypeScript syntax
-   Use `format="snippet"` attribute
-   Omit unnecessary properties

**Good** (focused):

```js format="snippet"
{
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sales', stacked: true },
    ],
}
```

**Bad** (too much):

```js format="snippet"
{
    container: document.getElementById('myChart'),
    autoSize: true,
    padding: { top: 40, right: 40, bottom: 40, left: 40 },
    title: { text: 'Sales Chart' },
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sales', yName: 'Sales', fill: '#007bff', stacked: true },
    ],
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
}
```

### Voice and Tone

-   **Active voice**: "Use the `type` property" not "The `type` property can be used"
-   **Present tense**: "The legend displays" not "The legend will display"
-   **Direct**: "Set `stacked: true`" not "You can set stacked to true if you want"
-   **No jargon**: Explain technical terms when first introduced

### Formatting

-   **Code elements**: Use backticks for property names, values, types: `xKey`, `'bar'`, `AgBarSeriesOptions`
-   **Headings**: Use sentence case: "Simple bar" not "Simple Bar" (except for proper nouns)
-   **Lists**: Use bullet points for related items, numbered lists for sequential steps
-   **Emphasis**: Use **bold** for important terms on first use, _italics_ sparingly

## Example Integration

Documentation and examples must be coordinated:

### Example Requirements

**Before referencing an example**, ensure:

1. Example exists in `_examples/` folder adjacent to `.mdoc` file
2. Example follows framework-compatible patterns (see [Examples Guide](./examples.md))
3. Example demonstrates the stated feature clearly
4. Example has proper `main.ts`, and optionally `data.ts`, `styles.css`

### Coordinating Docs with Examples

**Document what the example shows**:

````markdown
{% chartExampleRunner title="Stacked Bars" name="stacked-bars" type="generated" /%}

To stack bars enable the `stacked` series option.

```js format="snippet"
{
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'iphone', stacked: true },
        // ...
    ],
}
```
````

````

**Explain key configuration**:
- Highlight the specific properties being demonstrated
- Show minimal code needed to achieve the result
- Cross-reference related features

### Framework Compatibility

**Critical**: All public documentation examples MUST work across all frameworks.

- Follow patterns in [Examples Guide](./examples.md)
- Use top-level variables and functions
- Simple event handlers
- NO `@ag-skip-fws` for public documentation

**Valid uses of `@ag-skip-fws`** (internal only):
- Benchmark examples
- Test pages (`*-test` pages)
- Internal testing only

## Cross-Referencing

### Internal Links

**Use relative paths** for internal documentation:

```markdown
See the [Tooltips](./tooltips/) documentation for more details.

Learn about [Category Axes](./axes-types/#category).
````

**Linking to API sections**:

```markdown
See the [API Reference](#reference-AgBarSeriesOptions-label) for label options.
```

### When to Cross-Link

**Link when**:

-   Mentioning a related feature
-   Referencing configuration elsewhere
-   Pointing to more detailed information
-   Directing to examples of related concepts

**Don't over-link**:

-   Not every mention of a term needs a link
-   First mention in a section is usually sufficient

### External Links

**Mark external links** with `isExternal=true`:

```markdown
Visit the [AG Grid website](https://ag-grid.com/) {% link href="https://ag-grid.com/" isExternal=true /%}
```

## API Reference Integration

### Placement

**Always at the end of the page**:

```markdown
## API Reference

{% tabs %}

{% tabItem id="AgBarSeriesOptions" label="Bar Series" %}
{% apiReference id="AgBarSeriesOptions" /%}
{% /tabItem %}

{% /tabs %}
```

### Finding the Right Interface

API interfaces are in `packages/ag-charts-types/src/`:

**For series**:

-   Pattern: `Ag[SeriesType]SeriesOptions`
-   Location: `packages/ag-charts-types/src/series/[category]/[type]Options.ts`
-   Examples: `AgBarSeriesOptions`, `AgLineSeriesOptions`, `AgPieSeriesOptions`

**For features**:

-   Pattern: `Ag[Feature]Options` or `AgChart[Feature]Options`
-   Location: `packages/ag-charts-types/src/chart/` or feature-specific folders
-   Examples: `AgChartTooltipOptions`, `AgChartLegendOptions`, `AgChartTheme`

**For axes**:

-   Pattern: `Ag[AxisType]AxisOptions`
-   Location: `packages/ag-charts-types/src/axes/`
-   Examples: `AgCategoryAxisOptions`, `AgNumberAxisOptions`, `AgTimeAxisOptions`

### Multiple Related Interfaces

Use tabs when there are multiple related interfaces:

```markdown
## API Reference

{% tabs %}

{% tabItem id="AgChartTooltip" label="Chart Tooltip Options" %}
{% apiReference id="AgChartTooltipOptions" /%}
{% /tabItem %}

{% tabItem id="AgSeriesTooltip" label="Series Tooltip Options" %}
{% apiReference id="AgSeriesTooltip" /%}
{% /tabItem %}

{% /tabs %}
```

### Prioritizing Properties

For large interfaces, prioritize important properties:

```markdown
{% apiReference id="AgLineSeriesOptions" prioritise=["type", "xKey", "yKey", "yName"] /%}
```

## Quick Reference Checklist

Before submitting documentation:

-   [ ] Frontmatter includes `title` and `description` with `$framework` placeholder
-   [ ] Opening paragraph clearly explains the feature/series
-   [ ] Examples placed before configuration explanations
-   [ ] Code snippets use `format="snippet"` attribute
-   [ ] All `chartExampleRunner` names match existing `_examples/` folders
-   [ ] Cross-links use relative paths
-   [ ] API reference section at end
-   [ ] No hardcoded framework names (use `$framework`)
-   [ ] Property names match TypeScript definitions exactly
-   [ ] Examples are framework-compatible (no `@ag-skip-fws`)
-   [ ] Follows progressive disclosure (simple → complex)

## Next Steps

-   Review existing documentation pages for patterns
-   Consult [Examples Guide](./examples.md) for example creation
-   Use [Documentation Page Templates](../templates/) for new pages
-   Run [Documentation Review](../commands/docs-review.md) to validate pages
-   Check [Documentation Checklist](../checklists/docs-page.md) before submission
