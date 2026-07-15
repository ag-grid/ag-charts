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
    AgBandHighlightOptions,
    AgBaseAxisLabelOptions,
    AgBaseAxisOptions,
    AgBaseCartesianAxisLabelOptions,
    AgBaseCartesianAxisOptions,
    AgBaseCrossLineLabelOptions,
    AgBaseCrossLineOptions,
    AgBaseCrosshairLabel,
    AgCartesianAxisCaptionOptions,
    AgCartesianAxisLabelOptions,
    AgCartesianTimeAxisLabelOptions,
    AgCategoryAxisOptions,
    AgCrosshairLabel,
    AgCrosshairOptions,
    AgGroupedCategoryAxisLabelOptions,
    AgGroupedCategoryAxisOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgNumericAxisFormattableLabelOptions,
    AgOrdinalTimeAxisOptions,
    AgRadiusCategoryAxisOptions,
    AgRadiusNumberAxisOptions,
    AgTimeAxisOptions,
    AgTimeAxisParentLevel,
    AgTimeInterval,
    AgTimeIntervalUnit,
    AgUnitTimeAxisOptions,
    ContextDefault,
    CssColor,
    Opacity,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedBorderOptions, NormalisedColorType } from './normalisedCommonOptions';

// --- Label normalised shapes ---
//
// `mirrored`/`parallel` are NOT user-facing options (absent from `ag-charts-types`).
// They are computed axis-instance state managed by `Axis.updateDirection()` and
// gradient-legend's `AxisTicks`. They are deliberately excluded from these aliases
// per invariant I2.

// `fontWeight | color | cornerRadius | padding` are populated by the common axis
// theme template. Phase 4 dismantled `TimeAxisParentLevel`, so `primaryLabel`
// now returns the parent-level label options shape and can satisfy the same
// required-key set as the leaf `axis.options.label`.
type AxisLabelRequiredKeys =
    | 'enabled'
    | 'avoidCollisions'
    | 'spacing'
    | 'fontSize'
    | 'fontFamily'
    | 'fontWeight'
    | 'color'
    | 'cornerRadius'
    | 'padding'
    | 'border';

/**
 * `fontFamily` is narrowed from `FontFamilyFull` (which can be a `GoogleFontFamily`
 * object or array) to `string`, because `optionsModule.ts` flattens Google fonts
 * to their CSS family string before normalised options are emitted. Each
 * `Normalised<...>` alias declares this in its `O` parameter; `format` stays on
 * the user-facing types where it's actually defined (per invariant I2 — only the
 * formattable subtypes carry it).
 */
type AxisMorphs = {
    color?: CssColor;
    fill?: NormalisedColorType;
    border: NormalisedBorderOptions;
    fontFamily: string;
};

export type NormalisedBaseAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgBaseAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    AxisMorphs
>;

export type NormalisedNumericAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgNumericAxisFormattableLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    AxisMorphs
>;

export type NormalisedBaseCartesianAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgBaseCartesianAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    AxisMorphs
>;

export type NormalisedCartesianAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgCartesianAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    AxisMorphs
>;

export type NormalisedCartesianTimeAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgCartesianTimeAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    AxisMorphs
>;

export type NormalisedGroupedCategoryAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgGroupedCategoryAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys,
    AxisMorphs
>;

export type NormalisedAngleAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgAngleAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys | 'orientation',
    AxisMorphs
>;

export type NormalisedAngleAxisFormattableLabelOptions<TContext = ContextDefault> = Normalised<
    AgAngleAxisFormattableLabelOptions<TContext>,
    AxisLabelRequiredKeys | 'orientation',
    AxisMorphs
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

// --- Title / parent-level normalised shapes ---
//
// Phase 4 dismantles the `AxisTitle` shell and `TimeAxisParentLevel` holder.
// Title defaults move to `titleAxisThemeTemplate` (composed into every axis
// module that renders a title — every cartesian module plus `radius-number`/
// `radius-category`). Parent-level defaults move to `parentLevelAxisThemeTemplate`
// (composed into the time-style axis modules: `time`, `unit-time`,
// `ordinal-time`).

