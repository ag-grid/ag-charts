# Documentation Page Creation Command

This command scaffolds new AG Charts documentation pages following established patterns and standards.

## Purpose

Create a new documentation page with proper structure, examples, and API references based on AG Charts conventions.

## Input Requirements

User must provide:

1. **Page Type** (required):

    - `series` - For chart series types (bar, line, pie, etc.)
    - `feature` - For chart-wide features (tooltips, legend, zoom, etc.)
    - `configuration` - For configuration areas (axes, layout, etc.)
    - `getting-started` - For tutorial/getting started content
    - `reference` - For technical reference content

2. **Page Name** (required):

    - Kebab-case format (e.g., `waterfall-series`, `gradient-legend`, `axes-labels`)
    - Will be used for file paths and URLs

3. **Primary API Interface** (required):

    - TypeScript interface name (e.g., `AgWaterfallSeriesOptions`, `AgChartTooltipOptions`)
    - Must exist in `packages/ag-charts-types/src/`

4. **Brief Description** (required):

    - One sentence describing what to document
    - Will be used to generate content

5. **Additional Context** (optional):
    - Related features or series
    - Specific variations to cover
    - Enterprise-only indicator

## Execution Steps

### Phase 1: Preparation

1. **Read Documentation Guides**

    - Read `tools/prompts/guides/docs-pages.md` for comprehensive patterns
    - Read `tools/prompts/guides/examples.md` for example requirements
    - Identify the appropriate template from `tools/prompts/templates/`

2. **Research the API**

    - Read TypeScript definitions in `packages/ag-charts-types/src/`
        - Search for the primary interface name
        - Identify related interfaces
        - Note property structure and relationships
    - Read implementation files in `packages/ag-charts-{community,enterprise}/src/`
        - Locate series/feature implementation
        - Check for theme defaults in `*Module.ts` files
        - Understand behavior and capabilities

3. **Review Similar Documentation**
    - Find similar existing documentation page(s)
    - Note structure, sections, and patterns used
    - Identify reusable patterns for this page type

### Phase 2: Structure Creation

4. **Load Appropriate Template**

    - `tools/prompts/templates/docs-series-page.md` for series
    - `tools/prompts/templates/docs-feature-page.md` for features
    - `tools/prompts/templates/docs-configuration-page.md` for configuration

5. **Customize Template**

    - Replace all placeholder text with actual content
    - Adapt sections based on API research
    - Remove sections that don't apply
    - Add sections for unique features

6. **Create Page Structure**
    - Frontmatter with title and description
    - Opening paragraph
    - Progressive sections (simple → complex)
    - API Reference section at end

### Phase 3: Content Generation

7. **Generate Opening Content**

    - Write clear opening paragraph
    - Explain what feature/series does
    - State primary use case
    - Keep concise and jargon-free

8. **Create Example Specifications**

    - List required examples with names
    - Specify what each example demonstrates
    - Note configuration needed for each
    - Mark framework compatibility requirements

9. **Write Configuration Sections**

    - Simple/default usage first
    - Variations and modes next
    - Customization options
    - Advanced features last

10. **Add API Reference**
    - Identify all relevant interfaces
    - Create tabs for multiple interfaces
    - Use correct interface names

### Phase 4: Validation

11. **Self-Check Against Checklist**

    -   Review `tools/prompts/checklists/docs-page.md`
    -   Verify all required elements present
    -   Check technical accuracy
    -   Validate component usage

12. **Validate Structure**
    -   Frontmatter complete
    -   Examples before explanations
    -   Code snippets use `format="snippet"`
    -   Cross-references use relative paths
    -   API reference at end

## Output Format

### 1. Complete `.mdoc` File

Output the complete markdown file content for:

```
packages/ag-charts-website/src/content/docs/[page-name]/index.mdoc
```

### 2. Example Requirements Document

List all required examples with specifications:

```markdown
## Required Examples

### Example 1: simple-[feature]

-   **Location**: `_examples/simple-[feature]/`
-   **Purpose**: Demonstrate basic usage
-   **Configuration**:
    -   [List key configuration]
-   **Data**: [Data requirements]
-   **Framework Compatible**: Yes

### Example 2: [variation]-[feature]

-   **Location**: `_examples/[variation]-[feature]/`
-   **Purpose**: Show [variation] mode
-   **Configuration**:
    -   [List key configuration]
-   **Data**: [Data requirements]
-   **Framework Compatible**: Yes

[Continue for all examples...]
```

### 3. Navigation Entry

Provide JSON to add to `packages/ag-charts-website/src/content/docs-nav/nav.json`:

```json
{
    "title": "[Page Title]",
    "path": "[page-name]"
}
```

Specify which section it should be added to.

### 4. Validation Summary

Checklist results:

