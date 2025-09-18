# Option 1: Incremental Update API - Angular Implementation

## Overview

This document provides Angular-specific implementation details for Option 1 (Incremental Update API) of the high-frequency data updates feature in AG Charts. For the overall design document, see [DESIGN_DOC.md](../DESIGN_DOC.md). For the Option 1 architecture details, see [OPTION-1-INCREMENTAL-UPDATE.md](./OPTION-1-INCREMENTAL-UPDATE.md).

## Current State Analysis

### Existing Angular Wrapper

-   **Location**: `packages/ag-charts-angular/projects/ag-charts-angular/src/lib/ag-charts-base.ts`
-   **Current Implementation**:
    -   `ngOnChanges` triggers full updates, runs outside Angular zone for performance
    -   Still requires object cloning per update
    -   No granular reactivity for incremental data changes
    -   Missing OnPush change detection strategy
    -   No support for transaction-based updates

### Performance Bottlenecks

-   Data processing overhead (393ms out of 580ms total for 1M points) as primary bottleneck
-   Zone.js triggering excessive change detection cycles
-   No distinction between data and configuration updates
-   Missing modern Angular features (signals, OnPush)
-   RxJS subscriptions without proper cleanup patterns
-   Full data reprocessing even for small incremental changes

## Implementation Strategy

### Incremental Update Component with Zone Management

