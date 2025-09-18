# Option 3: Batched Update Queue - Angular Implementation

## Overview

This document provides Angular-specific implementation details for Option 3 (Batched Update Queue) of the high-frequency data updates feature in AG Charts. For the overall design document, see [DESIGN_DOC.md](../DESIGN_DOC.md). For the Option 3 architecture details, see [OPTION-3-BATCHED-UPDATE-QUEUE.md](./OPTION-3-BATCHED-UPDATE-QUEUE.md).

## Current State Analysis

### Existing Angular Wrapper

-   **Location**: `packages/ag-charts-angular/projects/ag-charts-angular/src/lib/ag-charts-base.ts`
-   **Current Implementation**:
    -   `ngOnChanges` triggers full updates, runs outside Angular zone for performance
    -   Still requires object cloning per update
    -   No granular reactivity for data-only changes
    -   Missing OnPush change detection strategy

### Performance Bottlenecks

-   Data processing overhead (393ms out of 580ms total for 1M points) as primary bottleneck
-   Zone.js triggering excessive change detection cycles
-   No distinction between data and configuration updates
-   Missing modern Angular features (signals, OnPush)
-   RxJS subscriptions without proper cleanup patterns

## Implementation Strategy

### OnPush Component with Zone Management

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

import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

interface HighFrequencyUpdateConfig {
    maxUpdatesPerSecond?: number;
    bufferTimeMs?: number;
    runOutsideZone?: boolean;
    maxBufferSize?: number;
    dropOldUpdates?: boolean;
    errorHandler?: (error: Error) => void;
}

interface StreamingMetrics {
    updatesPerSecond: number;
    droppedUpdates: number;
    queueDepth: number;
    lastUpdateTime: number;
    memoryUsageMB: number;
    fps: number;
}

@Component({
    selector: 'ag-charts-high-frequency',
    template: '<div #container style="width: 100%; height: 100%;"></div>',
    changeDetection: ChangeDetectionStrategy.OnPush, // Critical for performance
})
export class AgChartsHighFrequency implements AfterViewInit, OnDestroy {
    @Input() options!: AgChartOptions;
    @Input() highFrequencyConfig?: HighFrequencyUpdateConfig;
    @Input() autoStart = false;
    @Input() enableMetrics = false;

    @Output() chartReady = new EventEmitter<AgChartInstance>();
    @Output() updateProcessed = new EventEmitter<StreamingMetrics>();
    @Output() metricsUpdate = new EventEmitter<StreamingMetrics>();
    @Output() streamingError = new EventEmitter<Error>();

    private ngZone = inject(NgZone);
    private chart?: AgChartInstance;
    private destroy$ = new Subject<void>();
    private updateQueue$ = new Subject<any>();
    private metrics$ = new BehaviorSubject<StreamingMetrics>({
        updatesPerSecond: 0,
        droppedUpdates: 0,
        queueDepth: 0,
        lastUpdateTime: Date.now(),
        memoryUsageMB: 0,
        fps: 60,
    });

    ngAfterViewInit() {
        // Create chart outside Angular zone for performance
        this.ngZone.runOutsideAngular(() => {
            this.initializeChart();
            this.setupUpdatePipeline();

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
            animation: { enabled: false }, // Critical for high-frequency
        });
    }

    private setupUpdatePipeline() {
        const config = this.highFrequencyConfig || {};
        const bufferTimeMs = config.bufferTimeMs || 16; // Default ~60fps
        const maxBuffer = config.maxBufferSize || 1000;

        // Buffer updates for batch processing
        this.updateQueue$
            .pipe(
                bufferTime(bufferTimeMs),
                filter((updates) => updates.length > 0),
                takeUntil(this.destroy$)
            )
            .subscribe((updates) => {
                try {
                    // Process batch outside zone
                    this.processBatch(updates.slice(0, maxBuffer));

                    // Track dropped updates
                    if (updates.length > maxBuffer) {
                        this.updateMetrics({
                            droppedUpdates: updates.length - maxBuffer,
                        });
                    }
                } catch (error) {
                    this.handleError(error as Error);
                }
            });
    }

    private processBatch(updates: any[]) {
        if (!this.chart) return;

        const startTime = performance.now();

        // Apply transaction outside zone - focus on data processing efficiency
        this.chart.applyDataTransaction({
            operations: [
                {
                    type: 'append',
                    rows: updates,
                },
            ],
        });

        const processingTime = performance.now() - startTime;
        // Break down timing based on profiling: 68% data processing, 5% rendering
        const dataProcessingTime = processingTime * 0.68;
        const renderingTime = processingTime * 0.05;

        // Update metrics with data processing focus
        this.updateMetrics({
            updatesPerSecond: updates.length,
            queueDepth: 0,
            lastUpdateTime: Date.now(),
            fps: Math.round(1000 / (16 + processingTime)),
            dataProcessingTime,
            renderingTime,
        });

        // Emit completion inside zone if needed
        if (this.updateProcessed.observers.length > 0) {
            this.ngZone.run(() => {
                this.updateProcessed.emit(this.metrics$.value);
            });
        }
    }

