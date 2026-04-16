---
targets: ['*']
name: spruce-docs
description: Create or improve AG Charts documentation pages following established patterns, templates, and quality standards. Use when creating new documentation, revising existing pages, or ensuring documentation consistency.
context: fork
---

# Spruce Docs

This skill guides you through creating or improving AG Charts documentation pages using a structured workflow that ensures technical accuracy, pattern consistency, and framework compatibility.

## When to Use This Skill

-   Creating a new documentation page from scratch
-   Improving an existing documentation page
-   User requests to create, improve, or revise documentation
-   Documentation needs consistency with established patterns
-   Documentation needs technical accuracy validation
-   Adding new features that require documentation

## Prerequisites

-   Understanding of page type (series, feature, configuration, getting started, reference)
-   Access to TypeScript definitions (`packages/ag-charts-types/`)
-   Access to implementation files (`packages/ag-charts-community/` and/or `packages/ag-charts-enterprise/`)
-   Development server running (`yarn nx dev`) for visual validation

## Workflow

### Step 0: Load Required Documentation

**Read these files FIRST** before creating or modifying documentation:

1. `.rulesync/skills/spruce-docs/docs-pages-guide.md` - **COMPREHENSIVE** documentation patterns guide
2. `.rulesync/rules/examples.md` - Example requirements and framework compatibility
3. `.rulesync/skills/example/ag-charts/chart-construction.md` - Chart construction and module patterns
4. `.rulesync/skills/example/ag-charts/validation.md` - Build and validate commands
5. Appropriate template from `.rulesync/skills/spruce-docs/`:
    - `docs-series-page.md` - For chart series (bar, line, pie, etc.)
    - `docs-feature-page.md` - For chart-wide features (tooltips, legend, zoom, etc.)
    - `docs-configuration-page.md` - For configuration areas (axes, layout, etc.)
6. `.rulesync/skills/spruce-docs/checklist.md` - Validation checklist

**Optional supporting guides:**

-   `.rulesync/rules/examples-framework-patterns.md` - Technical framework transformation details
-   `.rulesync/rules/code-quality.md` - Code quality standards

### Step 1: Research & Planning

**Complete ALL before writing content:**

1. **Research the API:**

    - Read TypeScript definitions in `packages/ag-charts-types/src/`
        - Search for the primary interface name (e.g., `AgWaterfallSeriesOptions`)
        - Identify related interfaces and nested types
        - Note property structure, types, and relationships
    - Read implementation files in `packages/ag-charts-community/` and/or `packages/ag-charts-enterprise/`
        - Locate series/feature implementation
        - Check for theme defaults in `*Module.ts` files
        - Understand behavior and capabilities
    - Verify default values using the three-tier hierarchy:
        - Decorator defaults (base)
        - Theme template defaults (applied on top)
        - User configuration (final override)

2. **Review Similar Documentation:**

    - Find 2-3 similar existing documentation pages
    - Note structure, sections, and patterns used
    - Identify reusable patterns for this page type
    - Check how similar features document examples

3. **Plan Structure:**
    - Determine appropriate page type (series, feature, configuration)
    - Outline sections following progressive disclosure (simple → complex)
    - Identify required examples (minimum 2-3, ideally 4-5)
    - Note enterprise-only features if applicable

### Step 2: Content Creation

**Follow these patterns for quality documentation:**

1. **Frontmatter:**

    ```yaml
    ---
    title: '[Feature/Series Name]'
    enterprise: true # Only if enterprise-only
    ---
    ```

2. **Opening Paragraph:**

    - Clear, concise explanation of what the feature/series does
    - State primary use case in plain language
    - Keep jargon-free and accessible
    - No more than 2-3 sentences

3. **Progressive Disclosure Structure:**

    - Start with simplest/default usage
    - Progress to common variations
    - Then customization options
    - Finally advanced features
    - API Reference always at the end

4. **Section Pattern** (follow this template strictly for every section):

    ````markdown
    ## [Section Title]

    [Optional introductory sentence — only if needed to set context. Omit if the example speaks for itself.]

    {% chartExampleRunner title="[Example Name]" name="[example-name]" type="generated" /%}

    [One short sentence bridging the example to the code snippet below.]

    ```js format="snippet"
    [Minimal code snippet showing the key configuration]
    ```

    In this configuration:

    -   `propertyA` — what it does and why.
    -   `propertyB` — what it does and why.
    -   `propertyC` — what it does and why.
    ````

    **Key rules for every section:**
    - The example (`chartExampleRunner`) comes BEFORE any code snippet — readers see the visual result first.
    - Text between the example and the code snippet should be one sentence at most — just enough to introduce the snippet.
    - After the code snippet, use a **bulleted list** to explain each notable property. This is not optional — every code snippet must have bullet explanations.
    - Keep prose minimal throughout. Let the example and bullets do the heavy lifting.