```typescript
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    Output,
    inject,
} from '@angular/core';
import { BehaviorSubject, Subject, interval } from 'rxjs';
import { bufferTime, filter, takeUntil } from 'rxjs/operators';

import { AgChartInstance, AgChartOptions, AgDataTransaction, AgDataTransactionResult } from 'ag-charts-types';

interface IncrementalUpdateConfig {
    maxUpdatesPerSecond?: number;
    bufferTimeMs?: number;
    runOutsideZone?: boolean;
    maxBufferSize?: number;
    autoDataWindowing?: boolean;
    dataWindowSize?: number;
    errorHandler?: (error: Error) => void;
}

interface IncrementalMetrics {
    transactionsPerSecond: number;
    averageProcessingTime: number;
    averageRenderTime: number;
    queueDepth: number;
    lastUpdateTime: number;
    memoryUsageMB: number;
    dataWindowSize: number;
    droppedTransactions: number;
}

@Component({
    selector: 'ag-charts-incremental',
    template: '<div #container style="width: 100%; height: 100%;"></div>',
    changeDetection: ChangeDetectionStrategy.OnPush, // Critical for performance
})
export class AgChartsIncremental implements AfterViewInit, OnDestroy {
    @Input() options!: AgChartOptions;
    @Input() incrementalConfig?: IncrementalUpdateConfig;
    @Input() autoStart = false;
    @Input() enableMetrics = false;

    @Output() chartReady = new EventEmitter<AgChartInstance>();
    @Output() transactionComplete = new EventEmitter<AgDataTransactionResult>();
    @Output() metricsUpdate = new EventEmitter<IncrementalMetrics>();
    @Output() transactionError = new EventEmitter<Error>();

    private ngZone = inject(NgZone);
    private chart?: AgChartInstance;
    private destroy$ = new Subject<void>();
    private transactionQueue$ = new Subject<AgDataTransaction>();
    private metrics$ = new BehaviorSubject<IncrementalMetrics>({
        transactionsPerSecond: 0,
        averageProcessingTime: 0,
        averageRenderTime: 3.5, // Rendering is already optimized
        queueDepth: 0,
        lastUpdateTime: Date.now(),
        memoryUsageMB: 0,
        dataWindowSize: 0,
        droppedTransactions: 0,
    });

    ngAfterViewInit() {
        // Create chart outside Angular zone for performance
        this.ngZone.runOutsideAngular(() => {
            this.initializeChart();
            this.setupIncrementalPipeline();

            if (this.enableMetrics) {
                this.startMetricsMonitoring();
            }
        });

        // Emit chart ready inside zone for Angular components
        this.ngZone.run(() => {
            this.chartReady.emit(this.chart!);
        });
    }

    private initializeChart() {
        const container = document.querySelector('.ag-charts-container');

        this.chart = AgCharts.create({
            ...this.options,
            container,
            animation: { enabled: false }, // Critical for high-frequency updates
        });
    }

    private setupIncrementalPipeline() {
        const config = this.incrementalConfig || {};
        const bufferTimeMs = config.bufferTimeMs || 16; // Default ~60fps
        const maxBuffer = config.maxBufferSize || 1000;

        // Buffer transactions for incremental processing
        this.transactionQueue$
            .pipe(
                bufferTime(bufferTimeMs),
                filter((transactions) => transactions.length > 0),
                takeUntil(this.destroy$)
            )
            .subscribe((transactions) => {
                try {
                    // Process batch outside zone - focus on data processing optimization
                    this.processIncrementalBatch(transactions.slice(0, maxBuffer));

                    // Track dropped transactions
                    if (transactions.length > maxBuffer) {
                        this.updateMetrics({
                            droppedTransactions: transactions.length - maxBuffer,
                        });
                    }
                } catch (error) {
                    this.handleError(error as Error);
                }
            });
    }

    private processIncrementalBatch(transactions: AgDataTransaction[]) {
        if (!this.chart) return;

        const startTime = performance.now();

        // Combine transactions into single operation for efficiency
        const combinedTransaction = this.combineTransactions(transactions);

        // Apply incremental update - focus on data processing efficiency (68% bottleneck)
        this.chart.updateData(combinedTransaction);

        const processingTime = performance.now() - startTime;

        // Break down timing based on profiling: 68% data processing, 5% rendering
        const dataProcessingTime = processingTime * 0.68;
        const renderingTime = 3.5; // Rendering is already optimized at ~3-4ms

        // Update metrics with focus on data processing optimization
        this.updateMetrics({
            transactionsPerSecond: transactions.length,
            averageProcessingTime: dataProcessingTime,
            averageRenderTime: renderingTime,
            queueDepth: 0,
            lastUpdateTime: Date.now(),
            dataWindowSize: this.chart.getData().length || 0,
        });

        // Emit completion inside zone if needed
        if (this.transactionComplete.observers.length > 0) {
            this.ngZone.run(() => {
                this.transactionComplete.emit({
                    transactionId: `batch-${Date.now()}`,
                    operationCounts: this.calculateOperationCounts(transactions),
                    totalDataSize: this.chart!.getData().length || 0,
                    processingTime: dataProcessingTime,
                    visualUpdate: true,
                });
            });
        }
    }

    private combineTransactions(transactions: AgDataTransaction[]): AgDataTransaction {
        const combined: AgDataTransaction = {
            append: [],
            prepend: [],
            update: [],
            remove: [],
        };

        transactions.forEach((transaction) => {
            if (transaction.append) combined.append!.push(...transaction.append);
            if (transaction.prepend) combined.prepend!.push(...transaction.prepend);
            if (transaction.update) combined.update!.push(...transaction.update);
            if (transaction.remove) {
                if (Array.isArray(transaction.remove)) {
                    combined.remove = [...(combined.remove || []), ...transaction.remove];
                } else {
                    // Handle predicate functions
                    combined.remove = transaction.remove;
                }
            }
        });

        return combined;
    }

    private calculateOperationCounts(transactions: AgDataTransaction[]) {
        return transactions.reduce(
            (counts, transaction) => ({
                appended: counts.appended + (transaction.append?.length || 0),
                prepended: counts.prepended + (transaction.prepend?.length || 0),
                updated: counts.updated + (transaction.update?.length || 0),
                removed: counts.removed + (Array.isArray(transaction.remove) ? transaction.remove.length : 0),
                replaced: counts.replaced + (transaction.replace?.length || 0),
            }),
            { appended: 0, prepended: 0, updated: 0, removed: 0, replaced: 0 }
        );
    }

    // Public API for incremental updates
    updateData(transaction: AgDataTransaction) {
        this.transactionQueue$.next(transaction);
    }

    updateDataBatch(transactions: AgDataTransaction[]) {
        transactions.forEach((transaction) => this.transactionQueue$.next(transaction));
    }

    updateDataAsync(transaction: AgDataTransaction): Promise<AgDataTransactionResult> {
        return new Promise((resolve, reject) => {
            this.ngZone.runOutsideAngular(async () => {
                try {
                    const result = await this.chart?.updateDataAsync(transaction);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // Data windowing for memory management
    private applyDataWindowing() {
        const config = this.incrementalConfig;
        if (!config?.autoDataWindowing || !this.chart) return;

        const windowSize = config.dataWindowSize || 10000;
        const currentData = this.chart.getData();

        if (Array.isArray(currentData) && currentData.length > windowSize) {
            const trimmedData = currentData.slice(-windowSize);
            this.chart.updateData({ replace: trimmedData });
        }
    }

    private handleError(error: Error) {
        const handler = this.incrementalConfig?.errorHandler;

        if (handler) {
            // Custom handler runs outside zone
            handler(error);
        } else {
            // Default: emit error inside zone
            this.ngZone.run(() => {
                this.transactionError.emit(error);
            });
        }
    }

    private updateMetrics(partial: Partial<IncrementalMetrics>) {
        const current = this.metrics$.value;
        this.metrics$.next({ ...current, ...partial });
    }

    private startMetricsMonitoring() {
        // Monitor metrics outside zone
        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                const metrics = this.metrics$.value;

                // Apply data windowing check
                this.applyDataWindowing();

                // Only emit if there are observers
                if (this.metricsUpdate.observers.length > 0) {
                    this.ngZone.run(() => {
                        this.metricsUpdate.emit(metrics);
                    });
                }
            });
    }

    ngOnDestroy() {
        // Critical: proper cleanup
        this.destroy$.next();
        this.destroy$.complete();

        this.ngZone.runOutsideAngular(() => {
            this.chart?.destroy();
        });
    }
}
```

### Modern Angular 17+ Signals Implementation

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { AgChartInstance, AgChartOptions, AgDataTransaction } from 'ag-charts-types';

