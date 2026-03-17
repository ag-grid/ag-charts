import type { AgGradientColor, AgImageFill, AgPatternColor } from '../series/cartesian/commonOptions';
import type { AgChartAllThemeParams } from './themeParamsOptions';

export type WithThemeParams<T> = ExtendLiteralLeaves<T, Operation, ExcludeLeaves>;

export type Operation =
    | CacheOperation
    | ChartOperation
    | ColorOperation
    | FontOperation
    | LocationOperation
    | LogicOperation
    | NumericOperation
    | TransformOperation;

type Leaf<T extends ExcludeLeaves | object> = Operation | T;
type AnyLeaf = Leaf<ExcludeLeaves>;

type ExcludeLeaves = string | symbol | number | boolean | undefined | AgGradientColor | AgPatternColor | AgImageFill;

/**
 * Modify a type T by extending it's leaves with the type V, excluding any leaf that extends E.
 *
 * @param T type to extend
 * @param V value to union with the leaves
 * @param E leaf types to exclude and keep their original type
 */
type ExtendLiteralLeaves<T, V, E> = {
    [P in keyof T]: NonNullable<T[P]> extends Array<infer U>
        ? U extends E
            ? Array<U> | Array<V> | V
            : ExtendLiteralLeavesInner<T, V, E, P>
        : ExtendLiteralLeavesInner<T, V, E, P>;
};

type ExtendLiteralLeavesInner<T, V, E, P extends keyof T> =
    NonNullable<T[P]> extends Array<infer U>
        ? Array<ExtendLiteralLeaves<U, V, E>> | V
        : T[P] extends E
          ? T[P] | V
          : ExtendLiteralLeaves<T[P], V, E>;

type ThemeParam = keyof AgChartAllThemeParams;

type PaletteParam =
    | 'type'
    | 'fills'
    | 'fillsFallback'
    | 'fill'
    | 'fillFallback'
    | 'strokes'
    | 'stroke'
    | 'gradients'
    | 'gradient'
    | 'sequentialColors'
    | 'divergingColors'
    | 'hierarchyColors'
    | 'secondSequentialColors'
    | 'secondDivergingColors'
    | 'secondHierarchyColors'
    | 'range2'
    | 'up.fill'
    | 'up.stroke'
    | 'down.fill'
    | 'down.stroke'
    | 'altUp.fill'
    | 'altUp.stroke'
    | 'altDown.fill'
    | 'altDown.stroke'
    | 'neutral.fill'
    | 'neutral.stroke';

type CacheOperation = { $cacheMax: Leaf<number> };

type ChartOperation =
    | { $hasSeriesType: Leaf<string> }
    | { $isChartType: Leaf<string> }
    | { $isSeriesType: Leaf<string> };

type ColorOperation =
    | { $foregroundBackgroundMix: Leaf<number> } // Ratio of background (0 to 1)
    | { $foregroundOpacity: Leaf<number> } // Opacity (0 to 1)
    | { $interpolate: [AnyLeaf, Leaf<number>] } // Array of colours | Length of interpolated array
    | { $isGradient: AnyLeaf } // Target vertex
    | { $isImage: AnyLeaf } // Target vertex
    | { $isPattern: AnyLeaf } // Target vertex
    | { $mix: [Leaf<string>, Leaf<string>, Leaf<number>] }; // Colour A | Colour B | Ratio of Colour B (0 to 1)

type FontOperation = { $rem: Leaf<number> | [Leaf<number>, Leaf<ThemeParam>] }; // Ratio of base font size

type LocationOperation =
    | { $isUserOption: [Leaf<string>, AnyLeaf, AnyLeaf] } // Target vertex | Value if true | Value if false
    | { $mapPalette: PaletteParam } // Palette param
    | { $palette: PaletteParam } // Palette param
    | { $path: Leaf<string> | [Leaf<string>, AnyLeaf] | [Leaf<string>, AnyLeaf, AnyLeaf] } // Relative path to vertex | Default if path undefined | Custom branch on which to find the path
    | { $pathString: Leaf<string> } // Relative path to vertex
    | { $ref: ThemeParam }; // Theme param

type LogicOperation =
    | { $if: [AnyLeaf, AnyLeaf, AnyLeaf] } // Condition | Value if true | Value if false
    | { $or: AnyLeaf[] } // Array of values that are truthy
    | { $and: AnyLeaf[] } // Array of values that are truthy
    | { $eq: AnyLeaf[] } // Array of values that are truthy
    | { $not: AnyLeaf } // Target vertex that is truthy
    | { $switch: (AnyLeaf | object)[] } // Conditional value | Default value if no case matches | ...One to many cases of [match | match[], value if matched]
    | { $greaterThan: [Leaf<number>, Leaf<number>] }
    | { $lessThan: [Leaf<number>, Leaf<number>] };

type NumericOperation = { $even: Leaf<number> }; // Number

type TransformOperation =
    | { $apply: Leaf<object> | [Leaf<object>, Leaf<object[]>] } // Object to merge with each item in the array | Default if no user options supplied
    | { $applySwitch: any[] }
    | { $applyCycle: any[] }
    | { $findFirstSiblingNotOperation: AnyLeaf } // Default value if no non-operation sibling found
    | { $map: [AnyLeaf | object, AnyLeaf] } // Operation to apply to each item in the array | Target array
    | { $merge: Leaf<object>[] } // Array of objects to merge
    | { $omit: [Leaf<string[]>, Leaf<object>] } // Array of keys to omit | Object from which to omit keys
    | { $size: AnyLeaf } // Target vertex
    | { $shallow: Leaf<Array<any>> } // Array value to treat as a shallow value in the graph
    | { $shallowSimple: Leaf<Array<any>> } // Array value to treat as a shallow value in the graph, use when default children are simple objects
    | { $value: '$1' | '$index' }; // '$1' nearest ancestor value that is not an operation | '$index' nearest ancestor numeric path segment
