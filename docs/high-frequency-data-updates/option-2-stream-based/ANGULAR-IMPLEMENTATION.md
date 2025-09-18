# Option 2: Stream-Based API - Angular Implementation

## Overview

This document provides Angular-specific implementation details for Option 2 (Stream-Based API) of the high-frequency data updates feature in AG Charts. For the overall design document, see [DESIGN_DOC.md](../DESIGN_DOC.md). For the Option 2 architecture details, see [OPTION-2-STREAM-BASED.md](./OPTION-2-STREAM-BASED.md).

Angular's native RxJS integration makes it the ideal framework for implementing stream-based architectures. This implementation leverages Angular's reactive programming strengths to provide seamless, high-performance streaming data visualization.

## Current State Analysis

### Existing Angular Wrapper

-   **Location**: `packages/ag-charts-angular/projects/ag-charts-angular/src/lib/ag-charts-base.ts`
-   **Current Limitations**:
    -   No native stream support
    -   Manual data subscription management
    -   Limited reactive patterns
    -   No RxJS integration for data flow

### Performance Profile

-   **Data Processing**: 393ms out of 580ms total (68% bottleneck)
-   **Rendering**: 3-4ms (5% of total time)
-   **Zone.js Impact**: Significant in high-frequency scenarios
-   **Change Detection**: Requires OnPush optimization

## RxJS-Centric Architecture

### Core Stream Service

```typescript
import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, fromEvent, interval, merge, timer } from 'rxjs';
import {
    bufferCount,
    bufferTime,
    catchError,
    distinctUntilChanged,
    filter,
    map,
    retry,
    retryWhen,
    scan,
    share,
    startWith,
    switchMap,
    takeUntil,
    throttleTime,
    withLatestFrom,
} from 'rxjs/operators';

import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

export interface StreamConfig {
    bufferTimeMs?: number;
    bufferCount?: number;
    throttleMs?: number;
    maxRetries?: number;
    backpressureThreshold?: number;
    enableMetrics?: boolean;
}

export interface StreamMetrics {
    itemsPerSecond: number;
    bufferUtilization: number;
    droppedItems: number;
    latencyMs: number;
    memoryUsageMB: number;
    errors: number;
}

@Injectable({
    providedIn: 'root',
})
export class ChartStreamService {
    private ngZone = inject(NgZone);
    private activeStreams = new Map<string, StreamConnection>();
    private globalMetrics$ = new BehaviorSubject<StreamMetrics>({
        itemsPerSecond: 0,
        bufferUtilization: 0,
        droppedItems: 0,
        latencyMs: 0,
        memoryUsageMB: 0,
        errors: 0,
    });

    /**
     * Create a data stream with RxJS operators for data processing optimization
     */
    createDataStream<T>(streamId: string, source: Observable<T>, config: StreamConfig = {}): Observable<T[]> {
        const {
            bufferTimeMs = 16, // ~60fps
            bufferCount = 100,
            throttleMs = 0,
            maxRetries = 3,
            backpressureThreshold = 1000,
            enableMetrics = false,
        } = config;

        const destroy$ = new Subject<void>();
        const startTime = Date.now();
        let processedCount = 0;
        let droppedCount = 0;

        // Create buffered stream with backpressure handling
        const bufferedStream$ = source.pipe(
            // Apply throttling if configured
            throttleMs > 0 ? throttleTime(throttleMs) : (stream) => stream,

            // Buffer data for batch processing (key optimization for data processing bottleneck)
            bufferTime(bufferTimeMs, null, bufferCount),

            // Filter empty buffers
            filter((buffer) => buffer.length > 0),

            // Apply backpressure by dropping old data when buffer is too large
            map((buffer) => {
                if (buffer.length > backpressureThreshold) {
                    const excess = buffer.length - backpressureThreshold;
                    droppedCount += excess;
                    return buffer.slice(-backpressureThreshold); // Keep newest items
                }
                return buffer;
            }),

            // Error handling with retry logic
            retryWhen((errors) =>
                errors.pipe(
                    scan((retryCount, error) => {
                        if (retryCount >= maxRetries) {
                            throw error;
                        }
                        return retryCount + 1;
                    }, 0),
                    switchMap((retryCount) => timer(Math.pow(2, retryCount) * 1000))
                )
            ),

            // Track metrics if enabled
            enableMetrics
                ? map((buffer) => {
                      processedCount += buffer.length;
                      const elapsedSeconds = (Date.now() - startTime) / 1000;
                      const itemsPerSecond = processedCount / elapsedSeconds;

                      this.updateMetrics({
                          itemsPerSecond,
                          bufferUtilization: buffer.length / backpressureThreshold,
                          droppedItems: droppedCount,
                          latencyMs: Date.now() - startTime,
                          memoryUsageMB: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
                          errors: 0,
                      });

                      return buffer;
                  })
                : (stream) => stream,

            // Share stream to prevent multiple subscriptions
            share(),

            // Cleanup on destroy
            takeUntil(destroy$)
        );

        // Store connection for cleanup
        this.activeStreams.set(streamId, {
            stream$: bufferedStream$,
            destroy$,
            config,
            metrics: { processedCount, droppedCount },
        });

        return bufferedStream$;
    }

    /**
     * Create WebSocket stream with Angular HTTP integration
     */
    createWebSocketStream<T>(url: string, config: StreamConfig = {}): Observable<T> {
        return new Observable<T>((observer) => {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('WebSocket connected:', url);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    observer.next(data);
                } catch (error) {
                    observer.error(new Error(`Failed to parse WebSocket message: ${error}`));
                }
            };

            ws.onerror = (error) => {
                observer.error(new Error(`WebSocket error: ${error}`));
            };

            ws.onclose = () => {
                observer.complete();
            };

            // Cleanup function
            return () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
        }).pipe(retry(config.maxRetries || 3), share());
    }

    /**
     * Create Server-Sent Events stream using Angular HttpClient
     */
    createSSEStream<T>(url: string, config: StreamConfig = {}): Observable<T> {
        return new Observable<T>((observer) => {
            const eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    observer.next(data);
                } catch (error) {
                    observer.error(new Error(`Failed to parse SSE message: ${error}`));
                }
            };

            eventSource.onerror = (error) => {
                observer.error(error);
            };

            // Cleanup function
            return () => {
                eventSource.close();
            };
        }).pipe(retry(config.maxRetries || 3), share());
    }

    /**
     * Merge multiple streams with synchronization
     */
    mergeStreams<T>(
        streams: Record<string, Observable<T>>,
        syncMode: 'timestamp' | 'sequence' | 'none' = 'none'
    ): Observable<{ streamId: string; data: T; timestamp: number }[]> {
        const streamEntries = Object.entries(streams);

        if (syncMode === 'none') {
            return merge(
                ...streamEntries.map(([id, stream]) =>
                    stream.pipe(
                        map((data) => ({
                            streamId: id,
                            data,
                            timestamp: Date.now(),
                        }))
                    )
                )
            ).pipe(
                bufferTime(16), // Collect items in animation frames
                filter((items) => items.length > 0)
            );
        }

        // Synchronized streams using combineLatest
        return combineLatest(
            streamEntries.map(([id, stream]) =>
                stream.pipe(
                    map((data) => ({
                        streamId: id,
                        data,
                        timestamp: Date.now(),
                    })),
                    startWith(null)
                )
            )
        ).pipe(
            filter((items) => items.every((item) => item !== null)),
            map((items) => items as { streamId: string; data: T; timestamp: number }[]),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
        );
    }

    /**
     * Get global metrics observable
     */
    getMetrics(): Observable<StreamMetrics> {
        return this.globalMetrics$.asObservable();
    }

    /**
     * Cleanup specific stream
     */
    destroyStream(streamId: string): void {
        const connection = this.activeStreams.get(streamId);
        if (connection) {
            connection.destroy$.next();
            connection.destroy$.complete();
            this.activeStreams.delete(streamId);
        }
    }

    /**
     * Cleanup all streams
     */
    destroyAllStreams(): void {
        this.activeStreams.forEach((connection, streamId) => {
            this.destroyStream(streamId);
        });
    }

    private updateMetrics(metrics: StreamMetrics): void {
        this.globalMetrics$.next(metrics);
    }
}

interface StreamConnection {
    stream$: Observable<any>;
    destroy$: Subject<void>;
    config: StreamConfig;
    metrics: {
        processedCount: number;
        droppedCount: number;
    };
}
```

