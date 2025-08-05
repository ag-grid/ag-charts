# Technical Review Plan: Community vs Enterprise

## Page Analysis Summary

### Overview

This documentation page explains the differences between AG Charts Community (MIT licensed) and AG Charts Enterprise (commercial license), helping users understand when to use each version and how to access trials or purchase licenses.

### Key Content Areas

1. **Feature Comparison**: Uses `featuresSection` components to display community vs enterprise features
2. **Enterprise Bundle**: Explains combined AG Charts + AG Grid offering
3. **Testing & Trial Information**: How to test Enterprise features and request trial licenses
4. **Support Models**: Community vs Enterprise support differences
5. **Licensing & Pricing**: License types and pricing structure

### Special Components Used

-   `{% featuresSection library="charts" type="community|enterprise" /%}` - Renders feature lists from DocsFeaturesSection.json
-   `{% trialLicenceForm /%}` - Trial license request form
-   `{% enterpriseIcon /%}` - Enterprise feature indicator
-   `{% if isFramework(...) %}` - Framework-specific content blocks

## Validation Targets

### 1. Feature List Accuracy

**Source**: `external/ag-website-shared/src/components/features-section/DocsFeaturesSection.json`

#### Community Features to Verify:

-   Chart Essentials (line, bar, column, pie charts)
-   Accessibility Support
-   Basic Interactivity (highlighting, tooltips)
-   Intuitive Data Handling
-   Themes and Styling
-   Localisation (31 languages claim)
-   Download API (Base64 and PNG)
-   Event API
-   Major Frameworks support

#### Enterprise Features to Verify:

-   Advanced Chart Types (20+ additional types)
-   Financial Charts
-   Animations
-   Advanced Interactivity (context menus, crosshairs, navigator, zoom, synchronisation)
-   Background Images
-   Dedicated Support

### 2. Links and References

-   Community feature links pointing to correct documentation pages
-   Enterprise feature links pointing to correct documentation pages
-   External links to AG Grid documentation for framework-specific integrated charts
-   Pricing page link (`/license-pricing/`)
-   GitHub licenses link
-   Zendesk support link

### 3. Technical Claims to Validate

-   Enterprise features work locally without license key
-   Watermark appears when using Enterprise without license
-   Console error message appears without license
-   Trial license removes watermark and console errors
-   Trial license valid for two weeks
-   Trial provides access to both AG Grid and AG Charts Enterprise

### 4. Framework-Specific Content

-   Verify framework-specific integrated charts links are correct:
    -   React: `https://www.ag-grid.com/react-data-grid/integrated-charts/`
    -   Angular: `https://www.ag-grid.com/angular-data-grid/integrated-charts/`
    -   Vue: `https://www.ag-grid.com/vue-data-grid/integrated-charts/`
    -   JavaScript: `https://www.ag-grid.com/javascript-data-grid/integrated-charts/`

### 5. License Information

-   Community: MIT license
-   Enterprise: Commercial EULA license
-   Licenses are perpetual with 1 year support/updates

## Known Exceptions

No technical review exceptions file found for this page.

## Execution Plan

### Priority 1: Feature List Validation

1. Cross-reference all community features listed against actual implementation
2. Cross-reference all enterprise features listed against actual implementation
3. Verify the "20+ additional chart types" claim for enterprise
4. Check that all feature links point to valid documentation pages
5. Validate the "31 languages" claim for localisation

### Priority 2: Enterprise Testing Claims

1. Test that enterprise features can be used without license key
2. Verify watermark appearance without license
3. Check console error message without license
4. Test if importing `ag-charts-enterprise` works without configuration

### Priority 3: Documentation Links

1. Verify all internal documentation links are valid
2. Check external AG Grid links for each framework
3. Validate GitHub license link
4. Check Zendesk support link

### Priority 4: Page Content Structure

1. Verify framework-specific content renders correctly
2. Check that `enterpriseIcon` renders properly
3. Validate `trialLicenceForm` component functionality

### Priority 5: Related Pages

1. Cross-reference with installation page (`./installation`)
2. Cross-reference with quick-start page (`./quick-start`)
3. Verify consistency with pricing page (`/license-pricing/`)

## example-tester Agent Delegation Plan

Since this page has no interactive examples, the example-tester agent will not be needed for this review. All validation will be done through:

-   Documentation cross-referencing
-   Link validation
-   Feature list verification
-   Technical claim testing

## Expected Outcomes

### Success Criteria

1. All community features listed are actually available in ag-charts-community
2. All enterprise features listed require ag-charts-enterprise
3. All documentation links are valid and point to correct pages
4. Enterprise testing claims (watermark, console errors) are accurate
5. Framework-specific content is correct for each framework
6. License and pricing information is accurate

### Potential Issues to Watch For

1. Features listed that don't exist or are misclassified
2. Broken or incorrect documentation links
3. Inconsistencies between this page and linked pages
4. Incorrect framework-specific URLs
5. Outdated license or pricing information
6. Missing enterprise icons for enterprise features in linked documentation
