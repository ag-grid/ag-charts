# Batched Update Queue - Internal Optimization Strategy

## Overview

This document details the batched update queue optimization that can be added to AG Charts' high-frequency data update implementation as a **Phase 2 enhancement**. This is an internal optimization strategy that works transparently with any user-facing API choice (identifier-based or transaction-based).

**Important Note**: This batching optimization is **optional** and can be deferred to post-release. The core delta processing (Phase 1) provides 60-70% of performance gains without the complexity of batching.

## Status: Deferred to Phase 2

**Current Priority**: Implement efficient delta processing first (Phase 1)
**This Document**: Describes future optimization for additional 10-15% performance gain
**Timeline**: Can be added 2-3 weeks after core implementation or post-release

## Core Concept

Internal queue that batches updates within animation frames, providing:

-   **Transparent to API**: Works with any user-facing API (identifier-based or transaction-based)
-   **Progressive Enhancement**: Can be added without changing public API
-   **Automatic Optimization**: Users get benefits without code changes
-   **Frame-aligned Processing**: Reduces redundant calculations
-   **Coalescing**: Combines multiple rapid updates intelligently

## Why Defer Batching?

1. **Complexity**: Adds significant implementation complexity
2. **Diminishing Returns**: Core delta processing provides most benefit (60-70%)
3. **Not Critical Path**: Can ship without it and add later
4. **Risk Reduction**: Simpler Phase 1 has lower risk
5. **Customer Validation**: Get feedback before adding complexity

## Data Model

```typescript
interface DataTransaction {
    sequence?: number; // For deterministic ordering
    operations: DataOperation[];
    timestamp?: number;
}

interface DataOperation {
    type: 'append' | 'prepend' | 'replace' | 'delete' | 'trim';
    seriesId?: string;
    rows?: any[];
    indices?: number[];
    predicate?: (row: any) => boolean;
}

interface UpdateOptions {
    mode: 'immediate' | 'batched' | 'throttled';
    batchWindow?: number; // ms
    maxQueueSize?: number;
    retentionWindow?: number; // ms
}
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User API  │────▶│ Update Queue │────▶│ Batch Timer │
└─────────────┘     └──────────────┘     └─────────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌──────────────┐    ┌──────────────┐     ┌─────────────┐
│ Transactions │    │ Memory Mgmt  │     │   Renderer  │
└──────────────┘    └──────────────┘     └─────────────┘
        │                                         │
        ▼                                         ▼
┌──────────────┐                        ┌──────────────┐
│  DataService │                        │  EventsHub   │
└──────────────┘                        └──────────────┘
```

### Key Components

1. **UpdateQueue**: Accumulates updates between render frames with sequence ordering
2. **BatchTimer**: Coordinates updates with requestAnimationFrame
3. **DataTransactionManager**: Processes atomic batch operations maintaining data consistency
4. **MemoryManager**: Enforces retention policies with ring buffer support
5. **FastPath**: Bypasses options reconciliation for data-only updates
6. **Telemetry**: Tracks performance metrics and emits via eventsHub
7. **DataService Integration**: Leverages existing throttling and dispatch infrastructure

## How Batching Enhances Existing APIs

Batching works transparently with both API approaches:

### With Identifier-Based API

```typescript
// User code doesn't change
chart.update({ data: newData, dataId: 'id' });

// Internally with batching:
// - Multiple rapid updates are queued
// - Processed together in next animation frame
// - Delta computation happens once per batch
```

### With Transaction-Based API

```typescript
// User code for immediate processing (Phase 1)
chart.applyDataTransaction({ add: [...], update: [...] });

// Future async version with batching (Phase 2)
chart.applyDataTransactionAsync({ add: [...], update: [...] });

// Internally:
// - Transactions queued and coalesced
// - Similar operations combined
// - Executed in single batch
```

### Configuration Options

```typescript
interface AgChartOptions {
    // Existing options...

    performance?: {
        updateMode?: 'immediate' | 'batched' | 'throttled';
        targetFPS?: number; // Default: 60
        maxQueueDepth?: number; // Default: 100
        enableMetrics?: boolean; // Default: false (true in enterprise)
    };

    dataRetention?: {
        enabled?: boolean;
        mode?: 'time' | 'count';
        value?: number;
        trimStrategy?: 'oldest' | 'sample' | 'aggregate';
    };
}
```

## Performance Optimization Techniques

### 1. Data Processing Optimization (Primary Focus)

Based on performance profiling showing data processing consumes 68% of execution time (393ms out of 580ms total), the primary optimization target is data processing efficiency:

```typescript
class UpdateQueue {
    private queue: Update[] = [];
    private frameId: number | null = null;
    private dataProcessor: OptimizedDataProcessor;

    enqueue(update: Update) {
        this.queue.push(update);
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(() => this.flush());
        }
    }

    flush() {
        const batch = this.queue.splice(0);
        // Focus on efficient data processing - the major bottleneck
        this.processBatchOptimized(batch);
        this.frameId = null;
    }

    private processBatchOptimized(batch: Update[]) {
        // Coalesce similar operations to reduce processing overhead
        const coalescedBatch = this.dataProcessor.coalesceOperations(batch);
        // Use optimized data structures for processing
        const processedData = this.dataProcessor.batchProcess(coalescedBatch);
        // Apply to chart efficiently
        this.applyOptimizedUpdate(processedData);
    }
}
```

### 2. Data Structure Optimization

-   Use TypedArrays for numeric data to reduce parsing and processing overhead
-   Implement ring buffers for fixed-size windows to optimize data management:

```typescript
class OptimizedRingBuffer<T> {
    private buffer: T[];
    private head = 0;
    private size = 0;
    private dataProcessor: DataProcessor;

    constructor(private capacity: number) {
        this.buffer = new Array(capacity);
        this.dataProcessor = new DataProcessor();
    }

    pushBatch(items: T[]) {
        // Batch processing reduces per-item overhead
        const processedItems = this.dataProcessor.preprocessBatch(items);

        for (const item of processedItems) {
            this.buffer[this.head] = item;
            this.head = (this.head + 1) % this.capacity;
            this.size = Math.min(this.size + 1, this.capacity);
        }
    }

    toArray(): T[] {
        const start = this.size < this.capacity ? 0 : this.head;
        return [...this.buffer.slice(start), ...this.buffer.slice(0, start)];
    }
}
```

-   Pre-index data for O(1) append operations and faster processing
-   Reuse object allocations via object pools to reduce GC pressure during data processing
-   Use specialized data structures for numeric operations (Float64Array, Int32Array)

### 3. Rendering Coordination (Secondary Focus)

Since rendering only takes 3-4ms (less than 1% of total time), rendering optimization is secondary but still important for smooth user experience:

```typescript
class DataProcessingCoordinator {
    private targetFPS = 60;
    private lastProcess = 0;
    private processingBudget = 12; // ms - most of 16ms frame budget for data processing

    shouldProcessBatch(queueDepth: number): boolean {
        const now = performance.now();
        const elapsed = now - this.lastProcess;
        const frameTime = 1000 / this.targetFPS;

        // Prioritize data processing over rendering since it's the bottleneck
        if (elapsed >= frameTime && queueDepth > 0) {
            this.lastProcess = now;
            return true;
        }
        return false;
    }

    estimateProcessingTime(batchSize: number): number {
        // Based on actual profiling: ~0.4ms per data point processing
        return batchSize * 0.4;
    }
}
```

## Memory Management Strategy

### Retention Policies

```typescript
interface RetentionPolicy {
    trimData(data: any[], policy: RetentionConfig): any[];
}

class TimeBasedRetention implements RetentionPolicy {
    trimData(data: any[], config: { windowMs: number }) {
        const cutoff = Date.now() - config.windowMs;
        return data.filter((d) => d.timestamp > cutoff);
    }
}

class CountBasedRetention implements RetentionPolicy {
    trimData(data: any[], config: { maxPoints: number }) {
        return data.slice(-config.maxPoints);
    }
}
```

### Garbage Collection Optimization

-   Reuse objects instead of creating new ones
-   Clear references to trimmed data
-   Use object pools for temporary calculations

## When to Implement Batching

### Prerequisites (Phase 1 Must Be Complete)

-   ✅ Efficient delta processing implemented
-   ✅ Identifier-based or transaction-based API working
-   ✅ 60-70% performance improvement achieved
-   ✅ Customer feedback gathered

### Triggers for Adding Batching

-   Customer requests for >100 updates/second
-   Specific use cases with burst patterns
-   Need for additional 10-15% performance
-   Resource availability after Phase 1 success

## Implementation Plan (When Ready)

### Week 1: Core Queue Infrastructure

-   [ ] Implement UpdateQueue with ring buffer
-   [ ] Add requestAnimationFrame integration
-   [ ] Basic coalescing for consecutive updates
-   [ ] Unit tests for queue behavior

### Week 2: Optimization Strategies

-   [ ] Advanced coalescing algorithms
-   [ ] Adaptive batch sizing
-   [ ] Queue overflow handling
-   [ ] Performance monitoring

### Week 3: Testing and Integration

-   [ ] Integration with existing APIs
-   [ ] Performance benchmarks
-   [ ] Memory leak testing
-   [ ] Documentation