### Streaming Chart Component

```typescript
import { AsyncPipe, CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    NgZone,
    OnDestroy,
    Output,
    ViewChild,
    inject,
    signal,
} from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, fromEvent } from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    map,
    shareReplay,
    startWith,
    takeUntil,
    tap,
    withLatestFrom,
} from 'rxjs/operators';

import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { ChartStreamService, StreamConfig, StreamMetrics } from './chart-stream.service';

@Component({
    selector: 'ag-charts-streaming',
    standalone: true,
    imports: [CommonModule, AsyncPipe],
    template: `
        <div #container class="ag-charts-streaming-container" [style.width]="width" [style.height]="height"></div>

        <div *ngIf="showMetrics" class="ag-charts-metrics">
            <div class="metrics-item">
                <label>Updates/sec:</label>
                <span>{{ (metrics$ | async)?.itemsPerSecond | number: '1.0-1' }}</span>
            </div>
            <div class="metrics-item">
                <label>Buffer:</label>
                <span>{{ ((metrics$ | async)?.bufferUtilization || 0) * 100 | number: '1.0-1' }}%</span>
            </div>
            <div class="metrics-item">
                <label>Latency:</label>
                <span>{{ (metrics$ | async)?.latencyMs | number: '1.0-0' }}ms</span>
            </div>
            <div class="metrics-item">
                <label>Memory:</label>
                <span>{{ (metrics$ | async)?.memoryUsageMB | number: '1.0-1' }}MB</span>
            </div>
        </div>
    `,
    styles: [
        `
            .ag-charts-streaming-container {
                width: 100%;
                height: 400px;
            }

            .ag-charts-metrics {
                display: flex;
                gap: 1rem;
                padding: 0.5rem;
                background: #f5f5f5;
                border-radius: 4px;
                margin-top: 0.5rem;
                font-family: monospace;
                font-size: 0.875rem;
            }

            .metrics-item {
                display: flex;
                gap: 0.25rem;
            }

            .metrics-item label {
                font-weight: bold;
                color: #666;
            }

            .metrics-item span {
                color: #333;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgChartsStreamingComponent implements AfterViewInit, OnDestroy {
    @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

    @Input() options!: AgChartOptions;
    @Input() width = '100%';
    @Input() height = '400px';
    @Input() showMetrics = false;
    @Input() streamConfig: StreamConfig = {};

    // Stream inputs using signals for better change detection
    dataStream = signal<Observable<any> | null>(null);
    multipleStreams = signal<Record<string, Observable<any>> | null>(null);

    // Outputs for reactive events
    chartReady$ = new BehaviorSubject<AgChartInstance | null>(null);
    streamData$ = new BehaviorSubject<any[]>([]);

    private ngZone = inject(NgZone);
    private cdr = inject(ChangeDetectorRef);
    private streamService = inject(ChartStreamService);

    private chart?: AgChartInstance;
    private destroy$ = new Subject<void>();

    // Observables for template
    metrics$: Observable<StreamMetrics>;
    chartInstance$: Observable<AgChartInstance | null>;

    constructor() {
        this.metrics$ = this.streamService.getMetrics();
        this.chartInstance$ = this.chartReady$.asObservable();
    }

    ngAfterViewInit(): void {
        this.initializeChart();
        this.setupStreamSubscriptions();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.streamService.destroyAllStreams();

        if (this.chart) {
            this.ngZone.runOutsideAngular(() => {
                this.chart?.destroy();
            });
        }
    }

    /**
     * Connect a single data stream
     */
    connectDataStream(stream: Observable<any>, seriesId?: string): void {
        this.dataStream.set(stream);
    }

    /**
     * Connect multiple streams for different series
     */
    connectMultipleStreams(streams: Record<string, Observable<any>>): void {
        this.multipleStreams.set(streams);
    }

    /**
     * Manual data update method for compatibility
     */
    updateData(data: any[]): void {
        this.streamData$.next(data);
    }

    private initializeChart(): void {
        this.ngZone.runOutsideAngular(() => {
            this.chart = AgCharts.create({
                ...this.options,
                container: this.container.nativeElement,
                animation: { enabled: false }, // Disable for streaming performance
            });

            // Emit chart ready inside zone for Angular binding
            this.ngZone.run(() => {
                this.chartReady$.next(this.chart!);
            });
        });
    }

    private setupStreamSubscriptions(): void {
        // Single stream subscription
        combineLatest([this.dataStream.asObservable(), this.chartReady$.asObservable()])
            .pipe(
                filter(([stream, chart]) => stream !== null && chart !== null),
                switchMap(([stream, chart]) => {
                    const processedStream = this.streamService.createDataStream(
                        'primary-stream',
                        stream!,
                        this.streamConfig
                    );

                    return processedStream.pipe(
                        tap((dataBuffer) => {
                            this.ngZone.runOutsideAngular(() => {
                                // Batch update for data processing optimization
                                chart!.updateDataOnly(dataBuffer, { mode: 'append' });
                            });
                        })
                    );
                }),
                takeUntil(this.destroy$)
            )
            .subscribe({
                error: (error) => {
                    console.error('Single stream error:', error);
                },
            });

        // Multiple streams subscription
        combineLatest([this.multipleStreams.asObservable(), this.chartReady$.asObservable()])
            .pipe(
                filter(([streams, chart]) => streams !== null && chart !== null),
                switchMap(([streams, chart]) => {
                    const mergedStream = this.streamService.mergeStreams(streams!, 'timestamp');

                    return mergedStream.pipe(
                        tap((streamDataArray) => {
                            this.ngZone.runOutsideAngular(() => {
                                // Process each stream's data
                                streamDataArray.forEach(({ streamId, data }) => {
                                    const seriesId = this.getSeriesIdFromStreamId(streamId);
                                    chart!.updateSeriesData(seriesId, [data], { mode: 'append' });
                                });
                            });
                        })
                    );
                }),
                takeUntil(this.destroy$)
            )
            .subscribe({
                error: (error) => {
                    console.error('Multiple streams error:', error);
                },
            });

        // Manual data updates
        combineLatest([this.streamData$.asObservable(), this.chartReady$.asObservable()])
            .pipe(
                filter(([data, chart]) => data.length > 0 && chart !== null),
                tap(([data, chart]) => {
                    this.ngZone.runOutsideAngular(() => {
                        chart!.updateDataOnly(data, { mode: 'replace' });
                    });
                }),
                takeUntil(this.destroy$)
            )
            .subscribe();

        // Performance monitoring
        if (this.showMetrics) {
            this.metrics$
                .pipe(
                    distinctUntilChanged(),
                    tap(() => {
                        // Trigger change detection for metrics display
                        this.cdr.markForCheck();
                    }),
                    takeUntil(this.destroy$)
                )
                .subscribe();
        }
    }

    private getSeriesIdFromStreamId(streamId: string): string {
        // Map stream IDs to series IDs based on your application logic
        const streamToSeriesMap: Record<string, string> = {
            'price-stream': 'price-series',
            'volume-stream': 'volume-series',
            'indicator-stream': 'indicator-series',
        };

        return streamToSeriesMap[streamId] || streamId;
    }

    // Public API for imperative usage
    pauseStreams(): void {
        // Implementation would pause all active streams
        console.log('Pausing all streams');
    }

    resumeStreams(): void {
        // Implementation would resume all paused streams
        console.log('Resuming all streams');
    }

    getStreamMetrics(): Observable<StreamMetrics> {
        return this.metrics$;
    }
}
```

### Custom RxJS Operators

```typescript
import { Observable, OperatorFunction, merge } from 'rxjs';
import { bufferTime, concatMap, filter, map, scan, throttleTime } from 'rxjs/operators';

