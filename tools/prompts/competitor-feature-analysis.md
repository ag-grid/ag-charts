COMPETITIVE ANALYSIS: LIGHTNINGCHART JS

URL: https://lightningchart.com/js-charts/docs/

---

### 1. USER-FACING DOCUMENTATION

#### STRENGTHS:

-   The documentation explains the concept of handling data updates with zooming/panning.
-   It provides a clear mechanism using the `onScaleChange` event.

#### WEAKNESSES:

-   The documentation doesn't provide a simple, out-of-the-box solution. The developer has to write boilerplate code to handle the data updates.
-   It's not a simple flag or option, which might be what developers look for first.

---

### 2. API DOCUMENTATION

#### STRENGTHS:

-   The API provides the necessary building blocks: `onScaleChange` event, `clear()` and `add()` methods on the series.
-   This gives developers full control over the data flow, which is good for performance-critical applications.

#### WEAKNESSES:

-   There is no high-level API to automatically handle preserving the view during data updates.
-   The developer is responsible for managing the data, which can be complex and error-prone.
-   The event name `onScaleChange` might not be immediately obvious to a developer looking for a "zoom" or "pan" event.

---

### 3. EXAMPLES

#### STRENGTHS:

-   The documentation includes a clear code example of how to implement the feature from scratch.

#### WEAKNESSES:

-   The lack of a simple, copy-paste example for this common use case in the main examples gallery means developers have to piece the solution together from the documentation.

---

### OVERALL ASSESSMENT

LightningChart JS provides a powerful but low-level mechanism to handle data updates when zoomed. It's performant and gives the developer full control, but it is not as developer-friendly as it could be for this common use case. The developer needs to write custom logic to handle a feature that many would expect to be built-in.

COMPETITIVE ANALYSIS: SCICHART.JS

URL: https://www.scichart.com/documentation/js/current/

---

### 1. USER-FACING DOCUMENTATION

#### STRENGTHS:

-   The documentation directly addresses the "update data while zoomed" use case.
-   It introduces the concept of `zoomState` to manage user interactions, which is an intuitive approach.

#### WEAKNESSES:

-   The information is spread across multiple pages and even a YouTube video, which can make it difficult for developers to get a complete picture from a single source.

---

### 2. API DOCUMENTATION

#### STRENGTHS:

-   The API provides a clear and explicit way to handle the scenario by checking `sciChartSurface.zoomState`.
-   The API provides different methods for appending or updating data (`append`, `update`, `updateRange`).

#### WEAKNESSES:

-   Similar to LightningChart, there is no high-level, automatic solution. The developer still needs to write conditional logic to manage the `visibleRange` update.

---

### 3. EXAMPLES

#### STRENGTHS:

-   The documentation includes a code snippet that demonstrates the recommended approach.

#### WEAKNESSES:

-   It is likely that the official examples gallery does not have a prominent, ready-to-use example for this specific, common use case, forcing developers to look into the documentation and piece it together.

---

### OVERALL ASSESSMENT

SciChart.js provides a more explicit and intuitive API for handling data updates while zoomed compared to LightningChart.js. The use of `zoomState` makes the developer's intent clearer. However, it still requires manual implementation of the logic, lacking a simple, high-level solution.

COMPETITIVE ANALYSIS: TRADINGVIEW LIGHTWEIGHT CHARTS

URL: https://tradingview.github.io/lightweight-charts/

---

### 1. USER-FACING DOCUMENTATION

#### STRENGTHS:

-   The documentation is clear and to the point, highlighting the `series.update()` method for data updates.
-   It also mentions `scrollToRealtime()` for navigating back to the latest data, which is a nice additional feature.

#### WEAKNESSES:

-   The documentation is a bit vague about the "preserving zoom" behavior, stating that the chart "generally maintains its current zoom".

---

### 2. API DOCUMENTATION

#### STRENGTHS:

-   The API is very simple and intuitive for this use case. The `series.update()` method is a high-level abstraction that handles both appending new data and updating the last data point.
-   This is much simpler than the event-based approach of LightningChart and SciChart.

#### WEAKNESSES:

-   The simplicity might come at the cost of control. It's not clear how a developer would implement a different behavior if the default one is not desired.

---

### 3. EXAMPLES

#### STRENGTHS:

-   The documentation and search results point to clear examples of using `series.update()`.

#### WEAKNESSES:

-   There might not be specific examples that showcase edge cases or more complex scenarios of updating data while zoomed.

---

