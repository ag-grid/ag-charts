# Option 3: Batched Update Queue with Data Transactions

## Overview

This document details the recommended approach for implementing high-frequency data updates in AG Charts using a batched update queue with structured data transactions. This approach was selected as the optimal balance between performance, backward compatibility, and implementation complexity.

**Important Update**: Following AG Grid's proven pattern, we are adopting a simplified JavaScript API approach rather than complex framework-specific implementations. See [SIMPLIFIED-API.md](../SIMPLIFIED-API.md) for the streamlined design.

## Core Concept

Internal queue that batches updates within animation frames with structured transactions, providing:

-   Backward compatibility with progressive enhancement
-   Automatic batching to reduce render calls
-   Framework-agnostic solution
-   Natural integration with existing UpdateService
-   Support for atomic batch operations with sequence ordering
-   Leveraging of existing `DataService` throttling infrastructure

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

## API Design

### Core API

```typescript
// Enhanced update method (backward compatible)
chart.update(options: AgChartOptions, updateOpts?: {
  mode?: 'immediate' | 'batched' | 'throttled';
  batchWindow?: number;        // Default: 16ms (1 frame)
  priority?: 'high' | 'normal' | 'low';
});

// Data-only fast path
chart.updateDataOnly(data: any[], opts?: {
  operation?: 'replace' | 'append' | 'prepend';
  seriesIndex?: number;        // Default: all series
  maxRetention?: number;       // Max data points to keep
});

// Transaction-based updates for complex operations
chart.applyDataTransaction(transaction: {
  sequence?: number;
  operations: Array<{
    type: 'append' | 'prepend' | 'replace' | 'delete' | 'trim';
    seriesId?: string;
    rows?: any[];
    indices?: number[];
  }>;
});

// Performance monitoring
chart.performance.on('metrics', (metrics: PerformanceMetrics) => {
  // { fps, updateLatency, queueDepth, memoryUsage, droppedUpdates }
});

// Memory management
chart.setRetentionPolicy({
  mode: 'time' | 'count',
  value: number,
  trimStrategy: 'oldest' | 'sample' | 'aggregate',
  backpressure?: 'drop-oldest' | 'drop-newest' | 'throw'
});

// Get streaming metrics snapshot
chart.getStreamingMetrics(): StreamingMetrics;
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

## Implementation Phases

### Phase 1: Core Infrastructure (2 weeks)

-   [ ] Implement UpdateQueue and BatchTimer
-   [ ] Add fast path for data-only updates
-   [ ] Create performance telemetry system
-   [ ] Unit tests for queue behavior

### Phase 2: Memory Management (1 week)

-   [ ] Implement retention policies
-   [ ] Add circular buffer support
-   [ ] Memory usage monitoring
-   [ ] Stress tests for memory leaks

### Phase 3: Framework Integration (1 week)

-   [ ] Provide framework integration examples (see [Framework Integration Examples](../FRAMEWORK-INTEGRATION-EXAMPLES.md))
-   [ ] Document direct API usage patterns (see [Simplified API](../SIMPLIFIED-API.md))
-   [ ] Framework-specific examples

### Phase 4: Data Processing Optimization (2 weeks)

-   [ ] Implement optimized data processing pipeline (primary bottleneck)
-   [ ] Add data structure optimizations (TypedArrays, object pools)
-   [ ] Optimize batch coalescing algorithms
-   [ ] Performance benchmarks focusing on data processing efficiency

### Phase 5: Enterprise Features (1 week)

-   [ ] Advanced telemetry dashboard
-   [ ] Custom retention strategies
-   [ ] Priority queue support
-   [ ] Documentation and examples

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

## Migration Path

### For Existing Users

```typescript
// Old approach (still works)
chart.update({ ...options, data: newData });

// New optimized approach
chart.updateDataOnly(newData, { mode: 'batched' });

// Or configure globally
const chart = AgCharts.create({
    ...options,
    performance: { updateMode: 'batched' },
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

## Testing Approach

### Performance Tests

```typescript
describe('High-frequency updates', () => {
    test('handles 100 updates/sec', async () => {
        const chart = createChart();
        const updates = generateUpdates(100);

        const startTime = performance.now();
        for (const update of updates) {
            chart.updateDataOnly(update);
            await delay(10); // 100 updates/sec
        }

        const metrics = chart.performance.getMetrics();
        expect(metrics.averageFPS).toBeGreaterThan(30);
        expect(metrics.maxLatency).toBeLessThan(50);
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