/**
 * Custom operator for data processing optimization
 */
export function optimizeDataProcessing<T>(bufferMs = 16, maxBufferSize = 1000): OperatorFunction<T, T[]> {
    return (source: Observable<T>) =>
        source.pipe(
            bufferTime(bufferMs),
            filter((buffer) => buffer.length > 0),
            map((buffer) => {
                // Apply data processing optimization here
                // Focus on the 68% bottleneck in data processing
                if (buffer.length > maxBufferSize) {
                    // Drop oldest items if buffer is too large
                    return buffer.slice(-maxBufferSize);
                }
                return buffer;
            })
        );
}

/**
 * Adaptive buffering based on processing performance
 */
export function adaptiveBuffer<T>(): OperatorFunction<T, T[]> {
    let processingTime = 16; // Start with 16ms (60fps)
    let bufferSize = 100;

    return (source: Observable<T>) =>
        source.pipe(
            bufferTime(processingTime, null, bufferSize),
            filter((buffer) => buffer.length > 0),
            map((buffer) => {
                const startTime = performance.now();

                // Process buffer here (placeholder for actual processing)
                const processedBuffer = buffer;

                const endTime = performance.now();
                const actualProcessingTime = endTime - startTime;

                // Adapt buffer parameters based on performance
                if (actualProcessingTime > 16) {
                    // Processing is too slow, increase buffer time
                    processingTime = Math.min(processingTime * 1.1, 100);
                    bufferSize = Math.max(bufferSize * 0.9, 10);
                } else if (actualProcessingTime < 8) {
                    // Processing is fast, decrease buffer time
                    processingTime = Math.max(processingTime * 0.9, 16);
                    bufferSize = Math.min(bufferSize * 1.1, 1000);
                }

                return processedBuffer;
            })
        );
}

/**
 * Backpressure handling operator
 */
export function handleBackpressure<T>(
    maxQueueSize = 1000,
    dropStrategy: 'oldest' | 'newest' = 'oldest'
): OperatorFunction<T, T> {
    let queue: T[] = [];

    return (source: Observable<T>) =>
        new Observable<T>((observer) => {
            const subscription = source.subscribe({
                next: (value) => {
                    if (queue.length >= maxQueueSize) {
                        if (dropStrategy === 'oldest') {
                            queue.shift(); // Remove oldest
                        } else {
                            queue.pop(); // Remove newest
                        }
                    }

                    queue.push(value);

                    // Process queue
                    while (queue.length > 0) {
                        const item = queue.shift()!;
                        observer.next(item);
                    }
                },
                error: (error) => observer.error(error),
                complete: () => observer.complete(),
            });

            return () => subscription.unsubscribe();
        });
}

/**
 * Stream synchronization operator
 */
export function synchronizeStreams<T extends { timestamp: number }>(toleranceMs = 100): OperatorFunction<T[], T[]> {
    return (source: Observable<T[]>) =>
        source.pipe(
            scan((acc: T[], current: T[]) => {
                // Combine with previous items within tolerance
                const now = Date.now();
                const validItems = acc.filter((item) => now - item.timestamp <= toleranceMs);
                return [...validItems, ...current];
            }, []),
            filter((items) => items.length > 0)
        );
}

/**
 * Memory-efficient transformation operator
 */
export function efficientTransform<T, U>(transformer: (item: T) => U, batchSize = 100): OperatorFunction<T[], U[]> {
    return (source: Observable<T[]>) =>
        source.pipe(
            concatMap((items) => {
                // Process in smaller batches to avoid memory spikes
                const batches: U[][] = [];
                for (let i = 0; i < items.length; i += batchSize) {
                    const batch = items.slice(i, i + batchSize);
                    const transformedBatch = batch.map(transformer);
                    batches.push(transformedBatch);
                }
                return merge(...batches.map((batch) => [batch]));
            }),
            map((batches) => batches.flat())
        );
}
```

## WebSocket/SSE Integration Patterns

### WebSocket Service with Angular DI

```typescript
import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { filter, map, retry, share, takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class WebSocketService {
    private ngZone = inject(NgZone);
    private connections = new Map<string, WebSocketConnection>();

    /**
     * Create WebSocket connection with Angular zone management
     */
    connect<T>(url: string, options: WebSocketOptions = {}): Observable<T> {
        const connectionId = `${url}-${Date.now()}`;

        if (this.connections.has(connectionId)) {
            return this.connections.get(connectionId)!.data$;
        }

        const destroy$ = new Subject<void>();

        const websocket$ = new Observable<T>((observer) => {
            let ws: WebSocket;

            this.ngZone.runOutsideAngular(() => {
                ws = new WebSocket(url);

                ws.onopen = (event) => {
                    console.log('WebSocket connected:', url);
                    if (options.onOpen) {
                        this.ngZone.run(() => options.onOpen!(event));
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data) as T;
                        observer.next(data);
                    } catch (error) {
                        observer.error(new Error(`Failed to parse message: ${error}`));
                    }
                };

                ws.onerror = (error) => {
                    observer.error(error);
                    if (options.onError) {
                        this.ngZone.run(() => options.onError!(error));
                    }
                };

                ws.onclose = (event) => {
                    observer.complete();
                    if (options.onClose) {
                        this.ngZone.run(() => options.onClose!(event));
                    }
                };
            });

            return () => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
        }).pipe(retry(options.retryAttempts || 3), takeUntil(destroy$), share());

        const connection: WebSocketConnection = {
            data$: websocket$,
            destroy$,
            url,
            options,
        };

        this.connections.set(connectionId, connection);
        return websocket$;
    }

    /**
     * Send message through WebSocket
     */
    send(connectionId: string, message: any): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            // Implementation would send message through the WebSocket
            console.log('Sending message:', message);
        }
    }

    /**
     * Close specific connection
     */
    disconnect(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.destroy$.next();
            connection.destroy$.complete();
            this.connections.delete(connectionId);
        }
    }

    /**
     * Close all connections
     */
    disconnectAll(): void {
        this.connections.forEach((connection, id) => {
            this.disconnect(id);
        });
    }
}

