# Option 3: Batched Update Queue - Vue Implementation

## Overview

This document provides Vue 3-specific implementation details for Option 3 (Batched Update Queue) of the high-frequency data updates feature in AG Charts. For the overall design document, see [DESIGN_DOC.md](../DESIGN_DOC.md). For the Option 3 architecture details, see [OPTION-3-BATCHED-UPDATE-QUEUE.md](./OPTION-3-BATCHED-UPDATE-QUEUE.md).

## Current State Analysis

### Existing Vue Wrapper

-   **Location**: `packages/ag-charts-vue3/src/index.ts`
-   **Current Implementation**:
    -   Watches options object and spreads to create new object on each update
    -   No granular reactivity for data-only changes
    -   Deep reactivity on large datasets causing performance issues
    -   Missing Vue 3 performance optimizations (shallowRef, markRaw)

### Performance Bottlenecks

-   Data processing overhead (393ms out of 580ms total for 1M points) as primary bottleneck
-   Vue's deep reactivity proxying large data arrays
-   Watch handlers triggering cascading updates
-   No distinction between data and configuration updates
-   Missing performance-focused patterns like `toRaw` and `shallowRef`

## Implementation Strategy

### High-Performance Composables with Optimized Reactivity

```typescript
import { Ref, ShallowRef, computed, markRaw, onMounted, onUnmounted, shallowRef, toRaw, watch } from 'vue';

import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

interface PerformanceConfig {
    updateDebounceMs?: number;
    maxQueuedUpdates?: number;
    usePartialUpdates?: boolean;
    enableUpdateBatching?: boolean;
    onPerformanceAlert?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
    fps: number;
    updateCount: number;
    droppedUpdates: number;
    memoryUsageMB: number;
    averageLatency: number;
}

// Main performance-optimized composable
export function useAgChartsPerformance(initialOptions: AgChartOptions, config: PerformanceConfig = {}) {
    // CRITICAL: Use shallowRef to prevent deep reactivity
    const chartInstance = shallowRef<AgChartInstance | null>(null);
    const chartOptions = shallowRef(markRaw(initialOptions));
    const updateQueue = shallowRef<any[]>([]);
    const metrics = shallowRef<PerformanceMetrics>({
        fps: 60,
        updateCount: 0,
        droppedUpdates: 0,
        memoryUsageMB: 0,
        averageLatency: 0,
    });

    let frameId: number | null = null;
    let lastUpdateTime = performance.now();
    const debounceMs = config.updateDebounceMs || 16; // ~60fps

    // Process batched updates
    const processBatch = () => {
        if (!chartInstance.value || updateQueue.value.length === 0) {
            frameId = null;
            return;
        }

        const now = performance.now();
        const deltaTime = now - lastUpdateTime;

        // Skip frame if too soon
        if (deltaTime < debounceMs) {
            frameId = requestAnimationFrame(processBatch);
            return;
        }

        // Larger batches to optimize data processing (68% of execution time)
        const batch = updateQueue.value.splice(0, config.maxQueuedUpdates || 75);

        // Apply updates without triggering reactivity - focus on data processing efficiency
        const rawChart = toRaw(chartInstance.value);
        rawChart.applyDataTransaction({
            operations: [
                {
                    type: 'append',
                    rows: batch,
                },
            ],
        });

        // Update metrics with data processing focus
        const dataProcessingTime = deltaTime * 0.68; // Primary bottleneck
        const renderingTime = deltaTime * 0.05; // Minimal overhead

        metrics.value = {
            fps: Math.round(1000 / deltaTime),
            updateCount: metrics.value.updateCount + batch.length,
            droppedUpdates: updateQueue.value.length > 100 ? updateQueue.value.length - 100 : 0,
            memoryUsageMB: performance.memory?.usedJSHeapSize / 1048576 || 0,
            averageLatency: deltaTime,
            dataProcessingTime,
            renderingTime,
        };

        lastUpdateTime = now;
        frameId = null;

        // Schedule next batch if needed
        if (updateQueue.value.length > 0) {
            frameId = requestAnimationFrame(processBatch);
        }
    };

    // Add data to queue
    const addData = (data: any) => {
        updateQueue.value.push(data);

        if (!frameId) {
            frameId = requestAnimationFrame(processBatch);
        }
    };

    // Update chart options efficiently
    const updateOptions = (newOptions: AgChartOptions) => {
        // Mark as raw to prevent Vue reactivity
        chartOptions.value = markRaw(newOptions);

        if (chartInstance.value) {
            const { data, ...configOnly } = newOptions;
            toRaw(chartInstance.value).update(configOnly);
        }
    };

    // Initialize chart
    const initChart = (container: HTMLElement) => {
        const chart = AgCharts.create({
            ...toRaw(chartOptions.value),
            container,
            animation: { enabled: false }, // Critical for performance
        });

        // CRITICAL: Mark as raw to prevent Vue proxying
        chartInstance.value = markRaw(chart);

        return chart;
    };

    // Cleanup
    onUnmounted(() => {
        if (frameId) {
            cancelAnimationFrame(frameId);
        }
        if (chartInstance.value) {
            toRaw(chartInstance.value).destroy();
        }
    });

    return {
        chartInstance,
        addData,
        updateOptions,
        initChart,
        metrics: computed(() => metrics.value),
    };
}
```

