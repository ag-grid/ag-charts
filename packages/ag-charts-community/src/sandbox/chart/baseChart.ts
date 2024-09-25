import { EventEmitter } from '../../util/eventEmitter';
import { AxesCoordinator } from '../axes/axesCoordinator';
import { DataPipeline } from '../data/dataPipeline';
import { CategoryProcessor, NumberProcessor } from '../data/dataProcessor';
import type { IStage } from '../drawing/drawingTypes';
import { moduleRegistry } from '../modules/moduleRegistry';
import type { SeriesModule } from '../modules/modulesTypes';
import type { ISeries } from '../series/seriesTypes';
import { PipelinePhase, PipelineQueue } from '../util/pipelineQueue';
import { SizeObserver } from '../util/resizeObserver';
import type { ChartOptions } from './chartOptions';
import type { AgChartOptions, ChartEventMap, IChart } from './chartTypes';

export abstract class BaseChart<TOptions extends AgChartOptions, TCoordinate = unknown>
    implements IChart<TOptions, TCoordinate>
{
    static DefaultAxes?: object[];
    static DefaultKeysMap?: object;

    private static sizeObserver = new SizeObserver();

    readonly axesCoordinator?: AxesCoordinator<any, TCoordinate>;
    readonly events = new EventEmitter<ChartEventMap<TOptions>>();
    readonly pipeline = new PipelineQueue();

    private pendingOptions: ChartOptions<TOptions> | null = null;

    protected dataPipeline = new DataPipeline();
    protected scales?: any[];
    protected series?: any[];

    constructor(
        public readonly stage: IStage,
        public options: ChartOptions<TOptions>
    ) {
        this.setOptions(options);
    }

    setOptions(options: ChartOptions<TOptions>) {
        this.pendingOptions = options;
        this.pipeline.enqueue(PipelinePhase.OptionsUpdate, this.handlePendingOptions);
    }

    waitForUpdate(timeoutMs = 10_000): Promise<void> {
        const message = `Chart.waitForUpdate() timeout of ${timeoutMs}ms reached - chart update is taking too long.`;
        return new Promise((resolve, reject) => {
            const timerId = setTimeout(() => reject(new Error(message)), timeoutMs);
            this.pipeline.enqueue(PipelinePhase.Notify, () => {
                clearTimeout(timerId);
                resolve();
            });
        });
    }

    remove() {}

    protected processData() {
        const { fullOptions } = this.options;

        if (!fullOptions.data?.length || !fullOptions.series?.length) return;

        const { DefaultAxes, DefaultKeysMap } = this.constructor as any;
        const { axes = DefaultAxes, series } = fullOptions;
        const keysMap = new Map<TCoordinate | null, Set<string>>();

        const getKeys = (axisCoordinate: TCoordinate) =>
            keysMap.get(axisCoordinate) ?? keysMap.set(axisCoordinate, new Set()).get(axisCoordinate)!;

        for (const seriesOptions of series) {
            const seriesModule = moduleRegistry.getModule<SeriesModule<any>>(seriesOptions.type);
            const seriesKeysMap = Object.entries<string[]>(seriesModule?.axesKeysMap ?? DefaultKeysMap);
            for (const [axisCoordinate, axisKeys] of seriesKeysMap) {
                const axisCoordinateKeys = getKeys(axisCoordinate as TCoordinate);
                for (let key of axisKeys) {
                    key += 'Key';
                    if (Object.hasOwn(seriesOptions, key)) {
                        axisCoordinateKeys.add((seriesOptions as any)[key]);
                    }
                }
            }
        }

        /**
         * Order:
         * create data processors
         * create / modify axes
         * create / modify series
         */

        for (const axis of axes) {
            const direction = this.axesCoordinator?.getAxisCoordinate(axis) ?? null;
            for (const key of keysMap.get(direction)!) {
                this.dataPipeline.addProcessor(
                    key,
                    axis.type === 'category' ? new CategoryProcessor() : new NumberProcessor()
                );
            }
        }

        this.dataPipeline.processData(fullOptions.data);

        console.log({ axes, series, keysMap });
        console.log(this.dataPipeline.getResults());

        // if (fullOptions.axes ?? DefaultAxes) {
        // 'x' and 'y' represent the values inside `xKey` and `yKey`
        // }
    }

    protected onOptionsChange(options: ChartOptions<TOptions>) {
        const { fullOptions, optionsDiff } = options;

        this.options = options;

        if (options.lastOptions) {
            const prevOptions = options.lastOptions.fullOptions;

            if (fullOptions.width !== prevOptions.width || fullOptions.height !== prevOptions.height) {
                this.setSceneSize(fullOptions.width, fullOptions.height);
            }
            if (fullOptions.container != prevOptions.container) {
                this.setContainer(fullOptions.container, prevOptions.container);
            }
        } else {
            this.setSceneSize(fullOptions.width, fullOptions.height);
            this.setContainer(fullOptions.container);
        }

        if (!optionsDiff || optionsDiff.data || optionsDiff.series?.some((s: ISeries) => s.data)) {
            this.processData();
        }

        this.events.emit('change', this.options);
    }

    private handlePendingOptions = () => {
        if (!this.pendingOptions) return;
        this.onOptionsChange(this.pendingOptions);
        this.pendingOptions = null;
    };

    private setSceneSize(width?: number, height?: number) {
        if (!width || !height) {
            let pendingSize: DOMRect | null;

            const onResize = () => {
                if (pendingSize == null) return;
                this.stage.resize(width ?? pendingSize.width, height ?? pendingSize.height);
                pendingSize = null;
            };

            // If called multiple times it'll only register once, storing latest size.
            BaseChart.sizeObserver.observe(this.stage.rootElement, (size) => {
                pendingSize = size;
                this.pipeline.enqueue(PipelinePhase.PreRender, onResize);
            });
        } else {
            BaseChart.sizeObserver.unobserve(this.stage.rootElement);
            this.pipeline.enqueue(PipelinePhase.PreRender, () => this.stage.resize(width, height));
        }
    }

    private setContainer(container?: HTMLElement, prevContainer?: HTMLElement) {
        container?.setAttribute('data-ag-charts', '');
        container?.appendChild(this.stage.rootElement);
        prevContainer?.removeAttribute('data-ag-charts');
    }
}
