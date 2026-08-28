import type {
    AxisPluginModuleInstance,
    CallbackParamRules,
    CanvasPoint,
    DynamicContext,
    Forbid,
    LabelObstacle,
    NormalisedAxisCrossLineOptions,
} from 'ag-charts-core';
import { AbstractModuleInstance, jsonDiff } from 'ag-charts-core';
import type { AgCrossLineClickEvent } from 'ag-charts-types';

import type { SeriesAreaCanvasClickEvent, SeriesAreaContextMenuEvent } from '../../core/eventsHub';
import type { AxisContext } from '../../module/axisContext';
import type { ChartAxisRegistry } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { getAxisLabelSideFlag } from '../axis/axisLabelUtil';
import type { ChartAxisLabelFlipFlag } from '../chartAxis';
import type { LabelSource } from '../layout/labelManager';
import type { CrossLine, CrossLineValuePick, PendingCrossLineCallbackParam, PolarCrossLine } from './crossLine';

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
export class CrossLinesPlugin extends AbstractModuleInstance implements AxisPluginModuleInstance, LabelSource {
    static readonly className = 'CrossLines';

    readonly id: string;
    /** A reserved label never moves, so the plugin only ever contributes obstacles. */
    readonly usesPlacedLabels = false;
    /** Bumped whenever the label inputs change, so placement can skip an unchanged solve. */
    nodeDataVersion = 0;

    private readonly ctx: DynamicContext<ChartAxisRegistry<AxisContext>>;
    private readonly axisCtx: AxisContext;
    private readonly rangeGroup = new Group({ name: 'CrossLines-Range' });
    private readonly lineGroup = new Group({ name: 'CrossLines-Line' });
    private readonly labelGroup = new Group({ name: 'CrossLines-Label' });
    private instances: CrossLine[] = [];
    private visible = true;
    private lastOptions: NormalisedAxisCrossLineOptions[] | undefined;
    private readonly removePointerListeners: (() => void)[];

    constructor(ctx: DynamicContext<ChartAxisRegistry<AxisContext>>) {
        super();
        this.ctx = ctx;
        this.axisCtx = ctx.parent;
        this.id = `crossLines:${this.axisCtx.axisId}`;
        this.ctx.labelManager.registerSource(this);
        this.axisCtx.attachAxisOverlay(this.rangeGroup, 'low');
        this.axisCtx.attachAxisOverlay(this.lineGroup, 'mid');
        this.axisCtx.attachAxisOverlay(this.labelGroup, 'high');

        // Both hit-test this axis's cross lines, then diverge: the context-menu one annotates the
        // series-area handoff, the pointer-click one runs the cross-line listeners directly.
        this.removePointerListeners = [
            this.ctx.eventsHub.on('series-area:contextmenu', (event) => this.onSeriesAreaContextMenu(event)),
            this.ctx.eventsHub.on('series-area:canvas-click', (event) => this.onSeriesAreaCanvasClick(event)),
        ];
    }

    private pickCrosslines(point: CanvasPoint): CrossLine[] {
        const result: CrossLine[] = [];
        for (const crossLine of this.instances) {
            if (crossLine.containsPoint?.(point)) {
                result.push(crossLine);
            }
        }
        return result;
    }

    private toParamsArray(matches: CrossLine[], result: CrossLineValuePick[]): CrossLineValuePick[] {
        const { userAxisId: axisId, direction } = this.axisCtx;
        for (const crossLine of matches) {
            const { type: crossLineType, range, value } = crossLine;
            const crossLineId = crossLine.id ?? crossLine.internalId;
            result.push({ clickedOn: 'cross-line', axisId, direction, crossLineId, crossLineType, range, value });
        }
        return result satisfies AgCrossLineClickEvent<unknown>['allClickParams'];
    }

    private onSeriesAreaContextMenu(event: SeriesAreaContextMenuEvent): void {
        const picks = this.pickCrosslines(event);
        this.toParamsArray(picks, event.crossLine);
    }