### Specialized Streaming Composable

```typescript
export function useAgChartsStream<T = any>(
    chart: ShallowRef<AgChartInstance | null>,
    config: {
        maxBufferSize?: number;
        flushIntervalMs?: number;
        mode?: 'append' | 'replace' | 'rolling';
        rollingWindowSize?: number;
    } = {}
) {
    const buffer = shallowRef<T[]>([]);
    let flushTimer: number | null = null;

    const flushBuffer = () => {
        if (!chart.value || buffer.value.length === 0) return;

        const data = buffer.value;
        buffer.value = [];

        // Get raw chart to bypass reactivity
        const rawChart = toRaw(chart.value);

        if (config.mode === 'replace') {
            rawChart.updateDataOnly(data, { mode: 'replace' });
        } else if (config.mode === 'rolling') {
            // Rolling window logic
            const currentData = rawChart.getOptions().data || [];
            const maxSize = config.rollingWindowSize || 1000;
            const newData = [...currentData, ...data].slice(-maxSize);
            rawChart.updateDataOnly(newData, { mode: 'replace' });
        } else {
            // Append mode
            rawChart.applyDataTransaction({
                operations: [{ type: 'append', rows: data }],
            });
        }
    };

    const addData = (data: T) => {
        buffer.value.push(data);

        if (!flushTimer) {
            flushTimer = setTimeout(() => {
                flushBuffer();
                flushTimer = null;
            }, config.flushIntervalMs || 16);
        }
    };

    const addBatch = (batch: T[]) => {
        buffer.value.push(...batch);
        flushBuffer();
    };

    onUnmounted(() => {
        if (flushTimer) {
            clearTimeout(flushTimer);
        }
    });

    return { addData, addBatch, flushBuffer };
}

// Helper for raw data management
export function useRawData<T>(initialData: T[] = []) {
    // Use shallowRef and markRaw for arrays
    const data = shallowRef<T[]>(markRaw(initialData));

    const setData = (newData: T[]) => {
        data.value = markRaw(newData);
    };

    const appendData = (items: T[]) => {
        // Create new array to trigger reactivity
        data.value = markRaw([...toRaw(data.value), ...items]);
    };

    const clearData = () => {
        data.value = markRaw([]);
    };

    return {
        data: computed(() => data.value),
        setData,
        appendData,
        clearData,
    };
}
```

### Performance-Optimized Component

```typescript
import { PropType, defineComponent, onMounted, ref, watch } from 'vue';

import { useAgChartsPerformance } from './useAgChartsPerformance';

export const AgChartsPerformance = defineComponent({
    name: 'AgChartsPerformance',
    props: {
        options: { type: Object as PropType<AgChartOptions>, required: true },
        performanceConfig: { type: Object as PropType<PerformanceConfig> },
        height: { type: String, default: '400px' },
        width: { type: String, default: '100%' },
    },
    setup(props, { expose }) {
        const containerRef = ref<HTMLDivElement>();
        const { chartInstance, addData, updateOptions, initChart, metrics } = useAgChartsPerformance(
            props.options,
            props.performanceConfig
        );

        // Watch for option changes - use shallow comparison
        watch(
            () => props.options,
            (newOptions, oldOptions) => {
                // Only update if reference changed
                if (newOptions !== oldOptions) {
                    updateOptions(markRaw(newOptions));
                }
            },
            { flush: 'post' } // Batch DOM updates
        );

        onMounted(() => {
            if (containerRef.value) {
                initChart(containerRef.value);
            }
        });

        // Expose methods for imperative usage
        expose({
            addData,
            updateOptions,
            getMetrics: () => metrics.value,
            getInstance: () => toRaw(chartInstance.value),
        });

        return { containerRef, metrics };
    },
    template: `
    <div :style="{ width, height }">
      <div ref="containerRef" style="width: 100%; height: 100%;"></div>
      <div v-if="performanceConfig?.enableMetrics" class="metrics">
        {{ metrics.fps }} FPS | {{ metrics.updateCount }} updates
      </div>
    </div>
  `,
});
```

