# Decorator Bypass Optimization Patterns

These patterns avoid property setter overhead from `@SceneChangeDetection` and related decorators in hot rendering paths.

## 1. Direct Backing Field Access (`__fieldName`)

**Problem**: Property decorators (`@SceneChangeDetection`, `@DeclaredSceneChangeDetection`) add overhead to every getter/setter.

**Solution**: Access backing fields directly in hot rendering paths.

**IMPORTANT: Use `@Declared*` Decorators for Type Safety**

Always use the `@DeclaredSceneChangeDetection` or `@DeclaredSceneObjectChangeDetection` decorators instead of the older `@SceneChangeDetection` variants. The `@Declared*` decorators enforce type safety between the property and its backing field declaration:

```typescript
// changeDetectable.ts - Type constraint ensures __fieldName matches
export function DeclaredSceneChangeDetection<V>(opts?: SceneChangeDetectionOptions) {
    return function <K extends string, T extends Target & { [P in `__${K}`]: V }>(target: T, key: K): void {
        // TypeScript will error if declare __fieldName doesn't match the property type
    };
}
```

**Correct Pattern** (`shape.ts`):

```typescript
// Property declaration with type-safe backing field
@DeclaredSceneChangeDetection()
fillOpacity: number = 1;
declare __fillOpacity: number; // TypeScript enforces this matches the property type

@DeclaredSceneChangeDetection()
strokeWidth: number = 0;
declare __strokeWidth: number; // Type-safe: must be number

@DeclaredSceneObjectChangeDetection({ equals: objectsEqual, changeCb: Shape.handleFillChange })
fill: ShapeColor | undefined = 'black';
declare __fill: ShapeColor | undefined; // Type-safe: must match fill's type
```

**Type Safety Benefits**:

- **Compile-time errors** if `declare __fieldName` type doesn't match the property type
- **Refactoring safety** - changing property type will flag mismatched backing fields
- **IDE support** - autocomplete and type inference work correctly

**Incorrect (will cause TypeScript errors)**:

```typescript
@DeclaredSceneChangeDetection()
fillOpacity: number = 1;
declare __fillOpacity: string; // ERROR: Type 'string' is not assignable to type 'number'
```

**In hot paths, access backing field directly**:

```typescript
protected renderFill(ctx: CanvasContext, path?: Path2D) {
    const { __fill: fill, __fillOpacity: fillOpacity = 1 } = this;
    // Using __fillOpacity bypasses the getter
}
```

**When to Use**:

- Render methods (`renderFill`, `renderStroke`, `updatePath`)
- High-frequency update loops
- Any code called 1000+ times per frame

**When NOT to Use**:

- Initial setup code
- Infrequently called methods
- Code that needs change detection

**Migration Note**: When adding backing field access to existing properties using `@SceneChangeDetection`, migrate them to `@DeclaredSceneChangeDetection` to get type safety.

---

## 2. Batched Property Setting (`setStyleProperties`, `setStaticProperties`)

**Problem**: Setting multiple properties individually triggers change detection and `markDirty()` for each.

**Solution**: Create specialised methods that write directly to backing fields and call `markDirty()` once.

**Shape.setStyleProperties()** (`shape.ts:441-505`):

```typescript
setStyleProperties(
    style?: Partial<Pick<Shape, 'fill' | 'fillOpacity' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | ...>>,
    fillBBox?: { series: BBox; axis: BBox },
    fillParams?: GradientParams
): void {
    const opacity = style?.opacity ?? 1;
    const computedFillOpacity = (style?.fillOpacity ?? 1) * opacity;
    const computedStrokeOpacity = (style?.strokeOpacity ?? 1) * opacity;

    let hasDirectChanges = false;

    // Write directly to backing fields
    if (this.__fillOpacity !== computedFillOpacity) {
        this.__fillOpacity = computedFillOpacity;
        hasDirectChanges = true;
    }
    if (this.__strokeOpacity !== computedStrokeOpacity) {
        this.__strokeOpacity = computedStrokeOpacity;
        hasDirectChanges = true;
    }
    // ... other fields

    // Single dirty notification for all changes
    if (hasDirectChanges) {
        this.markDirty();
    }
}
```

**BarShape.setStaticProperties()** (`barShape.ts:30-59`):

```typescript
setStaticProperties(
    drawingMode: AgDrawingMode,
    topLeftCornerRadius: number,
    topRightCornerRadius: number,
    bottomRightCornerRadius: number,
    bottomLeftCornerRadius: number,
    visible: boolean,
    direction: 'x' | 'y',
    featherRatio: number,
    crisp: boolean,
    fillShadow: DropShadow | undefined
): void {
    // Direct backing field writes
    this.__drawingMode = drawingMode;
    this.__topLeftCornerRadius = topLeftCornerRadius;
    // ... etc

    this.dirtyPath = true;
    this.markDirty(); // Single call
}
```

**Usage in Series**:

