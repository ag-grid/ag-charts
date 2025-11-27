COMPETITIVE ANALYSIS: AG CHARTS (KEYBOARD NAVIGATION)

URL: https://www.ag-grid.com/charts/javascript/keyboard-navigation/

---

### 1. USER-FACING DOCUMENTATION

#### STRENGTHS:

-   **Existence of Documentation:** The feature is documented, and the model is explicitly stated. The documentation clarifies that navigation follows the data's declared order.

#### WEAKNESSES:

-   **Lack of Justification:** The documentation states the "data order" model (Left/Right arrows) but doesn't explain the reasoning behind this choice over a "visual order" model (Up/Down arrows), which can be counter-intuitive for sighted users.
-   **Discoverability:** It is not immediately obvious to a developer that the navigation for a vertical list of bars would be horizontal. The documentation doesn't address this potential point of confusion proactively.
-   **Guidance on Accessibility:** The documentation does not provide guidance on how to properly announce the chart's orientation to screen reader users, which is a crucial prerequisite for making any navigation model intuitive for non-sighted users.

---

### 2. API DOCUMENTATION

#### STRENGTHS:

-   **Consistency:** The API is consistent across different chart orientations. The same Left/Right arrow navigation is used for both horizontal and vertical bar charts, simplifying the implementation from the library's perspective.

#### WEAKNESSES:

-   **Lack of Configurability:** The navigation model is not configurable. Developers cannot switch to a "visual order" (Up/Down) navigation model, which is the standard for other vertical UI elements on the web.
-   **Limited 2D Navigation:** The current model occupies the Left/Right arrows for navigating between bars, which limits the possibility of using them for intra-item navigation (e.g., within a stacked bar).
-   **Less Intuitive for Sighted Users:** The API enforces a navigation model that contradicts the visual layout of the chart, leading to a counter-intuitive experience for sighted keyboard users.

---

### 3. EXAMPLES

#### STRENGTHS:

-   **Functional Examples:** The documentation likely includes examples that demonstrate the keyboard navigation feature in action.

#### WEAKNESSES:

-   **Lack of Best Practice Examples:** The examples demonstrate the default data-order navigation but fail to show how to build a fully accessible experience. For instance, there are no examples that show how to programmatically announce the chart's orientation to a screen reader.
-   **Missed Opportunity:** The examples do not showcase a richer 2D navigation model (e.g., navigating segments of a stacked bar), which would be possible with a visual-order navigation model.

---

### OVERALL ASSESSMENT

AG Charts provides a consistent but counter-intuitive keyboard navigation model for horizontal bar charts. By prioritizing a one-dimensional data-order model, it creates a disconnect for sighted keyboard users who expect to navigate a vertical list of bars with Up/Down arrows. While consistent from a library implementation perspective, it goes against established web accessibility patterns for similar UI components. The lack of configurability to switch to a visual-order model is a significant drawback.

---

### BRIDGING THE GAP: RECOMMENDATIONS FOR AG CHARTS

1.  **Adopt a Visual-Order Navigation Model as the Default:** For horizontal bar charts, the Up/Down arrow keys should navigate between bars. This aligns with WAI-ARIA best practices for vertical lists and is more intuitive for sighted users.

2.  **Introduce a Configurable Navigation Model:** Provide an API option to allow developers to choose between `navigation: 'visual'` and `navigation: 'data'`. This would offer flexibility and cater to different use cases.

3.  **Enable 2D Navigation:** Freeing up the Left/Right arrow keys would allow for a richer, two-dimensional navigation model. For example, in a stacked horizontal bar chart, Up/Down would move between bars, and Left/Right would move between the segments within a single bar. This would be a significant enhancement for all users, including those using screen readers.

4.  **Improve Documentation and Examples:**
    -   Clearly document the chosen navigation model and the reasoning behind it.
    -   Provide best-practice examples that include programmatically announcing the chart's orientation to screen readers.
    -   Showcase examples of 2D navigation in stacked or grouped charts.
