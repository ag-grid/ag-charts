# PREVis Assessment: Bubble with Labels Example

## Overview

This example demonstrates a bubble chart showing the "Top 10 Highest Rated Movies On IMDb" with multiple data dimensions encoded through position, size, color, and text labels.

## PREVis Scale Assessment

### 1. Visibility (Score: 7/10)

**Strengths:**

-   Clear title and subtitle communicate the chart's purpose
-   Bubble sizes effectively encode box office revenue
-   Text labels directly on bubbles identify movies and rankings
-   Different colors distinguish movie genres

**Weaknesses:**

-   Label overlap is likely with multiple bubbles in close proximity
-   Small bubbles (e.g., "12 Angry Men" with $2M box office) may have cramped labels
-   No visual hierarchy between overlapping elements

### 2. Scale & Context (Score: 6/10)

**Strengths:**

-   X-axis spans appropriate range for movie release years (1950s-2008)
-   Y-axis shows rating scale (8.8-9.3) with good granularity
-   Size domain configured ($2M-$1.2B) to show box office variation

**Weaknesses:**

-   Grid lines disabled, reducing ability to read precise values
-   No reference lines or annotations to provide context
-   Size legend missing to help interpret bubble dimensions

### 3. Annotation & Guidance (Score: 5/10)

**Strengths:**

-   Direct labeling shows movie rank and title
-   Series names properly capitalized in legend
-   Axis titles present

**Weaknesses:**

-   No interactive tooltips configured for additional details
-   Missing explanatory text about what bubble size represents
-   No visual cues to highlight notable patterns or outliers

### 4. Data Density (Score: 8/10)

**Strengths:**

-   Efficiently encodes 5 dimensions (year, rating, box office, genre, title)
-   Only 10 data points prevents overcrowding
-   Good use of available chart space

**Weaknesses:**

-   Could include additional context (e.g., average ratings, box office inflation adjustment)

### 5. Visual Hierarchy (Score: 6/10)

**Strengths:**

-   Title hierarchy with main title and subtitle
-   Genre differentiation through color
-   Size variation creates natural emphasis on highest-grossing films

**Weaknesses:**

-   All labels use same formatting regardless of importance
-   No emphasis on #1 ranked movie vs others
-   Legend position at top competes with title for attention

### 6. Clarity of Encoding (Score: 7/10)

**Strengths:**

-   Position encodings (year, rating) are intuitive
-   Size-to-revenue mapping is logical
-   Color-to-genre mapping works well

**Weaknesses:**

-   Domain range [$2M-$1.2B] seems reversed in configuration
-   Mixing absolute size (20) with maxSize (60) may cause confusion
-   No clear indication of what size scale represents

### 7. Interactive Affordances (Score: 4/10)

**Strengths:**

-   Static visualization loads quickly
-   Clean, uncluttered interface

**Weaknesses:**

-   No hover interactions configured
-   No zoom/pan capabilities for dense areas
-   No click interactions to explore movie details
-   Missing crosshairs or highlighting on hover

## Overall PREVis Score: 6.1/10

## Critical Issues to Address

1. **Label Collision**: The formatter creates long labels that will overlap, especially for movies clustered in similar year/rating ranges
2. **Missing Size Legend**: Users cannot interpret bubble sizes without a reference
3. **Reversed Domain**: The domain configuration [2000000, 1200000000] appears to be min-max but may be interpreted incorrectly
4. **No Interactivity**: Missing tooltips and hover states reduce exploratory capability

## Recommendations for Improvement

### High Priority

1. Add tooltip configuration with full movie details
2. Implement a size legend or annotation explaining bubble dimensions
3. Add smart label placement or collision detection
4. Enable grid lines for better value reading

### Medium Priority

1. Add hover highlighting and crosshairs
2. Include reference lines (e.g., average rating line)
3. Consider log scale for bubble sizes given the extreme range
4. Add subtle animations on load

### Low Priority

1. Include decade markers or era annotations
2. Add inflation-adjusted box office values
3. Consider using shapes to double-encode genre
4. Add a "zoom to selection" feature for genre filtering

## Data Storytelling Assessment

The example tells a clear story about highly-rated movies across different genres and eras, but lacks the interactive elements and visual refinements needed to fully explore the relationships between commercial success, critical acclaim, and time period. The direct labeling approach is ambitious but needs better execution to prevent overlap issues.

## Technical Notes

-   Uses enterprise features but doesn't leverage advanced capabilities
-   Clean data structure with proper TypeScript typing
-   Good use of functional mapping for series generation
-   Missing accessibility features (ARIA labels, keyboard navigation)
