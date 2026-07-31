import {
    AbstractModuleInstance,
    type AxisPluginModuleInstance,
    type DynamicContext,
    type NormalisedAxisCrossLineOptions,
    jsonDiff,
} from 'ag-charts-core';

import type { SeriesAreaContextMenuEvent } from '../../core/eventsHub';
import type { AxisContext } from '../../module/axisContext';
import type { ChartAxisRegistry } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { getAxisLabelSideFlag } from '../axis/axisLabelUtil';
import type { ChartAxisLabelFlipFlag } from '../chartAxis';
import type { CrossLine, PolarCrossLine } from './crossLine';

/**
 * Axis plugin that owns a per-axis runtime list of {@link CrossLine} instances along with the
 * scene-graph groups they render into.
 *
 * Ownership model (post-refactor — the axis itself has no cross-line awareness):
 * - The plugin creates its own per-axis `rangeGroup` / `lineGroup` / `labelGroup` and attaches
 *   them to the chart-level scene-graph zones owned by {@link AxisManager}. Those zones already
 *   sit at the correct z-indices for cross-line rendering.
 * - Per-instance `CrossLine` runtime is constructed by reading `ctx.crossLine`, a factory
 *   installed via `DynamicContext.factory()` by the owning axis-plugin module's `register` hook.
 *   The community `CrossLinesModule` (scoped to `chartType: 'cartesian'`) installs the cartesian
 *   implementation; the enterprise `PolarCrossLinesModule` (scoped to `chartType: 'polar'`) installs
 *   a polar-aware factory that branches on `axisCtx.axisType` between angle and radius variants.
 *   The two modules are distinct registry entries that share the same `optionsKey: 'crossLines'`,
 *   so `axis.crossLines` works uniformly across cartesian and polar axes.
 * - Lifecycle is driven by the generic {@link AxisPluginModuleInstance} hooks
 *   ({@link update}, {@link layout}, {@link onScaleChange}, {@link onGridChange}). The axis
 *   invokes them generically without knowing what cross-lines are.
 *
 * `applyOptions` is called every `Chart.applyAxes` cycle (whether or not the cross-lines options
 * changed), so the body short-circuits when the new options are structurally equivalent to the
 * previous call — preserving the pre-refactor `jsonDiff`-gated setter behaviour and avoiding
 * scene-graph detach/recreate churn on no-op updates. Per invariant I1 the options array is
 * read-only — the plugin stores its own runtime state on the per-instance `CrossLine`s.
 */
export class CrossLinesPlugin extends AbstractModuleInstance implements AxisPluginModuleInstance {
    static readonly className = 'CrossLines';

    private readonly ctx: DynamicContext<ChartAxisRegistry<AxisContext>>;
    private readonly axisCtx: AxisContext;
    private readonly rangeGroup = new Group({ name: 'CrossLines-Range' });
    private readonly lineGroup = new Group({ name: 'CrossLines-Line' });
    private readonly labelGroup = new Group({ name: 'CrossLines-Label' });
    private instances: CrossLine[] = [];
    private lastOptions: NormalisedAxisCrossLineOptions[] | undefined;
    private readonly removeContextMenuListener: () => void;

    constructor(ctx: DynamicContext<ChartAxisRegistry<AxisContext>>) {
        super();
        this.ctx = ctx;
        this.axisCtx = ctx.parent;
        this.axisCtx.attachAxisOverlay(this.rangeGroup, 'low');
        this.axisCtx.attachAxisOverlay(this.lineGroup, 'mid');
        this.axisCtx.attachAxisOverlay(this.labelGroup, 'high');

        // Annotate the series-area context-menu handoff when the pointer hits one of this axis's cross
        // lines — mirrors how axis-owning modules annotate `event.axis` (see axisDomProxy). The
        // series-area dispatch turns the annotation into a `cross-line` context-menu region.
        this.removeContextMenuListener = this.ctx.eventsHub.on('series-area:contextmenu', (event) =>
            this.onSeriesAreaContextMenu(event)
        );
    }