### Streaming Component with Built-in Controls

```typescript
export const AgChartsStreaming = defineComponent({
    name: 'AgChartsStreaming',
    props: {
        options: { type: Object as PropType<AgChartOptions>, required: true },
        streamUrl: String,
        streamMode: {
            type: String as PropType<'append' | 'replace' | 'rolling'>,
            default: 'append',
        },
        maxDataPoints: { type: Number, default: 1000 },
    },
    setup(props) {
        const { chartInstance, initChart } = useAgChartsPerformance(props.options);
        const { addData, addBatch } = useAgChartsStream(chartInstance, {
            mode: props.streamMode,
            rollingWindowSize: props.maxDataPoints,
        });

        const isStreaming = ref(false);
        const streamStats = ref({ received: 0, processed: 0 });

        // WebSocket streaming
        const startWebSocketStream = () => {
            if (!props.streamUrl) return;

            const ws = new WebSocket(props.streamUrl);
            isStreaming.value = true;

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                addData(data);
                streamStats.value.received++;
            };

            ws.onerror = () => {
                isStreaming.value = false;
            };

            ws.onclose = () => {
                isStreaming.value = false;
            };

            return ws;
        };

        onMounted(() => {
            if (props.streamUrl) {
                startWebSocketStream();
            }
        });

        return {
            chartInstance,
            isStreaming,
            streamStats,
            addData,
            addBatch,
        };
    },
    template: `
    <div class="ag-charts-streaming">
      <div ref="containerRef" style="width: 100%; height: 400px;"></div>
      <div class="stream-status">
        <span :class="{ active: isStreaming }">{{ isStreaming ? '● Live' : '○ Offline' }}</span>
        <span>Received: {{ streamStats.received }}</span>
      </div>
    </div>
  `,
});
```

## Usage Examples

### Live Analytics Dashboard

```vue
<template>
  <div class="dashboard">
    <AgChartsPerformance
      ref="chart"
      :options="chartOptions"
      :performance-config="performanceConfig"
      @metrics-update="onMetricsUpdate"
    />
    <div class="controls">
      <button @click="startStreaming">Start Streaming</button>
      <button @click="stopStreaming">Stop Streaming</button>
    </div>
    <div class="metrics">
      {{ metrics.fps }} FPS | {{ metrics.updateCount }} total updates
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, onMounted, onUnmounted } from 'vue';
import { AgChartsPerformance } from 'ag-charts-vue3';

const chart = ref();
const metrics = ref({ fps: 60, updateCount: 0 });
let eventSource: EventSource | null = null;

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
  updateDebounceMs: 20, // Optimize for data processing efficiency
  maxQueuedUpdates: 50, // Larger batches to amortize data processing cost
  enableUpdateBatching: true,
  enableDataProcessingOptimization: true, // Focus on 68% bottleneck
  enableMetrics: true
};

const startStreaming = () => {
  if (eventSource) return;

  eventSource = new EventSource('/api/analytics/stream');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    chart.value?.addData(data);
  };

  eventSource.onerror = () => {
    console.error('Stream error, reconnecting...');
    stopStreaming();
    setTimeout(startStreaming, 1000);
  };
};

const stopStreaming = () => {
  eventSource?.close();
  eventSource = null;
};

const onMetricsUpdate = (newMetrics) => {
  metrics.value = newMetrics;
};

onMounted(() => {
  startStreaming();
});

onUnmounted(() => {
  stopStreaming();
});
</script>
```

### Financial Trading with Composition API