5. **Component Usage:**
    - `{% chartExampleRunner %}` - For live examples
    - `{% apiReference %}` - For API documentation
    - `{% tabs %}` - For multiple related interfaces
    - Code snippets with `format="snippet"` when showing configuration patterns
    - Cross-references using relative paths

### Step 3: Example Specifications

**Define ALL required examples with complete specifications:**

For each example needed, document:

```markdown
### Example: [example-name]

-   **Location**: `_examples/[example-name]/`
-   **Purpose**: [What this example demonstrates]
-   **Configuration Highlights**:
    -   [Key configuration 1]
    -   [Key configuration 2]
-   **Data Requirements**: [Data structure/source]
-   **Framework Compatible**: ✅ YES (REQUIRED for all public docs examples)
-   **Notes**: [Any special considerations]
```

**Framework Compatibility Requirements (CRITICAL):**

-   ✅ ALL public documentation examples MUST work across all frameworks
-   ✅ NO `@ag-skip-fws` directive for documentation examples
-   ✅ Follow framework-compatible patterns from `.rulesync/rules/examples.md`:
    -   Use `document.getElementById('myChart')` for container
    -   Store options in top-level variable
    -   Store chart instance in top-level variable
    -   Use simple event handlers: `onclick="functionName()"`
    -   Keep functions at top level (not nested)
-   ❌ NO complex DOM manipulation beyond simple controls
-   ❌ NO external library dependencies

### Step 4: Validation (MANDATORY)

**Run these checks IN ORDER:**

1. **Self-Check Against Checklist:**

    - Open `.rulesync/skills/spruce-docs/checklist.md`
    - Verify all required elements present
    - Check technical accuracy (property names, types, defaults)
    - Validate component usage (correct syntax, attributes)
    - Confirm examples are specified completely

2. **Create Examples:**

    - Create all specified examples in `_examples/` folders
    - Follow `.rulesync/rules/examples.md` patterns
    - Ensure framework compatibility for each

3. **Generate Framework Variants:**

    ```bash
    nx generate-examples ag-charts-website
    ```

    **If this fails:** Review example patterns, fix framework incompatibilities

4. **Validate Examples Typecheck:**

    ```bash
    nx validate-examples
    ```

    **If this fails → FIX IMMEDIATELY** before proceeding

5. **Visual Verification:**

    - Start dev server: `yarn nx dev`
    - Navigate to page URL: `https://localhost:4600/charts/[page-path]`
    - Test ALL framework variants (vanilla, TypeScript, React, Angular, Vue)
    - Verify examples render correctly
    - Check responsive behavior
    - Test interactive elements

6. **Optional: Run docs-review Command:**
    ```bash
    # Use slash command or agent
    /docs-review [page-path]
    ```
    **If significant issues found → ADDRESS BEFORE FINALIZING**

## Completion Checklist

Cannot mark complete until **ALL** checked:

### Content Structure

-   [ ] Frontmatter complete and accurate
-   [ ] Opening paragraph clear and concise
-   [ ] Progressive disclosure followed (simple → complex)
-   [ ] API Reference section at end
-   [ ] All sections have examples before explanations

### Technical Accuracy

-   [ ] Property names match TypeScript definitions exactly
-   [ ] API interface names correct
-   [ ] Default values verified against three-tier hierarchy
-   [ ] Code snippets are valid and copy-pasteable
-   [ ] Cross-references use relative paths

### Examples

-   [ ] All examples created and working
-   [ ] Example specifications complete
-   [ ] Examples framework-compatible (NO `@ag-skip-fws`)
-   [ ] `nx generate-examples ag-charts-website` PASSED
-   [ ] `nx validate-examples` PASSED
-   [ ] All framework variants tested in dev server

### Writing Quality

-   [ ] Plain language, minimal jargon
-   [ ] Consistent terminology with other pages
-   [ ] Clear explanations of "why" not just "what"
-   [ ] No marketing language or superlatives