@Component({
    selector: 'ag-charts-signals-incremental',
    template: '<div #container style="width: 100%; height: 100%;"></div>',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgChartsSignalsIncremental {
    // Signals for reactive state
    options = input.required<AgChartOptions>();
    incrementalConfig = input<IncrementalUpdateConfig>();
    data = input<any[]>([]);
    maxDataPoints = input<number>(10000);

    // Computed signals for derived state
    private chartConfig = computed(() => {
        const { data, ...config } = this.options();
        return {
            ...config,
            animation: { enabled: false }, // Critical for incremental updates
            data: [], // Start with empty data for incremental loading
        };
    });

    // Computed data window management
    private windowedData = computed(() => {
        const currentData = this.data();
        const maxPoints = this.maxDataPoints();
        return currentData.length > maxPoints ? currentData.slice(-maxPoints) : currentData;
    });

    // Output signals
    chartReady = output<AgChartInstance>();
    transactionComplete = output<AgDataTransactionResult>();
    metricsUpdate = output<IncrementalMetrics>();

    private ngZone = inject(NgZone);
    private chart?: AgChartInstance;
    private transactionBuffer: AgDataTransaction[] = [];
    private metrics = signal<IncrementalMetrics>({
        transactionsPerSecond: 0,
        averageProcessingTime: 0,
        averageRenderTime: 3.5,
        queueDepth: 0,
        lastUpdateTime: Date.now(),
        memoryUsageMB: 0,
        dataWindowSize: 0,
        droppedTransactions: 0,
    });

    constructor() {
        // Effect for incremental data updates (major optimization target)
        effect(() => {
            const currentData = this.windowedData();
            if (currentData.length > 0 && this.chart) {
                this.ngZone.runOutsideAngular(() => {
                    this.processIncrementalDataUpdate(currentData);
                });
            }
        });

        // Effect for config updates (separate from data updates)
        effect(() => {
            const config = this.chartConfig();
            if (this.chart) {
                this.ngZone.runOutsideAngular(() => {
                    this.chart!.update(config);
                });
            }
        });

        // Metrics reporting effect
        effect(() => {
            const currentMetrics = this.metrics();
            this.metricsUpdate.emit(currentMetrics);
        });
    }

    ngAfterViewInit() {
        this.ngZone.runOutsideAngular(() => {
            this.initializeChart();
        });
    }

    private initializeChart() {
        const container = document.querySelector('.ag-charts-container');

        this.chart = AgCharts.create({
            ...this.chartConfig(),
            container,
        });

        this.ngZone.run(() => {
            this.chartReady.emit(this.chart!);
        });
    }

    private processIncrementalDataUpdate(data: any[]) {
        if (!this.chart) return;

        const startTime = performance.now();

        // Use incremental update API (focus on data processing optimization)
        this.chart.updateData({
            replace: data, // For now, replace - can be optimized to append/update based on diff
        });

        const processingTime = performance.now() - startTime;
        const dataProcessingTime = processingTime * 0.68; // Focus on 68% bottleneck

        // Update metrics
        this.metrics.update((m) => ({
            ...m,
            transactionsPerSecond: 1,
            averageProcessingTime: dataProcessingTime,
            lastUpdateTime: Date.now(),
            dataWindowSize: data.length,
        }));
    }

    // Public API for external updates
    appendData(data: any[]) {
        this.transactionBuffer.push({ append: data });
        this.flushBuffer();
    }

    updateData(transaction: AgDataTransaction) {
        this.transactionBuffer.push(transaction);
        this.flushBuffer();
    }

    private flushBuffer() {
        if (this.transactionBuffer.length === 0 || !this.chart) return;

        this.ngZone.runOutsideAngular(() => {
            const startTime = performance.now();

            // Process all buffered transactions
            this.transactionBuffer.forEach((transaction) => {
                this.chart!.updateData(transaction);
            });

            const processingTime = performance.now() - startTime;
            const dataProcessingTime = processingTime * 0.68;

            // Update metrics
            this.metrics.update((m) => ({
                ...m,
                transactionsPerSecond: this.transactionBuffer.length,
                averageProcessingTime: dataProcessingTime,
                queueDepth: 0,
                lastUpdateTime: Date.now(),
            }));

            this.transactionBuffer = [];
        });
    }
}
```

### Dependency Injection Configuration

```typescript
import { InjectionToken, Provider } from '@angular/core';

export const INCREMENTAL_UPDATE_CONFIG = new InjectionToken<IncrementalUpdateConfig>(
    'ag-charts.incremental-update-config'
);

export const provideIncrementalUpdateConfig = (config: IncrementalUpdateConfig): Provider => ({
    provide: INCREMENTAL_UPDATE_CONFIG,
    useValue: config,
});

// Module configuration
@NgModule({
    imports: [CommonModule],
    declarations: [AgChartsIncremental],
    exports: [AgChartsIncremental],
    providers: [
        provideIncrementalUpdateConfig({
            maxUpdatesPerSecond: 100,
            bufferTimeMs: 16,
            runOutsideZone: true,
            maxBufferSize: 1000,
            autoDataWindowing: true,
            dataWindowSize: 10000,
        }),
    ],
})
export class AgChartsIncrementalModule {}
```

## RxJS Integration for Incremental Updates

### Streaming Data Service

```typescript
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval } from 'rxjs';
import { bufferTime, catchError, filter, map, scan, takeUntil } from 'rxjs/operators';

import { AgDataTransaction, AgDataTransactionResult } from 'ag-charts-types';

@Injectable({
    providedIn: 'root',
})
export class IncrementalDataStreamService<TDatum> {
    private dataStream$ = new Subject<TDatum>();
    private transactionStream$ = new Subject<AgDataTransaction<TDatum>>();
    private metricsSubject$ = new BehaviorSubject<IncrementalMetrics>({
        transactionsPerSecond: 0,
        averageProcessingTime: 0,
        averageRenderTime: 3.5,
        queueDepth: 0,
        lastUpdateTime: Date.now(),
        memoryUsageMB: 0,
        dataWindowSize: 0,
        droppedTransactions: 0,
    });

    constructor(private ngZone: NgZone) {}

    // Observable for processed transactions (optimized for data processing)
    getTransactionStream(bufferTimeMs: number = 16): Observable<AgDataTransaction<TDatum>[]> {
        return this.transactionStream$.pipe(
            bufferTime(bufferTimeMs),
            filter((transactions) => transactions.length > 0),
            map((transactions) => this.optimizeTransactions(transactions))
        );
    }

    // Observable for incremental data accumulation
    getIncrementalDataStream(windowSize: number = 10000): Observable<TDatum[]> {
        return this.dataStream$.pipe(
            scan((acc: TDatum[], curr: TDatum) => {
                const newData = [...acc, curr];
                // Apply windowing for memory management
                return newData.length > windowSize ? newData.slice(-windowSize) : newData;
            }, [])
        );
    }

    // Add single data point
    addData(data: TDatum) {
        this.dataStream$.next(data);
        this.transactionStream$.next({ append: [data] });
    }

    // Add batch of data points
    addDataBatch(data: TDatum[]) {
        data.forEach((item) => this.dataStream$.next(item));
        this.transactionStream$.next({ append: data });
    }

    // Add transaction directly
    addTransaction(transaction: AgDataTransaction<TDatum>) {
        this.transactionStream$.next(transaction);
    }

    // Get metrics observable
    getMetrics(): Observable<IncrementalMetrics> {
        return this.metricsSubject$.asObservable();
    }

    private optimizeTransactions(transactions: AgDataTransaction<TDatum>[]): AgDataTransaction<TDatum>[] {
        // Combine consecutive append operations for better data processing
        const optimized: AgDataTransaction<TDatum>[] = [];
        let currentAppend: TDatum[] = [];

        transactions.forEach((transaction) => {
            if (transaction.append) {
                currentAppend.push(...transaction.append);
            } else {
                if (currentAppend.length > 0) {
                    optimized.push({ append: currentAppend });
                    currentAppend = [];
                }
                optimized.push(transaction);
            }
        });

        if (currentAppend.length > 0) {
            optimized.push({ append: currentAppend });
        }

        return optimized;
    }

    updateMetrics(partial: Partial<IncrementalMetrics>) {
        const current = this.metricsSubject$.value;
        this.metricsSubject$.next({ ...current, ...partial });
    }
}
```

### WebSocket Integration Service

```typescript
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { catchError, delay, retryWhen, take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class WebSocketIncrementalService<TDatum> {
    private socket?: WebSocket;
    private dataSubject$ = new Subject<TDatum>();
    private connectionSubject$ = new BehaviorSubject<boolean>(false);
    private errorSubject$ = new Subject<Error>();

    constructor(
        private ngZone: NgZone,
        private dataStreamService: IncrementalDataStreamService<TDatum>
    ) {}

    connect(url: string): Observable<TDatum> {
        return new Observable((observer) => {
            this.ngZone.runOutsideAngular(() => {
                this.socket = new WebSocket(url);

                this.socket.onopen = () => {
                    this.ngZone.run(() => {
                        this.connectionSubject$.next(true);
                        console.log('WebSocket connected for incremental updates');
                    });
                };

                this.socket.onmessage = (event) => {
                    try {
                        const data: TDatum = JSON.parse(event.data);
                        // Add to stream outside zone for performance
                        this.dataStreamService.addData(data);
                        observer.next(data);
                    } catch (error) {
                        this.ngZone.run(() => {
                            this.errorSubject$.next(error as Error);
                        });
                    }
                };

                this.socket.onclose = () => {
                    this.ngZone.run(() => {
                        this.connectionSubject$.next(false);
                        observer.complete();
                    });
                };

                this.socket.onerror = (error) => {
                    this.ngZone.run(() => {
                        const wsError = new Error('WebSocket error');
                        this.errorSubject$.next(wsError);
                        observer.error(wsError);
                    });
                };
            });
        }).pipe(
            retryWhen((errors) => errors.pipe(delay(1000), take(5))),
            catchError((error) => {
                console.error('WebSocket connection failed:', error);
                throw error;
            })
        );
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    getConnectionStatus(): Observable<boolean> {
        return this.connectionSubject$.asObservable();
    }

    getErrors(): Observable<Error> {
        return this.errorSubject$.asObservable();
    }
}
```

## Usage Examples

### Real-time Financial Data Dashboard

```typescript
@Component({
    template: `
        <div class="financial-dashboard">
            <div class="controls">
                <button (click)="toggleStream()" [disabled]="!isConnected">
                    {{ isStreaming ? 'Stop' : 'Start' }} Stream
                </button>
                <select [(ngModel)]="selectedSymbol" (change)="changeSymbol()">
                    <option *ngFor="let symbol of symbols" [value]="symbol">{{ symbol }}</option>
                </select>
            </div>

            <div class="metrics">
                <span>Processing: {{ metrics.averageProcessingTime.toFixed(2) }}ms</span>
                <span>Rendering: {{ metrics.averageRenderTime.toFixed(2) }}ms</span>
                <span>Updates/sec: {{ metrics.transactionsPerSecond }}</span>
                <span>Data points: {{ metrics.dataWindowSize }}</span>
            </div>

            <ag-charts-incremental
                [options]="chartOptions"
                [incrementalConfig]="streamConfig"
                [enableMetrics]="true"
                (transactionComplete)="onTransactionComplete($event)"
                (metricsUpdate)="onMetrics($event)"
                (chartReady)="onChartReady($event)"
            >
            </ag-charts-incremental>
        </div>
    `,
})
export class FinancialDashboardComponent implements OnInit, OnDestroy {
    @ViewChild(AgChartsIncremental) chart!: AgChartsIncremental;

    symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
    selectedSymbol = 'AAPL';
    isStreaming = false;
    isConnected = false;

    chartOptions: AgChartOptions = {
        title: { text: 'Real-time Stock Data' },
        data: [],
        series: [
            {
                type: 'candlestick',
                xKey: 'timestamp',
                openKey: 'open',
                highKey: 'high',
                lowKey: 'low',
                closeKey: 'close',
            },
            {
                type: 'bar',
                xKey: 'timestamp',
                yKey: 'volume',
                yAxis: 'volume',
            },
        ],
        axes: [
            { type: 'time', position: 'bottom' },
            { type: 'number', position: 'left' },
            { type: 'number', position: 'right', keys: ['volume'], id: 'volume' },
        ],
    };

    streamConfig: IncrementalUpdateConfig = {
        maxUpdatesPerSecond: 100,
        bufferTimeMs: 16, // ~60fps
        maxBufferSize: 2000,
        autoDataWindowing: true,
        dataWindowSize: 50000,
    };

    metrics: IncrementalMetrics = {
        transactionsPerSecond: 0,
        averageProcessingTime: 0,
        averageRenderTime: 3.5,
        queueDepth: 0,
        lastUpdateTime: Date.now(),
        memoryUsageMB: 0,
        dataWindowSize: 0,
        droppedTransactions: 0,
    };

    private destroy$ = new Subject<void>();

    constructor(
        private dataStreamService: IncrementalDataStreamService<StockTick>,
        private webSocketService: WebSocketIncrementalService<StockTick>
    ) {}

    ngOnInit() {
        // Set up WebSocket connection
        this.webSocketService
            .connect(`wss://api.example.com/stocks/${this.selectedSymbol}`)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (tick) => this.handleStockTick(tick),
                error: (error) => console.error('WebSocket error:', error),
            });

        // Monitor connection status
        this.webSocketService
            .getConnectionStatus()
            .pipe(takeUntil(this.destroy$))
            .subscribe((connected) => {
                this.isConnected = connected;
            });

        // Set up incremental data stream
        this.dataStreamService
            .getTransactionStream(16) // Buffer transactions every 16ms
            .pipe(takeUntil(this.destroy$))
            .subscribe((transactions) => {
                transactions.forEach((transaction) => {
                    this.chart.updateData(transaction);
                });
            });
    }

    onChartReady(chart: AgChartInstance) {
        console.log('Chart ready for incremental updates');
    }

    onTransactionComplete(result: AgDataTransactionResult) {
        console.log(`Processed ${result.operationCounts.appended} points in ${result.processingTime}ms`);
    }

    onMetrics(metrics: IncrementalMetrics) {
        this.metrics = metrics;
    }

    toggleStream() {
        this.isStreaming = !this.isStreaming;
        if (this.isStreaming) {
            this.startSimulation();
        }
    }

    changeSymbol() {
        // Clear existing data and reconnect for new symbol
        this.chart.updateData({ clear: true });
        this.webSocketService.disconnect();
        this.webSocketService
            .connect(`wss://api.example.com/stocks/${this.selectedSymbol}`)
            .pipe(takeUntil(this.destroy$))
            .subscribe((tick) => this.handleStockTick(tick));
    }

    private handleStockTick(tick: StockTick) {
        // Add to incremental data stream for processing optimization
        this.dataStreamService.addData(tick);
    }

    private startSimulation() {
        // Simulate high-frequency data for testing
        interval(50) // 20 updates per second
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this.isStreaming) {
                    const tick: StockTick = {
                        timestamp: Date.now(),
                        symbol: this.selectedSymbol,
                        open: 100 + Math.random() * 50,
                        high: 100 + Math.random() * 50,
                        low: 100 + Math.random() * 50,
                        close: 100 + Math.random() * 50,
                        volume: Math.floor(Math.random() * 10000),
                    };
                    this.handleStockTick(tick);
                }
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.webSocketService.disconnect();
    }
}