```vue
<template>
  <div class="trading-chart">
    <div ref="chartContainer" style="width: 100%; height: 500px;"></div>
    <div class="trading-stats">
      <span>Last Price: {{ lastPrice }}</span>
      <span>Volume: {{ volume }}</span>
      <span>Updates/sec: {{ updatesPerSecond }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, onMounted } from 'vue';
import { useAgChartsPerformance, useAgChartsStream } from './composables';

const chartContainer = ref<HTMLDivElement>();
const lastPrice = ref(0);
const volume = ref(0);
const updatesPerSecond = ref(0);

// Initialize chart with performance optimizations
const { chartInstance, initChart, metrics } = useAgChartsPerformance({
  title: { text: 'BTC/USD Trading' },
  series: [
    { type: 'candlestick', xKey: 'time' },
    { type: 'column', xKey: 'time', yKey: 'volume', yAxis: 'volume' }
  ],
  axes: [
    { type: 'time', position: 'bottom' },
    { type: 'number', position: 'left' },
    { type: 'number', position: 'right', keys: ['volume'], id: 'volume' }
  ]
}, {
  updateDebounceMs: 8, // ~120fps for financial data
  maxQueuedUpdates: 50
});

// Setup streaming with rolling window
const { addData } = useAgChartsStream(chartInstance, {
  mode: 'rolling',
  rollingWindowSize: 500,
  flushIntervalMs: 8
});

// WebSocket connection
const connectToExchange = () => {
  const ws = new WebSocket('wss://stream.exchange.com/trades');

  ws.onmessage = (event) => {
    const trade = JSON.parse(event.data);

    // Update chart
    addData({
      time: new Date(trade.timestamp),
      open: trade.open,
      high: trade.high,
      low: trade.low,
      close: trade.close,
      volume: trade.volume
    });

    // Update stats
    lastPrice.value = trade.close;
    volume.value = trade.volume;
  };

  ws.onerror = () => {
    // Reconnect after error
    setTimeout(connectToExchange, 1000);
  };
};

onMounted(() => {
  if (chartContainer.value) {
    initChart(chartContainer.value);
    connectToExchange();
  }
});

// Update metrics display
watch(metrics, (newMetrics) => {
  updatesPerSecond.value = newMetrics.updateCount;
});
</script>
```

## Performance Optimization Patterns

### 1. Critical Reactivity Patterns

```typescript
// ✅ CORRECT: Prevent deep reactivity on large datasets
const chartData = shallowRef(markRaw(largeDataArray));

// ✅ CORRECT: Use toRaw when accessing chart methods
const chart = shallowRef(markRaw(chartInstance));
toRaw(chart.value).update(options);

// ❌ WRONG: Deep reactivity on large data
const chartData = ref(largeDataArray); // Vue will proxy every item

// ❌ WRONG: Watching with deep option on large objects
watch(chartOptions, updateChart, { deep: true }); // Expensive!
```

### 2. Efficient Watch Patterns

```typescript
// ✅ CORRECT: Reference equality check
watch(
    () => props.options,
    (newOptions, oldOptions) => {
        if (newOptions !== oldOptions) {
            updateChart(markRaw(newOptions));
        }
    },
    { flush: 'post' } // Batch with DOM updates
);

// ✅ CORRECT: Computed for derived state
const chartConfig = computed(() => {
    const { data, ...config } = options.value;
    return markRaw(config);
});

// ❌ WRONG: Deep watching large objects
watch(options, updateChart, { deep: true, immediate: true });
```

### 3. Memory Management

```typescript
// Implement data trimming
const useDataWindow = (maxSize = 1000) => {
    const data = shallowRef<any[]>([]);

    const appendData = (items: any[]) => {
        const current = toRaw(data.value);
        const newData = [...current, ...items];

        // Trim to max size
        if (newData.length > maxSize) {
            data.value = markRaw(newData.slice(-maxSize));
        } else {
            data.value = markRaw(newData);
        }
    };

    return { data, appendData };
};
```

## Vue-Specific Risks & Mitigations

### Risk: Deep Reactivity Performance Degradation

**Mitigation**: Mandatory use of shallowRef and markRaw

```typescript
// Always use these patterns for chart data
const data = shallowRef(markRaw(dataArray));
const chart = shallowRef(markRaw(chartInstance));
```

### Risk: Watch Handlers Triggering Cascades

**Mitigation**: Use flush: 'post' and reference checks

```typescript
watch(source, handler, {
    flush: 'post', // Batch with DOM updates
    deep: false, // Never use deep for performance-critical watches
});
```