interface WebSocketConnection {
    data$: Observable<any>;
    destroy$: Subject<void>;
    url: string;
    options: WebSocketOptions;
}

interface WebSocketOptions {
    retryAttempts?: number;
    onOpen?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
}
```

### Server-Sent Events Service

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { retry, share, takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ServerSentEventsService {
    private ngZone = inject(NgZone);
    private http = inject(HttpClient);
    private connections = new Map<string, SSEConnection>();

    /**
     * Create Server-Sent Events connection
     */
    connect<T>(url: string, options: SSEOptions = {}): Observable<T> {
        const connectionId = `${url}-${Date.now()}`;

        if (this.connections.has(connectionId)) {
            return this.connections.get(connectionId)!.data$;
        }

        const destroy$ = new Subject<void>();

        const sse$ = new Observable<T>((observer) => {
            let eventSource: EventSource;

            this.ngZone.runOutsideAngular(() => {
                eventSource = new EventSource(url);

                eventSource.onopen = (event) => {
                    console.log('SSE connected:', url);
                    if (options.onOpen) {
                        this.ngZone.run(() => options.onOpen!(event));
                    }
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data) as T;
                        observer.next(data);
                    } catch (error) {
                        observer.error(new Error(`Failed to parse SSE data: ${error}`));
                    }
                };

                eventSource.onerror = (error) => {
                    observer.error(error);
                    if (options.onError) {
                        this.ngZone.run(() => options.onError!(error));
                    }
                };

                // Handle custom event types
                if (options.eventType) {
                    eventSource.addEventListener(options.eventType, (event) => {
                        try {
                            const data = JSON.parse((event as MessageEvent).data) as T;
                            observer.next(data);
                        } catch (error) {
                            observer.error(new Error(`Failed to parse custom event data: ${error}`));
                        }
                    });
                }
            });

            return () => {
                if (eventSource) {
                    eventSource.close();
                }
            };
        }).pipe(retry(options.retryAttempts || 3), takeUntil(destroy$), share());

        const connection: SSEConnection = {
            data$: sse$,
            destroy$,
            url,
            options,
        };

        this.connections.set(connectionId, connection);
        return sse$;
    }

    /**
     * Close specific connection
     */
    disconnect(connectionId: string): void {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.destroy$.next();
            connection.destroy$.complete();
            this.connections.delete(connectionId);
        }
    }

    /**
     * Close all connections
     */
    disconnectAll(): void {
        this.connections.forEach((connection, id) => {
            this.disconnect(id);
        });
    }
}

interface SSEConnection {
    data$: Observable<any>;
    destroy$: Subject<void>;
    url: string;
    options: SSEOptions;
}

interface SSEOptions {
    eventType?: string;
    retryAttempts?: number;
    onOpen?: (event: Event) => void;
    onError?: (event: Event) => void;
}
```

## Performance Strategies

### OnPush with markForCheck

```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
    selector: 'performance-optimized-chart',
    template: `
        <ag-charts-streaming [options]="chartOptions" [streamConfig]="streamConfig" (chartReady)="onChartReady($event)">
        </ag-charts-streaming>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceOptimizedChartComponent implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private ngZone = inject(NgZone);
    private destroy$ = new Subject<void>();

    chartOptions = {
        series: [
            {
                type: 'line',
                xKey: 'timestamp',
                yKey: 'value',
            },
        ],
    };

    streamConfig = {
        bufferTimeMs: 16, // 60fps
        bufferCount: 100,
        enableMetrics: true,
    };

    ngOnInit(): void {
        // Setup high-frequency data stream
        this.setupDataStream();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onChartReady(chart: AgChartInstance): void {
        console.log('Chart ready for streaming');
    }

    private setupDataStream(): void {
        // Simulate high-frequency data
        const dataStream$ = new Observable((observer) => {
            const interval = setInterval(() => {
                observer.next({
                    timestamp: Date.now(),
                    value: Math.random() * 100,
                });
            }, 10); // 100 updates/second

            return () => clearInterval(interval);
        });

        // Process outside Angular zone for performance
        this.ngZone.runOutsideAngular(() => {
            dataStream$
                .pipe(
                    // Manual change detection control
                    tap(() => {
                        // Only trigger change detection when necessary
                        if (this.shouldUpdateView()) {
                            this.ngZone.run(() => {
                                this.cdr.markForCheck();
                            });
                        }
                    }),
                    takeUntil(this.destroy$)
                )
                .subscribe();
        });
    }

    private shouldUpdateView(): boolean {
        // Implement logic to determine when to update the view
        // For example, only update every 10th frame
        return Math.random() < 0.1;
    }
}
```

### TrackBy Functions for Virtual Scrolling

```typescript
import { Component, TrackByFunction } from '@angular/core';

@Component({
    selector: 'virtual-scrolling-chart-data',
    template: `
        <cdk-virtual-scroll-viewport itemSize="50" class="data-viewport">
            <div *cdkVirtualFor="let item of streamData$ | async; trackBy: trackByTimestamp" class="data-item">
                {{ item.timestamp | date: 'HH:mm:ss.SSS' }} - {{ item.value | number: '1.2-2' }}
            </div>
        </cdk-virtual-scroll-viewport>
    `,
    styles: [
        `
            .data-viewport {
                height: 200px;
            }
            .data-item {
                height: 50px;
                display: flex;
                align-items: center;
                padding: 0 16px;
                border-bottom: 1px solid #eee;
            }
        `,
    ],
})
export class VirtualScrollingChartDataComponent {
    streamData$ = new Observable<Array<{ timestamp: number; value: number }>>();

    // Efficient trackBy function for virtual scrolling
    trackByTimestamp: TrackByFunction<{ timestamp: number; value: number }> = (index, item) => {
        return item.timestamp; // Use timestamp as unique identifier
    };

