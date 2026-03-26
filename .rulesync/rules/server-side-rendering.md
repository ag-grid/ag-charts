---
root: false
targets: ['*']
description: 'Server-side rendering patterns and global usage constraints'
globs: ['packages/ag-charts-server-side/src/**/*']
---

# Server-Side Rendering Guide

This guide covers patterns for server-side rendering support and avoiding global namespace pollution.

## Critical Constraint: Avoid Global Pollution

**Never directly access or modify `globalThis` in library code.** This affects users' enclosing applications and can cause unexpected side-effects in SSR environments.

### Browser Globals Access Pattern

Use the `globalsProxy` pattern for all browser APIs:

| API               | Getter Function        | Location                                       |
| ----------------- | ---------------------- | ---------------------------------------------- |
| `window`          | `getWindow()`          | `ag-charts-core/src/utils/dom/globalsProxy.ts` |
| `document`        | `getDocument()`        | `ag-charts-core/src/utils/dom/globalsProxy.ts` |
| `OffscreenCanvas` | `getOffscreenCanvas()` | `ag-charts-core/src/utils/dom/globalsProxy.ts` |
| `Path2D`          | `getPath2D()`          | `ag-charts-core/src/utils/dom/globalsProxy.ts` |
| `DOMMatrix`       | `getDOMMatrix()`       | `ag-charts-core/src/utils/dom/globalsProxy.ts` |
| `Image`           | `getImage()`           | `ag-charts-core/src/utils/dom/globalsProxy.ts` |

### Wrong - Direct Global Access

```typescript
// DO NOT do this:
const canvas = new OffscreenCanvas(100, 100);
const path = new Path2D();
const matrix = new DOMMatrix([1, 0, 0, 1, 0, 0]);
const img = new Image();
```

### Correct - Use Proxy Functions

```typescript
import { getDOMMatrix, getImage, getOffscreenCanvas, getPath2D } from 'ag-charts-core';

const OffscreenCanvasCtor = getOffscreenCanvas();
const canvas = new OffscreenCanvasCtor(100, 100);

const Path2DCtor = getPath2D();
const path = new Path2DCtor();

const DOMMatrixCtor = getDOMMatrix();
const matrix = new DOMMatrixCtor([1, 0, 0, 1, 0, 0]);

const ImageCtor = getImage();
const img = new ImageCtor();
```

## SSR Environment Injection

SSR environments inject custom implementations via the chart options:

```typescript
AgCharts.create({
    container,
    document: customDocument, // Injected via setDocument()
    window: customWindow, // Injected via setWindow()
    // ... chart options
});
```

The custom `window` object should include:

-   `OffscreenCanvas` - Canvas implementation (e.g., skia-canvas)
-   `Path2D` - Path implementation
-   `DOMMatrix` - Matrix implementation
-   `Image` - Image implementation
-   Standard window properties (`requestAnimationFrame`, etc.)

## Module-Level Initialisation

**Avoid module-level instantiation of browser APIs.** These run before `setWindow()` is called.

### Wrong

```typescript
class MyClass {
    private path = new Path2D(); // Runs at module load time
}
```

### Correct

```typescript
class MyClass {
    private path: Path2D;

    constructor() {
        const Path2DCtor = getPath2D();
        this.path = new Path2DCtor();
    }
}
```

## Test Environment Globals

Test environments may set globals since tests don't go through the chart creation flow:

```typescript
// jest.setup.ts - acceptable for isolated test environments
globalThis.OffscreenCanvas = NodeCanvas;
```

This is acceptable because test environments are isolated and controlled.