export type NormalisedAxisTitleOptions = Normalised<
    AgCartesianAxisCaptionOptions,
    'enabled' | 'text' | 'spacing' | 'fontSize' | 'fontFamily' | 'fontWeight' | 'color' | 'wrapping' | 'truncate',
    { color?: CssColor; fontFamily: string }
>;

export type NormalisedTimeAxisParentLevelOptions<TContext = ContextDefault> = Normalised<
    AgTimeAxisParentLevel<TContext>,
    'enabled' | 'label' | 'tick',
    { label: NormalisedCartesianTimeAxisLabelOptions<TContext>; tick: NormalisedAxisTickOptions }
>;

// --- Axis-level normalised shapes ---
//
// Phase 1b morphs `label`; Phase 2 morphs `line`/`tick`/`gridLine`. Phase 4
// promotes `title` to a required key on cartesian/radius axes via the per-axis
// aliases below; the base alias keeps `title` optional because angle axes do
// not render a title.

type AxisRequiredKeys = 'label' | 'line' | 'tick' | 'gridLine' | 'reverse';
type TitledAxisRequiredKeys = AxisRequiredKeys | 'title';
type CartesianAxisRequiredKeys = TitledAxisRequiredKeys | 'maxThicknessRatio';
type CategoryStyleAxisRequiredKeys = CartesianAxisRequiredKeys | 'groupPaddingInner';

type AxisLineTickGridLineMorph = {
    line: NormalisedAxisLineOptions;
    tick: NormalisedAxisTickOptions;
    gridLine: NormalisedAxisGridLineOptions;
};

type AxisTitleMorph = { title: NormalisedAxisTitleOptions };
type TimeAxisParentLevelMorph<TContext> = { parentLevel?: NormalisedTimeAxisParentLevelOptions<TContext> };

export type NormalisedBaseAxisOptions<TLabel = NormalisedBaseAxisLabelOptions, TContext = ContextDefault> = Normalised<
    AgBaseAxisOptions<TLabel, TContext>,
    AxisRequiredKeys,
    AxisLineTickGridLineMorph
>;

export type NormalisedBaseCartesianAxisOptions<
    TLabel = NormalisedBaseCartesianAxisLabelOptions,
    TContext = ContextDefault,
> = Normalised<
    AgBaseCartesianAxisOptions<TLabel, unknown, TContext>,
    CartesianAxisRequiredKeys,
    AxisLineTickGridLineMorph & AxisTitleMorph
>;

/**
 * Category-style cartesian axes (`category`, `grouped-category`, `unit-time`, `ordinal-time`)
 * all accept `interval.placement` plus the band-padding/null-bar fields. `NormalisedBaseCartesianAxisOptions`
 * carries the base `AgAxisBaseIntervalOptions` shape, which omits these — class generics
 * constrained on the base would lose access to them. This narrower constraint exposes
 * the shared category-style fields directly so subclass `this.options.fooBar` reads
 * resolve without per-getter casts. `bandAlignment` and `skipNullBars` are absent from
 * `grouped-category`, but staying optional here keeps the shared constraint usable
 * across all category-style axes.
 */
export type NormalisedBaseCategoryStyleAxisOptions<
    TLabel = NormalisedBaseCartesianAxisLabelOptions,
    TContext = ContextDefault,
> = NormalisedBaseCartesianAxisOptions<TLabel, TContext> & {
    interval?: AgAxisCategoryIntervalOptions;
    groupPaddingInner: number;
    paddingInner?: number;
    paddingOuter?: number;
    bandAlignment?: 'justify' | 'start' | 'center' | 'end';
    skipNullBars?: boolean;
};

/**
 * Polar-axis fields shared between angle and radius axes for class-generic reads
 * (e.g. `polarAxis.options.shape`). `shape` is intersected as required: theme
 * templates populate it for the two axis types whose public schema exposes it
 * (`angle-category`, `radius-number`), and the morph parameter on the other
 * concrete Normalised types injects the value the runtime override pins
 * (`angle-number` → `'circle'`, `radius-category` → `'circle'`). Other
 * cross-axis fields stay optional here because they are per-subtype.
 */
export type NormalisedBasePolarAxisOptions<
    TLabel = NormalisedBaseAxisLabelOptions,
    TContext = ContextDefault,
