**Current behaviour and Problem Statement**

-   Axes defaults (type, position, styles) are used if nothing is supplied to the `axes` array.
-   To change anything (type, position or styles) or add secondary axes, users need to supply the type and position of all axes.
-   This is extra work for the user and should be simplified. We want to make it easier to change only one property (type, position or styles) on one of the chart axes but leave the others as default.
-   Once the user has supplied the `axes` array, all unspecified _styles_ use the defaults from the theme so that is not a problem.

**Problem**

-   When setting any property (type, position or styles), there is no way to target or identify a specific axis.
-   We want a way for the user to just supply what they want to change/add and alll unspecified axes and properties should still render with defaults.

**Use cases**

1. Change the color of only one axis.
    - User somehow tells us which axis they mean and apply `line.stroke` to just that axis.
    - All axes (targeted and non-targeted) remain with the default type and position
2. Change the position of only one axis
    - User somehow tells us which axis they mean and change the position of that axis
    - All axes (targeted and non-targeted) remain with the default type
    - Untargeted axes remain with the default position
3. Change the type of only one axis
    - User somehow tells us which axis they mean and change the type of that axis
    - All axes (targeted and non-targeted) remain with the default position
    - Untargeted axes remain with the default type
4. Add a secondary axis
    - User somehow tells us that they want an additional axis
    - All axes (targeted and non-targeted) remain with the default type and position
    - New axis is added with default type and position

**Considerations**

-   The series type and data type set the default axis types
-   Polar series use angle/radius rather than cartesian types
-   Themes - should just work as is
-   `horizontal` series - will have 'x' axis as the yKeyAxis. Confusing but tolerable
-   typescript - users need to provide the optional `type` to get typechecking
-   Validation - we can use the inferred type
-   Other places that use 'x', 'y' and sometimes 'xy' such as zoom and sync - can they be updated to use the new keys?
-   Can users force axes to be shown even without an associated series? Currently they can. This will mean adding it to the dictionary. This also means that they can't have their own names for both axes in the secondary axis case because the default 'y' one will show. Unless we are clever.

**Proposals**

### Main Proposal: Dictionary of Axes

The proposal is to use an axis dictionary (`axes: {}`) instead of an array. This allows for easier targeting and modification of axes. Keys can be default names (`x`, `y`) or user-defined names. This is the proposal that will be used.

These keys will also be used throughout the code when referring to an axis such as crossAt: {value: 0, axis: ‘mySecondaryAxis’}.

#### Linking Series to Axes

Series can be linked to an axis by referencing the axis name in `xKeyAxis` or `yKeyAxis`.

If a `yKeyAxis` is not provided, the series will be associated with the default axis for that orientation.

If two series specify different `yKeyAxis`'s, a secondary axis is automatically created if the second ID doesn't match an existing axis.

```javascript
series: [
    { type: 'line', yKey: 'temp', yKeyAxis: 'temperatureAxis' },
    { type: 'bar', yKey: 'precip', yKeyAxis: 'precipitationAxis' }
],
axes: {
    x: { /* Default horizontal axis */ },
    temperatureAxis: { position: 'left', type: 'number' },
    precipitationAxis: { position: 'right', type: 'number' }
}
```

#### Modifying Default Axes

**By default orientation:** To style the default bottom axis (i.e., the `x` axis):

```javascript
axes: {
    x: {
        title: {
            text: 'My Horizontal Axis';
        }
    }
}
```

**Changing position:** To move the default horizontal axis from `bottom` to `top`:

```javascript
axes: {
    x: {
        position: 'top';
    }
}
```

#### Using Custom IDs

You can define a custom ID as a key in the `axes` dictionary and reference it in the series.

To style an axis referenced by a series:

```javascript
series: [{ /* ... */, xKey: 'product', xKeyAxis: 'myAxis' }],
axes: {
    myAxis: { title: { text: 'Products' } }
}
```

#### Secondary Axes

Secondary axes are created by referencing a new axis on a series, and are configured by adding a new entry to the `axes` dictionary.

```javascript
series: [
    { yKey: 'tonnes', yKeyAxisId: 'left-axis' },
    { yKey: 'litres', yKeyAxisId: 'right-axis' }
],
axes: {
    x: { /* ... */ },
    'left-axis': { position: 'left' },
    'right-axis': { position: 'right' }
}
```

The old way of just providing multiple axes in an array for the same position could still be supported for backward compatibility, but this dictionary approach is preferred for clarity.

### Additional Proposals

These are the old proposals.

-   **Use id’s from the series**
    -   Axes are created by providing axes ids within the series
    -   Add a secondary axis - provide different ids in the 1st and 2nd series
    -   A single axis can be configured within the array by identifying it by id
        -   Doesn’t help if autogenerated
    -   A single axis can be configured within the array by identifying it by position AND type
        -   Doesn’t help if you’re trying to change one of them. At a stretch we can infer a bit (‘top’ can only be the horizontal axis, and type can only be for that data type)
        -   Doesn’t explain if you’re adding or changing an existing one
-   **Axes has `vertical` and `horizontal` arrays.**
    -   Solves most of the problem for single axis in each direction scenario