### Integration

-   [ ] Navigation entry added to `docs-nav/nav.json` (if new page)
-   [ ] Cross-references from related pages added (if appropriate)
-   [ ] Related examples updated (if applicable)

## Critical Rules

1. **Framework compatibility is paramount** - All public documentation examples MUST work in all frameworks
2. **Technical accuracy is non-negotiable** - Verify against TypeScript definitions and implementation
3. **Progressive disclosure** - Always start simple, then add complexity
4. **Examples before explanations** - Show, then explain
5. **Pattern consistency** - Follow established patterns from similar pages
6. **Zero tolerance for broken examples** - If `nx validate-examples` fails, stop and fix immediately

## Failure Handling

If validation fails, consult relevant guides and apply these fixes:

### Example Generation Failed

**Error**: `nx generate-examples` fails with transformation errors
**Solution**:

-   Review `.rulesync/rules/examples.md` for framework patterns
-   Check for unsupported patterns (nested functions, complex DOM manipulation)
-   Simplify example to use declarative patterns
-   Test with minimal example first, then add complexity

### Example Typecheck Failed

**Error**: `nx validate-examples` reports TypeScript errors
**Solution**:

-   Verify property names match TypeScript definitions
-   Check for typos in configuration paths
-   Ensure data structure matches expected types
-   Validate enum values are correct

### Missing API Interface

**Error**: Cannot find TypeScript interface
**Solution**:

-   Search entire `packages/ag-charts-types/src/` directory
-   Check for alternative interface names (e.g., plural vs singular)
-   Verify spelling and capitalization
-   Check if interface was recently renamed

### Default Values Incorrect

**Error**: Documented defaults don't match actual behavior
**Solution**:

-   Check decorator defaults in implementation files
-   Review theme template defaults in `*Module.ts` files
-   Test actual behavior in dev server
-   Document the effective default (after all three tiers)

### Examples Not Framework Compatible

**Error**: Examples work in vanilla but fail in frameworks
**Solution**:

-   Remove `@ag-skip-fws` directive (not allowed for public docs)
-   Use `document.getElementById()` for container
-   Move nested functions to top level
-   Replace complex DOM code with simple declarative patterns
-   Store chart instance and options in top-level variables

## Example Path Mappings

Documentation pages and examples:

-   **Repo path**: `packages/ag-charts-website/src/content/docs/[page-name]/`
-   **Examples path**: `packages/ag-charts-website/src/content/docs/[page-name]/_examples/[example-name]/`
-   **Dev server**: `https://localhost:4600/charts/[page-name]`

## Related Documentation

### Core Guides

-   **`.rulesync/skills/spruce-docs/docs-pages-guide.md`** - Comprehensive documentation patterns (READ FIRST)
-   **`.rulesync/rules/examples.md`** - Example requirements and framework compatibility
-   **`.rulesync/rules/examples-framework-patterns.md`** - Technical framework transformation details

### Templates

-   **`.rulesync/skills/spruce-docs/docs-series-page.md`** - Template for series documentation
-   **`.rulesync/skills/spruce-docs/docs-feature-page.md`** - Template for feature documentation
-   **`.rulesync/skills/spruce-docs/docs-configuration-page.md`** - Template for configuration documentation

### Checklists

-   **`.rulesync/skills/spruce-docs/checklist.md`** - Comprehensive validation checklist

### Commands

-   **`.rulesync/commands/docs-create.md`** - Scaffolds new documentation pages
-   **`/docs-review`** - Reviews existing documentation for accuracy (shared core + product wrapper)

### Related Skills

-   **`.rulesync/skills/spruce-example/SKILL.md`** - Improves example quality and visual design

## Example Usage

When the user says:

-   "Create documentation for the waterfall series"
-   "Improve the tooltip documentation page"
-   "I need to document the new gradient legend feature"
-   "Review and update the axes-labels page"

This skill will automatically activate and guide you through the structured workflow above.

## Integration with Other Workflows

-   **Creating new pages**: Use `/docs-create` command first to scaffold, then use this skill to refine
-   **Improving examples**: Use `spruce-example` skill for visual improvements, then update documentation with this skill
-   **Validating documentation**: Use `/docs-review` command for comprehensive technical validation
-   **After feature development**: Use this skill to create documentation for new features

---

**Remember**: This is a structured workflow - follow steps in order, validate thoroughly, and never skip framework compatibility checks!