> = Normalised<AgBaseAxisOptions<TLabel, TContext>, AxisRequiredKeys, AxisLineTickGridLineMorph> & {
    shape: 'polygon' | 'circle';
    innerRadiusRatio?: number;
    positionAngle?: number;
    startAngle?: number;
    endAngle?: number;
};

/**
 * Constraint base for angle axes. Theme templates populate `startAngle`, so
 * `axis.options.startAngle` is guaranteed present at runtime — concrete
 * subtypes (`NormalisedAngle{Number,Category}AxisOptions`) declare this in
 * their R-list. The base intersection mirrors that shape so generic reads on
 * `AngleAxis<...>` resolve `this.options.startAngle: number` without a cast.
 */
export type NormalisedBaseAngleAxisOptions<
    TLabel = NormalisedBaseAxisLabelOptions,
    TContext = ContextDefault,
> = NormalisedBasePolarAxisOptions<TLabel, TContext> & { startAngle: number };

/**
 * Constraint base for radius axes — they render a title and a configurable
 * `positionAngle` (unlike angle axes). Required keys plus the title morph
 * live here so generic-typed reads on `RadiusAxis<...>` resolve
 * `this.options.title` and `this.options.positionAngle` without a cast.
 */
export type NormalisedBaseRadiusAxisOptions<
    TLabel = NormalisedBaseAxisLabelOptions,
    TContext = ContextDefault,
> = NormalisedBasePolarAxisOptions<TLabel, TContext> & {
    title: NormalisedAxisTitleOptions;
    positionAngle: number;
};

// --- Concrete cartesian axes ---