### OVERALL ASSESSMENT

TradingView Lightweight Charts provides a very developer-friendly and high-level solution for updating data while zoomed. The `series.update()` method is simple and intuitive, and it handles the preservation of the zoom level by default. This is a significant advantage over the other libraries that require manual implementation of this logic.

COMPETITIVE ANALYSIS: HIGHCHARTS

URL: https://www.highcharts.com/docs/index

---

### 1. USER-FACING DOCUMENTATION

#### STRENGTHS:

-   The documentation for individual API features like `series.addPoint` or `chart.update` is comprehensive.
-   The "Dynamic charts" concept is acknowledged, showing awareness of live data use cases.

#### WEAKNESSES:

-   Crucial documentation pages regarding dynamic data and data updating are difficult to find.
-   There is no clear, high-level guide that directly addresses the common problem of maintaining zoom during a data update.
-   The discoverability of the correct approach is very low.

---

### 2. API DOCUMENTATION

#### STRENGTHS:

-   The API provides all the necessary primitives to implement the behavior: `getExtremes()` to read the zoom state, `setExtremes()` to write it, and `setData()`/`addPoint()` to update the data.
-   The distinction between `setData` (replace all data) and `addPoint` (add a single point) is clear.
-   The `redraw` flag on API calls offers fine-grained control over rendering.

#### WEAKNESSES:

-   There is no high-level API option to automatically preserve the zoom state (e.g., `update(..., { preserveZoom: true })`).
-   The responsibility for managing the zoom state falls entirely on the developer.
-   The documentation for `setData` or `update` doesn't explicitly warn that the zoom will be reset.

---

### 3. EXAMPLES

#### STRENGTHS:

-   There are many official examples demonstrating dynamic data, such as the "live data" chart.
-   The examples are typically well-structured and easy to understand in isolation.
-   JSFiddle integration allows for immediate experimentation.

#### WEAKNESSES:

-   The official "live data" examples do not handle zoom preservation.
-   It is very difficult to find an official example that combines live data updates with zoom preservation.

---

### OVERALL ASSESSMENT

While Highcharts provides the low-level tools necessary to update data while zoomed, the developer experience is poor. The lack of a simple, built-in option to preserve zoom and the difficulty in finding relevant documentation make a common task feel like a complex workaround.

COMPETITIVE ANALYSIS: ECHARTS

URL: https://echarts.apache.org/handbook/en/get-started/

---

### 1. USER-FACING DOCUMENTATION

#### STRENGTHS:

-   The central `setOption` API is well-documented and its merging behavior is explained.
-   The documentation for the `dataZoom` component is thorough, covering its various types and properties.
-   The handbook provides a good conceptual overview of the library's architecture.

#### WEAKNESSES:

-   Similar to Highcharts, there is no dedicated guide for the "update data while zoomed" use case.
-   The documentation doesn't clearly state whether `setOption` is guaranteed to preserve zoom, leaving the developer to discover its limitations through testing.

---

### 2. API DOCUMENTATION

#### STRENGTHS:

-   The `setOption` API is powerful and its "lazy update" and option-merging capabilities are a smart default, potentially handling simple cases without extra code.
-   The `datazoom` event is well-documented and provides all the necessary information to capture the zoom state.
-   The API is consistent; `setOption` is the single entry point for almost all chart modifications.

#### WEAKNESSES:

-   There is no explicit option to enforce zoom preservation. The developer is relying on the default merging behavior.
-   If the default merging fails, the developer must implement a manual save/restore logic, which is non-obvious.
-   The API doesn't provide a simple `getZoom()` method; the developer must listen for and store the state from the `datazoom` event.

---

### 3. EXAMPLES

#### STRENGTHS:

-   ECharts has a vast library of official examples covering many different chart types and features.
-   Many examples showcase dynamic data updates using `setOption`.
-   The examples are clean, well-organized, and easy to modify in the online editor.

#### WEAKNESSES:

-   It is difficult to find an official example that specifically demonstrates updating data while preserving a user-defined zoom level.
-   The examples that show live data updates typically don't include a `dataZoom` component, thus avoiding the problem entirely.

---

### OVERALL ASSESSMENT

ECharts offers a slightly better developer experience than Highcharts for this specific problem, primarily due to the intelligent merging behavior of `setOption`. In many cases, it might "just work." However, when it doesn't, the developer is in a similar situation as with Highcharts: forced to write manual, state-management boilerplate code. The solution is not easily discoverable in the official documentation.
