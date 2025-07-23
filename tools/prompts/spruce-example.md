# Spruce Up Gallery Example

You are tasked with improving the visual appeal of an AG Charts gallery example to better showcase our feature set while maintaining readability and visual consistency.

**Context**: AG Charts offers extensive styling, interaction, and data presentation capabilities across both Community (MIT) and Enterprise (commercial) versions. The goal is to demonstrate these capabilities through polished, production-ready gallery examples that users would be proud to implement.

**Target Audience**: Our primary audience consists of enterprise and finance customers who value professional, business-oriented visualizations that convey trust, reliability, and sophistication.

**Usage**: Specify the example path relative to the repository root (e.g., `packages/ag-charts-website/src/content/gallery/_examples/simple-bar`). The command will analyze the current example and propose specific enhancements based on the chart type and data context.

## Instructions

1. **Analyze the current example**:

    - Examine the chart configuration and data structure
    - Identify the current visual features being used
    - Take a screenshot of the current rendered chart using the Puppeteer tools
    - Assess the visual hierarchy, readability, and overall appeal

2. **Feature Analysis**:

    - Review what AG Charts features are currently utilized
    - Identify potential features that could enhance the example from these comprehensive categories:

    **A. Visual Styling & Appearance**

    - **Themes**: Built-in themes (ag-default, ag-material, ag-financial, ag-polychroma, ag-vivid, ag-sheets, with dark variants) or custom theme overrides
    - **Fills**: Solid colors, linear gradients, patterns (lines, shapes), image fills with scaling options
    - **Background**: Chart background colors, gradients, or images with positioning options
    - **Fonts**: Typography customization (fontFamily, fontSize, fontStyle, fontWeight)
    - **Borders**: Chart and element border styling with stroke options

    **B. Series Enhancement**

    - **Markers**: Built-in shapes (circle, square, triangle, etc.) or custom callback functions with full fill support
    - **Series Fills**: Apply advanced fill types (gradients, patterns, images) to data series
    - **Series Highlighting**: Interactive highlighting effects on hover/selection
    - **Error Bars**: Data uncertainty visualization (Enterprise feature)
    - **Series Markers**: Enhanced marker customization with size, fill, and stroke options

    **C. Axis Configuration**

    - **Axis Types**: Number, log, category, time, ordinal-time, unit-time, grouped-category axes
    - **Axis Labels**: Custom formatting, rotation, positioning, and styling
    - **Grid Lines**: Customizable grid appearance with styling options
    - **Grid Bands**: Grid bands with custom styling options
    - **Cross Lines**: Reference lines with labels and custom styling
    - **Secondary Axes**: Multiple axis configuration for complex data relationships
    - **Time Axes**: Specialized time-based axis formatting and intervals
    - **Axis Domain**: Custom min/max ranges and nice domain calculation

    **D. Data Presentation & Formatting**

    - **Formatters**: Global and property-specific formatters (axes, tooltips, series labels)
        - Time formatting with Python strftime specification
        - Number formatting with currency, percentage, scientific notation
        - Context-aware formatting based on source (axes-label, tooltip, etc.)
    - **Legend**: Positioning, styling, and interaction customization
    - **Tooltips**: Multiple display modes (single, shared, compact) with custom positioning, HTML rendering, and interaction support

    **E. Interactive Features**

    - **Animation**: Series entrance animations, data update transitions, legend interaction animations (Enterprise)
    - **Zoom**: Chart navigation with pan and zoom controls (Enterprise)
    - **Cross-hairs & Band Highlight**: Mouse tracking indicators and category highlighting (Enterprise)
    - **Context Menu**: Customizable right-click menus (Enterprise)
    - **Navigator**: Chart overview and navigation component (Enterprise)
    - **Touch**: Touch interaction support for mobile devices
    - **Synchronization**: Multi-chart coordination and interaction (Enterprise)

    **F. Advanced Data Elements**

    - **Annotations**: Chart annotations with drawing tools and custom positioning (Enterprise)
    - **Overlays**: Custom overlay components and positioning
    - **Background Image**: Chart background images with fit and positioning options (Enterprise)

    **G. Layout & Positioning**

    - **Layout**: Chart sizing, positioning, and responsive behavior
    - **Title/Subtitle/Footnote**: Chart captions with custom styling and positioning
    - **Padding & Margins**: Precise control over chart spacing and positioning

    **H. Accessibility & Localization**

    - **Accessibility**: Screen reader support and keyboard navigation
    - **Localization**: Multi-language support with 40+ built-in locales
    - **Color Accessibility**: Pattern fills and high contrast options for colorblind users

