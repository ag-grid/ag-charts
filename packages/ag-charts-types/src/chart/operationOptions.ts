import type { AgGradientFill } from '../series/cartesian/commonOptions';
import type { AgChartThemeParams } from './themeParamsOptions';

export type WithThemeParams<T> = ExtendLiteralLeaves<T, Operation, ExcludeLeaves>;

export type Operation =
    | PathOperation
    | LogicOperation
    | NumericOperation
    | TransformOperation
    | FontOperation
    | ColorOperation;

type Leaf<T = ExcludeLeaves> = Operation | T;

type ExcludeLeaves = string | symbol | number | undefined | AgGradientFill;

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
            ? Array<U> | V
            : ExtendLiteralLeavesInner<T, V, E, P>
        : ExtendLiteralLeavesInner<T, V, E, P>;
};

type ExtendLiteralLeavesInner<T, V, E, P extends keyof T> =
    T[P] extends Array<infer U>
        ? Array<ExtendLiteralLeaves<U, V, E>>
        : T[P] extends E
          ? T[P] | V
          : ExtendLiteralLeaves<T[P], V, E>;

type ThemeParam = keyof AgChartThemeParams;

type PathOperation = { $ref: ThemeParam } | { $path: string };

type LogicOperation =
    | { $if: [Leaf, Leaf, Leaf] }
    | { $or: [Leaf, Leaf] }
    | { $and: [Leaf, Leaf] }
    | { $eq: [Leaf, Leaf] }
    | { $switch: [Leaf] };

type NumericOperation = { $mul: [Leaf<number>, Leaf<number>] } | { $round: [Leaf<number>] };

type TransformOperation = { $map: [Leaf] } | { $merge: Leaf[] };

type FontOperation = { $rem: [Leaf] | [Leaf, Leaf] };

type ColorOperation =
    | { $mix: [Leaf<string>, Leaf<string>, Leaf<number>] }
    | { $foregroundBackgroundMix: [Leaf<number>] }
    | { $foregroundBackgroundAccentMix: [Leaf<number>, Leaf<number>] };