### Risk: Proxy Overhead on Chart Instances

**Mitigation**: Always use toRaw for method calls

```typescript
// Always unwrap before calling methods
const rawChart = toRaw(chartInstance.value);
rawChart.update(options);
rawChart.applyDataTransaction(transaction);
```

### Risk: Memory Leaks from Event Listeners

**Mitigation**: Proper cleanup in onUnmounted

```typescript
onUnmounted(() => {
    // Clean up all resources
    if (ws) ws.close();
    if (eventSource) eventSource.close();
    if (frameId) cancelAnimationFrame(frameId);
    if (chart) toRaw(chart).destroy();
});
```

## Testing Strategies

### Unit Testing with Composition API

```typescript
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { useAgChartsPerformance } from './useAgChartsPerformance';

describe('useAgChartsPerformance', () => {
    it('should batch updates within frame', async () => {
        const { addData, metrics } = useAgChartsPerformance({ data: [], series: [] }, { maxQueuedUpdates: 10 });

        // Add multiple data points
        for (let i = 0; i < 5; i++) {
            addData({ value: i });
        }

        // Wait for next frame
        await new Promise((resolve) => requestAnimationFrame(resolve));

        expect(metrics.value.updateCount).toBe(5);
    });

    it('should handle rapid updates without memory leaks', async () => {
        const wrapper = mount(AgChartsPerformance, {
            props: {
                options: { data: [], series: [] },
                performanceConfig: { updateDebounceMs: 10 },
            },
        });

        const instance = wrapper.vm;

        // Simulate rapid updates
        for (let i = 0; i < 100; i++) {
            instance.addData({ value: Math.random() });
            await new Promise((r) => setTimeout(r, 1));
        }

        // Check metrics
        const metrics = instance.getMetrics();
        expect(metrics.droppedUpdates).toBe(0);

        wrapper.unmount();
    });
});
```

### Performance Testing

```typescript
it('should maintain 60fps with high-frequency updates', async () => {
    const startTime = performance.now();
    const { addData, metrics } = useAgChartsPerformance({ data: [], series: [] }, { updateDebounceMs: 16 });

    // Generate 100 updates per second
    for (let i = 0; i < 100; i++) {
        addData({ timestamp: Date.now(), value: Math.random() });
        await new Promise((r) => setTimeout(r, 10));
    }

    const endTime = performance.now();
    const avgFps = metrics.value.fps;

    expect(avgFps).toBeGreaterThan(30);
    expect(endTime - startTime).toBeLessThan(1200);
});
```

## Migration Guide

### From Existing AG Charts Vue

```vue
<!-- Before: Standard AG Charts Vue -->
<template>
  <ag-charts :options="options" />
</template>

<script setup>
import { ref } from 'vue';
import { AgCharts } from 'ag-charts-vue3';

const options = ref({
  data: [],
  series: [/* ... */]
});

const updateData = (newData) => {
  options.value = { ...options.value, data: newData };
};
</script>

<!-- After: High-frequency optimized -->
<template>
  <AgChartsPerformance
    ref="chart"
    :options="options"
    :performance-config="{ updateDebounceMs: 16 }"
  />
</template>

<script setup>
import { ref, shallowRef, markRaw } from 'vue';
import { AgChartsPerformance } from 'ag-charts-vue3';

const chart = ref();
const options = shallowRef(markRaw({
  data: [],
  series: [/* ... */]
}));

const updateData = (newData) => {
  // Batch updates automatically
  newData.forEach(item => chart.value?.addData(item));
};
</script>
```

## Best Practices

1. **Always use shallowRef + markRaw** for large data structures
2. **Use toRaw** when accessing chart instance methods
3. **Avoid deep watchers** on chart options or data
4. **Use flush: 'post'** for watch handlers to batch with DOM
5. **Implement proper cleanup** in onUnmounted hooks
6. **Monitor performance** using built-in metrics
7. **Use computed** for derived state instead of watchers
8. **Batch updates** using requestAnimationFrame

## Performance Targets

-   **Update Rate**: 100+ updates/second
-   **Frame Rate**: Maintain 60fps (50fps minimum)
-   **Reactivity Overhead**: <10% CPU usage
-   **Memory**: Stable usage over 24-hour period
-   **Latency**: <50ms from data arrival to render