    // Alternative trackBy for different scenarios
    trackByIndex: TrackByFunction<any> = (index) => index;
}
```

### Zone.js Bypass for High-Performance Operations

```typescript
import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject, animationFrameScheduler } from 'rxjs';
import { observeOn, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class HighPerformanceStreamService {
    private ngZone = inject(NgZone);

    /**
     * Process high-frequency updates outside Angular zone
     */
    createHighPerformanceStream<T>(source: Observable<T>): Observable<T> {
        const processedStream$ = new Subject<T>();

        // Process everything outside zone
        this.ngZone.runOutsideAngular(() => {
            source
                .pipe(
                    // Use animationFrame scheduler for smooth updates
                    observeOn(animationFrameScheduler),
                    tap((data) => {
                        // Heavy processing here won't trigger change detection
                        this.processDataOptimized(data);
                        processedStream$.next(data);
                    })
                )
                .subscribe();
        });

        return processedStream$.asObservable();
    }

    /**
     * Optimized data processing focused on the 68% bottleneck
     */
    private processDataOptimized<T>(data: T): void {
        // Implement efficient data processing algorithms
        // This is where the 393ms of 580ms total is spent

        // Example optimizations:
        // 1. Batch operations
        // 2. Minimize object creation
        // 3. Use typed arrays where possible
        // 4. Implement efficient data structures

        // Placeholder for actual processing
        if (Array.isArray(data)) {
            // Process arrays efficiently
            const processed = data.map((item) => this.transformItem(item));
            return processed as T;
        }

        return data;
    }

    private transformItem(item: any): any {
        // Efficient item transformation
        return {
            ...item,
            processed: true,
            timestamp: Date.now(),
        };
    }

    /**
     * Batch updates to minimize zone entries
     */
    createBatchedUpdates<T>(source: Observable<T>, batchSize = 100): Observable<T[]> {
        const batches$ = new Subject<T[]>();
        let batch: T[] = [];

        this.ngZone.runOutsideAngular(() => {
            source.subscribe((item) => {
                batch.push(item);

                if (batch.length >= batchSize) {
                    const currentBatch = [...batch];
                    batch = [];

                    // Only enter zone when batch is complete
                    this.ngZone.run(() => {
                        batches$.next(currentBatch);
                    });
                }
            });
        });

        return batches$.asObservable();
    }
}
```

## Testing with Jasmine/Karma

### Unit Testing Stream Components

```typescript
import { NgZone } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { AgChartsStreamingComponent } from './ag-charts-streaming.component';
import { ChartStreamService } from './chart-stream.service';

describe('AgChartsStreamingComponent', () => {
    let component: AgChartsStreamingComponent;
    let fixture: ComponentFixture<AgChartsStreamingComponent>;
    let streamService: jasmine.SpyObj<ChartStreamService>;
    let ngZone: NgZone;

    beforeEach(async () => {
        const streamServiceSpy = jasmine.createSpyObj('ChartStreamService', [
            'createDataStream',
            'createWebSocketStream',
            'mergeStreams',
            'getMetrics',
            'destroyStream',
            'destroyAllStreams',
        ]);

        await TestBed.configureTestingModule({
            declarations: [AgChartsStreamingComponent],
            providers: [{ provide: ChartStreamService, useValue: streamServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(AgChartsStreamingComponent);
        component = fixture.componentInstance;
        streamService = TestBed.inject(ChartStreamService) as jasmine.SpyObj<ChartStreamService>;
        ngZone = TestBed.inject(NgZone);

        // Setup default spy returns
        streamService.getMetrics.and.returnValue(
            of({
                itemsPerSecond: 100,
                bufferUtilization: 0.5,
                droppedItems: 0,
                latencyMs: 15,
                memoryUsageMB: 25,
                errors: 0,
            })
        );
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize chart outside Angular zone', fakeAsync(() => {
        const zoneSpy = spyOn(ngZone, 'runOutsideAngular').and.callThrough();

        component.options = {
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        };

        fixture.detectChanges();
        tick();

        expect(zoneSpy).toHaveBeenCalled();
    }));

    it('should handle single data stream', fakeAsync(() => {
        const testData = [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
        ];
        const dataStream$ = of(testData).pipe(delay(10));

        streamService.createDataStream.and.returnValue(of([testData]));

        component.connectDataStream(dataStream$);
        tick(100);

        expect(streamService.createDataStream).toHaveBeenCalledWith(
            'primary-stream',
            dataStream$,
            component.streamConfig
        );
    }));

    it('should handle multiple streams', fakeAsync(() => {
        const streams = {
            stream1: of({ timestamp: 1, value: 10 }),
            stream2: of({ timestamp: 1, value: 20 }),
        };

        const mergedData = [
            { streamId: 'stream1', data: { timestamp: 1, value: 10 }, timestamp: 1 },
            { streamId: 'stream2', data: { timestamp: 1, value: 20 }, timestamp: 1 },
        ];

        streamService.mergeStreams.and.returnValue(of(mergedData));

        component.connectMultipleStreams(streams);
        tick(100);

        expect(streamService.mergeStreams).toHaveBeenCalledWith(streams, 'timestamp');
    }));

    it('should display metrics when enabled', fakeAsync(() => {
        component.showMetrics = true;
        component.options = {
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        };

        fixture.detectChanges();
        tick();

        const metricsElement = fixture.nativeElement.querySelector('.ag-charts-metrics');
        expect(metricsElement).toBeTruthy();
    }));

    it('should cleanup streams on destroy', () => {
        component.ngOnDestroy();

        expect(streamService.destroyAllStreams).toHaveBeenCalled();
    });

    it('should handle stream errors gracefully', fakeAsync(() => {
        const errorStream$ = new Subject();
        const consoleSpy = spyOn(console, 'error');

        streamService.createDataStream.and.returnValue(errorStream$);

        component.connectDataStream(of([]));
        errorStream$.error(new Error('Test error'));
        tick();

        expect(consoleSpy).toHaveBeenCalledWith('Single stream error:', jasmine.any(Error));
    }));

    it('should process high-frequency updates efficiently', fakeAsync(() => {
        const highFrequencyData = Array.from({ length: 1000 }, (_, i) => ({
            timestamp: i,
            value: Math.random(),
        }));

        const dataStream$ = of(highFrequencyData);
        streamService.createDataStream.and.returnValue(of([highFrequencyData]));

        const startTime = performance.now();
        component.connectDataStream(dataStream$);
        tick(100);
        const endTime = performance.now();

        const processingTime = endTime - startTime;
        expect(processingTime).toBeLessThan(100); // Should process within 100ms
    }));
});
```

### Service Testing

```typescript
import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';

import { ChartStreamService } from './chart-stream.service';

describe('ChartStreamService', () => {
    let service: ChartStreamService;
    let ngZone: NgZone;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ChartStreamService);
        ngZone = TestBed.inject(NgZone);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create buffered data stream', (done) => {
        const source$ = new Subject<number>();
        const stream$ = service.createDataStream('test-stream', source$, {
            bufferTimeMs: 50,
            bufferCount: 3,
        });

        stream$.pipe(take(1)).subscribe((buffer) => {
            expect(buffer).toEqual([1, 2, 3]);
            done();
        });

        source$.next(1);
        source$.next(2);
        source$.next(3);
    });

    it('should handle backpressure by dropping old data', (done) => {
        const source$ = new Subject<number>();
        const stream$ = service.createDataStream('test-stream', source$, {
            bufferTimeMs: 10,
            backpressureThreshold: 2,
        });

        stream$.pipe(take(1)).subscribe((buffer) => {
            expect(buffer.length).toBeLessThanOrEqual(2);
            done();
        });

        // Send more data than threshold
        for (let i = 0; i < 5; i++) {
            source$.next(i);
        }
    });

    it('should retry on errors', (done) => {
        let attemptCount = 0;
        const source$ = new Subject<number>();
        const errorStream$ = source$.pipe(
            map(() => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Test error');
                }
                return attemptCount;
            })
        );

        const stream$ = service.createDataStream('test-stream', errorStream$, {
            maxRetries: 3,
        });

        stream$.pipe(take(1)).subscribe((buffer) => {
            expect(attemptCount).toBe(3);
            expect(buffer).toEqual([3]);
            done();
        });

        source$.next(1);
    });

    it('should merge multiple streams with timestamp sync', (done) => {
        const stream1$ = of({ timestamp: 100, value: 1 });
        const stream2$ = of({ timestamp: 101, value: 2 });

        const mergedStream$ = service.mergeStreams(
            {
                stream1: stream1$,
                stream2: stream2$,
            },
            'timestamp'
        );

        mergedStream$.pipe(take(1)).subscribe((items) => {
            expect(items).toHaveLength(2);
            expect(items[0].streamId).toBe('stream1');
            expect(items[1].streamId).toBe('stream2');
            done();
        });
    });

    it('should provide metrics', (done) => {
        const metrics$ = service.getMetrics();

        metrics$.pipe(take(1)).subscribe((metrics) => {
            expect(metrics).toEqual(
                jasmine.objectContaining({
                    itemsPerSecond: jasmine.any(Number),
                    bufferUtilization: jasmine.any(Number),
                    droppedItems: jasmine.any(Number),
                    latencyMs: jasmine.any(Number),
                    memoryUsageMB: jasmine.any(Number),
                    errors: jasmine.any(Number),
                })
            );
            done();
        });
    });

    it('should cleanup streams properly', () => {
        const source$ = new Subject<number>();
        const stream$ = service.createDataStream('test-stream', source$);

        const subscription = stream$.subscribe();

        service.destroyStream('test-stream');

        expect(subscription.closed).toBeTruthy();
    });
});
```

### Integration Testing

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, interval } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AgChartsStreamingComponent } from './ag-charts-streaming.component';
import { ChartStreamService } from './chart-stream.service';

@Component({
    template: `
        <ag-charts-streaming
            [options]="chartOptions"
            [streamConfig]="streamConfig"
            [showMetrics]="true"
            (chartReady)="onChartReady($event)"
        >
        </ag-charts-streaming>
    `,
})
class TestHostComponent {
    chartOptions = {
        series: [
            {
                type: 'line',
                xKey: 'timestamp',
                yKey: 'price',
            },
        ],
    };

    streamConfig = {
        bufferTimeMs: 100,
        enableMetrics: true,
    };

    chartInstance?: any;

    onChartReady(chart: any): void {
        this.chartInstance = chart;
    }
}

describe('Integration: AgChartsStreamingComponent with ChartStreamService', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let streamingComponent: AgChartsStreamingComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TestHostComponent, AgChartsStreamingComponent],
            providers: [ChartStreamService],
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        streamingComponent = fixture.debugElement.children[0].componentInstance;
    });

    it('should integrate streaming with chart updates', (done) => {
        fixture.detectChanges();

        // Wait for chart to be ready
        streamingComponent.chartReady$.subscribe((chart) => {
            if (chart) {
                // Create test data stream
                const testData$ = interval(10).pipe(
                    take(100),
                    map((i) => ({
                        timestamp: Date.now() + i * 10,
                        price: 100 + Math.random() * 10,
                    }))
                );

                // Connect stream
                streamingComponent.connectDataStream(testData$);

                // Verify metrics are being updated
                setTimeout(() => {
                    streamingComponent
                        .getStreamMetrics()
                        .pipe(take(1))
                        .subscribe((metrics) => {
                            expect(metrics.itemsPerSecond).toBeGreaterThan(0);
                            done();
                        });
                }, 1000);
            }
        });
    });

    it('should handle multiple concurrent streams', (done) => {
        fixture.detectChanges();

        streamingComponent.chartReady$.subscribe((chart) => {
            if (chart) {
                const streams = {
                    prices: interval(5).pipe(
                        take(50),
                        map((i) => ({ timestamp: Date.now(), price: 100 + i }))
                    ),
                    volumes: interval(7).pipe(
                        take(50),
                        map((i) => ({ timestamp: Date.now(), volume: 1000 + i * 10 }))
                    ),
                };

                streamingComponent.connectMultipleStreams(streams);

                setTimeout(() => {
                    streamingComponent
                        .getStreamMetrics()
                        .pipe(take(1))
                        .subscribe((metrics) => {
                            expect(metrics.itemsPerSecond).toBeGreaterThan(0);
                            done();
                        });
                }, 1000);
            }
        });
    });
});
```

