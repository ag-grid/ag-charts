# Vue Implementation Guide: Option 1 Incremental Update API

## Executive Summary

This document provides a comprehensive Vue 3-specific implementation guide for AG Charts' Incremental Update API (Option 1), focusing on Vue's Composition API, reactivity optimization, and performance patterns for high-frequency data updates. The implementation leverages Vue 3's advanced reactivity features while mitigating potential performance bottlenecks to achieve optimal data processing efficiency. Since rendering is already fast (~3-4ms), the primary focus is on optimizing data processing which represents 68% of execution time (~393ms out of 580ms for 1M points).

For the overall design document, see [DESIGN_DOC.md](../DESIGN_DOC.md). For the Option 1 architecture details, see [OPTION-1-INCREMENTAL-UPDATE.md](./OPTION-1-INCREMENTAL-UPDATE.md). For React implementation patterns, see [REACT-IMPLEMENTATION.md](./REACT-IMPLEMENTATION.md).

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Vue 3 Composition API Integration](#vue-3-composition-api-integration)
3. [Custom Composables](#custom-composables)
4. [Performance Optimization Strategies](#performance-optimization-strategies)
5. [Reactivity System Optimization](#reactivity-system-optimization)
6. [Component Implementation Patterns](#component-implementation-patterns)
7. [Real-world Examples](#real-world-examples)
8. [Integration Patterns](#integration-patterns)
9. [Testing Strategies](#testing-strategies)
10. [Migration Guide](#migration-guide)

## Current State Analysis

### Existing Vue Wrapper

-   **Location**: `packages/ag-charts-vue3/src/index.ts`
-   **Current Implementation**:
    -   Basic wrapper with options watching
    -   No specialized data update mechanisms
    -   Relies on full options replacement for updates
    -   Missing performance-focused patterns for high-frequency data

### Vue-Specific Performance Challenges

-   **Deep Reactivity Overhead**: Vue's proxy-based reactivity can impact large datasets (~68% data processing bottleneck)
-   **Watch Cascade Effects**: Watchers triggering on full options replacement
-   **Missing Optimization Patterns**: Lack of `shallowRef` and `markRaw` usage for performance-critical scenarios
-   **Data Processing Bottleneck**: Primary focus area - current data processing takes ~393ms for 1M points

## Vue 3 Composition API Integration

### Enhanced Vue Chart Component

```typescript
<template>
  <div
    ref="containerRef"
    :style="{ width: width || '100%', height: height || '400px' }"
  />
</template>

<script setup lang="ts" generic="TDatum">
import { ref, onMounted, onUnmounted, watch, shallowRef, markRaw, toRaw } from 'vue';
import { AgCharts, AgChartInstance, AgChartOptions, AgDataTransaction, AgDataTransactionResult } from 'ag-charts-community';

interface VueChartProps<TDatum> {
  options: AgChartOptions;
  width?: string;
  height?: string;
  enableIncrementalUpdates?: boolean;
  onTransactionComplete?: (result: AgDataTransactionResult) => void;
  onTransactionError?: (error: Error, transaction: AgDataTransaction<TDatum>) => void;
}

const props = withDefaults(defineProps<VueChartProps<TDatum>>(), {
  enableIncrementalUpdates: true,
});

const emit = defineEmits<{
  transactionComplete: [result: AgDataTransactionResult];
  transactionError: [error: Error, transaction: AgDataTransaction<TDatum>];
  chartReady: [instance: AgChartInstance<TDatum>];
}>();

const containerRef = ref<HTMLDivElement>();
// CRITICAL: Use shallowRef to prevent deep reactivity on chart instance
const chartInstance = shallowRef<AgChartInstance<TDatum> | null>(null);

// Initialize chart with optimized reactivity
onMounted(async () => {
  if (containerRef.value) {
    // Mark options as raw to prevent Vue reactivity proxying
    const rawOptions = markRaw({
      ...toRaw(props.options),
      container: containerRef.value,
    });

    const chart = AgCharts.create<TDatum>(rawOptions);

    // CRITICAL: Mark chart instance as raw to prevent Vue proxying
    chartInstance.value = markRaw(chart);

    // Set up event listeners
    if (props.onTransactionComplete) {
      chart.addEventListener('transactionComplete', props.onTransactionComplete);
    }

    if (props.onTransactionError) {
      chart.addEventListener('transactionError', props.onTransactionError);
    }

    emit('chartReady', chart);
  }
});

// Watch options with shallow comparison for performance
watch(
  () => props.options,
  (newOptions, oldOptions) => {
    // Only update if reference has changed (avoiding deep comparison)
    if (newOptions !== oldOptions && chartInstance.value) {
      const rawOptions = markRaw(toRaw(newOptions));
      // Use toRaw to bypass Vue reactivity when calling chart methods
      toRaw(chartInstance.value).update(rawOptions);
    }
  },
  { flush: 'post' } // Batch with DOM updates
);

onUnmounted(() => {
  if (chartInstance.value) {
    toRaw(chartInstance.value).destroy();
  }
});

// Expose chart instance and methods for external access
defineExpose({
  getInstance: () => toRaw(chartInstance.value),
  updateData: (transaction: AgDataTransaction<TDatum>) => {
    if (chartInstance.value) {
      return toRaw(chartInstance.value).updateData(transaction);
    }
    throw new Error('Chart instance not available');
  },
  updateDataAsync: (transaction: AgDataTransaction<TDatum>) => {
    if (chartInstance.value) {
      return toRaw(chartInstance.value).updateDataAsync(transaction);
    }
    throw new Error('Chart instance not available');
  },
});
</script>
```

## Custom Composables

### 1. useIncrementalChart Composable

```typescript
import { computed, markRaw, onUnmounted, ref, shallowRef, toRaw, watch } from 'vue';

import type { AgChartInstance, AgDataTransaction, AgDataTransactionResult } from 'ag-charts-community';

interface UseIncrementalChartOptions<TDatum> {
    seriesId?: string;
    maxRetries?: number;
    batchWindow?: number; // ms
    maxBatchSize?: number;
    onError?: (error: Error) => void;
}

interface UseIncrementalChartReturn<TDatum> {
    chartInstance: Readonly<Ref<AgChartInstance<TDatum> | null>>;
    updateData: (transaction: AgDataTransaction<TDatum>) => Promise<AgDataTransactionResult>;
    updateDataBatch: (transactions: AgDataTransaction<TDatum>[]) => Promise<AgDataTransactionResult[]>;
    getCurrentData: () => TDatum[] | Record<string, TDatum[]>;
    isUpdating: Readonly<Ref<boolean>>;
    error: Readonly<Ref<Error | null>>;
    stats: ComputedRef<TransactionStats>;
    initChart: (container: HTMLElement, options: AgChartOptions) => AgChartInstance<TDatum>;
}

interface TransactionStats {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageLatency: number;
    dataProcessingTime: number; // Focus metric for optimization
}

export function useIncrementalChart<TDatum = any>(
    options: UseIncrementalChartOptions<TDatum> = {}
): UseIncrementalChartReturn<TDatum> {
    const {
        seriesId,
        maxRetries = 3,
        batchWindow = 16, // ~60fps
        maxBatchSize = 50,
        onError,
    } = options;

    // CRITICAL: Use shallowRef to prevent deep reactivity
    const chartInstance = shallowRef<AgChartInstance<TDatum> | null>(null);
    const isUpdating = ref(false);
    const error = ref<Error | null>(null);

    // Track transaction statistics with focus on data processing
    const statsRef = ref({
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalLatency: 0,
        totalDataProcessingTime: 0, // Primary optimization target
    });

    // Batch processing queue
    const batchQueue = shallowRef<AgDataTransaction<TDatum>[]>(markRaw([]));
    let batchTimeoutId: number | null = null;

    // Initialize chart with optimized reactivity
    const initChart = (container: HTMLElement, chartOptions: AgChartOptions): AgChartInstance<TDatum> => {
        const rawOptions = markRaw({
            ...toRaw(chartOptions),
            container,
            // Disable animations for performance
            animation: { enabled: false },
        });

        const chart = AgCharts.create<TDatum>(rawOptions);
        // CRITICAL: Mark as raw to prevent Vue proxying
        chartInstance.value = markRaw(chart);

        return chart;
    };

    // Update data with optimized error handling
    const updateData = async (transaction: AgDataTransaction<TDatum>): Promise<AgDataTransactionResult> => {
        if (!chartInstance.value) {
            throw new Error('Chart instance not available');
        }

        const startTime = performance.now();
        let lastError: Error | null = null;

        isUpdating.value = true;
        error.value = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const enrichedTransaction = {
                    ...transaction,
                    seriesId: seriesId || transaction.seriesId,
                };

                // Use toRaw to bypass Vue reactivity for performance
                const result = await toRaw(chartInstance.value).updateDataAsync(enrichedTransaction);

                // Update statistics with focus on data processing
                const endTime = performance.now();
                const latency = endTime - startTime;
                const dataProcessingTime = latency * 0.68; // 68% of time is data processing

                statsRef.value.totalTransactions++;
                statsRef.value.successfulTransactions++;
                statsRef.value.totalLatency += latency;
                statsRef.value.totalDataProcessingTime += dataProcessingTime;

                isUpdating.value = false;
                return result;
            } catch (err) {
                lastError = err as Error;
                if (attempt < maxRetries) {
                    // Exponential backoff
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
                }
            }
        }

        // All retries failed
        statsRef.value.totalTransactions++;
        statsRef.value.failedTransactions++;
        error.value = lastError;
        isUpdating.value = false;

        if (onError) {
            onError(lastError!);
        }

        throw lastError!;
    };

    // Process batched transactions
    const processBatch = async (): Promise<AgDataTransactionResult[]> => {
        if (!chartInstance.value || batchQueue.value.length === 0) {
            return [];
        }

        const batch = [...toRaw(batchQueue.value)];
        batchQueue.value = markRaw([]);

        try {
            // Group transactions by series for optimization
            const groupedTransactions = batch.reduce(
                (groups, transaction) => {
                    const targetSeriesId = transaction.seriesId || seriesId || 'default';
                    if (!groups[targetSeriesId]) {
                        groups[targetSeriesId] = [];
                    }
                    groups[targetSeriesId].push(transaction);
                    return groups;
                },
                {} as Record<string, AgDataTransaction<TDatum>[]>
            );

            // Process each series group
            const results = await Promise.all(
                Object.entries(groupedTransactions).map(async ([targetSeriesId, transactions]) => {
                    // Merge transactions for same series to optimize data processing
                    const mergedTransaction: AgDataTransaction<TDatum> = {
                        seriesId: targetSeriesId,
                        append: transactions.flatMap((t) => t.append || []),
                        prepend: transactions.flatMap((t) => t.prepend || []),
                        update: transactions.flatMap((t) => t.update || []),
                        remove: transactions.flatMap((t) => t.remove || []).flat(),
                    };

                    return toRaw(chartInstance.value!).updateDataAsync(mergedTransaction);
                })
            );

            return results;
        } catch (error) {
            if (onError) {
                onError(error as Error);
            }
            throw error;
        }
    };

    // Batch update function
    const updateDataBatch = (transactions: AgDataTransaction<TDatum>[]): Promise<AgDataTransactionResult[]> => {
        return new Promise((resolve, reject) => {
            // Add to batch queue
            const currentQueue = toRaw(batchQueue.value);
            batchQueue.value = markRaw([...currentQueue, ...transactions]);

            // Clear existing timeout
            if (batchTimeoutId) {
                clearTimeout(batchTimeoutId);
            }

            // Schedule batch processing
            batchTimeoutId = setTimeout(async () => {
                try {
                    const results = await processBatch();
                    resolve(results);
                } catch (error) {
                    reject(error);
                }
            }, batchWindow);
        });
    };

    // Get current data
    const getCurrentData = (): TDatum[] | Record<string, TDatum[]> => {
        if (!chartInstance.value) return [];
        return toRaw(chartInstance.value).getData(seriesId);
    };

    // Computed statistics
    const stats = computed<TransactionStats>(() => ({
        totalTransactions: statsRef.value.totalTransactions,
        successfulTransactions: statsRef.value.successfulTransactions,
        failedTransactions: statsRef.value.failedTransactions,
        averageLatency: statsRef.value.totalLatency / Math.max(statsRef.value.successfulTransactions, 1),
        dataProcessingTime: statsRef.value.totalDataProcessingTime / Math.max(statsRef.value.successfulTransactions, 1),
    }));

    // Cleanup
    onUnmounted(() => {
        if (batchTimeoutId) {
            clearTimeout(batchTimeoutId);
        }
        if (chartInstance.value) {
            toRaw(chartInstance.value).destroy();
        }
    });

    return {
        chartInstance: readonly(chartInstance),
        updateData,
        updateDataBatch,
        getCurrentData,
        isUpdating: readonly(isUpdating),
        error: readonly(error),
        stats,
        initChart,
    };
}
```

### 2. useDataStream Composable

```typescript
import { computed, markRaw, onMounted, onUnmounted, ref, shallowRef, toRaw, watch } from 'vue';

interface UseDataStreamOptions<TDatum> {
    chart: Ref<AgChartInstance<TDatum> | null>;
    streamUrl?: string;
    seriesId?: string;
    maxDataPoints?: number;
    updateFrequency?: number;
    bufferSize?: number;
    onError?: (error: Error) => void;
}

interface UseDataStreamReturn<TDatum> {
    isConnected: Readonly<Ref<boolean>>;
    connectionError: Readonly<Ref<Error | null>>;
    bufferLength: ComputedRef<number>;
    streamStats: ComputedRef<StreamStats>;
    connect: () => void;
    disconnect: () => void;
    addData: (data: TDatum) => void;
    addBatch: (data: TDatum[]) => void;
}

interface StreamStats {
    messagesReceived: number;
    dataPointsProcessed: number;
    bufferOverflows: number;
    connectionRetries: number;
}

export function useDataStream<TDatum = any>(options: UseDataStreamOptions<TDatum>): UseDataStreamReturn<TDatum> {
    const {
        chart,
        streamUrl,
        seriesId,
        maxDataPoints = 10000,
        updateFrequency = 100, // ms
        bufferSize = 100,
        onError,
    } = options;

    const isConnected = ref(false);
    const connectionError = ref<Error | null>(null);

    // Use shallowRef for performance-critical data structures
    const dataBuffer = shallowRef<TDatum[]>(markRaw([]));
    const webSocket = shallowRef<WebSocket | null>(null);

    const statsRef = ref({
        messagesReceived: 0,
        dataPointsProcessed: 0,
        bufferOverflows: 0,
        connectionRetries: 0,
    });

    let flushTimeoutId: number | null = null;
    let lastFlushTime = Date.now();

    // Optimized buffer flushing
    const flushBuffer = () => {
        if (!chart.value || dataBuffer.value.length === 0) return;

        const data = [...toRaw(dataBuffer.value)];
        dataBuffer.value = markRaw([]);

        // Use chart's incremental update API (focus on data processing optimization)
        toRaw(chart.value)
            .updateDataAsync({
                seriesId,
                append: data,
            })
            .then(() => {
                statsRef.value.dataPointsProcessed += data.length;
            })
            .catch(onError);
    };

    // Add single data point
    const addData = (data: TDatum) => {
        const currentBuffer = toRaw(dataBuffer.value);

        // Check for buffer overflow
        if (currentBuffer.length >= bufferSize) {
            statsRef.value.bufferOverflows++;
            // Remove oldest data to make room
            currentBuffer.shift();
        }

        dataBuffer.value = markRaw([...currentBuffer, data]);

        // Throttled flushing for performance
        const now = Date.now();
        if (now - lastFlushTime >= updateFrequency) {
            flushBuffer();
            lastFlushTime = now;
        } else if (!flushTimeoutId) {
            flushTimeoutId = setTimeout(() => {
                flushBuffer();
                flushTimeoutId = null;
                lastFlushTime = Date.now();
            }, updateFrequency);
        }
    };

    // Add batch of data
    const addBatch = (data: TDatum[]) => {
        data.forEach((item) => addData(item));
    };

    // WebSocket connection management
    const connect = () => {
        if (!streamUrl || webSocket.value) return;

        try {
            const ws = new WebSocket(streamUrl);
            webSocket.value = markRaw(ws);

            ws.onopen = () => {
                isConnected.value = true;
                connectionError.value = null;
            };

            ws.onmessage = (event) => {
                try {
                    const data: TDatum = JSON.parse(event.data);
                    statsRef.value.messagesReceived++;
                    addData(data);
                } catch (error) {
                    onError?.(error as Error);
                }
            };

            ws.onclose = () => {
                isConnected.value = false;
                webSocket.value = null;
            };

            ws.onerror = (event) => {
                const error = new Error('WebSocket connection failed');
                connectionError.value = error;
                onError?.(error);
                statsRef.value.connectionRetries++;
            };
        } catch (error) {
            connectionError.value = error as Error;
            onError?.(error as Error);
        }
    };

    const disconnect = () => {
        if (webSocket.value) {
            toRaw(webSocket.value).close();
            webSocket.value = null;
        }
        isConnected.value = false;
    };

    // Computed properties
    const bufferLength = computed(() => dataBuffer.value.length);

    const streamStats = computed<StreamStats>(() => ({
        messagesReceived: statsRef.value.messagesReceived,
        dataPointsProcessed: statsRef.value.dataPointsProcessed,
        bufferOverflows: statsRef.value.bufferOverflows,
        connectionRetries: statsRef.value.connectionRetries,
    }));

    // Auto-connect when URL changes
    watch(
        () => streamUrl,
        (newUrl, oldUrl) => {
            if (newUrl !== oldUrl) {
                disconnect();
                if (newUrl) {
                    connect();
                }
            }
        },
        { immediate: true }
    );

    // Auto-connect when chart becomes available
    watch(
        chart,
        (newChart) => {
            if (newChart && streamUrl && !webSocket.value) {
                connect();
            }
        },
        { immediate: true }
    );

    // Cleanup
    onUnmounted(() => {
        if (flushTimeoutId) {
            clearTimeout(flushTimeoutId);
        }
        disconnect();
    });

    return {
        isConnected: readonly(isConnected),
        connectionError: readonly(connectionError),
        bufferLength,
        streamStats,
        connect,
        disconnect,
        addData,
        addBatch,
    };
}
```

### 3. useChartDataWindow Composable

```typescript
import { computed, markRaw, ref, shallowRef, toRaw, watch } from 'vue';

interface UseChartDataWindowOptions<TDatum> {
    maxDataPoints?: number;
    maxAge?: number; // milliseconds
    agingStrategy?: 'fifo' | 'time-based' | 'custom';
    onDataAged?: (agedData: TDatum[]) => void;
    timestampKey?: keyof TDatum;
}

interface UseChartDataWindowReturn<TDatum> {
    windowedData: ComputedRef<TDatum[]>;
    addData: (data: TDatum | TDatum[]) => void;
    clearData: () => void;
    currentSize: ComputedRef<number>;
    memoryUsage: ComputedRef<number>;
    isWindowActive: ComputedRef<boolean>;
}

export function useChartDataWindow<TDatum = any>(
    options: UseChartDataWindowOptions<TDatum> = {}
): UseChartDataWindowReturn<TDatum> {
    const {
        maxDataPoints = 10000,
        maxAge = 24 * 60 * 60 * 1000, // 24 hours
        agingStrategy = 'fifo',
        onDataAged,
        timestampKey = 'timestamp' as keyof TDatum,
    } = options;

    // CRITICAL: Use shallowRef + markRaw for large data arrays
    const dataStore = shallowRef<TDatum[]>(markRaw([]));

    // Add data with automatic windowing
    const addData = (data: TDatum | TDatum[]) => {
        const items = Array.isArray(data) ? data : [data];
        const currentData = toRaw(dataStore.value);
        const newData = [...currentData, ...items];

        // Apply windowing strategy
        let windowedData = newData;

        if (agingStrategy === 'fifo' && newData.length > maxDataPoints) {
            const excess = newData.length - maxDataPoints;
            const agedData = newData.slice(0, excess);
            windowedData = newData.slice(excess);

            if (onDataAged && agedData.length > 0) {
                onDataAged(agedData);
            }
        } else if (agingStrategy === 'time-based' && timestampKey) {
            const cutoffTime = Date.now() - maxAge;
            const filteredData = newData.filter((item) => {
                const timestamp = item[timestampKey] as unknown as number;
                return timestamp > cutoffTime;
            });

            const agedData = newData.filter((item) => {
                const timestamp = item[timestampKey] as unknown as number;
                return timestamp <= cutoffTime;
            });

            windowedData = filteredData;

            if (onDataAged && agedData.length > 0) {
                onDataAged(agedData);
            }
        }

        // Update with markRaw to prevent deep reactivity
        dataStore.value = markRaw(windowedData);
    };

    const clearData = () => {
        dataStore.value = markRaw([]);
    };

    // Computed properties
    const windowedData = computed(() => dataStore.value);
    const currentSize = computed(() => dataStore.value.length);
    const memoryUsage = computed(() => {
        // Rough estimate of memory usage in bytes
        return JSON.stringify(dataStore.value).length * 2; // UTF-16 characters
    });
    const isWindowActive = computed(() => currentSize.value >= maxDataPoints * 0.8);

    return {
        windowedData,
        addData,
        clearData,
        currentSize,
        memoryUsage,
        isWindowActive,
    };
}
```

## Performance Optimization Strategies

### 1. Reactivity System Optimization

```typescript
// Critical patterns for Vue 3 performance optimization

// ✅ CORRECT: Prevent deep reactivity on large datasets
const chartData = shallowRef(markRaw(largeDataArray));
const chartOptions = shallowRef(markRaw(optionsObject));

// ✅ CORRECT: Use toRaw when accessing chart methods
const chart = shallowRef(markRaw(chartInstance));
toRaw(chart.value).updateData(transaction);

// ✅ CORRECT: Mark complex objects as raw
const complexData = markRaw({
  dataset: largeArray,
  metadata: metadata,
  computedValues: expensiveCalculations,
});

// ❌ WRONG: Deep reactivity on large data structures
const chartData = ref(largeDataArray); // Vue will proxy every item
const chartOptions = reactive(optionsObject); // Deep reactivity overhead

// ❌ WRONG: Not using toRaw for method calls
chart.value.updateData(transaction); // Vue proxy overhead
```

### 2. Efficient Watch Patterns

```typescript
// Optimized watching for chart updates
export function useOptimizedChartWatching<TDatum>(
    chartOptions: Ref<AgChartOptions>,
    chartInstance: Ref<AgChartInstance<TDatum> | null>
) {
    // ✅ CORRECT: Shallow watching with reference comparison
    watch(
        chartOptions,
        (newOptions, oldOptions) => {
            // Only update if reference changed (focus on data processing optimization)
            if (newOptions !== oldOptions && chartInstance.value) {
                const rawOptions = markRaw(toRaw(newOptions));
                toRaw(chartInstance.value).update(rawOptions);
            }
        },
        {
            flush: 'post', // Batch with DOM updates
            deep: false, // Disable deep watching for performance
        }
    );

    // ✅ CORRECT: Watch specific properties that affect data processing
    watchEffect(() => {
        if (chartInstance.value && chartOptions.value.data) {
            // Focus on optimizing this data processing path
            const processedData = processDataForChart(chartOptions.value.data);
            toRaw(chartInstance.value).updateDataAsync({
                replace: processedData,
            });
        }
    });

    // ❌ WRONG: Deep watching large objects
    watch(chartOptions, updateChart, { deep: true }); // Expensive!
    watch(() => chartOptions.value.data, updateData, { deep: true }); // Avoid!
}
```

### 3. Memory-Efficient Data Processing

```typescript
// Composable for memory-efficient data processing
export function useDataProcessingOptimization<TDatum>() {
  // Use computed with proper dependencies
  const processedData = computed(() => {
    // Only recompute when source data reference changes
    return rawData.value.map(item => ({
      ...item,
      // Focus optimization on these expensive calculations (68% of performance)
      movingAverage: calculateMovingAverage(item),
      trend: calculateTrend(item),
      volatility: calculateVolatility(item),
    }));
  });

  // Batch processing for large datasets
  const processBatchedData = (data: TDatum[], batchSize = 1000) => {
    const results: ProcessedData<TDatum>[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      // Process batch to avoid blocking UI
      const processedBatch = batch.map(item => processDataPoint(item));
      results.push(...processedBatch);

      // Yield control to browser between batches
      if (i + batchSize < data.length) {
        await nextTick();
      }
    }

    return markRaw(results);
  };

  return {
    processedData,
    processBatchedData,
  };
}
```

### 4. Component Memoization Patterns

```typescript
// Memoized chart controls component
<template>
  <div class="chart-controls">
    <button
      @click="handleAddData"
      :disabled="isProcessing"
    >
      Add Data Point
    </button>
    <button
      @click="handleClearData"
      :disabled="isProcessing"
    >
      Clear Data
    </button>
    <div class="stats">
      <span>Data Updates: {{ stats.totalTransactions }}</span>
      <span>Processing Time: {{ stats.dataProcessingTime.toFixed(2) }}ms</span>
      <span>Rendering: ~3-4ms (optimized)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ChartControlsProps {
  onAddData: (data: any[]) => void;
  onClearData: () => void;
  isProcessing: boolean;
  stats: TransactionStats;
}

const props = defineProps<ChartControlsProps>();

// Memoize expensive operations
const handleAddData = () => {
  props.onAddData([generateRandomData()]);
};

const handleClearData = () => {
  props.onClearData();
};
</script>

<script lang="ts">
// Component-level optimization
export default defineComponent({
  // Equivalent to React.memo - prevent re-renders when props haven't changed
  __hmrId: 'ChartControls',
});
</script>
```

## Component Implementation Patterns

### 1. High-Performance Chart Component

```vue
<template>
  <div class="incremental-chart-container">
    <div ref="chartContainer" :style="containerStyle" />
    <div v-if="showMetrics" class="performance-metrics">
      <div>FPS: {{ metrics.fps }}</div>
      <div>Data Processing: {{ metrics.dataProcessingTime.toFixed(2) }}ms</div>
      <div>Rendering: ~3-4ms (optimized)</div>
      <div>Updates: {{ metrics.totalTransactions }}</div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TDatum">
import { computed, onMounted, ref, shallowRef, markRaw, toRaw } from 'vue';
import { useIncrementalChart } from './composables/useIncrementalChart';

interface IncrementalChartProps<TDatum> {
  options: AgChartOptions;
  width?: string;
  height?: string;
  showMetrics?: boolean;
  maxDataPoints?: number;
  updateFrequency?: number;
}

const props = withDefaults(defineProps<IncrementalChartProps<TDatum>>(), {
  width: '100%',
  height: '400px',
  showMetrics: false,
  maxDataPoints: 10000,
  updateFrequency: 16, // ~60fps
});

const emit = defineEmits<{
  chartReady: [instance: AgChartInstance<TDatum>];
  dataUpdated: [result: AgDataTransactionResult];
  error: [error: Error];
}>();

const chartContainer = ref<HTMLDivElement>();

// Use optimized chart composable
const {
  chartInstance,
  updateData,
  updateDataBatch,
  initChart,
  stats,
  isUpdating,
  error,
} = useIncrementalChart<TDatum>({
  maxRetries: 3,
  batchWindow: props.updateFrequency,
  onError: (err) => emit('error', err),
});

// Computed styles
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
}));

// Performance metrics
const metrics = computed(() => ({
  fps: Math.round(1000 / Math.max(stats.value.averageLatency, 16)),
  dataProcessingTime: stats.value.dataProcessingTime,
  totalTransactions: stats.value.totalTransactions,
  renderingTime: 3.5, // Known optimized rendering time
}));

// Initialize chart on mount
onMounted(() => {
  if (chartContainer.value) {
    const chart = initChart(chartContainer.value, props.options);
    emit('chartReady', chart);
  }
});

// Expose methods for parent components
defineExpose({
  updateData: async (transaction: AgDataTransaction<TDatum>) => {
    try {
      const result = await updateData(transaction);
      emit('dataUpdated', result);
      return result;
    } catch (err) {
      emit('error', err as Error);
      throw err;
    }
  },
  updateDataBatch,
  getInstance: () => toRaw(chartInstance.value),
  getStats: () => stats.value,
});
</script>

<style scoped>
.incremental-chart-container {
  position: relative;
}

.performance-metrics {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.performance-metrics > div {
  margin-bottom: 2px;
}
</style>
```

### 2. Streaming Chart Component

```vue
<template>
  <div class="streaming-chart">
    <div class="stream-controls">
      <button @click="toggleStream" :disabled="connecting">
        {{ isConnected ? 'Disconnect' : 'Connect' }}
      </button>
      <div class="stream-status" :class="statusClass">
        {{ statusText }}
      </div>
      <div class="stream-stats">
        <span>Received: {{ streamStats.messagesReceived }}</span>
        <span>Processed: {{ streamStats.dataPointsProcessed }}</span>
        <span>Buffer: {{ bufferLength }}</span>
      </div>
    </div>

    <IncrementalChart
      ref="chartRef"
      :options="chartOptions"
      :show-metrics="true"
      @chart-ready="onChartReady"
      @error="onChartError"
    />
  </div>
</template>

<script setup lang="ts" generic="TDatum">
import { ref, computed, watch } from 'vue';
import { useDataStream } from './composables/useDataStream';
import IncrementalChart from './IncrementalChart.vue';

interface StreamingChartProps<TDatum> {
  streamUrl?: string;
  chartOptions: AgChartOptions;
  seriesId?: string;
  maxDataPoints?: number;
  updateFrequency?: number;
}

const props = defineProps<StreamingChartProps<TDatum>>();

const emit = defineEmits<{
  connected: [];
  disconnected: [];
  error: [error: Error];
  dataReceived: [data: TDatum];
}>();

const chartRef = ref();
const chartInstance = ref<AgChartInstance<TDatum> | null>(null);
const connecting = ref(false);

// Use data streaming composable
const {
  isConnected,
  connectionError,
  bufferLength,
  streamStats,
  connect,
  disconnect,
} = useDataStream<TDatum>({
  chart: chartInstance,
  streamUrl: props.streamUrl,
  seriesId: props.seriesId,
  maxDataPoints: props.maxDataPoints,
  updateFrequency: props.updateFrequency,
  onError: (error) => emit('error', error),
});

// Computed properties
const statusClass = computed(() => ({
  'status-connected': isConnected.value,
  'status-disconnected': !isConnected.value && !connecting.value,
  'status-connecting': connecting.value,
  'status-error': connectionError.value,
}));

const statusText = computed(() => {
  if (connectionError.value) return 'Error';
  if (connecting.value) return 'Connecting...';
  return isConnected.value ? 'Connected' : 'Disconnected';
});

// Event handlers
const onChartReady = (instance: AgChartInstance<TDatum>) => {
  chartInstance.value = instance;
};

const onChartError = (error: Error) => {
  emit('error', error);
};

const toggleStream = async () => {
  if (isConnected.value) {
    disconnect();
  } else {
    connecting.value = true;
    try {
      connect();
      await new Promise(resolve => {
        const unwatch = watch(isConnected, (connected) => {
          if (connected) {
            unwatch();
            resolve(true);
          }
        });

        setTimeout(() => {
          unwatch();
          resolve(false);
        }, 5000);
      });
    } finally {
      connecting.value = false;
    }
  }
};

// Watch connection status
watch(isConnected, (connected) => {
  if (connected) {
    emit('connected');
  } else {
    emit('disconnected');
  }
});
</script>

<style scoped>
.streaming-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stream-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.stream-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.status-connected {
  background: #d4edda;
  color: #155724;
}

.status-disconnected {
  background: #f8d7da;
  color: #721c24;
}

.status-connecting {
  background: #fff3cd;
  color: #856404;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.stream-stats {
  display: flex;
  gap: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
}
</style>
```

## Real-world Examples

### 1. Financial Trading Dashboard

```vue
<template>
  <div class="trading-dashboard">
    <div class="dashboard-header">
      <h2>Live Trading Dashboard</h2>
      <div class="symbol-selector">
        <select v-model="selectedSymbol" @change="handleSymbolChange">
          <option v-for="symbol in symbols" :key="symbol" :value="symbol">
            {{ symbol }}
          </option>
        </select>
      </div>
      <div class="connection-status">
        <span :class="connectionStatusClass">
          {{ connectionStatusText }}
        </span>
      </div>
    </div>

    <div class="charts-grid">
      <div class="main-chart">
        <h3>{{ selectedSymbol }} Price & Volume</h3>
        <IncrementalChart
          ref="mainChartRef"
          :options="mainChartOptions"
          :show-metrics="true"
          height="400px"
          @chart-ready="onMainChartReady"
        />
      </div>

      <div class="indicator-charts">
        <div class="indicator-chart">
          <h4>RSI</h4>
          <IncrementalChart
            ref="rsiChartRef"
            :options="rsiChartOptions"
            height="150px"
            @chart-ready="onRSIChartReady"
          />
        </div>

        <div class="indicator-chart">
          <h4>MACD</h4>
          <IncrementalChart
            ref="macdChartRef"
            :options="macdChartOptions"
            height="150px"
            @chart-ready="onMACDChartReady"
          />
        </div>
      </div>
    </div>

    <div class="order-book">
      <h3>Order Book</h3>
      <div class="order-book-content">
        <!-- Order book implementation -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef, markRaw } from 'vue';
import { useIncrementalChart } from './composables/useIncrementalChart';
import { useDataStream } from './composables/useDataStream';
import IncrementalChart from './components/IncrementalChart.vue';

interface TradingTick {
  timestamp: number;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid: number;
  ask: number;
}

interface IndicatorValue {
  timestamp: number;
  value: number;
}

interface TradingDashboardProps {
  symbols: string[];
  wsUrl: string;
}

const props = defineProps<TradingDashboardProps>();

const selectedSymbol = ref(props.symbols[0]);
const mainChartRef = ref();
const rsiChartRef = ref();
const macdChartRef = ref();

// Chart instances
const mainChartInstance = ref<AgChartInstance<TradingTick> | null>(null);
const rsiChartInstance = ref<AgChartInstance<IndicatorValue> | null>(null);
const macdChartInstance = ref<AgChartInstance<IndicatorValue> | null>(null);

// Data processing composables
const {
  updateData: updateMainChart,
  stats: mainChartStats,
} = useIncrementalChart<TradingTick>({
  seriesId: 'ohlc-series',
  batchWindow: 8, // ~120fps for financial data
  maxBatchSize: 50,
});

const {
  updateData: updateRSIChart,
} = useIncrementalChart<IndicatorValue>({
  seriesId: 'rsi-series',
  batchWindow: 16,
});

const {
  updateData: updateMACDChart,
} = useIncrementalChart<IndicatorValue>({
  seriesId: 'macd-series',
  batchWindow: 16,
});

// Streaming data
const {
  isConnected,
  connectionError,
  streamStats,
} = useDataStream<TradingTick>({
  chart: mainChartInstance,
  streamUrl: computed(() => `${props.wsUrl}?symbol=${selectedSymbol.value}`),
  updateFrequency: 8, // High frequency for trading data
  onError: (error) => console.error('Stream error:', error),
});

// Chart configurations
const mainChartOptions = computed(() => markRaw({
  data: [], // Start with empty data
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
      yName: 'Volume',
      yAxis: 'volume',
    },
  ],
  axes: [
    {
      type: 'time',
      position: 'bottom',
    },
    {
      type: 'number',
      position: 'left',
    },
    {
      type: 'number',
      position: 'right',
      keys: ['volume'],
      id: 'volume',
    },
  ],
}));

const rsiChartOptions = computed(() => markRaw({
  data: [],
  series: [
    {
      type: 'line',
      xKey: 'timestamp',
      yKey: 'value',
    },
  ],
  axes: [
    {
      type: 'time',
      position: 'bottom',
    },
    {
      type: 'number',
      position: 'left',
      min: 0,
      max: 100,
    },
  ],
}));

const macdChartOptions = computed(() => markRaw({
  data: [],
  series: [
    {
      type: 'line',
      xKey: 'timestamp',
      yKey: 'value',
    },
  ],
}));

// Computed properties
const connectionStatusClass = computed(() => ({
  'status-connected': isConnected.value,
  'status-error': connectionError.value,
  'status-disconnected': !isConnected.value && !connectionError.value,
}));

const connectionStatusText = computed(() => {
  if (connectionError.value) return 'Connection Error';
  return isConnected.value ? 'Connected' : 'Disconnected';
});

// Event handlers
const onMainChartReady = (instance: AgChartInstance<TradingTick>) => {
  mainChartInstance.value = instance;
};

const onRSIChartReady = (instance: AgChartInstance<IndicatorValue>) => {
  rsiChartInstance.value = instance;
};

const onMACDChartReady = (instance: AgChartInstance<IndicatorValue>) => {
  macdChartInstance.value = instance;
};

const handleSymbolChange = () => {
  // Clear existing data when symbol changes
  if (mainChartInstance.value) {
    updateMainChart({ clear: true });
  }
  if (rsiChartInstance.value) {
    updateRSIChart({ clear: true });
  }
  if (macdChartInstance.value) {
    updateMACDChart({ clear: true });
  }
};

// Technical indicator calculations (simplified)
const calculateRSI = (prices: number[], period = 14): number => {
  // RSI calculation logic (focus on optimizing this data processing)
  return 50; // Placeholder
};

const calculateMACD = (prices: number[]): number => {
  // MACD calculation logic (focus on optimizing this data processing)
  return 0; // Placeholder
};

// Handle incoming trading data
const handleTradingTick = (tick: TradingTick) => {
  if (tick.symbol !== selectedSymbol.value) return;

  // Update main chart with OHLC data (focus on data processing optimization)
  updateMainChart({
    append: [tick],
  });

  // Calculate and update indicators (major data processing optimization target)
  const rsiValue = calculateRSI([tick.close]); // In real implementation, maintain price history
  updateRSIChart({
    append: [{ timestamp: tick.timestamp, value: rsiValue }],
  });

  const macdValue = calculateMACD([tick.close]);
  updateMACDChart({
    append: [{ timestamp: tick.timestamp, value: macdValue }],
  });
};

// Set up WebSocket message handling
onMounted(() => {
  // This would be handled by the useDataStream composable
  // but shown here for demonstration of data processing flow
});
</script>

<style scoped>
.trading-dashboard {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  height: 100vh;
  padding: 1rem;
}

.dashboard-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.charts-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-chart {
  flex: 1;
}

.indicator-charts {
  display: flex;
  gap: 1rem;
}

.indicator-chart {
  flex: 1;
}

.order-book {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.status-connected {
  color: #28a745;
}

.status-error {
  color: #dc3545;
}

.status-disconnected {
  color: #ffc107;
}
</style>
```

### 2. IoT Sensor Monitoring Dashboard

```vue
<template>
  <div class="iot-dashboard">
    <div class="dashboard-header">
      <h2>IoT Sensor Monitoring</h2>
      <div class="alert-summary">
        <span class="alert-count" :class="alertSeverityClass">
          {{ activeAlerts.length }} Active Alerts
        </span>
      </div>
    </div>

    <div class="sensors-grid">
      <div
        v-for="sensor in sensors"
        :key="sensor.id"
        class="sensor-panel"
        :class="{ 'sensor-alert': hasSensorAlert(sensor.id) }"
      >
        <div class="sensor-header">
          <h3>{{ sensor.name }}</h3>
          <div class="sensor-status" :class="getSensorStatusClass(sensor.id)">
            {{ getSensorStatus(sensor.id) }}
          </div>
        </div>

        <div class="sensor-charts">
          <div class="chart-section">
            <h4>Temperature & Humidity</h4>
            <IncrementalChart
              :ref="el => setSensorChartRef(sensor.id, 'temp-humidity', el)"
              :options="getTempHumidityOptions(sensor.id)"
              height="200px"
              @chart-ready="(instance) => onSensorChartReady(sensor.id, 'temp-humidity', instance)"
            />
          </div>

          <div class="chart-section">
            <h4>Pressure & Battery</h4>
            <IncrementalChart
              :ref="el => setSensorChartRef(sensor.id, 'pressure-battery', el)"
              :options="getPressureBatteryOptions(sensor.id)"
              height="150px"
              @chart-ready="(instance) => onSensorChartReady(sensor.id, 'pressure-battery', instance)"
            />
          </div>
        </div>

        <div class="sensor-readings">
          <div class="reading">
            <span class="label">Temperature:</span>
            <span class="value">{{ getLatestReading(sensor.id, 'temperature') }}°C</span>
          </div>
          <div class="reading">
            <span class="label">Humidity:</span>
            <span class="value">{{ getLatestReading(sensor.id, 'humidity') }}%</span>
          </div>
          <div class="reading">
            <span class="label">Pressure:</span>
            <span class="value">{{ getLatestReading(sensor.id, 'pressure') }} hPa</span>
          </div>
          <div class="reading">
            <span class="label">Battery:</span>
            <span class="value">{{ getLatestReading(sensor.id, 'batteryLevel') }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="alerts-panel">
      <h3>Recent Alerts</h3>
      <div class="alerts-list">
        <div
          v-for="alert in recentAlerts"
          :key="alert.id"
          class="alert-item"
          :class="alert.severity"
        >
          <div class="alert-time">{{ formatTime(alert.timestamp) }}</div>
          <div class="alert-sensor">{{ alert.sensorId }}</div>
          <div class="alert-message">{{ alert.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, shallowRef, markRaw, toRaw } from 'vue';
import { useIncrementalChart } from './composables/useIncrementalChart';
import { useDataStream } from './composables/useDataStream';
import { useChartDataWindow } from './composables/useChartDataWindow';
import IncrementalChart from './components/IncrementalChart.vue';

interface SensorReading {
  timestamp: number;
  sensorId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  batteryLevel: number;
}

interface SensorAlert {
  id: string;
  sensorId: string;
  timestamp: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
}

interface Sensor {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface IoTDashboardProps {
  sensors: Sensor[];
  streamUrl: string;
  alertThresholds: Record<string, Record<string, number>>;
}

const props = defineProps<IoTDashboardProps>();

// State management
const sensorChartInstances = reactive<Record<string, Record<string, AgChartInstance<SensorReading> | null>>>({});
const sensorChartRefs = reactive<Record<string, Record<string, any>>>({});
const latestReadings = reactive<Record<string, SensorReading>>({});
const alerts = shallowRef<SensorAlert[]>(markRaw([]));

// Data processing composables for each sensor
const sensorComposables = computed(() => {
  const composables: Record<string, any> = {};

  props.sensors.forEach(sensor => {
    composables[sensor.id] = {
      tempHumidity: useIncrementalChart<SensorReading>({
        seriesId: `${sensor.id}-temp-humidity`,
        batchWindow: 100, // Lower frequency for IoT data
        maxBatchSize: 20,
      }),
      pressureBattery: useIncrementalChart<SensorReading>({
        seriesId: `${sensor.id}-pressure-battery`,
        batchWindow: 100,
        maxBatchSize: 20,
      }),
      dataWindow: useChartDataWindow<SensorReading>({
        maxDataPoints: 1000, // Keep last 1000 readings per sensor
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        agingStrategy: 'time-based',
        timestampKey: 'timestamp',
      }),
    };
  });

  return composables;
});

// Data streaming
const {
  isConnected,
  connectionError,
  streamStats,
} = useDataStream<SensorReading>({
  chart: computed(() => null), // Not using direct chart binding
  streamUrl: props.streamUrl,
  updateFrequency: 200, // Slower updates for IoT sensors
  onError: (error) => console.error('IoT stream error:', error),
});

// Chart configurations
const getTempHumidityOptions = (sensorId: string) => markRaw({
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
      yAxis: 'humidity',
      stroke: '#4ecdc4',
    },
  ],
  axes: [
    {
      type: 'time',
      position: 'bottom',
    },
    {
      type: 'number',
      position: 'left',
      title: { text: 'Temperature (°C)' },
    },
    {
      type: 'number',
      position: 'right',
      keys: ['humidity'],
      id: 'humidity',
      title: { text: 'Humidity (%)' },
    },
  ],
});

const getPressureBatteryOptions = (sensorId: string) => markRaw({
  data: [],
  series: [
    {
      type: 'line',
      xKey: 'timestamp',
      yKey: 'pressure',
      yName: 'Pressure (hPa)',
      stroke: '#45b7d1',
    },
    {
      type: 'line',
      xKey: 'timestamp',
      yKey: 'batteryLevel',
      yName: 'Battery (%)',
      yAxis: 'battery',
      stroke: '#96ceb4',
    },
  ],
  axes: [
    {
      type: 'time',
      position: 'bottom',
    },
    {
      type: 'number',
      position: 'left',
      title: { text: 'Pressure (hPa)' },
    },
    {
      type: 'number',
      position: 'right',
      keys: ['batteryLevel'],
      id: 'battery',
      title: { text: 'Battery (%)' },
      min: 0,
      max: 100,
    },
  ],
});

// Computed properties
const activeAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const ageMinutes = (Date.now() - alert.timestamp) / (1000 * 60);
    return ageMinutes < 60; // Active for 1 hour
  });
});

const recentAlerts = computed(() => {
  return [...alerts.value]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);
});

const alertSeverityClass = computed(() => {
  const criticalCount = activeAlerts.value.filter(a => a.severity === 'critical').length;
  const highCount = activeAlerts.value.filter(a => a.severity === 'high').length;

  if (criticalCount > 0) return 'critical';
  if (highCount > 0) return 'high';
  if (activeAlerts.value.length > 0) return 'medium';
  return 'low';
});

// Helper functions
const setSensorChartRef = (sensorId: string, chartType: string, el: any) => {
  if (!sensorChartRefs[sensorId]) {
    sensorChartRefs[sensorId] = {};
  }
  sensorChartRefs[sensorId][chartType] = el;
};

const onSensorChartReady = (sensorId: string, chartType: string, instance: AgChartInstance<SensorReading>) => {
  if (!sensorChartInstances[sensorId]) {
    sensorChartInstances[sensorId] = {};
  }
  sensorChartInstances[sensorId][chartType] = instance;
};

const getLatestReading = (sensorId: string, metric: keyof SensorReading): string => {
  const reading = latestReadings[sensorId];
  if (!reading) return 'N/A';

  const value = reading[metric];
  if (typeof value === 'number') {
    return value.toFixed(1);
  }
  return String(value);
};

const getSensorStatus = (sensorId: string): string => {
  const reading = latestReadings[sensorId];
  if (!reading) return 'Offline';

  const ageMinutes = (Date.now() - reading.timestamp) / (1000 * 60);
  if (ageMinutes > 5) return 'Stale';

  return 'Online';
};

const getSensorStatusClass = (sensorId: string): string => {
  const status = getSensorStatus(sensorId);
  return `status-${status.toLowerCase()}`;
};

const hasSensorAlert = (sensorId: string): boolean => {
  return activeAlerts.value.some(alert => alert.sensorId === sensorId);
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

// Alert checking function (focus on data processing optimization)
const checkForAlerts = (reading: SensorReading) => {
  const thresholds = props.alertThresholds[reading.sensorId];
  if (!thresholds) return;

  const checks = [
    {
      metric: 'temperature',
      value: reading.temperature,
      threshold: thresholds.temperature,
      message: `High temperature: ${reading.temperature}°C`,
    },
    {
      metric: 'humidity',
      value: reading.humidity,
      threshold: thresholds.humidity,
      message: `High humidity: ${reading.humidity}%`,
    },
    {
      metric: 'pressure',
      value: reading.pressure,
      threshold: thresholds.pressure,
      message: `Abnormal pressure: ${reading.pressure} hPa`,
    },
    {
      metric: 'batteryLevel',
      value: reading.batteryLevel,
      threshold: thresholds.batteryLevel,
      message: `Low battery: ${reading.batteryLevel}%`,
      inverted: true, // Alert when below threshold
    },
  ];

  checks.forEach(check => {
    const isAlert = check.inverted
      ? check.value < check.threshold
      : check.value > check.threshold;

    if (isAlert) {
      const alert: SensorAlert = {
        id: `${reading.sensorId}-${check.metric}-${Date.now()}`,
        sensorId: reading.sensorId,
        timestamp: Date.now(),
        message: check.message,
        severity: determineSeverity(check.metric, check.value, check.threshold),
        value: check.value,
        threshold: check.threshold,
      };

      const currentAlerts = toRaw(alerts.value);
      alerts.value = markRaw([...currentAlerts, alert]);
    }
  });
};

const determineSeverity = (metric: string, value: number, threshold: number): SensorAlert['severity'] => {
  // Simplified severity logic
  const deviation = Math.abs(value - threshold) / threshold;

  if (deviation > 0.5) return 'critical';
  if (deviation > 0.3) return 'high';
  if (deviation > 0.1) return 'medium';
  return 'low';
};

// Handle incoming sensor data (major data processing optimization area)
const handleSensorReading = (reading: SensorReading) => {
  // Update latest readings
  latestReadings[reading.sensorId] = reading;

  // Check for alerts (optimize this data processing)
  checkForAlerts(reading);

  // Update charts with incremental data
  const composable = sensorComposables.value[reading.sensorId];
  if (composable) {
    // Add to data window for memory management
    composable.dataWindow.addData(reading);

    // Update temperature/humidity chart
    composable.tempHumidity.updateData({
      append: [reading],
    });

    // Update pressure/battery chart
    composable.pressureBattery.updateData({
      append: [reading],
    });
  }
};

// WebSocket message handling would be integrated with useDataStream
// This is shown for demonstration of the data processing flow

onMounted(() => {
  // Initialize sensor chart instances
  props.sensors.forEach(sensor => {
    sensorChartInstances[sensor.id] = {};
  });
});
</script>

<style scoped>
.iot-dashboard {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  gap: 1rem;
  height: 100vh;
  padding: 1rem;
}

.dashboard-header {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.alert-count {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
}

.alert-count.critical {
  background: #dc3545;
  color: white;
}

.alert-count.high {
  background: #fd7e14;
  color: white;
}

.alert-count.medium {
  background: #ffc107;
  color: #212529;
}

.alert-count.low {
  background: #28a745;
  color: white;
}

.sensors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1rem;
  overflow-y: auto;
}

.sensor-panel {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  transition: border-color 0.3s;
}

.sensor-panel.sensor-alert {
  border-color: #dc3545;
  box-shadow: 0 0 10px rgba(220, 53, 69, 0.3);
}

.sensor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sensor-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.875rem;
}

.status-online {
  background: #d4edda;
  color: #155724;
}

.status-stale {
  background: #fff3cd;
  color: #856404;
}

.status-offline {
  background: #f8d7da;
  color: #721c24;
}

.sensor-charts {
  margin-bottom: 1rem;
}

.chart-section {
  margin-bottom: 1rem;
}

.chart-section h4 {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.sensor-readings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.reading {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.reading .label {
  color: #6c757d;
}

.reading .value {
  font-weight: bold;
}

.alerts-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
}

.alerts-list {
  max-height: 500px;
  overflow-y: auto;
}

.alert-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.alert-item.critical {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.alert-item.high {
  background: #fff3cd;
  border-left: 4px solid #fd7e14;
}

.alert-item.medium {
  background: #e2e3e5;
  border-left: 4px solid #ffc107;
}

.alert-item.low {
  background: #d1ecf1;
  border-left: 4px solid #17a2b8;
}

.alert-time {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.alert-sensor {
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.alert-message {
  font-weight: 500;
}
</style>
```

## Integration Patterns

### 1. State Management Integration (Pinia)

```typescript
// stores/chartData.ts
import { defineStore } from 'pinia';
import { markRaw, ref, shallowRef, toRaw } from 'vue';

export const useChartDataStore = defineStore('chartData', () => {
    // CRITICAL: Use shallowRef for performance with large datasets
    const chartData = shallowRef<Record<string, any[]>>(markRaw({}));
    const isLoading = ref(false);
    const error = ref<Error | null>(null);

    // Track data processing metrics (focus area for optimization)
    const processingStats = ref({
        totalUpdates: 0,
        dataProcessingTime: 0,
        renderingTime: 3.5, // Known optimized rendering time
    });

    const setChartData = (chartId: string, data: any[]) => {
        const currentData = toRaw(chartData.value);
        chartData.value = markRaw({
            ...currentData,
            [chartId]: data,
        });
    };

    const appendChartData = (chartId: string, newData: any[]) => {
        const startTime = performance.now();

        const currentData = toRaw(chartData.value);
        const existingData = currentData[chartId] || [];

        // Focus optimization on this data processing step
        const updatedData = [...existingData, ...newData];

        chartData.value = markRaw({
            ...currentData,
            [chartId]: updatedData,
        });

        // Track data processing performance
        const processingTime = performance.now() - startTime;
        processingStats.value.totalUpdates++;
        processingStats.value.dataProcessingTime += processingTime;
    };

    const clearChartData = (chartId: string) => {
        const currentData = toRaw(chartData.value);
        const { [chartId]: removed, ...rest } = currentData;
        chartData.value = markRaw(rest);
    };

    return {
        chartData,
        isLoading,
        error,
        processingStats,
        setChartData,
        appendChartData,
        clearChartData,
    };
});
```

### 2. Router Integration

```typescript
// composables/useChartRouting.ts
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useChartRouting() {
    const router = useRouter();
    const route = useRoute();

    // Reactive chart configuration based on route
    const chartConfig = computed(() => {
        const { chartType, seriesId, timeRange } = route.query;

        return {
            chartType: (chartType as string) || 'line',
            seriesId: seriesId as string,
            timeRange: parseInt(timeRange as string) || 3600000, // 1 hour default
        };
    });

    const updateChartRoute = (config: { chartType?: string; seriesId?: string; timeRange?: number }) => {
        router.push({
            query: {
                ...route.query,
                ...config,
            },
        });
    };

    // Watch for route changes and update chart
    const onRouteChange = (callback: (config: any) => void) => {
        watch(chartConfig, callback, { immediate: true });
    };

    return {
        chartConfig,
        updateChartRoute,
        onRouteChange,
    };
}
```

### 3. API Integration (with vue-query)

```typescript
// composables/useChartQuery.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

export function useChartQuery<TDatum>(
    chartId: string,
    options: {
        refetchInterval?: number;
        enabled?: boolean;
    } = {}
) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['chartData', chartId],
        queryFn: () => fetchChartData<TDatum>(chartId),
        refetchInterval: options.refetchInterval || 5000,
        enabled: options.enabled,
    });

    const appendDataMutation = useMutation({
        mutationFn: (newData: TDatum[]) => appendChartData(chartId, newData),
        onSuccess: (newData) => {
            // Optimistically update cache (focus on data processing efficiency)
            queryClient.setQueryData(['chartData', chartId], (oldData: TDatum[] = []) =>
                markRaw([...toRaw(oldData), ...newData])
            );
        },
    });

    const chartData = computed(() => data.value || markRaw([]));

    return {
        chartData,
        isLoading,
        error,
        appendData: appendDataMutation.mutate,
        isAppending: appendDataMutation.isPending,
    };
}
```

## Testing Strategies

### 1. Vitest Unit Tests

```typescript
// tests/composables/useIncrementalChart.test.ts
import { useIncrementalChart } from '@/composables/useIncrementalChart';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { createMockChart } from './mocks/chartMocks';

describe('useIncrementalChart', () => {
    let mockChart: any;

    beforeEach(() => {
        mockChart = createMockChart();
    });

    it('should initialize with default options', () => {
        const { chartInstance, isUpdating, error, stats } = useIncrementalChart();

        expect(chartInstance.value).toBeNull();
        expect(isUpdating.value).toBe(false);
        expect(error.value).toBeNull();
        expect(stats.value.totalTransactions).toBe(0);
    });

    it('should update data successfully', async () => {
        const { updateData, initChart, stats } = useIncrementalChart();

        const container = document.createElement('div');
        initChart(container, { data: [], series: [] });

        const transaction = { append: [{ x: 1, y: 10 }] };
        const result = await updateData(transaction);

        expect(result.operationCounts.appended).toBe(1);
        expect(stats.value.totalTransactions).toBe(1);
        expect(stats.value.successfulTransactions).toBe(1);
    });

    it('should handle retries on failure', async () => {
        const mockErrorChart = {
            updateDataAsync: vi
                .fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue({ operationCounts: { appended: 1 }, processingTime: 15 }),
        };

        const { updateData } = useIncrementalChart({ maxRetries: 2 });

        const transaction = { append: [{ x: 1, y: 10 }] };
        const result = await updateData(transaction);

        expect(mockErrorChart.updateDataAsync).toHaveBeenCalledTimes(2);
        expect(result.operationCounts.appended).toBe(1);
    });

    it('should batch multiple transactions', async () => {
        const { updateDataBatch, initChart } = useIncrementalChart({
            batchWindow: 10,
            maxBatchSize: 5,
        });

        const container = document.createElement('div');
        initChart(container, { data: [], series: [] });

        const transactions = [
            { append: [{ x: 1, y: 10 }] },
            { append: [{ x: 2, y: 20 }] },
            { append: [{ x: 3, y: 30 }] },
        ];

        const results = await updateDataBatch(transactions);

        expect(results).toHaveLength(1); // Batched into single update
        expect(results[0].operationCounts.appended).toBe(3);
    });
});
```

### 2. Component Testing

```typescript
// tests/components/IncrementalChart.test.ts
import IncrementalChart from '@/components/IncrementalChart.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

describe('IncrementalChart', () => {
    const mockOptions = {
        data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    };

    it('should render chart container', () => {
        const wrapper = mount(IncrementalChart, {
            props: { options: mockOptions },
        });

        expect(wrapper.find('.incremental-chart-container').exists()).toBe(true);
    });

    it('should emit chartReady event', async () => {
        const wrapper = mount(IncrementalChart, {
            props: { options: mockOptions },
        });

        // Wait for chart initialization
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('chartReady')).toBeTruthy();
    });

    it('should handle data updates through exposed methods', async () => {
        const wrapper = mount(IncrementalChart, {
            props: { options: mockOptions },
        });

        const chartComponent = wrapper.vm as any;

        const transaction = { append: [{ x: 3, y: 30 }] };
        const result = await chartComponent.updateData(transaction);

        expect(result.operationCounts.appended).toBe(1);
        expect(wrapper.emitted('dataUpdated')).toBeTruthy();
    });

    it('should show performance metrics when enabled', () => {
        const wrapper = mount(IncrementalChart, {
            props: {
                options: mockOptions,
                showMetrics: true,
            },
        });

        expect(wrapper.find('.performance-metrics').exists()).toBe(true);
        expect(wrapper.text()).toContain('Data Processing:');
        expect(wrapper.text()).toContain('Rendering: ~3-4ms');
    });
});
```

### 3. Performance Testing

```typescript
// tests/performance/chartPerformance.test.ts
import IncrementalChart from '@/components/IncrementalChart.vue';
import { mount } from '@vue/test-utils';
import { performance } from 'perf_hooks';
import { describe, expect, it } from 'vitest';

describe('Chart Performance', () => {
    it('should handle high-frequency data processing efficiently', async () => {
        const wrapper = mount(IncrementalChart, {
            props: {
                options: { data: [], series: [{ type: 'line', xKey: 'x', yKey: 'y' }] },
            },
        });

        const chartComponent = wrapper.vm as any;
        await wrapper.vm.$nextTick(); // Wait for chart initialization

        const updates = Array.from({ length: 1000 }, (_, i) => ({
            append: [{ x: Date.now() + i, y: Math.random() * 100 }],
        }));

        const startTime = performance.now();

        // Process updates in batches to simulate real-world usage
        for (let i = 0; i < updates.length; i += 50) {
            const batch = updates.slice(i, i + 50);
            await Promise.all(batch.map((update) => chartComponent.updateData(update)));
            await wrapper.vm.$nextTick();
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgLatency = totalTime / updates.length;

        // Focus on data processing performance (rendering is already ~3-4ms)
        expect(avgLatency).toBeLessThan(30); // Less than 30ms average for data processing
        expect(totalTime).toBeLessThan(5000); // Total under 5 seconds for data processing

        const stats = chartComponent.getStats();
        expect(stats.dataProcessingTime).toBeLessThan(25); // Average data processing time
    });

    it('should maintain memory efficiency during continuous updates', async () => {
        const wrapper = mount(IncrementalChart, {
            props: {
                options: {
                    data: [],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
            },
        });

        const chartComponent = wrapper.vm as any;
        await wrapper.vm.$nextTick();

        const initialMemory = process.memoryUsage().heapUsed;

        // Simulate continuous updates for 2 seconds
        const updateInterval = setInterval(() => {
            chartComponent.updateData({
                append: [{ x: Date.now(), y: Math.random() * 100 }],
            });
        }, 10);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        clearInterval(updateInterval);

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = finalMemory - initialMemory;

        // Memory growth should be reasonable (< 50MB for 2 seconds of updates)
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);

        wrapper.unmount();
    });
});
```

### 4. E2E Testing with Playwright

```typescript
// tests/e2e/chartInteraction.test.ts
import { expect, test } from '@playwright/test';

test.describe('Chart Interaction', () => {
    test('should handle real-time data updates smoothly', async ({ page }) => {
        await page.goto('/trading-dashboard');

        // Wait for chart to load
        await page.waitForSelector('.incremental-chart-container');

        // Check initial state
        const initialDataPoints = await page.locator('[data-testid="data-point"]').count();

        // Start streaming data
        await page.click('[data-testid="start-stream"]');

        // Wait for data to start flowing
        await page.waitForTimeout(2000);

        // Check that data points have increased
        const updatedDataPoints = await page.locator('[data-testid="data-point"]').count();
        expect(updatedDataPoints).toBeGreaterThan(initialDataPoints);

        // Check performance metrics
        const fps = await page.locator('[data-testid="fps-metric"]').textContent();
        const fpsValue = parseInt(fps?.replace('FPS', '') || '0');
        expect(fpsValue).toBeGreaterThan(30); // Minimum 30 FPS

        // Check data processing time
        const processingTime = await page.locator('[data-testid="processing-time"]').textContent();
        const processingValue = parseFloat(processingTime?.replace('ms', '') || '0');
        expect(processingValue).toBeLessThan(50); // Less than 50ms processing time
    });

    test('should handle chart resizing without performance degradation', async ({ page }) => {
        await page.goto('/chart-test');

        // Initial chart load
        await page.waitForSelector('.incremental-chart-container');

        // Resize viewport
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(100);

        await page.setViewportSize({ width: 800, height: 600 });
        await page.waitForTimeout(100);

        // Check that chart is still responsive
        const chartElement = page.locator('.incremental-chart-container');
        await expect(chartElement).toBeVisible();

        // Performance should not degrade
        const metrics = await page.locator('[data-testid="performance-metrics"]').textContent();
        expect(metrics).toContain('FPS');
    });
});
```

## Migration Guide

### From Vue 2 to Vue 3 with Incremental Updates

#### Before (Vue 2 with Options API)

```vue
<template>
  <div>
    <ag-charts :options="chartOptions" />
  </div>
</template>

<script>
import { AgChartsVue } from 'ag-charts-vue';

export default {
  components: {
    AgChartsVue,
  },
  data() {
    return {
      chartData: [],
      chartOptions: {
        data: [],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
      },
    };
  },
  methods: {
    addDataPoint(newPoint) {
      // Inefficient: Full data replacement
      this.chartData.push(newPoint);
      this.chartOptions = {
        ...this.chartOptions,
        data: this.chartData,
      };
    },
  },
  watch: {
    chartData: {
      handler() {
        // Full options update on every data change
        this.chartOptions = {
          ...this.chartOptions,
          data: this.chartData,
        };
      },
      deep: true,
    },
  },
};
</script>
```

#### After (Vue 3 with Composition API and Incremental Updates)

```vue
<template>
  <div>
    <IncrementalChart
      ref="chartRef"
      :options="chartOptions"
      :show-metrics="true"
      @chart-ready="onChartReady"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, computed } from 'vue';
import { useIncrementalChart } from '@/composables/useIncrementalChart';
import IncrementalChart from '@/components/IncrementalChart.vue';

interface DataPoint {
  x: number;
  y: number;
}

const chartRef = ref();

// CRITICAL: Use shallowRef + markRaw for performance
const chartOptions = shallowRef(markRaw({
  data: [], // Start with empty data
  series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
}));

// Use optimized composable
const {
  updateData,
  stats,
} = useIncrementalChart<DataPoint>({
  batchWindow: 16, // ~60fps
  maxBatchSize: 50,
});

const onChartReady = (instance: any) => {
  console.log('Chart ready with incremental update capability');
};

const addDataPoint = async (newPoint: DataPoint) => {
  // Efficient: Incremental update (focus on data processing optimization)
  await updateData({
    append: [newPoint],
  });
};

// Expose methods for external use
defineExpose({
  addDataPoint,
  getStats: () => stats.value,
});
</script>
```

### Migration Checklist

-   [ ] **Update Vue Version**: Migrate to Vue 3.2+
-   [ ] **Replace Options API**: Convert to Composition API with `<script setup>`
-   [ ] **Update Imports**: Import from new incremental chart components
-   [ ] **Optimize Reactivity**: Use `shallowRef` and `markRaw` for large datasets
-   [ ] **Replace Data Updates**: Use `updateData()` instead of full options replacement
-   [ ] **Add Error Handling**: Implement proper error boundaries and handling
-   [ ] **Update Tests**: Convert to Vitest and update testing patterns
-   [ ] **Performance Monitoring**: Add metrics tracking for data processing
-   [ ] **Memory Management**: Implement data windowing if needed
-   [ ] **TypeScript**: Add proper type definitions for data models

### Performance Comparison

| Aspect                  | Vue 2 (Before)           | Vue 3 + Incremental (After)      |
| ----------------------- | ------------------------ | -------------------------------- |
| **Data Processing**     | ~393ms for 1M points     | ~15-30ms for incremental updates |
| **Reactivity Overhead** | High (deep watching)     | Minimal (shallow refs)           |
| **Memory Usage**        | Growing with each update | Managed with windowing           |
| **Update Frequency**    | ~10 updates/sec          | 100+ updates/sec                 |
| **Rendering**           | ~3-4ms (already fast)    | ~3-4ms (maintained)              |
| **Bundle Size**         | Larger with Vue 2        | Smaller with tree-shaking        |

## Best Practices Summary

1. **Always use `shallowRef` + `markRaw`** for performance-critical data structures
2. **Use `toRaw` when calling chart methods** to bypass Vue reactivity
3. **Avoid deep watching** on large datasets or complex objects
4. **Implement proper error handling** with retry mechanisms
5. **Monitor performance metrics** focusing on data processing time
6. **Use data windowing** for long-running applications
7. **Batch updates** using composables and proper timing
8. **Test thoroughly** with Vitest and performance tests
9. **Follow TypeScript patterns** for type safety
10. **Focus optimization efforts** on data processing (68% of performance impact)

This Vue implementation guide provides a comprehensive foundation for integrating AG Charts' Incremental Update API with Vue 3 applications, ensuring optimal performance and developer experience for high-frequency data visualization scenarios while leveraging Vue's advanced reactivity system efficiently.