interface StockTick {
    timestamp: number;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
```

### IoT Sensor Monitoring with Multi-Series

```typescript
@Component({
    template: `
        <div class="iot-dashboard">
            <div class="sensors-grid">
                <div *ngFor="let sensor of sensors" class="sensor-panel">
                    <h3>{{ sensor.name }}</h3>
                    <div class="sensor-metrics">
                        <span>Updates: {{ sensor.metrics.transactionsPerSecond }}/sec</span>
                        <span>Processing: {{ sensor.metrics.averageProcessingTime.toFixed(2) }}ms</span>
                    </div>
                    <ag-charts-incremental
                        [options]="getSensorChartOptions(sensor)"
                        [incrementalConfig]="sensorConfig"
                        [enableMetrics]="true"
                        (metricsUpdate)="updateSensorMetrics(sensor.id, $event)"
                        (chartReady)="onSensorChartReady(sensor.id, $event)"
                    >
                    </ag-charts-incremental>
                </div>
            </div>
        </div>
    `,
})
export class IoTMonitoringComponent implements OnInit, OnDestroy {
    sensors = [
        { id: 'sensor-1', name: 'Temperature Sensor 1', metrics: this.defaultMetrics() },
        { id: 'sensor-2', name: 'Humidity Sensor 1', metrics: this.defaultMetrics() },
        { id: 'sensor-3', name: 'Pressure Sensor 1', metrics: this.defaultMetrics() },
    ];