## Error Handling and Retry Logic

### Comprehensive Error Service

```typescript
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError, timer } from 'rxjs';
import { catchError, retryWhen, scan, switchMap, tap } from 'rxjs/operators';

export interface ErrorRecoveryConfig {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
}

@Injectable({
    providedIn: 'root',
})
export class StreamErrorService {
    private errorCounts = new Map<string, number>();
    private circuitBreakerStates = new Map<string, 'closed' | 'open' | 'half-open'>();
    private circuitBreakerTimers = new Map<string, number>();

    /**
     * Apply error recovery strategy to stream
     */
    withErrorRecovery<T>(streamId: string, source: Observable<T>, config: ErrorRecoveryConfig): Observable<T> {
        return source.pipe(
            retryWhen((errors) =>
                errors.pipe(
                    scan((retryCount, error) => {
                        const currentCount = this.errorCounts.get(streamId) || 0;
                        this.errorCounts.set(streamId, currentCount + 1);

                        if (retryCount >= config.maxRetries) {
                            this.openCircuitBreaker(streamId, config.circuitBreakerTimeout);
                            throw error;
                        }

                        console.warn(`Stream ${streamId} error, retry ${retryCount + 1}/${config.maxRetries}:`, error);
                        return retryCount + 1;
                    }, 0),
                    switchMap((retryCount) => {
                        const delay = config.exponentialBackoff
                            ? config.retryDelay * Math.pow(2, retryCount)
                            : config.retryDelay;

                        return timer(delay);
                    })
                )
            ),
            catchError((error) => {
                console.error(`Stream ${streamId} failed permanently:`, error);
                return this.handleFinalError(streamId, error);
            }),
            tap(() => {
                // Reset error count on successful emission
                this.errorCounts.set(streamId, 0);
                this.closeCircuitBreaker(streamId);
            })
        );
    }

    /**
     * Check if circuit breaker allows execution
     */
    canExecute(streamId: string): boolean {
        const state = this.circuitBreakerStates.get(streamId) || 'closed';

        if (state === 'open') {
            const timer = this.circuitBreakerTimers.get(streamId);
            if (timer && Date.now() > timer) {
                this.circuitBreakerStates.set(streamId, 'half-open');
                return true;
            }
            return false;
        }

        return true;
    }

    /**
     * Get error statistics for a stream
     */
    getErrorStats(streamId: string): {
        errorCount: number;
        circuitBreakerState: string;
        nextRetryTime?: number;
    } {
        return {
            errorCount: this.errorCounts.get(streamId) || 0,
            circuitBreakerState: this.circuitBreakerStates.get(streamId) || 'closed',
            nextRetryTime: this.circuitBreakerTimers.get(streamId),
        };
    }

    private openCircuitBreaker(streamId: string, timeout: number): void {
        this.circuitBreakerStates.set(streamId, 'open');
        this.circuitBreakerTimers.set(streamId, Date.now() + timeout);
        console.warn(`Circuit breaker opened for stream ${streamId}`);
    }

    private closeCircuitBreaker(streamId: string): void {
        this.circuitBreakerStates.set(streamId, 'closed');
        this.circuitBreakerTimers.delete(streamId);
    }

    private handleFinalError<T>(streamId: string, error: any): Observable<T> {
        // Could integrate with error reporting service
        console.error(`Final error for stream ${streamId}:`, error);

        // Return empty observable or error based on application needs
        return throwError(error);
    }
}
```

