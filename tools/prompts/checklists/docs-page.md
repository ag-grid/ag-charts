# Documentation Page Checklist

Use this checklist before submitting or finalizing any documentation page. This ensures consistency, accuracy, and quality across all AG Charts documentation.

## Pre-Submission Checklist

### Content Structure

-   [ ] **Frontmatter is complete**

    -   [ ] `title` field present and descriptive
    -   [ ] `description` field present and uses `$framework` placeholder where appropriate
    -   [ ] `enterprise: true` set if feature is enterprise-only
    -   [ ] Other optional fields (`hidden`, `hideSideMenu`, etc.) set appropriately

-   [ ] **Opening paragraph present**

    -   [ ] Clearly explains what the feature/series does
    -   [ ] States the primary use case
    -   [ ] Uses plain language without jargon
    -   [ ] Is concise (1-2 sentences typically)

-   [ ] **Content follows progressive disclosure**

    -   [ ] Simple/basic usage comes first
    -   [ ] Variations follow basic usage
    -   [ ] Advanced features after variations
    -   [ ] Customization towards the end
    -   [ ] API Reference is the final section

-   [ ] **Examples precede explanations**

    -   [ ] Each major feature shown with `chartExampleRunner` first
    -   [ ] Configuration explanation follows the example
    -   [ ] Examples demonstrate the specific feature being discussed

-   [ ] **API Reference section present**
    -   [ ] Placed at the very end of the page
    -   [ ] Uses `{% tabs %}` and `{% tabItem %}` for multiple interfaces
    -   [ ] Correct interface name(s) in `{% apiReference id="..." /%}`
    -   [ ] Tab labels are clear and descriptive

### Technical Accuracy

-   [ ] **Configuration examples are valid**

    -   [ ] All code snippets use `format="snippet"` attribute
    -   [ ] Property names match TypeScript definitions exactly (case-sensitive)
    -   [ ] Values match expected types (strings, numbers, booleans, objects)
    -   [ ] No syntax errors in code snippets

-   [ ] **API references are correct**

    -   [ ] Interface names in `apiReference` match TypeScript definitions
    -   [ ] Interface names use correct PascalCase (e.g., `AgBarSeriesOptions`)
    -   [ ] Multiple related interfaces included where appropriate

-   [ ] **Default values are accurate**

    -   [ ] Defaults verified against theme templates in `*Module.ts` files first
    -   [ ] Fallback to `@Property` decorators if not in theme
    -   [ ] TypeScript comments match actual runtime defaults
    -   [ ] Mentioned only when relevant to understanding

-   [ ] **Cross-references are valid**
    -   [ ] Internal links use relative paths (e.g., `./tooltips/`, `./axes-types/`)
    -   [ ] Links point to existing pages
    -   [ ] Hash links point to existing sections/headings
    -   [ ] External links marked with `isExternal=true` attribute

### Examples Integration

-   [ ] **All referenced examples exist**

    -   [ ] Each `chartExampleRunner name="..."` has matching `_examples/` folder
    -   [ ] Example folder contains required `main.ts` file
    -   [ ] Optional `data.ts`, `styles.css`, `index.html` files present as needed

-   [ ] **Examples are framework-compatible**

    -   [ ] NO `@ag-skip-fws` directive in public documentation examples
    -   [ ] Examples follow patterns in [Examples Guide](../guides/examples.md)
    -   [ ] Top-level variables and functions used
    -   [ ] Simple event handlers (no complex inline logic)
    -   [ ] Container uses `document.getElementById('myChart')`

-   [ ] **Examples demonstrate stated features**
    -   [ ] Example clearly shows the feature being documented
    -   [ ] Configuration in documentation matches example code
    -   [ ] Example is focused (not showing unrelated features)

### Writing Quality

-   [ ] **Framework-agnostic language**

    -   [ ] Uses `$framework` placeholder in descriptions
    -   [ ] No hardcoded framework names ("React", "Angular", "Vue")
    -   [ ] Content works for all frameworks