    sensorConfig: IncrementalUpdateConfig = {
        maxUpdatesPerSecond: 50,
        bufferTimeMs: 20,
        maxBufferSize: 1000,
        autoDataWindowing: true,
        dataWindowSize: 5000,
    };

    private chartInstances = new Map<string, AgChartInstance>();
    private destroy$ = new Subject<void>();

    constructor(private dataStreamService: IncrementalDataStreamService<SensorReading>) {}

    ngOnInit() {
        // Simulate sensor data
        interval(100) // 10 readings per second per sensor
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.sensors.forEach((sensor) => {
                    const reading: SensorReading = {
                        timestamp: Date.now(),
                        sensorId: sensor.id,
                        temperature: 20 + Math.random() * 15,
                        humidity: 40 + Math.random() * 30,
                        pressure: 1000 + Math.random() * 50,
                        batteryLevel: 90 + Math.random() * 10,
                    };

                    // Add to incremental stream for optimized data processing
                    this.dataStreamService.addData(reading);

                    // Update specific sensor chart
                    const chart = this.chartInstances.get(sensor.id);
                    if (chart) {
                        chart.updateData({
                            append: [reading],
                        });
                    }
                });
            });
    }

    getSensorChartOptions(sensor: any): AgChartOptions {
        return {
            title: { text: sensor.name },
            data: [],
            series: [
                {
                    type: 'line',
                    xKey: 'timestamp',
                    yKey: 'temperature',
                    yName: 'Temperature (°C)',
                    stroke: '#ff6b6b',
                },
                {
                    type: 'line',
                    xKey: 'timestamp',
                    yKey: 'humidity',
                    yName: 'Humidity (%)',
                    stroke: '#4ecdc4',
                    yAxis: 'secondary',
                },
            ],
            axes: [
                { type: 'time', position: 'bottom' },
                { type: 'number', position: 'left', keys: ['temperature'] },
                { type: 'number', position: 'right', keys: ['humidity'], id: 'secondary' },
            ],
        };
    }

    onSensorChartReady(sensorId: string, chart: AgChartInstance) {
        this.chartInstances.set(sensorId, chart);
    }

    updateSensorMetrics(sensorId: string, metrics: IncrementalMetrics) {
        const sensor = this.sensors.find((s) => s.id === sensorId);
        if (sensor) {
            sensor.metrics = metrics;
        }
    }

    private defaultMetrics(): IncrementalMetrics {
        return {
            transactionsPerSecond: 0,
            averageProcessingTime: 0,
            averageRenderTime: 3.5,
            queueDepth: 0,
            lastUpdateTime: Date.now(),
            memoryUsageMB: 0,
            dataWindowSize: 0,
            droppedTransactions: 0,
        };
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

interface SensorReading {
    timestamp: number;
    sensorId: string;
    temperature: number;
    humidity: number;
    pressure: number;
    batteryLevel: number;
}
```

## Zone.js Management Best Practices

### Critical Performance Pattern

```typescript
// ✅ CORRECT: Chart operations outside zone (focus on data processing)
this.ngZone.runOutsideAngular(() => {
    this.chart = AgCharts.create(options);
    this.chart.updateData(transaction); // Incremental update for data processing efficiency
    this.chart.updateDataAsync(batchTransaction);
});

// ✅ CORRECT: UI updates inside zone
this.ngZone.run(() => {
    this.transactionComplete.emit(result);
    this.changeDetector.markForCheck();
});

// ❌ WRONG: Chart operations inside zone
this.chart.updateData(transaction); // Triggers change detection

// ❌ WRONG: Forgetting zone management for incremental updates
interval(100).subscribe(() => {
    this.chart.updateData({ append: data }); // Runs in zone, causes CD cycles
});
```

### Event Listener Patching for Incremental Updates

```typescript
private patchEventListeners(options: AgChartOptions) {
    // Patch event listeners to run inside zone
    const events = ['nodeClick', 'seriesNodeClick', 'legendItemClick', 'transactionComplete'];

    events.forEach((eventName) => {
        const originalListener = options[eventName];
        if (originalListener) {
            options[eventName] = (...args: any[]) => {
                // Run user callback inside zone for Angular binding updates
                this.ngZone.run(() => originalListener(...args));
            };
        }
    });

    return options;
}
```

## Performance Optimization Patterns

### 1. OnPush Change Detection with Incremental Updates

```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush, // Essential for incremental updates
})
export class IncrementalChartComponent {
    // Use immutable data patterns for incremental updates
    @Input() set dataUpdates(value: AgDataTransaction[]) {
        this._dataUpdates = [...value]; // Create new reference
        this.processIncrementalUpdates();
    }