    private onSeriesAreaContextMenu(event: SeriesAreaContextMenuEvent): void {
        for (const crossLine of this.instances) {
            if (crossLine.containsPoint?.(event) !== true) continue;

            event.crossLine.push({
                crossLineId: crossLine.id ?? crossLine.internalId,
                axisId: this.axisCtx.axisId,
                direction: this.axisCtx.direction,
                type: crossLine.type,
                value: crossLine.value,
                range: crossLine.range,
            });
        }
    }

    applyOptions(options: NormalisedAxisCrossLineOptions[] | undefined): void {
        if (this.optionsEquivalent(options)) {
            return;
        }
        this.lastOptions = options;

        for (const crossLine of this.instances) {
            this.detachInstance(crossLine);
        }

        if (options == null) {
            this.instances = [];
            return;
        }

        this.instances = options.map((crossLineOptions) => {
            const instance = this.ctx.crossLine;
            instance.set(crossLineOptions);
            this.attachInstance(instance);
            this.initInstance(instance);
            return instance;
        });
    }

    onAxisUpdate(): void {
        const visible = this.axisCtx.hasDefinedDomain() || this.axisCtx.hasVisibleSeries();
        const { gridPadding } = this.axisCtx;
        const polar = this.axisCtx.getPolarLayout?.();
        for (const crossLine of this.instances) {
            crossLine.gridPadding = gridPadding;
            if (polar) (crossLine as PolarCrossLine).applyPolarLayout(polar);
            crossLine.update(visible);
        }
    }

    onAxisLayout(): void {
        const polar = this.axisCtx.getPolarLayout?.();
        const visible = this.axisCtx.hasDefinedDomain() || this.axisCtx.hasVisibleSeries();
        const { reverse } = this.axisCtx;

        if (polar) {
            const sideFlag = -getAxisLabelSideFlag(this.axisCtx.mirrored) as ChartAxisLabelFlipFlag;
            for (const crossLine of this.instances) {
                const polarCrossLine = crossLine as PolarCrossLine;
                polarCrossLine.sideFlag = sideFlag;
                polarCrossLine.parallelFlipRotation = polar.parallelFlipRotation;
                polarCrossLine.regularFlipRotation = polar.regularFlipRotation;
                polarCrossLine.calculateLayout?.(visible, reverse);
            }
        } else {
            for (const crossLine of this.instances) {
                crossLine.calculateLayout?.(visible, reverse);
            }
        }
    }

    onScaleChange(): void {
        const [r0, r1] = this.axisCtx.range;
        for (const crossLine of this.instances) {
            crossLine.clippedRange = [r0, r1];
        }
    }

    onGridChange(): void {
        for (const crossLine of this.instances) {
            this.initInstance(crossLine);
        }
    }

    setVisible(visible: boolean): void {
        this.rangeGroup.visible = visible;
        this.lineGroup.visible = visible;
        this.labelGroup.visible = visible;
    }

    getInstances(): readonly CrossLine[] {
        return this.instances;
    }

    override destroy(): void {
        this.removeContextMenuListener();
        for (const crossLine of this.instances) {
            this.detachInstance(crossLine);
        }
        this.instances = [];
        this.rangeGroup.remove();
        this.lineGroup.remove();
        this.labelGroup.remove();
        super.destroy();
    }

    private attachInstance(crossLine: CrossLine): void {
        this.rangeGroup.appendChild(crossLine.rangeGroup);
        this.lineGroup.appendChild(crossLine.lineGroup);
        this.labelGroup.appendChild(crossLine.labelGroup);
    }

    private detachInstance(crossLine: CrossLine): void {
        crossLine.rangeGroup.remove();
        crossLine.lineGroup.remove();
        crossLine.labelGroup.remove();
    }

    private initInstance(crossLine: CrossLine): void {
        crossLine.scale = this.axisCtx.scale;
        crossLine.gridLength = this.axisCtx.gridLength;
        crossLine.gridPadding = this.axisCtx.gridPadding;
    }

    private optionsEquivalent(options: NormalisedAxisCrossLineOptions[] | undefined): boolean {
        const previous = this.lastOptions;
        if (options === previous) return true;
        if (options == null || previous == null) return false;
        return jsonDiff(previous, options) == null;
    }
}
