import type {
    AgAngleAxisFormattableLabelOptions,
    AgAngleAxisLabelOptions,
    AgAngleCategoryAxisOptions,
    AgAngleNumberAxisOptions,
    AgAxisBaseIntervalOptions,
    AgAxisBaseTickOptions,
    AgAxisCategoryIntervalOptions,
    AgAxisContinuousIntervalOptions,
    AgAxisGridLineOptions,
    AgAxisLineOptions,
    AgBaseAxisLabelOptions,
    AgBaseAxisOptions,
    AgBaseCartesianAxisLabelOptions,
    AgBaseCartesianAxisOptions,
    AgCartesianAxisLabelOptions,
    AgCartesianTimeAxisLabelOptions,
    AgCategoryAxisOptions,
    AgGroupedCategoryAxisLabelOptions,
    AgGroupedCategoryAxisOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgNumericAxisFormattableLabelOptions,
    AgOrdinalTimeAxisOptions,
    AgRadiusCategoryAxisOptions,
    AgRadiusNumberAxisOptions,
    AgTimeAxisOptions,
    AgTimeInterval,
    AgTimeIntervalUnit,
    AgUnitTimeAxisOptions,
    ContextDefault,
} from 'ag-charts-types';

import type { Normalised } from './normalise';

// --- Label normalised shapes ---
//
// `mirrored`/`parallel` are NOT user-facing options (absent from `ag-charts-types`).
// They are computed axis-instance state managed by `Axis.updateDirection()` and
// gradient-legend's `AxisTicks`. They are deliberately excluded from these aliases
// per invariant I2.

// `fontWeight | color | cornerRadius | padding` are populated by the common axis
// theme template but cannot be required here yet: `SeriesLabelProperties` (still
// used by `primaryLabel` until Phase 4 dismantles `TimeAxisParentLevel`) declares
// them as optional. Phase 4 promotes them to required once primaryLabel returns
// an options shape.
type AxisLabelRequiredKeys = 'enabled' | 'avoidCollisions' | 'spacing' | 'fontSize' | 'fontFamily' | 'border';

/**
 * `fontFamily` is narrowed from `FontFamilyFull` (which can be a `GoogleFontFamily`
 * object or array) to `string`, because `optionsModule.ts` flattens Google fonts
 * to their CSS family string before normalised options are emitted. Each
 * `Normalised<...>` alias declares this in its `O` parameter; `format` stays on
 * the user-facing types where it's actually defined (per invariant I2 — only the
 * formattable subtypes carry it).
 */
type FontFamilyMorph = { fontFamily: string };

export type NormalisedBaseAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgBaseAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    FontFamilyMorph
>;

export type NormalisedNumericAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgNumericAxisFormattableLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    FontFamilyMorph
>;

export type NormalisedBaseCartesianAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgBaseCartesianAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    FontFamilyMorph
>;

export type NormalisedCartesianAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgCartesianAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    FontFamilyMorph
>;

export type NormalisedCartesianTimeAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgCartesianTimeAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    FontFamilyMorph
>;

export type NormalisedGroupedCategoryAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgGroupedCategoryAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    FontFamilyMorph
>;

export type NormalisedAngleAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgAngleAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys | 'orientation',
    FontFamilyMorph
>;

export type NormalisedAngleAxisFormattableLabelOptions<TContext = ContextDefault> = Normalised<
    AgAngleAxisFormattableLabelOptions<TContext>,
    AxisLabelRequiredKeys | 'orientation',
    FontFamilyMorph
>;

// --- Line / tick / gridLine normalised shapes ---
//
// Phase 2 dismantles the `AxisLine`, `AxisGridLine`, `AxisTick` holders. Their
// `enabled`/`width`/`size`/`stroke`/`style` defaults move to
// `commonAxisThemeTemplate` (per axis module overrides for type-specific
// flips like `time` → `gridLine.enabled = false`). The R-lists below match
// what's now guaranteed populated post-theme-merge across every axis module.

export type NormalisedAxisLineOptions = Normalised<AgAxisLineOptions, 'enabled' | 'width'>;

export type NormalisedAxisGridLineOptions = Normalised<AgAxisGridLineOptions, 'enabled' | 'width' | 'style'>;

export type NormalisedAxisTickOptions = Normalised<AgAxisBaseTickOptions, 'enabled' | 'width' | 'size'>;

