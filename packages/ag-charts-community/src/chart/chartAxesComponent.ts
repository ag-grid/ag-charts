import type {
    AxisID,
    AxisPluginModuleInstance,
    ChartAnimationPhase,
    ChartType,
    DynamicContext,
    SeriesChangeType,
} from 'ag-charts-core';
import {
    ChartUpdateType,
    Debug,
    ModuleType,
    entries,
    moduleMatchesChartType,
    readContributedValue,
} from 'ag-charts-core';
import type { AgBaseAxisOptions, AgChartOptions } from 'ag-charts-types';

import type { ChartRegistry } from '../module/moduleContext';
import type { ChartOptions } from '../module/optionsModule';
import type { ChartAxes } from './chartAxes';
import type { ChartAxis } from './chartAxis';
import type { AxesHost } from './chartTypeEnv';
import type { AxisLabelSource } from './layout/axisLabelSource';
import type { Series, UnknownSeries } from './series/series';
import type { SeriesNodeDatum } from './series/seriesTypes';

const debug = Debug.create(true, 'opts');

type LabelledAxis = ChartAxis & { readonly labelSource: AxisLabelSource };

/**
 * Mirrors `axis.context` on top of the latest options reference. The base `Axis` declares `context` with
 * `declare` so the property is absent unless the user supplied one, which `callWithContext` relies on.
 */
function syncAxisContext(axis: ChartAxis, opts: AgBaseAxisOptions): void {
    const userContext = (opts as { context?: unknown }).context;
    if (userContext !== undefined) {
        (axis as { context?: unknown }).context = userContext;
    } else if ('context' in axis) {
        delete (axis as { context?: unknown }).context;
    }
}

/** The axes of a chart type that has them, composed by the cartesian and polar chart types. */
export class ChartAxesComponent<TAxes extends ChartAxes<LabelledAxis>> implements AxesHost {
    axes: TAxes;

    constructor(
        private readonly ctx: DynamicContext<ChartRegistry>,
        private readonly chartType: ChartType,
        private readonly createChartAxes: () => TAxes,
        private readonly onAxesChanged?: (newValue: TAxes, oldValue: TAxes | undefined) => void
    ) {
        this.axes = createChartAxes();
    }

    setAxes(axes: ChartAxes) {
        const previous = this.axes;
        if (axes === previous) return;
        this.axes = axes as TAxes;

        if (previous.length > 0 || axes.length > 0) {
            this.ctx.axisManager.updateAxes(previous, this.axes);
        }

        // Registered here rather than by the axis, so mini-chart axes sharing these ids never replace them.
        const { labelManager } = this.ctx;
        for (const axis of previous) {
            labelManager.unregisterSource(axis.labelSource.id, axis.labelSource);
        }
        for (const axis of this.axes) {
            labelManager.registerSource(axis.labelSource);
        }

        this.onAxesChanged?.(this.axes, previous);
    }

    /** Must run before `assignSeriesToAxes`. */
    assignAxesToSeries(series: UnknownSeries[]) {
        for (const s of series) {
            for (const direction of s.directions) {
                const seriesAxisId = s.getKeyAxis(direction) ?? direction;
                const newAxis = this.axes.findById(seriesAxisId);
                if (!newAxis) {
                    this.ctx.logger.warnOnce(
                        `no matching axis for direction [${direction}] and id [${seriesAxisId}]; check series and axes configuration.`
                    );
                    return;
                }
                s.axes[direction] = newAxis;
            }
        }
    }

    assignSeriesToAxes(series: UnknownSeries[]) {
        for (const axis of this.axes) {
            function seriesPredicateFn(s: Series<SeriesNodeDatum, any, any>) {
                return s.axes[axis.direction] === axis;
            }
            axis.boundSeries = series.filter(seriesPredicateFn);
        }
    }

    processDomains() {
        for (const axis of this.axes) {
            axis.processData();
        }
    }