## Cross-Cutting Concerns

### Data Processing Integration

-   Ensure data consistency during high-frequency batch processing operations
-   Optimize data transformation pipeline to reduce the 393ms processing overhead
-   Use efficient data structures and algorithms for the 68% of time spent in data processing

### Navigator Integration

-   Ensure navigator state remains consistent during trim/append operations
-   Update navigator's data window atomically with main chart data
-   Preserve zoom/pan state using `MementoCaretaker` during transactions

### Error Handling & Backpressure

```typescript
interface BackpressureStrategy {
    type: 'drop-oldest' | 'drop-newest' | 'throw' | 'yield';
    warningThreshold?: number;
    onBackpressure?: (metrics: StreamingMetrics) => void;
}
```

-   Emit warnings via logger when queue depth exceeds threshold
-   Support configurable strategies for handling overflow
-   Provide async yield callback for custom backpressure handling

### Accessibility

-   Throttle screen reader announcements to prevent spam
-   Batch aria-live updates per animation frame
-   Provide summary announcements for rapid data changes

### SSR & Worker Environments

-   Ensure graceful degradation when `requestAnimationFrame` unavailable
-   Support worker timer alignment via scheduling hooks
-   Handle server-side rendering without DOM access

## Risk Mitigation

### Memory Leaks from Uncleared References

**Mitigation**: Implement comprehensive cleanup in lifecycle methods:

```typescript
class StreamingChart {
    private cleanupTasks: Array<() => void> = [];

    registerCleanup(task: () => void) {
        this.cleanupTasks.push(task);
    }

    destroy() {
        // Run all cleanup tasks
        this.cleanupTasks.forEach((task) => task());
        this.cleanupTasks = [];

        // Clear all references
        this.chart?.destroy();
        this.chart = null;
        this.dataQueue.clear();
        this.subscriptions.clear();
    }
}
```

### Browser Resource Exhaustion

**Mitigation**: Implement resource monitoring and throttling:

```typescript
class ResourceMonitor {
    private memoryThresholdMB = 500;
    private cpuThresholdPercent = 80;
    private updateRateLimit = 100; // max updates/sec

    checkResources(): ResourceStatus {
        const memory = performance.memory?.usedJSHeapSize / 1048576 || 0;
        const shouldThrottle = memory > this.memoryThresholdMB;

        return {
            memoryMB: memory,
            shouldThrottle,
            suggestedDelay: shouldThrottle ? 32 : 16 // Reduce to 30fps if throttling
        };
    }

    enforceRateLimit(currentRate: number): boolean {
        return currentRate > this.updateRateLimit;
    }
```

### Race Conditions in Concurrent Updates

**Mitigation**: Use atomic operations and proper synchronization:

```typescript
class UpdateSynchronizer {
    private updateInProgress = false;
    private pendingUpdates: any[] = [];

    async applyUpdate(chart: AgChartInstance, data: any[]): Promise<void> {
        if (this.updateInProgress) {
            this.pendingUpdates.push(...data);
            return;
        }

        this.updateInProgress = true;

        try {
            await chart.applyDataTransaction({
                operations: [{ type: 'append', rows: data }]
            });

            // Process any pending updates
            if (this.pendingUpdates.length > 0) {
                const pending = this.pendingUpdates.splice(0);
                await this.applyUpdate(chart, pending);
            }
        } finally {
            this.updateInProgress = false;
        }
}
```

## Implementation Examples

### Real-Time Financial Trading Dashboard

```typescript
// React Example
import { useAgChartsStream, AgChartsStreaming } from 'ag-charts-react';

function TradingDashboard() {
  const { addData, chartOptions, metrics } = useAgChartsStream({
    title: { text: 'Real-Time Trading' },
    series: [
      { type: 'line', xKey: 'timestamp', yKey: 'price', name: 'BTC/USD' },
      { type: 'line', xKey: 'timestamp', yKey: 'volume', yAxis: 'volume' }
    ],
    axes: [
      { type: 'time', position: 'bottom' },
      { type: 'number', position: 'left', keys: ['price'] },
      { type: 'number', position: 'right', keys: ['volume'], id: 'volume' }
    ]
  }, {
    updateStrategy: 'rolling',
    rollingWindowSize: 500,
    batchSize: 25, // Larger batches to amortize data processing cost
    batchTimeout: 16, // Optimize for data processing efficiency
    enableDataProcessingOptimization: true, // Focus on the 68% bottleneck
  });

  useEffect(() => {
    const ws = new WebSocket('wss://stream.exchange.com/trades');

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      addData({
        timestamp: new Date(trade.time),
        price: trade.price,
        volume: trade.volume
      });
    };

    return () => ws.close();
  }, [addData]);

  return (
    <div>
      <div>FPS: {metrics.fps} | Updates/sec: {metrics.updatesPerSecond}</div>
      <AgChartsStreaming options={chartOptions} />
    </div>
  );
}
```

