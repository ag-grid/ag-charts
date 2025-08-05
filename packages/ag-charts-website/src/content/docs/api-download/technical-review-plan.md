# Technical Review Plan: API Download

## Page Analysis Summary

### Features Covered

-   Chart image download functionality via JavaScript API
-   Two main API methods: `download()` and `getImageDataURL()`
-   Framework-specific guidance for obtaining `AgChartInstance` references (React, Angular, Vue)
-   Customizable download options (dimensions, filename, format)

### Key APIs Documented

-   `AgChartInstance.download(options?: DownloadOptions)`
-   `AgChartInstance.getImageDataURL(options?: ImageDataUrlOptions)`
-   `DownloadOptions` interface (extends `ImageDataUrlOptions`)
-   `ImageDataUrlOptions` interface

### Examples Referenced

-   **download** example: Demonstrates all three use cases mentioned in documentation
    -   Basic download without options
    -   Download with fixed dimensions (600x300)
    -   Get image data URL and open in new tab

### Interactive Features

-   Button-triggered download actions
-   Browser's native download behavior
-   New tab/window opening with image data

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgChartInstance` interface in `packages/ag-charts-types/src/chartBuilderOptions.ts`
    - Verify `download` method signature and JSDoc
    - Verify `getImageDataURL` method signature and JSDoc
2. `DownloadOptions` interface
    - Verify it extends `ImageDataUrlOptions`
    - Verify `fileName` property (optional, string)
3. `ImageDataUrlOptions` interface
    - Verify `width` property (optional, PixelSize)
    - Verify `height` property (optional, PixelSize)
    - Verify `fileFormat` property (optional, with allowed values)

### Implementation Files to Check

1. `/packages/ag-charts-community/src/chart/chart.ts` - Main chart implementation
2. `/packages/ag-charts-community/src/chart/chartProxy.ts` - Proxy pattern implementation
3. `/packages/ag-charts-community/src/scene/scene.ts` - Canvas rendering and image generation

### Examples to Test with Expected Behaviors

#### download example

**Documentation claims:**

-   Shows how to obtain reference to `AgChartInstance`
-   Shows how to use `download()` to start image download
-   Shows how to use `getImageDataURL()` to create base64 URL and open in new tab

**Expected behaviors for example-tester agent:**

1. Chart should render an area chart with browser usage statistics
2. Three buttons should be visible: "Download", "Download at 600x300", "Open"
3. "Download" button should trigger browser download of chart image at current size
4. "Download at 600x300" button should download at fixed dimensions
5. "Open" button should open chart image in new tab/window
6. No console errors during any operation
7. Downloaded images should match the rendered chart
8. Chart should have title "Browser Usage Statistics" and subtitle "2009-2019"
9. Legend should be positioned at top
10. Four series should be visible: IE, Chrome, Firefox, Safari

**Specific features to validate:**

-   Area chart with 0.5 fill opacity
-   Multiple series rendering
-   Legend positioning
-   Title and subtitle display

### User Interactions to Validate

1. Click "Download" button - verify browser download starts
2. Click "Download at 600x300" button - verify sized download
3. Click "Open" button - verify new tab opens with image
4. Resize chart container - verify subsequent downloads reflect new size
5. Test download during chart animations (if any)
6. Test rapid successive downloads
7. Test download with different browser zoom levels

### Visual States to Screenshot and Analyze

1. Default chart rendering state
2. Downloaded image content (if possible to capture)
3. New tab with opened image
4. Chart at different viewport sizes before download
5. Any loading or processing states during download

### Interactive Features Requiring Visual Comparison

1. Downloaded image should match visible chart exactly
2. Fixed-size downloads should be exactly 600x300 pixels
3. Image quality should be preserved in downloads
4. All chart elements (title, subtitle, legend, axes, series) should be present in downloads

### Chart Elements That Should Be Interactive

Based on documentation, the chart itself doesn't need to be interactive for this example - focus is on the download buttons and their functionality.

### Expected Tooltip Content and Behaviors

Not applicable for this example - focus is on download functionality, not chart interactivity.

## Known Exceptions

No `technical-review-exceptions.md` file exists for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgChartInstance` interface matches documentation
2. Check `download()` method signature and return type (Promise<void>)
3. Check `getImageDataURL()` method signature and return type (Promise<string>)
4. Verify `DownloadOptions` extends `ImageDataUrlOptions` correctly
5. Validate all option properties and their types

### Priority 2: Implementation Verification

1. Check actual implementation of `download()` method
2. Verify Promise resolution behavior
3. Check default values for options (filename defaults to "image")
4. Verify supported file formats (PNG, JPEG)
5. Check canvas-to-image conversion logic

### Priority 3: Example Testing with example-tester

1. Delegate comprehensive example testing to example-tester agent with detailed expectations
2. Verify all three download scenarios work correctly
3. Check for console errors or warnings
4. Validate TypeScript usage and API compliance
5. Test edge cases (empty chart, very large/small dimensions)

### Priority 4: Visual and Interaction Testing

1. Screenshot default chart state
2. Test all three buttons and capture results
3. Verify downloaded images match rendered chart
4. Test responsive behavior
5. Check accessibility of download controls

### Priority 5: Documentation Completeness

1. Verify all API options are documented
2. Check framework-specific guidance accuracy
3. Validate code snippets in documentation
4. Ensure examples demonstrate all documented features

## Success Criteria

-   All API signatures match implementation
-   Example demonstrates all three documented use cases
-   Downloads work correctly across different scenarios
-   No console errors during operations
-   Downloaded images accurately represent chart
-   Documentation accurately describes all features and options

## Estimated Complexity

-   **API Validation**: Low - Clear interfaces to check
-   **Implementation Review**: Medium - Need to understand canvas rendering
-   **Example Testing**: Low - Straightforward functionality
-   **Visual Testing**: Medium - Need to verify image quality and accuracy
-   **Overall**: Medium complexity due to image generation verification