    getResizeUpdateType(): ChartUpdateType {
        let updateType = ChartUpdateType.PERFORM_LAYOUT;
        for (const axis of this.axes) {
            const axisUpdateType = axis.getUpdateTypeOnResize();
            if (axisUpdateType < updateType) {
                updateType = axisUpdateType;
            }
        }
        return updateType;
    }

    resetAnimations(phase: ChartAnimationPhase) {
        for (const axis of this.axes) {
            axis.resetAnimation(phase);
        }
    }

    destroy() {
        this.axes.destroy();
    }

    applyAxes(
        host: AxesHost,
        options: AgChartOptions,
        chartOptions: ChartOptions,
        seriesStatus: SeriesChangeType,
        axesChanged = true
    ) {
        if (!('axes' in options) || !options.axes) {
            return;
        }

        const axes = options.axes;
        const forceRecreate = seriesStatus === 'replaced';
        const matchingTypes = !forceRecreate && host.axes.matches(axes);

        // Try to optimise series updates if series count and types didn't change.
        if (matchingTypes) {
            if (axesChanged) {
                for (const axis of host.axes) {
                    const newOpts = axes[axis.id];
                    axis.applyOptions(newOpts as typeof axis.options);
                    syncAxisContext(axis, newOpts);
                    this.applyAxisModules(axis, newOpts);
                }
            }
        } else {
            debug(`ChartAxesComponent.applyAxes() - creating new axes instances; seriesStatus: ${seriesStatus}`);
            host.setAxes(this.createAxes(axes));
        }

        // Implicit primary axes have no unmapped key, so fall back to the canonical id to keep `userKey` usable.
        const { unmappedAxisKeys, optionMetadata } = chartOptions;
        // OPTIMIZATION: disable the expensive tick-calculation where the axis allows it.
        const pickComputationEnabled = optionMetadata.presetType !== 'sparkline';
        for (const axis of host.axes) {
            axis.userKey = unmappedAxisKeys.get(axis.id) ?? axis.id;
            axis.setPickComputationEnabled(pickComputationEnabled);
        }
    }

    private createAxes(options: Record<string, AgBaseAxisOptions>): TAxes {
        const newAxes = this.createChartAxes();

        for (const [id, axisOptions] of entries(options)) {
            const axis = this.ctx.moduleRegistry
                .getAxisModule(axisOptions.type!)!
                .create(this.ctx, id as AxisID, axisOptions) as TAxes[number];
            this.applyAxisModules(axis, axisOptions);

            newAxes.push(axis);
        }

        return newAxes;
    }

    private applyAxisModules(axis: ChartAxis, options: AgBaseAxisOptions) {
        const moduleContext = axis.createModuleContext();
        const moduleMap = axis.getModuleMap();

        const { moduleRegistry } = this.ctx;
        for (const module of moduleRegistry.listModulesByType(ModuleType.AxisPlugin)) {
            if (!moduleMatchesChartType(module, this.chartType)) continue;

            const optionsKey = module.optionsKey ?? module.name;
            // Only the plugin's own key carries its options; its other contributions (e.g. listeners) do not.
            const ownContributions = moduleRegistry
                .moduleContributions(module.name)
                .filter(({ relative }) => relative.segments.length === 1 && relative.segments[0].key === optionsKey);
            const pluginOpts = readContributedValue(ownContributions, 'axis', options);
            const shouldBeEnabled = pluginOpts != null;
            const isEnabled = moduleMap.isEnabled(module.name);

            if (!shouldBeEnabled) {
                if (isEnabled) {
                    moduleMap.removeModule(module.name);
                }
                continue;
            }

            if (!isEnabled) {
                module.register?.(moduleContext);
                moduleMap.addModule(module.name, module.create(moduleContext));
            }

            const plugin = moduleMap.getModule(module.name) as AxisPluginModuleInstance;
            plugin.applyOptions(pluginOpts);
        }
    }
}