// --- Interval normalised shapes ---
//
// Phase 3 dismantles the `AxisInterval` and `AngleAxisInterval` holders.
// `interval` is genuinely optional on the axis options: only category /
// unit-time / ordinal-time module templates populate `placement: 'between'`,
// and no module populates the continuous axis interval fields. Reads use
// `axis.options.interval?.X`; the `interval` key is therefore deliberately
// excluded from `AxisRequiredKeys`.

export type NormalisedAxisIntervalOptions = Normalised<AgAxisBaseIntervalOptions>;

export type NormalisedAxisCategoryIntervalOptions = Normalised<AgAxisCategoryIntervalOptions>;

export type NormalisedAxisContinuousIntervalOptions<
    TInterval extends AgTimeInterval | AgTimeIntervalUnit | number = number,
> = Normalised<AgAxisContinuousIntervalOptions<TInterval>>;

// --- Axis-level normalised shapes ---
//
// Phase 1b morphs `label`; Phase 2 morphs `line`/`tick`/`gridLine`. The remaining
// holders (`title`, `parentLevel`) keep their user-facing shapes here and gain
// dedicated normalised aliases when Phase 4 eliminates them.

type AxisRequiredKeys = 'label' | 'line' | 'tick' | 'gridLine';

type AxisLineTickGridLineMorph = {
    line: NormalisedAxisLineOptions;
    tick: NormalisedAxisTickOptions;
    gridLine: NormalisedAxisGridLineOptions;
};

export type NormalisedBaseAxisOptions<TLabel = NormalisedBaseAxisLabelOptions, TContext = ContextDefault> = Normalised<
    AgBaseAxisOptions<TLabel, TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph
>;

export type NormalisedBaseCartesianAxisOptions<
    TLabel = NormalisedBaseCartesianAxisLabelOptions,
    TContext = ContextDefault,
> = Normalised<AgBaseCartesianAxisOptions<TLabel, unknown, TContext>, AxisRequiredKeys, AxisLineTickGridLineMorph>;

/**
 * Category-style cartesian axes (`category`, `time`, `unit-time`, `ordinal-time`) all
 * accept `interval.placement`. `NormalisedBaseCartesianAxisOptions` carries the base
 * `AgAxisBaseIntervalOptions` shape, which omits `placement` — class generics
 * constrained on the base would lose access to it. This narrower constraint exposes
 * `placement` while keeping subtypes (continuous/discrete-time interval shapes) free
 * to bring their own additional fields.
 */
export type NormalisedBaseCategoryStyleAxisOptions<
    TLabel = NormalisedBaseCartesianAxisLabelOptions,
    TContext = ContextDefault,
> = NormalisedBaseCartesianAxisOptions<TLabel, TContext> & { interval?: AgAxisCategoryIntervalOptions };

export type NormalisedBasePolarAxisOptions<
    TLabel = NormalisedBaseAxisLabelOptions,
    TContext = ContextDefault,
> = Normalised<AgBaseAxisOptions<TLabel, TContext>, AxisRequiredKeys, AxisLineTickGridLineMorph>;

// --- Concrete cartesian axes ---

export type NormalisedNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgNumberAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedLogAxisOptions<TContext = ContextDefault> = Normalised<
    AgLogAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedBaseCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgTimeAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedUnitTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgUnitTimeAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedOrdinalTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgOrdinalTimeAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedGroupedCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgGroupedCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedGroupedCategoryAxisLabelOptions<TContext> }
>;

// --- Concrete polar axes ---
//
// `AgRadiusAxisLabelOptions` and `AgRadiusAxisFormattableLabelOptions` are not
// exported from `ag-charts-types` and are empty structural extensions of
// `AgBaseAxisLabelOptions` / `AgNumericAxisFormattableLabelOptions`. The
// internal-only `RadiusAxisLabel.autoRotate`/`autoRotateAngle` fields are
// migrated to plain `RadiusAxis` instance fields per I2 — they are absent from
// the public types and therefore never appear in `axis.options.label`.

export type NormalisedAngleNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgAngleNumberAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedAngleAxisFormattableLabelOptions<TContext> }
>;

export type NormalisedAngleCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgAngleCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedAngleAxisLabelOptions<TContext> }
>;

export type NormalisedRadiusNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgRadiusNumberAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedNumericAxisLabelOptions<TContext> }
>;

export type NormalisedRadiusCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgRadiusCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph & { label: NormalisedBaseAxisLabelOptions<TContext> }
>;