    // Public API for adding updates
    addUpdate(data: any) {
        this.updateQueue$.next(data);
    }

    addBatch(updates: any[]) {
        updates.forEach((update) => this.updateQueue$.next(update));
    }

    applyDataTransaction(transaction: DataTransaction) {
        this.ngZone.runOutsideAngular(() => {
            this.chart?.applyDataTransaction(transaction);
        });
    }

    private handleError(error: Error) {
        const handler = this.highFrequencyConfig?.errorHandler;

        if (handler) {
            // Custom handler runs outside zone
            handler(error);
        } else {
            // Default: emit error inside zone
            this.ngZone.run(() => {
                this.streamingError.emit(error);
            });
        }
    }

    private updateMetrics(partial: Partial<StreamingMetrics>) {
        const current = this.metrics$.value;
        this.metrics$.next({ ...current, ...partial });
    }

    private startMetricsMonitoring() {
        // Monitor metrics outside zone
        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                const metrics = this.metrics$.value;

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

import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

@Component({
    selector: 'ag-charts-signals',
    template: '<div #container style="width: 100%; height: 100%;"></div>',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgChartsSignals {
    // Signals for reactive state
    options = input.required<AgChartOptions>();
    highFrequencyConfig = input<HighFrequencyUpdateConfig>();
    data = input<any[]>([]);
    maxDataPoints = input<number>(1000);

    // Computed signals for derived state
    private chartConfig = computed(() => {
        const { data, ...config } = this.options();
        return { ...config, animation: { enabled: false } };
    });

    // Output signals
    chartReady = output<AgChartInstance>();
    metricsUpdate = output<StreamingMetrics>();

    private ngZone = inject(NgZone);
    private chart?: AgChartInstance;
    private updateBuffer: any[] = [];
    private metrics = signal<StreamingMetrics>({
        updatesPerSecond: 0,
        droppedUpdates: 0,
        queueDepth: 0,
        lastUpdateTime: Date.now(),
        memoryUsageMB: 0,
        fps: 60,
    });

    constructor() {
        // Effect for data updates
        effect(() => {
            const currentData = this.data();
            if (currentData.length > 0 && this.chart) {
                this.ngZone.runOutsideAngular(() => {
                    this.processDataUpdate(currentData);
                });
            }
        });

        // Effect for config updates
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

    private processDataUpdate(data: any[]) {
        const maxPoints = this.maxDataPoints();
        const startTime = performance.now();

        // Trim data if exceeds max points
        const trimmedData = data.length > maxPoints ? data.slice(-maxPoints) : data;

        this.chart!.updateDataOnly(trimmedData, {
            mode: 'replace',
        });

        // Update metrics
        const processingTime = performance.now() - startTime;
        this.metrics.update((m) => ({
            ...m,
            updatesPerSecond: trimmedData.length,
            lastUpdateTime: Date.now(),
            fps: Math.round(1000 / (16 + processingTime)),
        }));
    }

    // Public API
    addData(data: any) {
        this.updateBuffer.push(data);
        this.flushBuffer();
    }

    private flushBuffer() {
        if (this.updateBuffer.length === 0) return;

        this.ngZone.runOutsideAngular(() => {
            this.chart?.applyDataTransaction({
                operations: [
                    {
                        type: 'append',
                        rows: this.updateBuffer,
                    },
                ],
            });

            this.updateBuffer = [];
        });
    }
}
```

### Dependency Injection Configuration

```typescript
import { InjectionToken, Provider } from '@angular/core';

export const HIGH_FREQUENCY_CONFIG = new InjectionToken<HighFrequencyUpdateConfig>('ag-charts.high-frequency-config');

export const provideHighFrequencyConfig = (config: HighFrequencyUpdateConfig): Provider => ({
    provide: HIGH_FREQUENCY_CONFIG,
    useValue: config,
});

// Module configuration
@NgModule({
    imports: [CommonModule],
    declarations: [AgChartsHighFrequency],
    exports: [AgChartsHighFrequency],
    providers: [
        provideHighFrequencyConfig({
            maxUpdatesPerSecond: 60,
            bufferTimeMs: 16,
            runOutsideZone: true,
            maxBufferSize: 1000,
        }),
    ],
})
export class AgChartsHighFrequencyModule {}
```

## Usage Examples

### IoT Sensor Monitoring Dashboard

```typescript
@Component({
    template: `
        <ag-charts-high-frequency
            [options]="chartOptions"
            [highFrequencyConfig]="streamConfig"
            [enableMetrics]="true"
            (metricsUpdate)="onMetrics($event)"
        >
        </ag-charts-high-frequency>
        <div class="metrics">Processing {{ metrics.updatesPerSecond }} updates/sec at {{ metrics.fps }} FPS</div>
    `,
})
export class SensorMonitorComponent implements OnInit {
    @ViewChild(AgChartsHighFrequency) chart!: AgChartsHighFrequency;

    chartOptions = {
        title: { text: 'Sensor Data Stream' },
        data: [],
        series: [
            { type: 'line', xKey: 'time', yKey: 'temperature' },
            { type: 'line', xKey: 'time', yKey: 'humidity' },
        ],
    };

    streamConfig: HighFrequencyUpdateConfig = {
        maxUpdatesPerSecond: 60,
        bufferTimeMs: 25, // Larger batches for data processing efficiency
        maxBufferSize: 1500, // Allow larger buffers to optimize data processing
        dropOldUpdates: true,
        enableDataProcessingOptimization: true, // Focus on 68% bottleneck
    };

    metrics = { updatesPerSecond: 0, fps: 60 };

    ngOnInit() {
        // Simulate high-frequency sensor data
        interval(10).subscribe(() => {
            this.chart.addBatch([
                {
                    time: Date.now(),
                    temperature: 20 + Math.random() * 10,
                    humidity: 40 + Math.random() * 20,
                },
            ]);
        });
    }

    onMetrics(metrics: StreamingMetrics) {
        this.metrics = metrics;
    }
}
```

### Financial Trading with WebSockets

```typescript
@Component({
    template: `
        <ag-charts-signals
            [options]="chartOptions()"
            [data]="tradeData()"
            [maxDataPoints]="500"
            (chartReady)="onChartReady($event)"
        >
        </ag-charts-signals>
    `,
})
export class TradingComponent implements OnInit, OnDestroy {
    private ws?: WebSocket;
    private trades: Trade[] = [];

    // Signals for reactive data
    tradeData = signal<Trade[]>([]);
    chartOptions = signal({
        title: { text: 'Live Trading' },
        series: [
            { type: 'candlestick', xKey: 'time' },
            { type: 'column', xKey: 'time', yKey: 'volume', yAxis: 'volume' },
        ],
        axes: [
            { type: 'time', position: 'bottom' },
            { type: 'number', position: 'left' },
            { type: 'number', position: 'right', keys: ['volume'], id: 'volume' },
        ],
    });

    ngOnInit() {
        this.connectWebSocket();
    }

    private connectWebSocket() {
        this.ws = new WebSocket('wss://stream.exchange.com/trades');

        this.ws.onmessage = (event) => {
            const trade = JSON.parse(event.data);
            this.trades.push(trade);

            // Update signal with new data
            this.tradeData.set([...this.trades]);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Retry connection
            setTimeout(() => this.connectWebSocket(), 1000);
        };
    }

    onChartReady(chart: AgChartInstance) {
        console.log('Chart ready for streaming');
    }

    ngOnDestroy() {
        this.ws?.close();
    }
}
```

## Zone.js Management Best Practices

### Critical Performance Pattern

```typescript
// ✅ CORRECT: Chart operations outside zone
this.ngZone.runOutsideAngular(() => {
    this.chart = AgCharts.create(options);
    this.chart.update(newOptions);
    this.chart.applyDataTransaction(transaction);
});

// ✅ CORRECT: UI updates inside zone
this.ngZone.run(() => {
    this.metricsUpdate.emit(metrics);
    this.changeDetector.markForCheck();
});

// ❌ WRONG: Chart operations inside zone
this.chart.update(newOptions); // Triggers change detection

// ❌ WRONG: Forgetting zone management
interval(100).subscribe(() => {
    this.chart.updateData(data); // Runs in zone, causes CD cycles
});
```

### Event Listener Patching

```typescript
private patchEventListeners(options: AgChartOptions) {
  // Patch event listeners to run inside zone
  const events = ['nodeClick', 'seriesNodeClick', 'legendItemClick'];

  events.forEach(eventName => {
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

### 1. OnPush Change Detection

```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush, // Essential
})
export class ChartComponent {
    // Use immutable data patterns
    @Input() set data(value: any[]) {
        this._data = [...value]; // Create new reference
        this.updateChart();
    }

    private updateChart() {
        // Manual change detection control
        this.ngZone.runOutsideAngular(() => {
            this.chart.updateData(this._data);
        });
    }
}
```

### 2. RxJS Subscription Management

```typescript
export class StreamingComponent implements OnDestroy {
    private destroy$ = new Subject<void>();

    ngOnInit() {
        // Always use takeUntil for cleanup
        interval(100)
            .pipe(
                takeUntil(this.destroy$),
                // Process outside zone
                tap((value) =>
                    this.ngZone.runOutsideAngular(() => {
                        this.processUpdate(value);
                    })
                )
            )
            .subscribe();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

### 3. Buffering and Batching

```typescript
private setupBuffering() {
  this.updates$.pipe(
    bufferTime(16), // Batch per frame
    filter(buffer => buffer.length > 0),
    map(buffer => buffer.slice(0, 100)), // Limit batch size
    takeUntil(this.destroy$)
  ).subscribe(batch => {
    this.ngZone.runOutsideAngular(() => {
      this.processBatch(batch);
    });
  });
}
```

## Angular-Specific Risks & Mitigations

### Risk: Zone.js Causing Excessive Change Detection

**Mitigation**: Strict zone management with OnPush strategy

```typescript
// Always wrap performance-critical code
this.ngZone.runOutsideAngular(() => {
    // High-frequency operations here
});

// Use OnPush everywhere
changeDetection: ChangeDetectionStrategy.OnPush;
```

### Risk: Memory Leaks from Unclosed Subscriptions

**Mitigation**: takeUntil pattern for all subscriptions

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.stream$.pipe(
    takeUntil(this.destroy$)
  ).subscribe();
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Risk: Signals Effects Running Unexpectedly

**Mitigation**: Careful effect dependencies

```typescript
constructor() {
  // Use untracked for reads that shouldn't trigger
  effect(() => {
    const data = this.data(); // Tracked
    untracked(() => {
      const config = this.config(); // Not tracked
      this.updateChart(data, config);
    });
  });
}
```

## Testing Strategies

### Unit Testing with Zone Management

```typescript
import { NgZone } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

describe('AgChartsHighFrequency', () => {
    let component: AgChartsHighFrequency;
    let fixture: ComponentFixture<AgChartsHighFrequency>;
    let ngZone: NgZone;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AgChartsHighFrequency],
        });
        fixture = TestBed.createComponent(AgChartsHighFrequency);
        component = fixture.componentInstance;
        ngZone = TestBed.inject(NgZone);
    });

    it('should process updates outside zone', fakeAsync(() => {
        const spy = spyOn(ngZone, 'runOutsideAngular').and.callThrough();

        component.ngAfterViewInit();
        component.addBatch([{ value: 1 }, { value: 2 }]);

        tick(20); // Wait for buffer

        expect(spy).toHaveBeenCalled();
    }));

    it('should handle 100 updates/sec', fakeAsync(() => {
        component.ngAfterViewInit();

        // Simulate high-frequency updates
        for (let i = 0; i < 100; i++) {
            component.addUpdate({ timestamp: Date.now(), value: i });
            tick(10);
        }

        expect(component['metrics$'].value.droppedUpdates).toBe(0);
    }));
});
```

### Performance Testing

```typescript
it('should maintain performance with high update rate', async () => {
    const fixture = TestBed.createComponent(AgChartsHighFrequency);
    const component = fixture.componentInstance;

    component.highFrequencyConfig = {
        maxUpdatesPerSecond: 100,
        bufferTimeMs: 10,
    };

    fixture.detectChanges();

    const startTime = performance.now();

    // Generate rapid updates
    for (let i = 0; i < 1000; i++) {
        component.addUpdate({ value: Math.random() });
        await new Promise((r) => setTimeout(r, 1));
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should process 1000 updates in ~1 second
    expect(duration).toBeLessThan(1500);
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
        /* ... */
    };

    updateData(newData: any[]) {
        this.options = { ...this.options, data: newData };
    }
}

// After: High-frequency optimized
@Component({
    template: `
        <ag-charts-high-frequency [options]="options" [highFrequencyConfig]="streamConfig"> </ag-charts-high-frequency>
    `,
})
export class NewChartComponent {
    @ViewChild(AgChartsHighFrequency) chart!: AgChartsHighFrequency;

    options = {
        /* ... */
    };
    streamConfig = { maxUpdatesPerSecond: 60 };

    updateData(newData: any[]) {
        this.chart.addBatch(newData); // Automatically batched
    }
}
```

## Best Practices

1. **Always use OnPush change detection** for streaming components
2. **Run chart operations outside Angular zone** to prevent CD cycles
3. **Use takeUntil pattern** for all RxJS subscriptions
4. **Batch updates** using RxJS bufferTime operator
5. **Implement proper cleanup** in ngOnDestroy
6. **Use signals** for modern Angular 17+ applications
7. **Monitor performance** with built-in metrics
8. **Test zone management** explicitly in unit tests

## Performance Targets

-   **Update Rate**: 100+ updates/second
-   **Frame Rate**: Maintain 60fps (50fps minimum)
-   **Change Detection**: <5ms per cycle
-   **Memory**: No leaks over 24-hour period
-   **Zone.js Overhead**: <10% CPU usage