    private onSeriesAreaCanvasClick(event: SeriesAreaCanvasClickEvent): void {
        const picks = this.pickCrosslines(event);
        if (picks.length > 0) {
            const callbacks = event.pendingCrossLineCallbacks;
            const isClick = event.type === 'click';

            const allParamsOnThisAxis = this.toParamsArray(picks, []);
            callbacks.allClickParams.push(...allParamsOnThisAxis);

            // Use `Forbid` to ensure that allClickParams and rootLevelParams do have conflicting keys,
            // otherwise the `...` spreading could silently and unintentionally override something.
            type ParamType = (typeof allParamsOnThisAxis)[number];
            type EventType = PendingCrossLineCallbackParam;
            const rootLevelParams: Forbid<EventType, keyof ParamType> = {
                event: event.sourceEvent,
                type: isClick ? 'crossLineClick' : 'crossLineDoubleClick',
            };
            const params: CallbackParamRules<EventType> = {
                allClickParams: undefined,
                ...allParamsOnThisAxis[0],
                ...rootLevelParams,
            };
            const callers = [this.axisCtx.caller, this.ctx.chartService];

            // `chart.axes[].crossLines[].listeners` level:
            const { listeners } = this.axisCtx;
            for (const crossLine of picks) {
                const { internalId } = crossLine;
                const crossLineListener = isClick ? crossLine.listeners?.click : crossLine.listeners?.doubleClick;
                if (crossLineListener) {
                    callbacks.crossLines.set(internalId, { callers, fn: crossLineListener, params });
                }
            }

            // `chart.axes[].listeners` level:
            const axisId = this.axisCtx.userAxisId;
            const axisListener = isClick ? listeners?.crossLineClick : listeners?.crossLineDoubleClick;
            if (axisListener && !callbacks.axes.has(axisId)) {
                callbacks.axes.set(axisId, { callers, fn: axisListener, params });
            }

            // `chart.listeners` level:
            callbacks.chart ??= { callers, fn: (p: any) => this.ctx.chartService.callListener(p), params };
        }
    }

    applyOptions(options: NormalisedAxisCrossLineOptions[] | undefined): void {
        if (this.optionsEquivalent(options)) {
            return;
        }
        this.lastOptions = options;
        this.nodeDataVersion++;

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
        const { width, height } = this.ctx.scene;
        const containerBox = { x: 0, y: 0, width, height };
        const polar = this.axisCtx.getPolarLayout?.();
        for (const crossLine of this.instances) {
            crossLine.gridPadding = gridPadding;
            crossLine.containerBox = containerBox;
            if (polar) (crossLine as PolarCrossLine).applyPolarLayout(polar);
            crossLine.update(visible);
        }
    }

    onAxisLayout(): void {
        this.nodeDataVersion++;
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
        // Layout has already bumped the version by now, so a flip has to invalidate the solve itself.
        if (visible !== this.visible) this.nodeDataVersion++;
        this.visible = visible;
        this.rangeGroup.visible = visible;
        this.lineGroup.visible = visible;
        this.labelGroup.visible = visible;
    }

    getInstances(): readonly CrossLine[] {
        return this.instances;
    }

    /**
     * Reserved cross-line labels, as obstacles in placement space. Seeded before any label resolves, so
     * every other label routes around them whatever order the sources are solved in.
     */
    getLabelObstacles(seriesRect: BBox): LabelObstacle[] | undefined {
        if (!this.visible) return;

        const obstacles: LabelObstacle[] = [];
        for (const crossLine of this.instances) {
            if (crossLine.reservesLabelSpace !== true) continue;
            const box = crossLine.getLabelBox?.();
            if (box == null) continue;

            obstacles.push({
                kind: 'rect',
                category: 'label',
                // Already the rotated footprint, so it is inserted unrotated: a rotation here would have
                // the engine inflate the footprint a second time.
                box: {
                    x: box.x - seriesRect.x,
                    y: box.y - seriesRect.y,
                    width: box.width,
                    height: box.height,
                },
            });
        }
        return obstacles.length > 0 ? obstacles : undefined;
    }

    override destroy(): void {
        this.ctx.labelManager.unregisterSource(this.id, this);
        for (const removeListener of this.removePointerListeners) {
            removeListener();
        }
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