```typescript
// Before (slow):
node.fill = style.fill;
node.fillOpacity = style.fillOpacity;
node.stroke = style.stroke;
// ... 10 more properties = 10 markDirty() calls

// After (fast):
node.setStyleProperties(style, fillBBox);
node.setStaticProperties(drawingMode, ...);
// = 2 markDirty() calls total
```

---

## 3. Direct Animation Reset for Bar-like Series (`resetBarSelectionsDirect`)

**Problem**: The base class `resetDatumAnimation()` method uses `resetMotion()` which invokes a callback function for every node and goes through the decorator system. This is a significant hotspot during animations.

**Solution**: Override `resetDatumAnimation()` to use `resetBarSelectionsDirect()` which bypasses callbacks and decorators entirely.

**Base Class Implementation** (SLOW - `cartesianSeries.ts`):

```typescript
protected resetDatumAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
    const { datum } = this.opts?.animationResetFns ?? {};

    if (datum) {
        resetMotion([data.datumSelection], datum);  // Invokes callback per node
    }
}
```

**resetMotion Pattern** (SLOW - `resetMotion.ts`):

```typescript
export function resetMotion<N extends Node, T extends Partial<N>, D>(
    selectionsOrNodes: Selection<N, D>[] | N[],
    propsFn: (node: N, datum: D) => T // Called for EVERY node
) {
    for (const selection of selections) {
        selection.batchedUpdate(function resetMotionNodes() {
            for (const node of selectionNodes) {
                const from = propsFn(node, node.datum); // Callback overhead
                node.setProperties(from); // Decorator overhead
            }
        });
    }
}
```

**Optimised Override** (FAST - `barSeries.ts`):

```typescript
protected override resetDatumAnimation(
    data: CartesianAnimationData<BarShape<BarNodeDatum>, BarNodeDatum, BarNodeDatum, BarSeriesNodeDataContext>
) {
    // Use direct reset to bypass resetMotion callback overhead
    resetBarSelectionsDirect([data.datumSelection, this.phantomSelection]);
}
```

**resetBarSelectionsDirect Pattern** (FAST - `barUtil.ts`):

```typescript
export function resetBarSelectionsDirect<D extends AnimatableBarDatum & { crisp?: boolean }>(
    selections: { nodes(): Iterable<Rect<D>>; cleanup(): void; batchedUpdate(fn: () => void): void }[]
): void {
    for (const selection of selections) {
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetBarNodes() {
            for (const node of nodes) {
                const datum = node.datum;
                if (datum == null) continue;

                // Direct method bypasses decorators - writes to __x, __y, etc.
                node.resetAnimationProperties(
                    datum.x,
                    datum.y,
                    datum.width,
                    datum.height,
                    datum.opacity ?? 1,
                    datum.clipBBox
                );
                node.crisp = datum.crisp ?? false;
            }
            selection.cleanup();
        });
    }
}
```

**Performance Difference**:

| Aspect              | `resetMotion()` (Base)  | `resetBarSelectionsDirect()`    |
| ------------------- | ----------------------- | ------------------------------- |
| Callback overhead   | Per-node function call  | No callbacks                    |
| Decorator overhead  | Full decorator system   | Direct backing field writes     |
| `markDirty()` calls | Multiple per node       | Single consolidated call        |
| Properties handled  | All (flexible but slow) | 6 critical animation properties |

**When Called**: Animation resets happen during:

- `animateEmptyUpdateReady()`
- `animateWaitingUpdateReady()`
- `animateReadyResize()`
- `animateClearingUpdateEmpty()`

This means the optimisation impacts **every animation frame** where state resets occur.

**Implementation for Bar-like Series**:

```typescript
// 1. Add to _ModuleSupport destructuring
const {
    // ... existing imports
    resetBarSelectionsDirect,
} = _ModuleSupport;

// 2. Override resetDatumAnimation
protected override resetDatumAnimation(data: YourAnimationData) {
    // Use direct reset to bypass resetMotion callback overhead
    resetBarSelectionsDirect([data.datumSelection]);
}
```

**Measured Impact** (RangeBarSeries with 100k points):

| Benchmark          | Before  | After   | Improvement |
| ------------------ | ------- | ------- | ----------- |
| 10x append batch   | 34.98ms | 31.70ms | ~9% faster  |
| 1x remove batch    | 35.63ms | 31.31ms | ~12% faster |
| 50x rolling window | 37.43ms | 31.70ms | ~15% faster |

**Checklist**:

- [ ] Add `resetBarSelectionsDirect` to `_ModuleSupport` destructuring
- [ ] Override `resetDatumAnimation()` method
- [ ] Pass all relevant selections (datum selection, phantom selection if applicable)
- [ ] Verify tests pass
- [ ] Run benchmarks to measure improvement

---

## 4. Direct Animation Reset for Markers (`resetMarkerSelectionsDirect`)

**Problem**: Line series and other marker-based series have the same `resetMotion()` overhead for marker nodes. Markers also use the `Scalable` mixin which requires special handling when bypassing decorators.

**Solution**: Use `resetMarkerSelectionsDirect()` which handles markers correctly, including transform matrix invalidation.

**LineSeries Pattern** (`lineSeries.ts`):