-   [ ] **Consistent terminology**

    -   [ ] Uses exact API property names (in backticks)
    -   [ ] Consistent naming throughout the page
    -   [ ] Technical terms explained on first use

-   [ ] **Proper formatting**

    -   [ ] Code elements use backticks: `propertyName`, `'value'`, `InterfaceName`
    -   [ ] Headings use appropriate levels (## for major sections, ### for subsections)
    -   [ ] Bullet points for related items
    -   [ ] Numbered lists for sequential steps (rare in docs)

-   [ ] **Clear explanations**
    -   [ ] Active voice: "Use the property" not "The property can be used"
    -   [ ] Present tense: "The chart displays" not "The chart will display"
    -   [ ] Direct instructions: "Set `stacked: true`" not "You can set stacked to true"

### Components Usage

-   [ ] **chartExampleRunner used correctly**

    -   [ ] Has required `title` attribute
    -   [ ] Has required `name` attribute matching example folder
    -   [ ] Optional `type="generated"` attribute included for docs examples
    -   [ ] Optional `options` object used correctly if needed (e.g., `{ "exampleHeight": 800 }`)

-   [ ] **Callout components used appropriately**

    -   [ ] `{% note %}` for important general information
    -   [ ] `{% warning %}` for critical warnings or pitfalls
    -   [ ] `{% idea %}` for tips and best practices
    -   [ ] Not overused (reduces effectiveness)
    -   [ ] Content is relevant and helpful

-   [ ] **Code blocks formatted correctly**
    -   [ ] Language specified (js, ts, html, css, bash)
    -   [ ] `format="snippet"` used for configuration objects
    -   [ ] Code is minimal and focused
    -   [ ] Ellipsis (`// ...`) used to indicate omitted parts

### Cross-Referencing

-   [ ] **Related features linked**

    -   [ ] Links to related series types
    -   [ ] Links to related features (tooltips, legend, etc.)
    -   [ ] Links to configuration options (axes, themes, etc.)
    -   [ ] Links to getting started/tutorial content where appropriate

-   [ ] **API sections linked**
    -   [ ] Links to specific API reference sections where relevant
    -   [ ] Format: `[API Reference](#reference-InterfaceName-propertyName)`

### Navigation

-   [ ] **Page added to navigation** (if new page)

    -   [ ] Entry added to `packages/ag-charts-website/src/content/docs-nav/nav.json`
    -   [ ] Placed in appropriate section
    -   [ ] Title matches page title

-   [ ] **"Next Up" section** (optional)
    -   [ ] Links to logical next topic if appropriate
    -   [ ] Helps users navigate related content

## Page-Type Specific Checklists

### For Series Pages

-   [ ] **Simple [Series] section present**

    -   [ ] Basic example showing series type
    -   [ ] Explains required properties (`xKey`, `yKey`, etc.)
    -   [ ] Shows minimal working configuration

-   [ ] **Variations documented** (if applicable)

    -   [ ] Horizontal orientation (if supported)
    -   [ ] Stacked mode (if supported)
    -   [ ] Normalized mode (if stacking supported)
    -   [ ] Grouped stacks (if applicable)

-   [ ] **Customization section present**

    -   [ ] Labels (if applicable)
    -   [ ] Markers (for line-based series)
    -   [ ] Colors/fills
    -   [ ] Other visual styling options

-   [ ] **Data section present** (if relevant)
    -   [ ] Missing data handling
    -   [ ] Continuous data usage (time/number axes)
    -   [ ] Data format requirements

### For Feature Pages

-   [ ] **Default behavior documented**

    -   [ ] Shows feature working out of the box
    -   [ ] Explains default configuration

-   [ ] **Modes/variations documented** (if applicable)

    -   [ ] Different operation modes explained
    -   [ ] Use cases for each mode
    -   [ ] Examples for each mode

-   [ ] **Configuration sections present**

    -   [ ] Position/placement (if applicable)
    -   [ ] Size/constraints (if applicable)
    -   [ ] Behavior/interaction (if applicable)

-   [ ] **Customization documented**
    -   [ ] CSS styling (if applicable)
    -   [ ] Renderer functions (if applicable)
    -   [ ] Configuration options

### For Configuration Pages

-   [ ] **Overview section present**

    -   [ ] Explains what configuration area controls
    -   [ ] When users need to configure it

-   [ ] **Default behavior explained**

    -   [ ] What happens without explicit configuration
    -   [ ] Automatic/inferred behavior

-   [ ] **Each type/mode documented**
    -   [ ] Description and use cases
    -   [ ] Visual example
    -   [ ] Configuration code
    -   [ ] Important notes or limitations
    -   [ ] Link to API reference

## Validation Steps

### Before Requesting Review

-   [ ] **Run example generation**

    ```bash
    nx generate-examples ag-charts-website
    ```

-   [ ] **Validate examples**

    ```bash
    nx validate-examples
    ```

-   [ ] **View page in dev server**

    ```bash
    nx dev
    ```

    -   [ ] Navigate to page in all frameworks (JavaScript, React, Angular, Vue)
    -   [ ] Examples load and display correctly
    -   [ ] Framework switcher works for all examples
    -   [ ] Navigation shows page correctly

-   [ ] **Run formatting**
    ```bash
    nx format
    ```

### Optional Validation

-   [ ] **Run E2E tests** (for significant changes)

    ```bash
    nx e2e ag-charts-website
    ```

-   [ ] **Run docs review** (for comprehensive validation)
    -   Use `/docs-review` command with page path
    -   Address any critical or warning issues found

## Common Issues Checklist

Avoid these common mistakes:

-   [ ] **No hardcoded framework names** in content (use `$framework`)
-   [ ] **No `@ag-skip-fws`** in public documentation examples
-   [ ] **No missing examples** - all `chartExampleRunner` references have folders
-   [ ] **No incorrect interface names** in `apiReference`
-   [ ] **No absolute paths** in cross-references (use relative paths)
-   [ ] **No missing `format="snippet"`** on configuration code blocks
-   [ ] **No inconsistent property names** (check against TypeScript definitions)
-   [ ] **No undocumented defaults** that differ from theme templates
-   [ ] **No overly complex examples** (keep examples focused)
-   [ ] **No missing frontmatter** fields (title, description minimum)

## Final Review Questions

Before marking as complete, answer these questions:

1. **Would a new user understand this feature from this documentation?**

    - If no, add more explanation or simpler examples

2. **Are all code snippets copy-pasteable and valid?**

    - If no, fix syntax errors and ensure completeness

3. **Do all examples work in all frameworks?**

    - If no, simplify examples or fix framework-compatibility issues

4. **Is the page structure consistent with similar pages?**

    - If no, follow the appropriate template pattern

5. **Are all technical details accurate?**
    - If uncertain, verify against TypeScript definitions and implementation

## Resources

-   [Documentation Pages Guide](../guides/docs-pages.md) - Comprehensive guide
-   [Examples Guide](../guides/examples.md) - Example creation guide
-   [Documentation Templates](../templates/) - Page templates (see individual template files)
-   [Documentation Review Command](../commands/docs-review.md) - Validation tool
-   [Default Values Guide](../guides/defaults.md) - Default value verification

## Quick Reference

**Essential Files for Documentation**:

-   Main doc: `packages/ag-charts-website/src/content/docs/[page-name]/index.mdoc`
-   Examples: `packages/ag-charts-website/src/content/docs/[page-name]/_examples/[example-name]/`
-   Navigation: `packages/ag-charts-website/src/content/docs-nav/nav.json`
-   TypeScript types: `packages/ag-charts-types/src/`

**Essential Commands**:

```bash
nx generate-examples ag-charts-website  # Generate framework variants
nx validate-examples                     # Validate all examples
nx dev                                   # Start dev server
nx format                                # Format files
nx e2e ag-charts-website                 # Run E2E tests
```

**Framework URL Paths**:

-   JavaScript: `/charts/javascript/[page-name]/`
-   React: `/charts/react/[page-name]/`
-   Angular: `/charts/angular/[page-name]/`
-   Vue: `/charts/vue/[page-name]/`