    private processIncrementalUpdates() {
        // Manual change detection control for data processing optimization
        this.ngZone.runOutsideAngular(() => {
            this._dataUpdates.forEach((transaction) => {
                this.chart.updateData(transaction);
            });
        });
    }
}
```

### 2. RxJS Subscription Management for Incremental Streams

```typescript
export class IncrementalStreamingComponent implements OnDestroy {
    private destroy$ = new Subject<void>();

    ngOnInit() {
        // Optimized streaming for incremental updates
        this.dataStreamService
            .getTransactionStream(16) // 60fps buffer
            .pipe(
                takeUntil(this.destroy$),
                // Process outside zone for data processing optimization
                tap((transactions) =>
                    this.ngZone.runOutsideAngular(() => {
                        this.processIncrementalTransactions(transactions);
                    })
                )
            )
            .subscribe();
    }

    private processIncrementalTransactions(transactions: AgDataTransaction[]) {
        // Focus on data processing efficiency (68% of performance)
        const optimizedTransactions = this.optimizeTransactions(transactions);
        optimizedTransactions.forEach((transaction) => {
            this.chart.updateData(transaction);
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

### 3. Buffering and Batching for Incremental Updates

```typescript
private setupIncrementalBuffering() {
    this.transactionUpdates$
        .pipe(
            bufferTime(16), // Batch per frame for data processing efficiency
            filter((buffer) => buffer.length > 0),
            map((buffer) => this.combineTransactions(buffer)), // Optimize data processing
            takeUntil(this.destroy$)
        )
        .subscribe((combinedTransaction) => {
            this.ngZone.runOutsideAngular(() => {
                this.chart.updateData(combinedTransaction);
            });
        });
}

private combineTransactions(transactions: AgDataTransaction[]): AgDataTransaction {
    // Combine multiple transactions for efficient data processing
    return transactions.reduce(
        (combined, transaction) => ({
            append: [...(combined.append || []), ...(transaction.append || [])],
            update: [...(combined.update || []), ...(transaction.update || [])],
            remove: [...(combined.remove || []), ...(transaction.remove || [])],
        }),
        {}
    );
}
```

## Angular-Specific Risks & Mitigations

### Risk: Zone.js Causing Excessive Change Detection with Incremental Updates

**Mitigation**: Strict zone management with OnPush strategy

```typescript
// Always wrap incremental update operations
this.ngZone.runOutsideAngular(() => {
    // High-frequency incremental operations here
    this.chart.updateData(transaction);
});

// Use OnPush everywhere for incremental update components
changeDetection: ChangeDetectionStrategy.OnPush;
```

### Risk: Memory Leaks from Unclosed Subscriptions in Streaming

**Mitigation**: takeUntil pattern for all incremental data subscriptions

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
    this.incrementalDataStream$
        .pipe(takeUntil(this.destroy$))
        .subscribe((transaction) => this.chart.updateData(transaction));
}

ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
}
```

### Risk: Signals Effects Running Unexpectedly with Incremental Data

**Mitigation**: Careful effect dependencies for incremental updates

```typescript
constructor() {
    // Use untracked for reads that shouldn't trigger incremental updates
    effect(() => {
        const incrementalData = this.incrementalData(); // Tracked
        untracked(() => {
            const config = this.config(); // Not tracked
            this.processIncrementalUpdate(incrementalData, config);
        });
    });
}
```

## Testing Strategies

### Unit Testing with Zone Management and Incremental Updates

```typescript
import { NgZone } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

describe('AgChartsIncremental', () => {
    let component: AgChartsIncremental;
    let fixture: ComponentFixture<AgChartsIncremental>;
    let ngZone: NgZone;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AgChartsIncremental],
        });
        fixture = TestBed.createComponent(AgChartsIncremental);
        component = fixture.componentInstance;
        ngZone = TestBed.inject(NgZone);
    });

    it('should process incremental updates outside zone', fakeAsync(() => {
        const spy = spyOn(ngZone, 'runOutsideAngular').and.callThrough();

        component.ngAfterViewInit();
        component.updateData({ append: [{ value: 1 }, { value: 2 }] });

        tick(20); // Wait for buffer

        expect(spy).toHaveBeenCalled();
    }));

    it('should handle 100 incremental updates/sec', fakeAsync(() => {
        component.ngAfterViewInit();

        // Simulate high-frequency incremental updates
        for (let i = 0; i < 100; i++) {
            component.updateData({
                append: [{ timestamp: Date.now(), value: i }],
            });
            tick(10);
        }

        expect(component['metrics$'].value.droppedTransactions).toBe(0);
    }));

    it('should optimize data processing with transaction combining', fakeAsync(() => {
        const combineSpy = spyOn<any>(component, 'combineTransactions').and.callThrough();

        component.ngAfterViewInit();

        // Add multiple transactions that should be combined
        component.updateData({ append: [{ value: 1 }] });
        component.updateData({ append: [{ value: 2 }] });
        component.updateData({ append: [{ value: 3 }] });

        tick(20); // Wait for buffer processing

        expect(combineSpy).toHaveBeenCalled();
    }));
});
```

### Performance Testing for Incremental Updates

```typescript
it('should maintain performance with high incremental update rate', async () => {
    const fixture = TestBed.createComponent(AgChartsIncremental);
    const component = fixture.componentInstance;

    component.incrementalConfig = {
        maxUpdatesPerSecond: 100,
        bufferTimeMs: 10,
        autoDataWindowing: true,
        dataWindowSize: 5000,
    };

    fixture.detectChanges();

    const startTime = performance.now();

    // Generate rapid incremental updates
    for (let i = 0; i < 1000; i++) {
        component.updateData({
            append: [{ timestamp: Date.now(), value: Math.random() }],
        });
        await new Promise((r) => setTimeout(r, 1));
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should process 1000 incremental updates efficiently
    expect(duration).toBeLessThan(1500); // Data processing optimization target
});

it('should optimize data processing bottleneck', async () => {
    const component = TestBed.createComponent(AgChartsIncremental).componentInstance;

    const largeBatch = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: Date.now() + i,
        value: Math.random(),
    }));

    const startTime = performance.now();

    // Test incremental processing of large dataset
    component.updateData({ append: largeBatch });

    const processingTime = performance.now() - startTime;

    // Focus on data processing optimization (68% of total time)
    expect(processingTime).toBeLessThan(100); // Target < 100ms for data processing
});
```

## Migration Guide

### From Existing AG Charts Angular

```typescript
// Before: Standard AG Charts Angular
@Component({
    template: '<ag-charts [options]="options"></ag-charts>',
})
export class OldChartComponent {
    options = {
        data: [], // Full dataset
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    };