### IoT Sensor Monitoring

```typescript
// Angular Example
@Component({
    template: `
        <ag-charts-high-frequency
            [options]="chartOptions"
            [highFrequencyConfig]="streamConfig"
            [enableMetrics]="true"
            (metricsUpdate)="onMetrics($event)"
        >
        </ag-charts-high-frequency>
        <div>Processing {{ metrics.updatesPerSecond }} updates/sec</div>
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
        bufferTimeMs: 16,
        maxBufferSize: 1000,
        dropOldUpdates: true,
    };

    metrics = { updatesPerSecond: 0 };

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

### Live Analytics Dashboard

```typescript
// Vue Example
<template>
  <div>
    <AgChartsPerformance
      ref="chart"
      :options="chartOptions"
      :performance-config="performanceConfig"
      @metrics-update="onMetricsUpdate"
    />
    <div>{{ metrics.fps }} FPS | {{ metrics.updateCount }} total updates</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, markRaw } from 'vue';
import { AgChartsPerformance } from 'ag-charts-vue3';

const chart = ref();
const metrics = ref({ fps: 60, updateCount: 0 });

// Use shallowRef + markRaw for performance
const chartOptions = shallowRef(markRaw({
  title: { text: 'Live Analytics' },
  data: [],
  series: [
    { type: 'column', xKey: 'category', yKey: 'count' },
    { type: 'line', xKey: 'category', yKey: 'average', yAxis: 'secondary' }
  ],
  axes: [
    { type: 'category', position: 'bottom' },
    { type: 'number', position: 'left', keys: ['count'] },
    { type: 'number', position: 'right', keys: ['average'], id: 'secondary' }
  ]
}));

const performanceConfig = {
  updateDebounceMs: 16, // 60fps
  maxQueuedUpdates: 30,
  enableUpdateBatching: true
};

onMounted(() => {
  // Server-sent events for real-time analytics
  const eventSource = new EventSource('/api/analytics/stream');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    chart.value?.addData(data);
  };
});

const onMetricsUpdate = (newMetrics) => {
  metrics.value = newMetrics;
};
</script>
```

## Migration Path (When Implemented)

### Automatic Enhancement

```typescript
// No code changes needed - batching activates automatically
chart.update({ data: newData, dataId: 'id' });

// Or opt-in to explicit batching control
const chart = AgCharts.create({
    ...options,
    performance: {
        enableBatching: true,
        batchWindow: 16, // ms
    },
});
```

### From Competitors

#### From HighCharts

```typescript
// HighCharts
chart.series[0].setData(data, true, true, true);

// AG Charts
chart.updateDataOnly(data, { seriesIndex: 0 });
```

#### From Chart.js with Streaming Plugin

```typescript
// Chart.js + Streaming
chart.data.datasets[0].data.push(point);
chart.update('quiet');

// AG Charts
chart.updateDataOnly(data, { operation: 'append' });
```

## Expected Performance Improvements

### Without Batching (Phase 1 Only)

-   **Throughput**: 60-80 updates/second
-   **Latency**: 150-200ms
-   **Performance Gain**: 60-70% from baseline

### With Batching (Phase 1 + 2)

-   **Throughput**: 95-120 updates/second
-   **Latency**: 85-100ms
-   **Performance Gain**: 75-85% from baseline
-   **Additional Benefit**: +10-15% over Phase 1

## Testing Approach (When Implemented)

### Performance Validation

```typescript
describe('Batching optimization', () => {
    test('improves throughput with batching', async () => {
        const chartWithout = createChart({ enableBatching: false });
        const chartWith = createChart({ enableBatching: true });

        // Measure performance difference
        const withoutMetrics = await runBenchmark(chartWithout);
        const withMetrics = await runBenchmark(chartWith);

        // Should see 10-15% improvement
        expect(withMetrics.throughput).toBeGreaterThan(withoutMetrics.throughput * 1.1);
    });
});
```

### Benchmarks

-   Sustained load: 1000 updates/sec for 5 minutes
-   Burst patterns: 0-500-0 updates/sec cycles
-   Memory stability: 24-hour continuous updates
-   Framework overhead: Measure reconciliation cost
-   Visual regression: Ensure interactions remain stable under live updates
-   CPU usage validation for framework-specific integration (target: <80% at 100 updates/sec)
