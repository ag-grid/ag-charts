# Label elements must be associated with controls

Rule ID: Web:S6853

Rule URL: https://sonarcloud.io/api/rules/show?key=Web%3AS6853&organization=ag-grid

Form labels must be properly associated with their controls to ensure accessibility and usability. A `<label>` element must either wrap a control element or use the `for` attribute to reference a control's `id`, and must contain descriptive text content.

**Key Issues:**

-   Screen readers cannot properly describe form controls without proper label associations
-   Users cannot click labels to focus/activate controls
-   Reduces accessibility for keyboard-only navigation
-   Makes forms harder to understand and use

**Clean Code Attributes:**

-   Tags: accessibility, wcag2-a, user-experience
-   Severity: Major
-   Type: Code Smell
-   Impact on Accessibility: High

## Example Violations

```html
<!-- Noncompliant: Input without associated label -->
<input type="text" />
<label>Favorite food</label>
```

```html
<!-- Noncompliant: Label without text content -->
<label>
    <input type="text" />
</label>
```

```html
<!-- Noncompliant: Label with for attribute but no matching id -->
<label for="username">Username</label>
<input type="text" />
```

```html
<!-- Noncompliant: Label with aria-hidden span but no visible text -->
<label>
    <span aria-hidden="true">Field</span>
    <input type="text" />
</label>
```

## Example Fixes

```html
<!-- Compliant: Label wraps input with descriptive text -->
<label>
    Favorite food
    <input type="text" />
</label>
```

```html
<!-- Compliant: Label uses for attribute with matching id -->
<label for="username">Username</label>
<input type="text" id="username" />
```

```html
<!-- Compliant: Label wraps input with visible text -->
<label>
    <span>Email address</span>
    <input type="email" />
</label>
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts components, form labels often appear in:

1. **Color picker inputs:**

    ```html
    <!-- Before: Label without proper association -->
    <label class="ag-charts-color-picker__color-field" role="presentation">
        <span class="ag-charts-color-picker__color-label" aria-hidden="true"></span>
        <input class="ag-charts-color-picker__color-input" tabindex="0" value="#000" />
    </label>

    <!-- After: Add visible text or use aria-label on input -->
    <label class="ag-charts-color-picker__color-field">
        <span class="ag-charts-color-picker__color-label">Color</span>
        <input class="ag-charts-color-picker__color-input" tabindex="0" value="#000" />
    </label>
    ```

2. **Range sliders and controls:**

    ```html
    <!-- Before: Input without label -->
    <input class="ag-charts-slider" type="range" min="0" max="100" />

    <!-- After: Wrapped in label with text -->
    <label>
        Opacity
        <input class="ag-charts-slider" type="range" min="0" max="100" />
    </label>
    ```

3. **Custom form controls:**
    ```html
    <!-- Compliant: Custom component with proper label -->
    <label>
        Chart Title
        <input type="text" class="ag-charts-title-input" />
    </label>
    ```

### Fixing Strategies

1. **Wrap with label and add text:**

    ```html
    <!-- Simplest approach -->
    <label>
        Field Name
        <input type="text" />
    </label>
    ```

2. **Use for/id association:**

    ```html
    <!-- When wrapping isn't possible -->
    <label for="field-id">Field Name</label>
    <input type="text" id="field-id" />
    ```

3. **Remove aria-hidden from label text:**

    ```html
    <!-- Before -->
    <label>
        <span aria-hidden="true">Field</span>
        <input type="text" />
    </label>

    <!-- After -->
    <label>
        <span>Field</span>
        <input type="text" />
    </label>
    ```

4. **Add aria-label as fallback:**
    ```html
    <!-- When visual label isn't desired -->
    <label>
        <input type="text" aria-label="Color value" />
    </label>
    ```

### Important Exceptions

-   **Custom components:** Labels wrapping custom React/Vue components that contain form controls do not raise issues
-   **Programmatic labels:** Controls that receive labels dynamically via JavaScript (e.g., `input.labels`) are acceptable
-   **ARIA labels:** Controls with `aria-label` or `aria-labelledby` provide equivalent functionality

### Testing Considerations

-   Test with screen readers to verify label announcements
-   Ensure clicking labels focuses/activates controls
-   Verify keyboard navigation works correctly
-   Check that label text is visible and descriptive

### References

-   [WCAG 2.1 - Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html)
-   [MDN: `<label>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
-   [WebAIM: Creating Accessible Forms](https://webaim.org/techniques/forms/controls)
