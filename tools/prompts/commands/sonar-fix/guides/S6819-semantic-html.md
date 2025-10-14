# Web:S6819 - Use semantic HTML elements instead of ARIA roles

## Rule Overview

**Severity:** MAJOR
**Type:** CODE_SMELL
**Category:** Accessibility

## Description

ARIA roles should be avoided when semantic HTML elements with equivalent functionality exist. Semantic HTML tags provide better accessibility, browser support, and SEO benefits compared to generic elements with ARIA roles.

### Why This Matters

1. **Built-in Functionality**: Semantic HTML elements come with inherent behaviors and keyboard interactions
2. **Universal Support**: Better support across browsers and assistive technologies
3. **Better SEO**: Search engines understand semantic HTML better than ARIA roles
4. **Maintainability**: Semantic HTML is clearer and easier to understand

## Examples

### Non-Compliant Code

```html
<!-- Using ARIA role on generic element -->
<div role="button" onClick="myFunction()">Click me</div>

<!-- Redundant role="presentation" on elements with no semantic meaning -->
<div role="presentation" class="container">
    <div role="presentation" class="content"></div>
</div>

<!-- Using ARIA role instead of semantic element -->
<div role="navigation">
    <a href="/home">Home</a>
</div>
```

### Compliant Solution

```html
<!-- Use semantic button element -->
<button onClick="myFunction()">Click me</button>

<!-- Remove redundant role from divs (they have no semantic meaning anyway) -->
<div class="container">
    <div class="content"></div>
</div>

<!-- Use semantic nav element -->
<nav>
    <a href="/home">Home</a>
</nav>
```

## Common Replacements

| ARIA Role           | Semantic HTML Element  |
| ------------------- | ---------------------- |
| `role="button"`     | `<button>`             |
| `role="navigation"` | `<nav>`                |
| `role="main"`       | `<main>`               |
| `role="heading"`    | `<h1>` to `<h6>`       |
| `role="list"`       | `<ul>` or `<ol>`       |
| `role="listitem"`   | `<li>`                 |
| `role="img"`        | `<img>`                |
| `role="link"`       | `<a>`                  |
| `role="form"`       | `<form>`               |
| `role="slider"`     | `<input type="range">` |

### Special Case: role="presentation"

`role="presentation"` (or `role="none"`) removes an element's implicit ARIA semantics from the accessibility tree. It should be used sparingly:

-   **On divs/spans**: Usually redundant since these elements have no semantic meaning
-   **On semantic elements**: Only when you explicitly want to remove their semantics (rare)
-   **Better approach**: Simply don't use the role attribute on divs/spans

## Important Exceptions

### Custom Interactive Components

When creating custom interactive components that have no semantic HTML equivalent, ARIA roles are appropriate:

1. **2D Sliders/Color Pickers**: For 2-dimensional input controls (like a color saturation/value picker), `role="slider"` with proper ARIA attributes is acceptable since HTML only provides 1-dimensional `<input type="range">`.

    ```html
    <!-- Acceptable: Custom 2D slider with ARIA -->
    <div role="slider" aria-label="Color palette" aria-valuetext="Saturation 50%, Value 75%" tabindex="0"></div>
    ```

2. **Complex Widgets**: Tree views, grids, and other complex patterns that have no semantic HTML equivalent.

### When ARIA is Necessary

-   When semantic HTML doesn't provide the needed functionality
-   When the element has proper ARIA attributes (aria-label, aria-valuetext, etc.)
-   When keyboard navigation is properly implemented
-   When the ARIA pattern follows WAI-ARIA Authoring Practices

## Fix Strategy

1. **Identify the element's purpose**: What is this element trying to accomplish?
2. **Check for semantic alternative**: Is there an HTML element that does this?
3. **Replace or remove**:
    - If semantic alternative exists: Replace the element
    - If role is redundant (e.g., role="presentation" on div): Remove the role attribute
    - If creating custom widget: Ensure proper ARIA implementation with all required attributes

## Resources

-   [MDN: ARIA Techniques](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
-   [W3C WAI-ARIA 1.2 Standard](https://www.w3.org/TR/wai-aria-1.2/)
-   [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
