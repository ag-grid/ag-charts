import type { CartesianChartOptions, CommonChartOptions, PolarChartOptions } from '../modules/defs/commonOptions';
import { EventEmitter } from '../util/eventEmitter';
import { SizeObserver } from '../util/resizeObserver';
import { Stage, StageQueue } from '../util/stageQueue';
import type { ChartOptions } from './chartOptions';
import type { Scene } from './scene';
import type { ChartEventMap, IChart } from './types';

export abstract class BaseChart<T extends CommonChartOptions> implements IChart {
    private static sizeObserver = new SizeObserver();

    readonly events = new EventEmitter<ChartEventMap>();
    readonly stageQueue = new StageQueue();

    private pendingOptions: ChartOptions<T> | null = null;

    constructor(
        public readonly scene: Scene,
        public options: ChartOptions<T>
    ) {
        this.setOptions(options);
    }

    setOptions(options: ChartOptions<T>) {
        this.pendingOptions = options;
        this.stageQueue.enqueue(Stage.OPTIONS_UPDATE, this.applyPendingOptions);
    }

    remove() {}

    protected applyOptions(options: ChartOptions<T>) {
        this.options = options;

        if (options.prevOptions) {
            const { fullOptions } = options;
            const prevOptions = options.prevOptions.fullOptions;

            if (fullOptions.width !== prevOptions.width || fullOptions.height !== prevOptions.height) {
                this.setAutoSize(Boolean(fullOptions.width || fullOptions.height));
            }
            if (fullOptions.container != prevOptions.container) {
                this.setContainer(fullOptions.container, prevOptions.container);
            }
        } else {
            const { fullOptions } = options;
            this.setAutoSize(Boolean(fullOptions.width || fullOptions.height));
            this.setContainer(fullOptions.container);
        }

        this.events.emit('change', this.options);
    }

    private applyPendingOptions = () => {
        if (!this.pendingOptions) return;
        this.applyOptions(this.pendingOptions);
        this.pendingOptions = null;
    };

    private setAutoSize(autoSize?: boolean) {
        if (autoSize) {
            let pendingSize: DOMRect | null;

            const onResize = () => {
                if (pendingSize == null) return;
                const { width, height } = pendingSize;
                this.scene.resize(width, height);
                pendingSize = null;
            };

            // If called multiple times it'll only register once, storing latest size.
            BaseChart.sizeObserver.observe(this.scene.rootElement, (size) => {
                pendingSize = size;
                this.stageQueue.enqueue(Stage.PRE_RENDER, onResize);
            });
        } else {
            BaseChart.sizeObserver.unobserve(this.scene.rootElement);
        }
    }

    private setContainer(container: HTMLElement, prevContainer?: HTMLElement) {
        container.setAttribute('data-ag-charts', '');
        container.appendChild(this.scene.rootElement);
        prevContainer?.removeAttribute('data-ag-charts');
    }
}

export class CartesianChart extends BaseChart<CartesianChartOptions> {}

export class PolarChart extends BaseChart<PolarChartOptions> {}

export class HierarchyChart extends BaseChart<any> {}

export class TopologyChart extends BaseChart<any> {}