    updateData(newData: any[]) {
        // Inefficient: Full data replacement
        this.options = { ...this.options, data: newData };
    }
}

// After: Incremental update implementation
@Component({
    template: `
        <ag-charts-incremental
            [options]="options"
            [incrementalConfig]="config"
            (transactionComplete)="onTransactionComplete($event)"
        >
        </ag-charts-incremental>
    `,
})
export class NewChartComponent {
    @ViewChild(AgChartsIncremental) chart!: AgChartsIncremental;

    options = {
        data: [], // Start with empty data
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    };

    config: IncrementalUpdateConfig = {
        maxUpdatesPerSecond: 100,
        bufferTimeMs: 16,
        autoDataWindowing: true,
        dataWindowSize: 10000,
    };

    updateData(newData: any[]) {
        // Efficient: Incremental update
        this.chart.updateData({ append: newData });
    }

    onTransactionComplete(result: AgDataTransactionResult) {
        console.log(`Data processing: ${result.processingTime}ms`);
    }
}
```

## Best Practices

1. **Always use OnPush change detection** for incremental update components
2. **Run chart operations outside Angular zone** to prevent CD cycles
3. **Use takeUntil pattern** for all RxJS subscriptions in streaming
4. **Buffer incremental updates** using RxJS bufferTime operator
5. **Implement proper cleanup** in ngOnDestroy
6. **Use signals** for modern Angular 17+ applications with incremental updates
7. **Monitor performance** with built-in metrics focused on data processing
8. **Test zone management** explicitly in unit tests
9. **Optimize transaction combining** to reduce data processing overhead
10. **Implement data windowing** for memory management in long-running streams

## Performance Targets

-   **Update Rate**: 100+ incremental updates/second
-   **Frame Rate**: Maintain 60fps (50fps minimum)
-   **Data Processing**: <30ms per incremental batch (primary optimization target)
-   **Rendering**: Maintain 3-4ms (already optimized)
-   **Change Detection**: <5ms per cycle
-   **Memory**: No leaks over 24-hour period with incremental updates
-   **Zone.js Overhead**: <10% CPU usage
-   **Transaction Latency**: <50ms for incremental data operations
