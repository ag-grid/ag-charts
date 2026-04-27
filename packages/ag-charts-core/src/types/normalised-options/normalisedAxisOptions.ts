import type {
    AgAngleAxisFormattableLabelOptions,
    AgAngleAxisLabelOptions,
    AgAngleCategoryAxisOptions,
    AgAngleNumberAxisOptions,
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

type AxisLabelRequiredKeys = 'enabled' | 'avoidCollisions' | 'spacing' | 'fontSize' | 'fontFamily';

export type NormalisedBaseAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgBaseAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys
>;

export type NormalisedNumericAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgNumericAxisFormattableLabelOptions<TContext>,
    AxisLabelRequiredKeys
>;

export type NormalisedBaseCartesianAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgBaseCartesianAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys
>;

export type NormalisedCartesianAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgCartesianAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys
>;

export type NormalisedCartesianTimeAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgCartesianTimeAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys
>;

export type NormalisedGroupedCategoryAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgGroupedCategoryAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys
>;

export type NormalisedAngleAxisLabelOptions<TContext = ContextDefault> = Normalised<
    AgAngleAxisLabelOptions<TContext>,
    AxisLabelRequiredKeys | 'orientation'
>;

export type NormalisedAngleAxisFormattableLabelOptions<TContext = ContextDefault> = Normalised<
    AgAngleAxisFormattableLabelOptions<TContext>,
    AxisLabelRequiredKeys | 'orientation'
>;

// --- Axis-level normalised shapes ---
//
// Phase 1b morphs `label` only. The remaining holders (`line`, `tick`, `gridLine`,
// `interval`, `title`, `parentLevel`) keep their user-facing shapes here and gain
// dedicated normalised aliases when their respective phases (2/3/4) eliminate
// the corresponding holder classes.

type AxisRequiredKeys = 'label' | 'line' | 'tick' | 'gridLine' | 'interval';

export type NormalisedBaseAxisOptions<TLabel = NormalisedBaseAxisLabelOptions, TContext = ContextDefault> = Normalised<
    AgBaseAxisOptions<TLabel, TContext>,
    AxisRequiredKeys
>;

export type NormalisedBaseCartesianAxisOptions<
    TLabel = NormalisedBaseCartesianAxisLabelOptions,
    TContext = ContextDefault,
> = Normalised<AgBaseCartesianAxisOptions<TLabel, unknown, TContext>, AxisRequiredKeys>;

export type NormalisedBasePolarAxisOptions<
    TLabel = NormalisedBaseAxisLabelOptions,
    TContext = ContextDefault,
> = Normalised<AgBaseAxisOptions<TLabel, TContext>, AxisRequiredKeys>;

// --- Concrete cartesian axes ---

export type NormalisedNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgNumberAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedLogAxisOptions<TContext = ContextDefault> = Normalised<
    AgLogAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedBaseCartesianAxisLabelOptions<TContext> }
>;

export type NormalisedTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgTimeAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedUnitTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgUnitTimeAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedOrdinalTimeAxisOptions<TContext = ContextDefault> = Normalised<
    AgOrdinalTimeAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedCartesianTimeAxisLabelOptions<TContext> }
>;

export type NormalisedGroupedCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgGroupedCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedGroupedCategoryAxisLabelOptions<TContext> }
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
    { label: NormalisedAngleAxisFormattableLabelOptions<TContext> }
>;

export type NormalisedAngleCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgAngleCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedAngleAxisLabelOptions<TContext> }
>;

export type NormalisedRadiusNumberAxisOptions<TContext = ContextDefault> = Normalised<
    AgRadiusNumberAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedNumericAxisLabelOptions<TContext> }
>;

export type NormalisedRadiusCategoryAxisOptions<TContext = ContextDefault> = Normalised<
    AgRadiusCategoryAxisOptions<TContext>,
    AxisRequiredKeys,
    { label: NormalisedBaseAxisLabelOptions<TContext> }
>;