```markdown
## Pre-Submission Validation

### Structure

-   [x] Frontmatter complete
-   [x] Opening paragraph clear
-   [x] Progressive disclosure followed
-   [x] API Reference at end

### Technical Accuracy

-   [x] Property names match TypeScript definitions
-   [x] API interface names correct
-   [x] Default values verified
-   [x] Cross-references valid

### Examples

-   [ ] Examples to be created (see Example Requirements)
-   [x] Example names valid
-   [x] Examples framework-compatible

### Next Steps

1. Create examples (see Example Requirements document)
2. Add page to navigation (see Navigation Entry)
3. Run `yarn nx generate-examples ag-charts-website`
4. Run `yarn nx validate-examples`
5. Test in dev server with `yarn nx dev`
```

## Usage Examples

### Example 1: Creating a Series Page

**Input**:

```
Page Type: series
Page Name: waterfall-series
Primary API Interface: AgWaterfallSeriesOptions
Description: Document the Waterfall Series which visualizes sequential positive and negative changes
Additional Context: Should cover positive/negative connectors, subtotals, line configuration
```

**Process**:

1. Load series page template
2. Research `AgWaterfallSeriesOptions` interface
3. Review bar-series for similar patterns
4. Create structure: Simple → Subtotals → Connectors → Customization → API
5. Generate example specifications
6. Output complete page

### Example 2: Creating a Feature Page

**Input**:

```
Page Type: feature
Page Name: gradient-legend
Primary API Interface: AgChartGradientLegendOptions
Description: Document gradient legend feature for continuous color scales
Additional Context: Enterprise feature, applies to heatmaps and gradient series
```

**Process**:

1. Load feature page template
2. Research `AgChartGradientLegendOptions` interface
3. Review legend and themes pages for patterns
4. Create structure: Default → Position → Scale → Customization → API
5. Mark as enterprise in frontmatter
6. Generate example specifications
7. Output complete page

### Example 3: Creating a Configuration Page

**Input**:

```
Page Type: configuration
Page Name: axes-labels
Primary API Interface: AgAxisLabelOptions
Description: Document axis label configuration including formatting, rotation, and padding
```

**Process**:

1. Load configuration page template
2. Research `AgAxisLabelOptions` interface
3. Review axes-types for patterns
4. Create structure: Overview → Formatting → Rotation → Padding → API
5. Generate examples for each configuration area
6. Output complete page

## Quality Standards

The generated documentation must:

1. **Follow established patterns**

    - Use appropriate template structure
    - Match style of similar existing pages
    - Maintain consistent terminology

2. **Be technically accurate**

    - Property names match TypeScript definitions exactly
    - Default values verified against implementation
    - Code snippets are valid and copy-pasteable

3. **Be framework-agnostic**

    - Use `$framework` placeholder
    - Examples work in all frameworks
    - No framework-specific code in public docs

4. **Be user-friendly**

    - Clear explanations in plain language
    - Examples before complex explanations
    - Progressive disclosure (simple → complex)

5. **Be complete**
    - All required sections present
    - Example specifications detailed
    - API reference comprehensive

## Error Handling

If issues arise during creation:

### Missing API Interface

**Error**: Cannot find TypeScript interface
**Solution**:

-   Search entire `packages/ag-charts-types/src/` directory
-   Check for alternative interface names
-   Verify with user if interface name is correct

### Unclear Page Type

**Error**: User description doesn't clearly fit a page type
**Solution**:

-   Ask clarifying questions
-   Review similar features to determine best fit
-   Suggest most appropriate page type with explanation

### Insufficient Information

**Error**: Not enough context to create quality documentation
**Solution**:

-   Request additional details from user
-   List specific information needed
-   Suggest researching similar features first

## Integration with Workflow

After creating documentation with this command:

1. **Review generated content** for accuracy
2. **Create examples** following Example Requirements document
3. **Add to navigation** using provided JSON
4. **Generate framework variants**: `yarn nx generate-examples ag-charts-website`
5. **Validate examples**: `yarn nx validate-examples`
6. **Test in dev server**: `yarn nx dev`
7. **Optional**: Run `/docs-review` for comprehensive validation

## Related Resources

-   [Documentation Pages Guide](../guides/docs-pages.md) - Comprehensive patterns and guidelines
-   [Examples Guide](../guides/examples.md) - Example creation requirements
-   [Documentation Templates](../templates/) - Base templates for each page type
-   [Documentation Checklist](../checklists/docs-page.md) - Validation checklist
-   [Documentation Review](./docs-review.md) - Validation command

## Notes for Implementation

When implementing this command:

-   Read all referenced guides before generating content
-   Research thoroughly from TypeScript definitions
-   Follow template structure closely
-   Generate realistic example specifications
-   Validate against checklist before output
-   Provide clear next steps for user

This command is for **scaffolding** documentation pages. Examples must be created separately following the [Examples Guide](../guides/examples.md). Use this command to get a solid starting structure, then refine and complete based on actual implementation details.
