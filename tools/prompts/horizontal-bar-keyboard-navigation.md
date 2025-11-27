---
title: Keyboard Navigation for Horizontal Bar Series
---

## 1. Introduction

This report examines the optimal keyboard navigation model for an **interactive** online horizontal bar series, where the bars are arranged vertically. The central question is whether the left/right arrow keys or the up/down arrow keys should be used to navigate between the bars. This analysis assumes the chart is not a static image but a rich component where users can interact with data points to see tooltips, make selections, or explore details.

The core of the issue is a conflict between two models:

-   **Data Order Navigation:** Following the logical sequence of the underlying data array (e.g., using right arrow to go to the next item).
-   **Visual Order Navigation:** Following the spatial arrangement of the visual elements on the screen (e.g., using the down arrow to move to the bar below).

This analysis is based on established accessibility guidelines, competitor implementations, and best practices.

## 2. Research Findings

Research into web accessibility guidelines and existing charting library implementations provides the following insights:

-   **WAI-ARIA Best Practices:** The W3C's WAI-ARIA Authoring Practices provide patterns for similar components. For vertically oriented widgets like lists, menus, and trees, the **Up and Down arrow keys** are the standard for moving between items. The Left and Right arrow keys are typically used for actions within an item, such as expanding/collapsing a tree node or navigating a grid's columns [1]. A horizontal bar chart is visually analogous to a vertical list of items.

-   **General Keyboard Navigation Principles:** Accessibility guidelines from sources like WebAIM and Deque emphasize that keyboard focus order should be logical and predictable, ideally following the visual layout of the page [2]. For a vertical stack of interactive elements, this implies a top-to-bottom navigation path, which corresponds to the Up and Down arrow keys.

-   **AG Charts Documentation:** The AG Charts documentation states that for a series, the Left and Right arrow keys are used to move between individual items, following the data's declared order, not necessarily the visual order [3]. This is a "data order" model.

-   **Screen Reader Behavior:** For non-sighted users relying on screen readers, the primary experience is a linear sequence of data points (e.g., "Bar 1 of 5, Sales: $100"). While the "Right" arrow often implies "next item" in a generic collection, the "Down" arrow is also a standard and intuitive way to move to the next element in a sequence. The key is that the navigation is predictable. The Up/Down model provides this, moving users from one bar to the next in a logical order that is coherent for both sighted and non-sighted users.

## 3. Competitor Analysis

A review of major charting libraries reveals different approaches to keyboard navigation:

-   **Highcharts:** Provides a comprehensive accessibility module. It uses arrow keys to move between data points. The default behavior appears to follow a data-order model, similar to the current AG Charts implementation.

-   **ApexCharts:** Provides accessibility options, including `a11y.keyboardNavigation`. However, the specific behavior of the arrow keys (Up/Down vs. Left/Right) for navigating between bars in a horizontal bar chart is not clearly documented in publicly available resources.

-   **Recharts:** Uses Left/Right arrow keys for navigating between data points. Its accessibility features are less consistent across different chart types.

-   **ECharts, Chart.js, Google Charts, Plotly.js:** These popular libraries have limited to no built-in interactive keyboard navigation for moving between individual data points. Their accessibility focus is primarily on ARIA attributes for screen reader compatibility rather than interactive control.

### Summary of Competitor Models:

| Library        | Navigation Model                                | Configurable | Notes                                                                       |
| -------------- | ----------------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| **Highcharts** | 1D Data-Order Model (Left/Right between items)  | Yes          | Mature accessibility module, but a less intuitive default for this case.    |
| **Recharts**   | 1D Data-Order Model (Left/Right between items)  | Limited      | Behavior can be inconsistent.                                               |
| **ApexCharts** | Undocumented                                    | Yes          | While accessibility options exist, the specific arrow key model is unclear. |
| **Others**     | No significant built-in interactive navigation. | No           | Focus is on screen reader descriptions.                                     |

## 4. Analysis of Approaches

### Approach 1: Left/Right Arrow Keys (Data Order)

This model, used by Highcharts and Recharts, treats the chart series as a one-dimensional list, where `Right` means "next" and `Left` means "previous".

-   **Pros:**

    -   Consistent implementation for the library regardless of chart orientation.
    -   Aligns with the non-visual, linear experience of a screen reader.

-   **Cons:**
    -   **Counter-intuitive for sighted keyboard users.** The visual layout is a vertical stack, but the navigation is horizontal.
    -   Inconsistent with established keyboard patterns for other vertical UI elements on the web.

### Approach 2: Up/Down Arrow Keys (Visual Order)

This model maps the keyboard controls to the visual layout of the chart.

-   **Pros:**

    -   **Highly intuitive for sighted keyboard users.**
    -   **Consistent with web standards** for navigating vertical lists.
    -   Creates a clear two-dimensional navigation model (Up/Down between bars, Left/Right within a bar).

-   **Cons:**
    -   Requires the navigation logic to be aware of the chart's visual orientation.

## 5. Recommendation

It is strongly recommended to use the **Up and Down arrow keys** to navigate between bars in a horizontal bar series.

### Justification:

1.  **Crucial Prerequisite: Announce the Orientation:** A potential issue with visual-order navigation is inconsistency for non-sighted users, who cannot see whether a chart is a vertical column or a horizontal bar series. The standard and **crucial** solution to this is to programmatically announce the chart's orientation. For example, a screen reader must announce the component as: _"Chart, horizontal bar series, 7 items."_ This gives the user the necessary context to understand that the component is arranged vertically and that Up/Down arrows are the expected navigation keys, aligning the experience for all users and resolving the conflict between visual layout and interaction consistency.

2.  **Prioritize Intuitive Interaction:** For sighted keyboard users, the visual layout is primary. A vertical arrangement implies vertical navigation. This aligns with the Principle of Least Surprise.

3.  **Adherence to Web Standards:** Users are already familiar with using up/down arrows to navigate vertical lists. Following WAI-ARIA patterns for similar widgets ensures a consistent and accessible experience.

4.  **Enables a Richer 2D Navigation Model for All Users:** Adopting a visual order model enables a more sophisticated navigation system that benefits everyone. It frees up the Left/Right arrows for intra-item navigation. This is crucial for complex charts like stacked or grouped horizontal bars, allowing **all users**, including those with screen readers, to explore the different segments of a single bar. This creates a richer, more detailed data exploration experience that a simple 1D data-order model cannot offer.

5.  **Enhances, Not Compromises, the Screen Reader Experience:** The visual order model does not prioritize sighted users at the expense of non-sighted users. For a screen reader, navigating a vertical list with Up/Down arrows is a standard and predictable interaction that maintains a logical, linear flow through the data. This approach serves both user groups effectively without introducing a conflict.

While a simple data-order model is used by some competitors, the visual model is more intuitive and aligns better with established web standards. It offers a superior user experience for sighted keyboard users while enhancing the experience for non-sighted users by enabling richer data interaction.

## 6. Sources

[1] W3C WAI-ARIA Authoring Practices 1.2 - Keyboard Interaction Patterns for Listbox, Tree View, etc. (https://www.w3.org/TR/wai-aria-practices-1.2/)
[2] WebAIM - Keyboard Accessibility (https://webaim.org/techniques/keyboard/)
[3] AG Charts Documentation - Keyboard Navigation (https://www.ag-grid.com/charts/javascript/keyboard-navigation/)
