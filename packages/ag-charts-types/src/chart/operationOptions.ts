import type { AgGradientColor, AgImageFill, AgPatternColor } from '../series/cartesian/commonOptions';
import type { AgChartThemeParams } from './themeParamsOptions';

export type WithThemeParams<T> = ExtendLiteralLeaves<T, Operation, ExcludeLeaves>;

export type Operation =
    | PathOperation
    | LogicOperation
    | NumericOperation
    | TransformOperation
    | FontOperation
    | ColorOperation;

type Leaf<T extends ExcludeLeaves | object> = Operation | T;
type AnyLeaf = Leaf<ExcludeLeaves>;

type ExcludeLeaves = string | symbol | number | undefined | AgGradientColor | AgPatternColor | AgImageFill;

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

type ThemeParam = keyof AgChartThemeParams;

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

type PathOperation =
    | { $isUserOption: [Leaf<string>, AnyLeaf, AnyLeaf] }
    | { $palette: PaletteParam }
    | { $path: Leaf<string> | [Leaf<string>, AnyLeaf] | [Leaf<string>, AnyLeaf, AnyLeaf] }
    | { $ref: ThemeParam };

type LogicOperation =
    | { $if: [AnyLeaf, AnyLeaf, AnyLeaf] }
    | { $or: AnyLeaf[] }
    | { $and: AnyLeaf[] }
    | { $eq: [AnyLeaf, AnyLeaf] }
    | { $not: [AnyLeaf] }
    | { $switch: [AnyLeaf] };

type NumericOperation = { $even: [Leaf<number>] } | { $mul: [Leaf<number>, Leaf<number>] } | { $round: [Leaf<number>] };

type TransformOperation =
    | { $map: [AnyLeaf, AnyLeaf] }
    | { $find: [AnyLeaf, AnyLeaf] }
    | { $findFirstSiblingNotOperation: [AnyLeaf] }
    | { $merge: Leaf<object>[] }
    | { $omit: [Leaf<Array<string>>, Leaf<object>] }
    | { $value: '$1' | '$index' };

type FontOperation = { $rem: [AnyLeaf] | [AnyLeaf, AnyLeaf] };

type ColorOperation =
    | { $mix: [Leaf<string>, Leaf<string>, Leaf<number>] }
    | { $foregroundBackgroundMix: [Leaf<number>] }
    | { $foregroundOpacity: [Leaf<number>] }
    | { $interpolate: [AnyLeaf, Leaf<number>] }
    | { $isGradient: [AnyLeaf] }
    | { $isPattern: [AnyLeaf] }
    | { $isImage: [AnyLeaf] };