## Usage Examples

### Financial Trading Dashboard

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { Observable, combineLatest, interval } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ChartStreamService } from './chart-stream.service';
import { WebSocketService } from './websocket.service';

@Component({
    selector: 'trading-dashboard',
    template: `
        <div class="trading-dashboard">
            <ag-charts-streaming
                [options]="ohlcChartOptions"
                [showMetrics]="true"
                [streamConfig]="streamConfig"
                #ohlcChart
            >
            </ag-charts-streaming>

            <ag-charts-streaming
                [options]="volumeChartOptions"
                [showMetrics]="true"
                [streamConfig]="streamConfig"
                #volumeChart
            >
            </ag-charts-streaming>

            <div class="controls">
                <button (click)="pauseStreams()">Pause</button>
                <button (click)="resumeStreams()">Resume</button>
                <button (click)="clearData()">Clear</button>
            </div>
        </div>
    `,
    styles: [
        `
            .trading-dashboard {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                height: 100vh;
                padding: 1rem;
            }
            .controls {
                grid-column: 1 / -1;
                display: flex;
                gap: 0.5rem;
                justify-content: center;
                padding: 1rem;
            }
        `,
    ],
})
export class TradingDashboardComponent implements OnInit {
    private wsService = inject(WebSocketService);
    private streamService = inject(ChartStreamService);

    private symbol = 'AAPL';
    private priceStream$?: Observable<PriceData>;
    private volumeStream$?: Observable<VolumeData>;

    ohlcChartOptions = {
        title: { text: `${this.symbol} Price` },
        series: [
            {
                type: 'candlestick',
                xKey: 'timestamp',
                openKey: 'open',
                highKey: 'high',
                lowKey: 'low',
                closeKey: 'close',
            },
        ],
        axes: [
            { type: 'time', position: 'bottom' },
            { type: 'number', position: 'left' },
        ],
    };

    volumeChartOptions = {
        title: { text: `${this.symbol} Volume` },
        series: [
            {
                type: 'column',
                xKey: 'timestamp',
                yKey: 'volume',
            },
        ],
        axes: [
            { type: 'time', position: 'bottom' },
            { type: 'number', position: 'left' },
        ],
    };

    streamConfig = {
        bufferTimeMs: 25, // Larger batches for data processing efficiency
        bufferCount: 50,
        enableMetrics: true,
        backpressureThreshold: 1000,
    };

    ngOnInit(): void {
        this.setupDataStreams();
    }

    ngOnDestroy(): void {
        this.wsService.disconnectAll();
        this.streamService.destroyAllStreams();
    }

    private setupDataStreams(): void {
        // Create WebSocket streams
        this.priceStream$ = this.wsService.connect<PriceData>(`wss://api.trading.com/stream/prices/${this.symbol}`, {
            retryAttempts: 5,
            onError: (error) => console.error('Price stream error:', error),
        });

        this.volumeStream$ = this.wsService.connect<VolumeData>(`wss://api.trading.com/stream/volume/${this.symbol}`, {
            retryAttempts: 5,
            onError: (error) => console.error('Volume stream error:', error),
        });

        // Process and connect streams
        const processedPriceStream$ = this.streamService.createDataStream(
            'price-stream',
            this.priceStream$,
            this.streamConfig
        );

        const processedVolumeStream$ = this.streamService.createDataStream(
            'volume-stream',
            this.volumeStream$,
            this.streamConfig
        );

        // Connect to charts (would be done through template references)
        // this.ohlcChart.connectDataStream(processedPriceStream$);
        // this.volumeChart.connectDataStream(processedVolumeStream$);
    }

    pauseStreams(): void {
        // Implementation would pause all streams
        console.log('Pausing all streams');
    }

    resumeStreams(): void {
        // Implementation would resume all streams
        console.log('Resuming all streams');
    }

    clearData(): void {
        // Implementation would clear chart data
        console.log('Clearing chart data');
    }
}

interface PriceData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface VolumeData {
    timestamp: number;
    volume: number;
}
```

### IoT Sensor Monitoring

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { Observable, interval, merge } from 'rxjs';
import { map, scan, share } from 'rxjs/operators';

import { ChartStreamService } from './chart-stream.service';
import { ServerSentEventsService } from './sse.service';

@Component({
    selector: 'iot-monitoring',
    template: `
        <div class="iot-dashboard">
            <h2>IoT Sensor Monitoring</h2>

            <ag-charts-streaming
                [options]="temperatureChartOptions"
                [showMetrics]="true"
                [streamConfig]="streamConfig"
                #tempChart
            >
            </ag-charts-streaming>

            <ag-charts-streaming
                [options]="humidityChartOptions"
                [showMetrics]="true"
                [streamConfig]="streamConfig"
                #humidityChart
            >
            </ag-charts-streaming>

            <div class="alerts" *ngIf="alerts$ | async as alerts">
                <div *ngFor="let alert of alerts" [class]="'alert alert-' + alert.severity">
                    {{ alert.message }}
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .iot-dashboard {
                padding: 1rem;
            }
            .alerts {
                margin-top: 1rem;
            }
            .alert {
                padding: 0.5rem;
                margin: 0.25rem 0;
                border-radius: 4px;
            }
            .alert-warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
            }
            .alert-danger {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
            }
        `,
    ],
})
export class IoTMonitoringComponent implements OnInit {
    private sseService = inject(ServerSentEventsService);
    private streamService = inject(ChartStreamService);

    private sensorStream$?: Observable<SensorData>;
    alerts$?: Observable<Alert[]>;

    temperatureChartOptions = {
        title: { text: 'Temperature Sensors' },
        series: [
            {
                type: 'line',
                xKey: 'timestamp',
                yKey: 'temperature',
                stroke: '#ff6b6b',
            },
        ],
        axes: [
            { type: 'time', position: 'bottom' },
            { type: 'number', position: 'left', label: { text: 'Temperature (°C)' } },
        ],
    };

    humidityChartOptions = {
        title: { text: 'Humidity Sensors' },
        series: [
            {
                type: 'line',
                xKey: 'timestamp',
                yKey: 'humidity',
                stroke: '#4ecdc4',
            },
        ],
        axes: [
            { type: 'time', position: 'bottom' },
            { type: 'number', position: 'left', label: { text: 'Humidity (%)' } },
        ],
    };

    streamConfig = {
        bufferTimeMs: 100, // 10fps for IoT data
        bufferCount: 20,
        enableMetrics: true,
        backpressureThreshold: 500,
    };

    ngOnInit(): void {
        this.setupSensorStreams();
        this.setupAlerts();
    }

    ngOnDestroy(): void {
        this.sseService.disconnectAll();
        this.streamService.destroyAllStreams();
    }

    private setupSensorStreams(): void {
        // Create SSE stream for sensor data
        this.sensorStream$ = this.sseService.connect<SensorData>('https://api.iot.com/stream/sensors', {
            eventType: 'sensor-data',
            retryAttempts: 3,
            onError: (error) => console.error('Sensor stream error:', error),
        });

        // Create separate streams for temperature and humidity
        const temperatureStream$ = this.sensorStream$.pipe(
            map((data) => ({
                timestamp: data.timestamp,
                temperature: data.temperature,
            })),
            share()
        );

        const humidityStream$ = this.sensorStream$.pipe(
            map((data) => ({
                timestamp: data.timestamp,
                humidity: data.humidity,
            })),
            share()
        );

        // Process streams
        const processedTempStream$ = this.streamService.createDataStream(
            'temperature-stream',
            temperatureStream$,
            this.streamConfig
        );

        const processedHumidityStream$ = this.streamService.createDataStream(
            'humidity-stream',
            humidityStream$,
            this.streamConfig
        );

        // Connect to charts (would be done through template references)
        // this.tempChart.connectDataStream(processedTempStream$);
        // this.humidityChart.connectDataStream(processedHumidityStream$);
    }

    private setupAlerts(): void {
        this.alerts$ = this.sensorStream$!.pipe(
            scan((alerts: Alert[], data: SensorData) => {
                const newAlerts: Alert[] = [];

                // Temperature alerts
                if (data.temperature > 35) {
                    newAlerts.push({
                        id: `temp-high-${data.timestamp}`,
                        message: `High temperature detected: ${data.temperature}°C`,
                        severity: 'danger',
                        timestamp: data.timestamp,
                    });
                } else if (data.temperature < 10) {
                    newAlerts.push({
                        id: `temp-low-${data.timestamp}`,
                        message: `Low temperature detected: ${data.temperature}°C`,
                        severity: 'warning',
                        timestamp: data.timestamp,
                    });
                }

                // Humidity alerts
                if (data.humidity > 80) {
                    newAlerts.push({
                        id: `humidity-high-${data.timestamp}`,
                        message: `High humidity detected: ${data.humidity}%`,
                        severity: 'warning',
                        timestamp: data.timestamp,
                    });
                }

                // Keep only recent alerts (last 10)
                const recentAlerts = [...newAlerts, ...alerts].slice(0, 10);
                return recentAlerts;
            }, []),
            share()
        );
    }
}

interface SensorData {
    timestamp: number;
    sensorId: string;
    temperature: number;
    humidity: number;
    pressure: number;
}

interface Alert {
    id: string;
    message: string;
    severity: 'warning' | 'danger';
    timestamp: number;
}
```