3. **Propose targeted improvements**:

    - Select 3-5 most appropriate enhancements for this specific use case
    - **Check for outdated patterns**: Some examples may use complex workarounds that simulate features we didn't have originally - look for built-in AG Charts options that can replace these
    - Prioritize improvements that:
        - Enhance visual appeal without overwhelming the chart
        - Improve data readability and comprehension
        - Showcase relevant AG Charts capabilities
        - Maintain consistency with other gallery examples
        - Are appropriate for the chart type and data context
        - Convey professionalism and trustworthiness suitable for business presentations
        - Replace any manual/complex implementations with native AG Charts features where available

4. **Implementation considerations**:

    - **API Contract Compliance**: The local `packages/ag-charts-types/` package is the source of truth for our options API - all configurations MUST adhere to these TypeScript interfaces
    - **Type Safety**: Examples must be fully type-safe - NEVER use `any` type. Use proper TypeScript types from `ag-charts-types` or `unknown` for truly unknown values
        - **Type Error Resolution**: If facing confusing TypeScript errors with `AgChartOptions`, try narrowing to more specific types like `AgCartesianChartOptions`, `AgPolarChartOptions`, `AgHierarchyChartOptions`, or `AgTopologyChartOptions` rather than trying to interpret complex union type errors
    - **Enterprise Visual Standards**: Target professional business environments with:
        - Conservative, sophisticated color palettes (blues, grays, muted tones)
        - Clean, minimal design that emphasizes data clarity
        - Professional typography (avoid decorative fonts)
        - Subtle use of gradients and effects - prefer understated elegance
        - Business-appropriate themes (ag-material, ag-financial preferred over vivid themes)
    - Ensure any formatters or styling choices improve readability
    - Use consistent color palettes and visual themes
    - Consider accessibility (color contrast, patterns for colorblind users)
    - Maintain clean, professional appearance
    - Don't over-engineer - choose features that add genuine value

5. **Apply improvements**:
    - Implement the selected enhancements
    - Test the changes by taking a new screenshot using the development server (typically running on `https://host.docker.internal:4600`)
    - Ensure the example still loads correctly and functions as expected
    - Verify the example works across different viewport sizes if responsive features are added

## Guidelines

-   **Visual Consistency**: Follow AG Charts design principles and maintain consistency with other gallery examples
-   **Feature Appropriateness**: Not every example needs every feature - choose what makes sense for the specific use case
-   **Readability First**: Any styling or formatting should improve, not hinder, data comprehension
-   **Professional Polish**: Aim for a polished, production-ready appearance that enterprise and finance customers would confidently present to stakeholders and executives
-   **Performance**: Avoid overly complex configurations that might impact performance
-   **Enterprise Features**: When using Enterprise features (marked with "Enterprise" in the feature list), ensure they add significant value and consider providing Community alternatives where possible

## Expected Output

Provide:

1. Analysis of current state with screenshot
2. List of proposed improvements with rationale
3. Implementation of selected enhancements
4. Before/after comparison screenshots
5. Brief summary of changes made and their benefits

Remember: The goal is to create visually appealing examples that effectively demonstrate AG Charts capabilities while remaining practical and user-friendly.
