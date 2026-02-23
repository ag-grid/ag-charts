# Browser Testing Tips — AG Charts

AG Charts renders to **HTML Canvas**, not DOM. Chart internals (series, axes, labels, legends) are drawn as canvas pixels and cannot be inspected via DOM queries. Screenshots are the primary verification method.

## Dev Server

```bash
yarn nx dev
```

-   Local URL: `https://localhost:4600/`
-   Docs pages: `https://localhost:4600/charts/javascript/${pageName}/`

## Page Navigation

Documentation pages use **lazy loading** (IntersectionObserver) for examples. When navigating to a page:

1. Navigate to the page URL.
2. Scroll down to bring each example into the viewport.
3. Wait for the canvas to render before taking a screenshot — examples load on-demand as they enter the visible area.

## Example Structure

Each example renders inside an **iframe**. Within the iframe:

-   Interactive controls (buttons, sliders, dropdowns) appear **above** the chart canvas.
-   The chart itself is a `<canvas>` element.

To interact with an example, you must target elements inside the example iframe.

## Testing Interactive Controls

-   **Buttons / dropdowns / sliders**: These are standard DOM elements inside the example iframe. Click or interact with them, then screenshot to verify the chart updated.
-   **Tooltips**: Hover over data points on the canvas. Tooltips render as **DOM overlays outside the canvas** and are visible in screenshots.
-   **Legend items**: Rendered **on the canvas**. Click the canvas region where a legend item appears and screenshot to verify the toggle effect (e.g., series visibility change).

## Console Errors

After loading a page and interacting with examples, check the browser console for errors:

```
mcp__chrome-devtools__browser_console_messages
```

Filter out known noise (e.g., HMR messages, favicon 404s). Report any errors related to AG Charts rendering or data handling.

## Canvas-Specific Considerations

-   **No DOM inspection of chart internals**: Series shapes, axis ticks, gridlines, and labels are all drawn on canvas. Use screenshots to verify visual output.
-   **Screenshot comparison**: When verifying that a property change (e.g., `fontSize`, `color`, `enabled`) has taken effect, take a before/after screenshot and compare visually.
-   **Animation**: Charts may animate on load. Wait briefly after navigation or interaction before screenshotting to capture the final state.
-   **Responsive sizing**: Charts resize with their container. If verifying layout, check that the canvas dimensions match expectations in the screenshot.

## Direct URL Testing (Sub-agent Mode)

When the product configuration includes an **Example Direct URL Pattern**, example browser testing is delegated to a `docs-example-browser-tester` sub-agent that opens each example at its standalone URL.

Direct URL characteristics:

-   Examples render full-viewport with no docs page chrome, no iframe wrapper.
-   Interactive controls (buttons, dropdowns) are directly accessible without scrolling past documentation content.
-   Console messages come from the example only, not the surrounding docs page.
-   Screenshots capture the complete example without docs page chrome.

The main agent retains responsibility for page-level visual/interaction testing (Step 6) which requires the full docs page context (theme switchers, framework selectors, cross-references, keyboard navigation).