## Best Practices

### 1. RxJS Stream Composition

```typescript
// ✅ GOOD: Compose streams efficiently
const optimizedStream$ = rawDataStream$.pipe(
    optimizeDataProcessing(16, 1000),
    handleBackpressure(1000, 'oldest'),
    adaptiveBuffer(),
    shareReplay(1)
);

// ❌ AVOID: Multiple subscriptions without sharing
rawDataStream$.subscribe(handler1);
rawDataStream$.subscribe(handler2);
rawDataStream$.subscribe(handler3);
```

### 2. Memory Management

```typescript
// ✅ GOOD: Proper cleanup with takeUntil
private destroy$ = new Subject<void>();

ngOnInit() {
    this.dataStream$.pipe(
        takeUntil(this.destroy$)
    ).subscribe();
}

ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
}

// ❌ AVOID: Manual unsubscription tracking
private subscriptions: Subscription[] = [];

ngOnInit() {
    this.subscriptions.push(
        this.dataStream$.subscribe()
    );
}
```

### 3. Zone.js Management

```typescript
// ✅ GOOD: Process data outside zone, update UI inside zone
this.ngZone.runOutsideAngular(() => {
    this.dataStream$.subscribe((data) => {
        this.processData(data); // Heavy processing outside zone

        this.ngZone.run(() => {
            this.cdr.markForCheck(); // Trigger change detection when needed
        });
    });
});

// ❌ AVOID: All operations in zone
this.dataStream$.subscribe((data) => {
    this.processData(data); // Triggers change detection unnecessarily
});
```

### 4. Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling
const resilientStream$ = this.webSocketService.connect(url).pipe(
    retryWhen((errors) =>
        errors.pipe(
            scan((retryCount, err) => {
                if (retryCount >= 3) throw err;
                return retryCount + 1;
            }, 0),
            delay(1000)
        )
    ),
    catchError((error) => {
        console.error('Stream failed:', error);
        return EMPTY; // Or fallback stream
    })
);

// ❌ AVOID: No error handling
const fragileStream$ = this.webSocketService.connect(url);
```

## Performance Targets

### Angular-Specific Metrics

| Metric                 | Target                  | Measurement                               |
| ---------------------- | ----------------------- | ----------------------------------------- |
| **RxJS Processing**    | <20ms per batch         | Time from stream emission to chart update |
| **Change Detection**   | <5ms per cycle          | OnPush with markForCheck optimization     |
| **Zone.js Overhead**   | <10% of processing time | Comparison with/without zone operations   |
| **Memory Growth**      | <50MB per hour          | Long-running stream monitoring            |
| **Stream Composition** | 5+ concurrent streams   | Multiple observable sources               |

### Data Processing Optimization

Focus on the primary bottleneck (68% of execution time):

-   **Batch Processing**: Process arrays of data rather than individual items
-   **Efficient Operators**: Use `scan`, `bufferTime`, and `share` operators effectively
-   **Memory Pooling**: Reuse objects and arrays where possible
-   **Type Safety**: Leverage TypeScript for compile-time optimizations

## Migration Guide

### From Standard AG Charts Angular to Stream-Based

```typescript
// Before: Standard approach
export class OldChartComponent {
    chartOptions = { data: [] };

    updateData(newData: any[]) {
        this.chartOptions = {
            ...this.chartOptions,
            data: newData,
        };
    }
}

// After: Stream-based approach
export class NewChartComponent {
    private dataSubject$ = new BehaviorSubject<any[]>([]);

    ngOnInit() {
        const processedStream$ = this.streamService.createDataStream('main-stream', this.dataSubject$, {
            bufferTimeMs: 16,
            enableMetrics: true,
        });

        this.chartComponent.connectDataStream(processedStream$);
    }

    updateData(newData: any[]) {
        this.dataSubject$.next(newData);
    }
}
```

## Conclusion

Angular's native RxJS integration makes it exceptionally well-suited for implementing stream-based data visualization. The reactive programming paradigm aligns naturally with real-time data flows, providing powerful composition capabilities and built-in error handling.

### Key Advantages for Angular

1. **Native RxJS Integration**: Leverage Angular's built-in reactive patterns
2. **Zone.js Management**: Precise control over change detection
3. **Dependency Injection**: Clean service architecture for stream management
4. **TypeScript Benefits**: Strong typing for stream operations
5. **OnPush Optimization**: Maximum performance with minimal effort

### Implementation Strategy

The Angular implementation focuses on:

-   **RxJS-first approach** for all data flow management
-   **Service-based architecture** for stream coordination
-   **Performance optimization** through zone management and OnPush
-   **Comprehensive error handling** with circuit breakers and retry logic
-   **Type safety** throughout the stream pipeline

This approach positions Angular applications to handle high-frequency data scenarios effectively while maintaining the framework's strengths in developer experience and maintainability.