```typescript
// Animation reset function defined in constructor options
animationResetFns: {
    path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
    label: resetLabelFn,
    datum: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
}

// Override to use direct reset
protected override resetDatumAnimation(data: LineAnimationData): void {
    // Use direct reset for datum selection to bypass resetMotion callback overhead
    resetMarkerSelectionsDirect([data.datumSelection]);
}
```

**resetMarkerSelectionsDirect Pattern** (`markerUtil.ts`):

```typescript
/**
 * Optimised reset for marker selections that bypasses resetMotion callback overhead.
 * Uses direct backing field writes via Marker.resetAnimationProperties().
 *
 * Equivalent to: resetMotion(selections, (node, datum) => ({
 *   ...resetMarkerFn(node),        // { opacity: 1, scalingX: 1, scalingY: 1 }
 *   ...resetMarkerPositionFn(node, datum)  // { x, y, scalingCenterX, scalingCenterY }
 * }))
 *
 * Note: size is NOT reset - it preserves the current animated size.
 */
export function resetMarkerSelectionsDirect<D extends CartesianSeriesNodeDatum>(
    selections: { nodes(): Iterable<Marker>; cleanup(): void; batchedUpdate(fn: () => void): void }[]
): void {
    for (const selection of selections) {
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetMarkerNodes() {
            for (const node of nodes) {
                const datum = node.datum as D | undefined;
                if (datum?.point == null) continue;

                const { x, y } = datum.point;
                if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

                // Direct method bypasses decorators - writes to __x, __y, etc.
                // Preserves current size (node.size) to match original resetMotion behavior
                node.resetAnimationProperties(x, y, node.size, 1, 1, 1);
            }
            selection.cleanup();
        });
    }
}
```

**Critical: Marker.resetAnimationProperties() Implementation** (`marker.ts`):

```typescript
resetAnimationProperties(
    x: number,
    y: number,
    size: number,
    opacity: number,
    scalingX: number,
    scalingY: number
): void {
    // Direct backing field writes bypass SceneChangeDetection decorators
    this.__x = x;
    this.__y = y;
    this.__size = size;
    this.__opacity = opacity;
    // Use encapsulated method for scaling properties from Scalable mixin
    this.resetScalingProperties(scalingX, scalingY, x, y);
    this.dirtyPath = true;

    // Single dirty notification for the batch
    this.markDirty();
}
```

**Critical: Scalable.resetScalingProperties() Must Trigger Transform Recalculation** (`transformable.ts`):

```typescript
/**
 * Optimised reset for animation hot paths.
 * Bypasses SceneChangeDetection decorators by writing directly to backing fields.
 */
resetScalingProperties(
    scalingX: number,
    scalingY: number,
    scalingCenterX: number,
    scalingCenterY: number
): void {
    this.__scalingX = scalingX;
    this.__scalingY = scalingY;
    this.__scalingCenterX = scalingCenterX;
    this.__scalingCenterY = scalingCenterY;
    // CRITICAL: Trigger transform matrix recalculation (sets _dirtyTransform = true)
    this.onChangeDetection('scaling');
}
```

**Why `onChangeDetection()` is Required**:

The `MatrixTransformInternal` class (base for `Scalable`, `Rotatable`, `Translatable` mixins) uses a `_dirtyTransform` flag to track when the transform matrix needs recalculation:

```typescript
class MatrixTransformInternal {
    private _dirtyTransform = true;

    override onChangeDetection(property: string): void {
        super.onChangeDetection(property);
        this._dirtyTransform = true; // CRITICAL: Sets flag for matrix recalc
        // ...
    }

    computeTransformMatrix() {
        if (!this._dirtyTransform) return; // Early exit if not dirty
        // ... recalculate matrix
        this._dirtyTransform = false;
    }
}
```

Without calling `onChangeDetection()`, the `_dirtyTransform` flag won't be set, and `computeTransformMatrix()` will return early without recalculating the matrix. This causes incorrect marker positioning during animations.

**Key Differences from Bar Reset**:

| Aspect             | `resetBarSelectionsDirect`             | `resetMarkerSelectionsDirect`    |
| ------------------ | -------------------------------------- | -------------------------------- |
| Node type          | `Rect` (no transforms)                 | `Marker` (uses `Scalable` mixin) |
| Size handling      | Set from `datum.width/height`          | Preserve current `node.size`     |
| Transform handling | Not applicable                         | Must call `onChangeDetection()`  |
| Properties reset   | x, y, width, height, opacity, clipBBox | x, y, size, opacity, scalingX/Y  |

**Checklist for Marker-based Series**:

- [ ] Add `resetMarkerSelectionsDirect` import from `markerUtil.ts`
- [ ] Override `resetDatumAnimation()` to use `resetMarkerSelectionsDirect()`
- [ ] Ensure `Marker.resetAnimationProperties()` uses `resetScalingProperties()` (encapsulated)
- [ ] Ensure `Scalable.resetScalingProperties()` calls `onChangeDetection('scaling')`
- [ ] Verify animation tests pass (especially mid-animation snapshots)