export type NormalisedNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgNumberAxisOptions<TContext>,
    CartesianAxisRequiredKeys,
    AxisLineTickGridLineMorph & AxisTitleMorph & { label: NormalisedCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedLogAxisOptions<TContext = ContextDefault> = Normalised<
    AgLogAxisOptions<TContext>,
    CartesianAxisRequiredKeys,
    AxisLineTickGridLineMorph & AxisTitleMorph & { label: NormalisedCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgCategoryAxisOptions<TContext>,
    CategoryStyleAxisRequiredKeys,
    AxisLineTickGridLineMorph & AxisTitleMorph & { label: NormalisedBaseCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgTimeAxisOptions<TContext>,
    CartesianAxisRequiredKeys,
    AxisLineTickGridLineMorph &
        AxisTitleMorph &
        TimeAxisParentLevelMorph<TContext> & { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedUnitTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgUnitTimeAxisOptions<TContext>,
    CategoryStyleAxisRequiredKeys,
    AxisLineTickGridLineMorph &
        AxisTitleMorph &
        TimeAxisParentLevelMorph<TContext> & { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedOrdinalTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgOrdinalTimeAxisOptions<TContext>,
    CategoryStyleAxisRequiredKeys,
    AxisLineTickGridLineMorph &
        AxisTitleMorph &
        TimeAxisParentLevelMorph<TContext> & { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedGroupedCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgGroupedCategoryAxisOptions<TContext>,
    CategoryStyleAxisRequiredKeys,
    AxisLineTickGridLineMorph & AxisTitleMorph & { label: NormalisedGroupedCategoryAxisLabelOptions<TContext> }
>;

// --- Concrete polar axes ---
//
// `AgRadiusAxisLabelOptions` and `AgRadiusAxisFormattableLabelOptions` are not
// exported from `ag-charts-types` and are empty structural extensions of
// `AgBaseAxisLabelOptions` / `AgNumericAxisFormattableLabelOptions`. The
// internal-only `RadiusAxisLabel.autoRotate`/`autoRotateAngle` fields are
// migrated to plain `RadiusAxis` instance fields per I2 — they are absent from
// the public types and therefore never appear in `axis.options.label`.

// `shape` is absent from the public schemas of `angle-number` and `radius-category`,
// but the runtime axis classes hard-code their shape to `'circle'`. The morph injects
// that fixed value here so the `NormalisedBasePolarAxisOptions.shape: 'polygon' |
// 'circle'` constraint is satisfied without a public-API change.
type AngleNumberShapeMorph = { shape: 'circle' };
type RadiusCategoryShapeMorph = { shape: 'circle' };

export type NormalisedAngleNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgAngleNumberAxisOptions<TContext>,
    AxisRequiredKeys | 'startAngle',
    AxisLineTickGridLineMorph & AngleNumberShapeMorph & { label: NormalisedAngleAxisFormattableLabelOptions<TContext> }
>;

export type NormalisedAngleCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgAngleCategoryAxisOptions<TContext>,
    AxisRequiredKeys | 'startAngle' | 'groupPaddingInner' | 'paddingInner' | 'shape',
    AxisLineTickGridLineMorph & { label: NormalisedAngleAxisLabelOptions<TContext> }
>;

export type NormalisedRadiusNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgRadiusNumberAxisOptions<TContext>,
    TitledAxisRequiredKeys | 'positionAngle' | 'shape',
    AxisLineTickGridLineMorph & AxisTitleMorph & { label: NormalisedNumericAxisLabelOptions<TContext> }
>;

export type NormalisedRadiusCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgRadiusCategoryAxisOptions<TContext>,
    TitledAxisRequiredKeys | 'positionAngle' | 'groupPaddingInner' | 'paddingInner' | 'paddingOuter',
    AxisLineTickGridLineMorph &
        AxisTitleMorph &
        RadiusCategoryShapeMorph & { label: NormalisedBaseAxisLabelOptions<TContext> }
>;

// --- Axis-attached plugins ---
//
// Phase 5 dismantles the `@Property`-decorated holders on `Crosshair`,
// `BandHighlight`, and `CrosshairLabelProperties`. Each plugin holds a
// `Normalised<...>` reference to its slice of `axis.options[plugin.name]`
// and mutates nothing (per invariant I1). R-lists below match what the
// crosshair / bandHighlight `themeTemplate`s populate post-merge.

export type NormalisedCrosshairLabelOptions<TFormat = string, TContext = ContextDefault> = Normalised<
    AgCrosshairLabel<TFormat, TContext>,
    'enabled' | 'xOffset' | 'yOffset'
>;

export type NormalisedSparklineCrosshairLabelOptions<TContext = ContextDefault> = Normalised<
    AgBaseCrosshairLabel<TContext>,
    'enabled' | 'xOffset' | 'yOffset'
>;

type CrosshairLabelMorph<TFormat, TContext> = {
    label: NormalisedCrosshairLabelOptions<TFormat, TContext>;
    stroke?: CssColor;
};

export type NormalisedCrosshairOptions<TFormat = string, TContext = ContextDefault> = Normalised<
    AgCrosshairOptions<NormalisedCrosshairLabelOptions<TFormat, TContext>>,
    'enabled' | 'snap' | 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset' | 'label',
    CrosshairLabelMorph<TFormat, TContext>
>;

export type NormalisedBandHighlightOptions = Normalised<
    AgBandHighlightOptions,
    'enabled' | 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset' | 'fill' | 'fillOpacity',
    { stroke?: CssColor; fill?: NormalisedColorType }
>;

// --- Cross-lines normalised shapes ---
//
// Phase 6 converts cross-lines into an axis plugin (`type: 'axis:plugin'`,
// `name: 'crossLines'`) so they go through the same `applyAxisModules` path
// as `crosshair` / `bandHighlight`. The cross-lines `themeTemplate` (relocated
// here from `chartTheme.getAxisDefaults`) populates `enabled`, `fill`,
// `stroke`, `strokeWidth`, `fillOpacity`, and the entire `label` block.
// `type`, `value`, `range` stay user-facing without theme defaults — they
// describe an individual cross-line, not its styling.

export type NormalisedAxisCrossLineLabelOptions = Normalised<
    AgBaseCrossLineLabelOptions,
    'fontSize' | 'fontFamily' | 'fontWeight' | 'padding' | 'color' | 'cornerRadius',
    { fontFamily: string }
>;

// The cross-lines theme template applies `fill`/`fillOpacity` to every cross-line, so the
// normalised shape carries them on both variants — via the morph, as they are not common keys.
interface CrossLineLabelMorph {
    label?: NormalisedAxisCrossLineLabelOptions;
    fill?: CssColor;
    fillOpacity?: Opacity;
}

export type NormalisedAxisCrossLineOptions = Normalised<
    AgBaseCrossLineOptions,
    'enabled' | 'stroke' | 'strokeWidth',
    CrossLineLabelMorph
>;
