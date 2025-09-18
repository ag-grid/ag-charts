# Option 2: Stream-Based API - Vue Implementation

## Overview

This document provides Vue 3-specific implementation details for Option 2 (Stream-Based API) of the high-frequency data updates feature in AG Charts. For the overall design document, see [DESIGN_DOC.md](../DESIGN_DOC.md). For the Option 2 architecture details, see [OPTION-2-STREAM-BASED.md](./OPTION-2-STREAM-BASED.md).

## Current State Analysis

### Existing Vue Wrapper

-   **Location**: `packages/ag-charts-vue3/src/index.ts`
-   **Current Implementation**:
    -   Watches options object and spreads to create new object on each update
    -   No native streaming capabilities
    -   Deep reactivity on large datasets causing performance issues
    -   Missing Vue 3 performance optimizations for reactive streams

### Stream-Based Requirements

-   High-frequency data processing (100+ updates/second) as primary bottleneck (68% of execution time)
-   Real-time reactive streams with backpressure handling
-   Native browser streaming API integration (WebSocket, SSE, Fetch)
-   Stream composition and transformation
-   Multi-stream coordination and synchronization
-   Vue 3 Composition API integration with streaming patterns

## Implementation Strategy

### Streaming-Optimized Composables with Vue 3 Reactivity

```typescript
import { Ref, ShallowRef, computed, markRaw, onMounted, onUnmounted, shallowRef, toRaw, watchEffect } from 'vue';

import { AgDataStream, AgStreamConnection, AgStreamOptions } from 'ag-charts-stream';
import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

interface StreamingConfig {
    bufferSize?: number;
    backpressureThreshold?: number;
    synchronizationMode?: 'timestamp' | 'sequence' | 'none';
    errorHandlingStrategy?: 'retry' | 'skip' | 'circuit-breaker';
    onStreamEvent?: (event: StreamEvent) => void;
}

interface StreamEvent {
    type: 'connect' | 'data' | 'error' | 'disconnect' | 'backpressure';
    streamId: string;
    data?: any;
    timestamp: number;
    latency?: number;
}

interface StreamMetrics {
    messagesPerSecond: number;
    bufferUtilization: number;
    errorRate: number;
    averageLatency: number;
    activeConnections: number;
}

// Main stream-based composable
export function useAgChartsStreaming<TDatum = any>(initialOptions: AgChartOptions, config: StreamingConfig = {}) {
    // Use shallowRef to prevent deep reactivity on stream instances
    const chartInstance = shallowRef<AgChartInstance | null>(null);
    const chartOptions = shallowRef(markRaw(initialOptions));
    const activeStreams = shallowRef<Map<string, AgDataStream<TDatum>>>(new Map());
    const streamConnections = shallowRef<Map<string, AgStreamConnection>>(new Map());
    const streamMetrics = shallowRef<StreamMetrics>({
        messagesPerSecond: 0,
        bufferUtilization: 0,
        errorRate: 0,
        averageLatency: 0,
        activeConnections: 0,
    });

    let metricsUpdateTimer: number | null = null;

    // Stream management
    const createDataStream = (seriesId?: string, streamOptions?: AgStreamOptions<TDatum>) => {
        if (!chartInstance.value) {
            throw new Error('Chart instance not initialized');
        }

        // Use raw chart to avoid Vue reactivity overhead
        const rawChart = toRaw(chartInstance.value);
        return rawChart.createDataStream(seriesId, {
            buffer: {
                maxSize: config.bufferSize || 1000,
                overflowStrategy: 'drop-oldest',
                warningThreshold: 0.8,
            },
            backpressure: {
                enabled: true,
                highWaterMark: config.backpressureThreshold || 1000,
                lowWaterMark: (config.backpressureThreshold || 1000) * 0.5,
                batchSize: 50, // Optimize for data processing
            },
            monitoring: {
                enabled: true,
                samplingRate: 0.1,
            },
            ...streamOptions,
        });
    };

    // Connect external stream to chart
    const connectStream = async (
        stream: AgDataStream<TDatum>,
        seriesId?: string,
        streamOptions?: AgStreamOptions<TDatum>
    ) => {
        if (!chartInstance.value) {
            throw new Error('Chart instance not initialized');
        }

        const rawChart = toRaw(chartInstance.value);
        const connection = await rawChart.connectStream(stream, seriesId, streamOptions);

        // Track stream and connection
        activeStreams.value.set(stream.id, markRaw(stream));
        streamConnections.value.set(connection.id, markRaw(connection));

        // Setup stream event handling
        setupStreamEventHandling(stream, connection);

        return connection;
    };

    // Multi-stream coordination
    const createMultiStream = async (streamMappings: Record<string, AgDataStream<TDatum>>, options?: any) => {
        if (!chartInstance.value) {
            throw new Error('Chart instance not initialized');
        }

        const rawChart = toRaw(chartInstance.value);
        return rawChart.createMultiStream(streamMappings, {
            synchronization: {
                mode: config.synchronizationMode || 'timestamp',
                timestampTolerance: 100,
                maxWaitTime: 1000,
            },
            ...options,
        });
    };

    // Stream event handling
    const setupStreamEventHandling = (stream: AgDataStream<TDatum>, connection: AgStreamConnection) => {
        // Monitor stream performance
        watchEffect(() => {
            const updateMetrics = () => {
                const stats = connection.stats;
                streamMetrics.value = {
                    messagesPerSecond: stats.messagesProcessed,
                    bufferUtilization: 0, // Would get from stream buffer
                    errorRate: stats.errors / Math.max(stats.messagesReceived, 1),
                    averageLatency: stats.averageLatency,
                    activeConnections: streamConnections.value.size,
                };

                if (config.onStreamEvent) {
                    config.onStreamEvent({
                        type: 'data',
                        streamId: stream.id,
                        timestamp: Date.now(),
                        latency: stats.averageLatency,
                    });
                }
            };

            // Update metrics every second
            if (!metricsUpdateTimer) {
                metricsUpdateTimer = setInterval(updateMetrics, 1000);
            }
        });

        // Error handling
        stream.onError((error) => {
            console.error(`Stream ${stream.id} error:`, error);
            if (config.onStreamEvent) {
                config.onStreamEvent({
                    type: 'error',
                    streamId: stream.id,
                    data: error.message,
                    timestamp: Date.now(),
                });
            }
        });
    };

    // Disconnect stream
    const disconnectStream = async (streamId: string) => {
        const stream = activeStreams.value.get(streamId);
        const connection = Array.from(streamConnections.value.values()).find((conn) => conn.seriesId === streamId);

        if (stream) {
            await stream.stop();
            activeStreams.value.delete(streamId);
        }

        if (connection) {
            await connection.disconnect();
            streamConnections.value.delete(connection.id);
        }
    };

    // Initialize chart
    const initChart = (container: HTMLElement) => {
        const chart = AgCharts.create({
            ...toRaw(chartOptions.value),
            container,
            animation: { enabled: false }, // Critical for streaming performance
        });

        // Mark as raw to prevent Vue proxying
        chartInstance.value = markRaw(chart);
        return chart;
    };

    // Update chart options
    const updateOptions = (newOptions: AgChartOptions) => {
        chartOptions.value = markRaw(newOptions);

        if (chartInstance.value) {
            const { data, ...configOnly } = newOptions;
            // Don't pass data through options for streaming charts
            toRaw(chartInstance.value).update(configOnly);
        }
    };

    // Cleanup
    onUnmounted(async () => {
        if (metricsUpdateTimer) {
            clearInterval(metricsUpdateTimer);
        }

        // Disconnect all streams
        const disconnectPromises = Array.from(activeStreams.value.keys()).map(disconnectStream);
        await Promise.all(disconnectPromises);

        if (chartInstance.value) {
            toRaw(chartInstance.value).destroy();
        }
    });

    return {
        chartInstance,
        createDataStream,
        connectStream,
        createMultiStream,
        disconnectStream,
        initChart,
        updateOptions,
        metrics: computed(() => streamMetrics.value),
        activeStreams: computed(() => Array.from(activeStreams.value.keys())),
        streamConnections: computed(() => Array.from(streamConnections.value.values())),
    };
}
```

### Specialized Streaming Composables

```typescript
// WebSocket streaming composable
export function useChartWebSocketStream<TDatum = any>(url: string, options: AgStreamOptions<TDatum> = {}) {
    const stream = shallowRef<AgWebSocketStream<TDatum> | null>(null);
    const connectionState = shallowRef<'idle' | 'connecting' | 'connected' | 'error' | 'closed'>('idle');
    const messageCount = ref(0);
    const lastMessage = shallowRef<TDatum | null>(null);

    const connect = async () => {
        connectionState.value = 'connecting';

        try {
            const webSocketStream = new AgWebSocketStream<TDatum>(url, options);
            stream.value = markRaw(webSocketStream);

            // Monitor stream state
            watchEffect(() => {
                connectionState.value = webSocketStream.state as any;
            });

            // Track messages
            webSocketStream.subscribe({
                next: (data: TDatum) => {
                    messageCount.value++;
                    lastMessage.value = markRaw(data);
                },
                error: (error: Error) => {
                    console.error('WebSocket stream error:', error);
                    connectionState.value = 'error';
                },
                complete: () => {
                    connectionState.value = 'closed';
                },
            });

            await webSocketStream.start();
        } catch (error) {
            connectionState.value = 'error';
            throw error;
        }
    };

    const disconnect = async () => {
        if (stream.value) {
            await toRaw(stream.value).stop();
            stream.value = null;
            connectionState.value = 'closed';
        }
    };

    onUnmounted(() => {
        disconnect();
    });

    return {
        stream: computed(() => stream.value),
        connectionState: computed(() => connectionState.value),
        messageCount: computed(() => messageCount.value),
        lastMessage: computed(() => lastMessage.value),
        connect,
        disconnect,
    };
}

// Server-Sent Events streaming composable
export function useChartSSEStream<TDatum = any>(
    url: string,
    eventType: string = 'data',
    options: AgStreamOptions<TDatum> = {}
) {
    const stream = shallowRef<AgSSEStream<TDatum> | null>(null);
    const connectionState = shallowRef<'idle' | 'connecting' | 'connected' | 'error' | 'closed'>('idle');
    const eventCount = ref(0);
    const lastEvent = shallowRef<TDatum | null>(null);

    const connect = async () => {
        connectionState.value = 'connecting';

        try {
            const sseStream = new AgSSEStream<TDatum>(url, eventType, options);
            stream.value = markRaw(sseStream);

            // Monitor stream state
            watchEffect(() => {
                connectionState.value = sseStream.state as any;
            });

            // Track events
            sseStream.subscribe({
                next: (data: TDatum) => {
                    eventCount.value++;
                    lastEvent.value = markRaw(data);
                },
                error: (error: Error) => {
                    console.error('SSE stream error:', error);
                    connectionState.value = 'error';
                },
                complete: () => {
                    connectionState.value = 'closed';
                },
            });

            await sseStream.start();
        } catch (error) {
            connectionState.value = 'error';
            throw error;
        }
    };

    const disconnect = async () => {
        if (stream.value) {
            await toRaw(stream.value).stop();
            stream.value = null;
            connectionState.value = 'closed';
        }
    };

    onUnmounted(() => {
        disconnect();
    });

    return {
        stream: computed(() => stream.value),
        connectionState: computed(() => connectionState.value),
        eventCount: computed(() => eventCount.value),
        lastEvent: computed(() => lastEvent.value),
        connect,
        disconnect,
    };
}

// Stream processor composable
export function useStreamProcessor<TInput, TOutput>(
    inputStream: Ref<AgDataStream<TInput> | null>,
    processor: {
        transform?: (data: TInput) => TOutput;
        filter?: (data: TInput) => boolean;
        buffer?: { size: number; flushInterval: number };
    }
) {
    const processedStream = shallowRef<AgDataStream<TOutput> | null>(null);
    const processingStats = ref({
        inputCount: 0,
        outputCount: 0,
        filterDropped: 0,
        processingLatency: 0,
    });

    watchEffect(() => {
        if (!inputStream.value) {
            processedStream.value = null;
            return;
        }

        let stream = inputStream.value;

        // Apply filter if provided
        if (processor.filter) {
            stream = stream.filter((data) => {
                const passed = processor.filter!(data);
                if (!passed) {
                    processingStats.value.filterDropped++;
                }
                processingStats.value.inputCount++;
                return passed;
            });
        }

        // Apply transformation if provided
        if (processor.transform) {
            stream = stream.transform((data) => {
                const startTime = performance.now();
                const result = processor.transform!(data);
                const endTime = performance.now();

                processingStats.value.processingLatency = endTime - startTime;
                processingStats.value.outputCount++;
                return result;
            });
        }

        processedStream.value = markRaw(stream as AgDataStream<TOutput>);
    });

    return {
        processedStream: computed(() => processedStream.value),
        stats: computed(() => processingStats.value),
    };
}
```

### Stream-Based Chart Components

```typescript
import { PropType, defineComponent, onMounted, ref, watchEffect } from 'vue';

import { useAgChartsStreaming } from './useAgChartsStreaming';

export const AgChartsStreaming = defineComponent({
    name: 'AgChartsStreaming',
    props: {
        options: { type: Object as PropType<AgChartOptions>, required: true },
        streamingConfig: { type: Object as PropType<StreamingConfig> },
        height: { type: String, default: '400px' },
        width: { type: String, default: '100%' },
    },
    emits: ['stream-event', 'metrics-update', 'stream-error'],
    setup(props, { emit, expose }) {
        const containerRef = ref<HTMLDivElement>();

        const {
            chartInstance,
            createDataStream,
            connectStream,
            createMultiStream,
            disconnectStream,
            initChart,
            updateOptions,
            metrics,
            activeStreams,
        } = useAgChartsStreaming(props.options, {
            ...props.streamingConfig,
            onStreamEvent: (event) => emit('stream-event', event),
        });

        // Watch for option changes
        watchEffect(() => {
            if (props.options) {
                updateOptions(markRaw(props.options));
            }
        });

        // Watch metrics and emit updates
        watchEffect(() => {
            emit('metrics-update', metrics.value);
        });

        onMounted(() => {
            if (containerRef.value) {
                initChart(containerRef.value);
            }
        });

        // Expose methods for imperative usage
        expose({
            createDataStream,
            connectStream,
            createMultiStream,
            disconnectStream,
            getMetrics: () => metrics.value,
            getInstance: () => toRaw(chartInstance.value),
            getActiveStreams: () => activeStreams.value,
        });

        return {
            containerRef,
            metrics,
            activeStreams,
        };
    },
    template: `
    <div :style="{ width, height }" class="ag-charts-streaming">
      <div ref="containerRef" style="width: 100%; height: 100%;"></div>
      <div v-if="streamingConfig?.showMetrics" class="streaming-metrics">
        <span>{{ metrics.messagesPerSecond }} msg/s</span>
        <span>{{ activeStreams.length }} streams</span>
        <span>{{ Math.round(metrics.averageLatency) }}ms latency</span>
      </div>
    </div>
  `,
});

// WebSocket streaming component
export const AgChartsWebSocketStreaming = defineComponent({
    name: 'AgChartsWebSocketStreaming',
    props: {
        options: { type: Object as PropType<AgChartOptions>, required: true },
        websocketUrl: { type: String, required: true },
        autoConnect: { type: Boolean, default: true },
        seriesId: String,
        streamOptions: { type: Object as PropType<AgStreamOptions> },
    },
    emits: ['connected', 'disconnected', 'message', 'error'],
    setup(props, { emit, expose }) {
        const containerRef = ref<HTMLDivElement>();

        const { chartInstance, connectStream, initChart, updateOptions } = useAgChartsStreaming(props.options);

        const { stream, connectionState, messageCount, connect, disconnect } = useChartWebSocketStream(
            props.websocketUrl,
            props.streamOptions
        );

        let streamConnection: AgStreamConnection | null = null;

        // Auto-connect when chart is ready
        watchEffect(async () => {
            if (chartInstance.value && stream.value && connectionState.value === 'connected' && !streamConnection) {
                try {
                    streamConnection = await connectStream(stream.value, props.seriesId);
                    emit('connected', streamConnection);
                } catch (error) {
                    emit('error', error);
                }
            }
        });

        // Monitor connection state
        watchEffect(() => {
            if (connectionState.value === 'connected') {
                emit('connected');
            } else if (connectionState.value === 'closed') {
                emit('disconnected');
            } else if (connectionState.value === 'error') {
                emit('error', new Error('WebSocket connection error'));
            }
        });

        onMounted(async () => {
            if (containerRef.value) {
                initChart(containerRef.value);

                if (props.autoConnect) {
                    await connect();
                }
            }
        });

        expose({
            connect,
            disconnect,
            getConnectionState: () => connectionState.value,
            getMessageCount: () => messageCount.value,
            getInstance: () => toRaw(chartInstance.value),
        });

        return {
            containerRef,
            connectionState,
            messageCount,
            connect,
            disconnect,
        };
    },
    template: `
    <div class="ag-charts-websocket-streaming">
      <div ref="containerRef" style="width: 100%; height: 400px;"></div>
      <div class="connection-status">
        <span :class="['status-indicator', connectionState]">
          {{ connectionState === 'connected' ? '● Live' : connectionState === 'connecting' ? '◐ Connecting' : '○ Offline' }}
        </span>
        <span>Messages: {{ messageCount }}</span>
        <div class="controls">
          <button @click="connect" :disabled="connectionState === 'connected'">Connect</button>
          <button @click="disconnect" :disabled="connectionState !== 'connected'">Disconnect</button>
        </div>
      </div>
    </div>
  `,
});
```

## Usage Examples

### Real-Time Financial Dashboard

```vue
<template>
  <div class="financial-dashboard">
    <AgChartsStreaming
      ref="tradingChart"
      :options="chartOptions"
      :streaming-config="streamingConfig"
      @stream-event="onStreamEvent"
      @metrics-update="onMetricsUpdate"
      height="500px"
    />

    <div class="dashboard-controls">
      <button @click="startTrading" :disabled="isStreaming">Start Trading Stream</button>
      <button @click="stopTrading" :disabled="!isStreaming">Stop Trading Stream</button>
      <button @click="addIndicatorStream" :disabled="!isStreaming">Add RSI Stream</button>
    </div>

    <div class="metrics-panel">
      <h3>Stream Metrics</h3>
      <div>Messages/sec: {{ metrics.messagesPerSecond }}</div>
      <div>Buffer Usage: {{ Math.round(metrics.bufferUtilization * 100) }}%</div>
      <div>Average Latency: {{ Math.round(metrics.averageLatency) }}ms</div>
      <div>Active Streams: {{ metrics.activeConnections }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, onMounted } from 'vue';
import { AgChartsStreaming } from 'ag-charts-vue3';
import { useChartWebSocketStream, useChartSSEStream } from './composables';

interface TradingData {
  timestamp: number;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorData {
  timestamp: number;
  rsi: number;
  macd: number;
}

const tradingChart = ref();
const isStreaming = ref(false);
const metrics = ref({
  messagesPerSecond: 0,
  bufferUtilization: 0,
  averageLatency: 0,
  activeConnections: 0,
});

// Chart configuration optimized for streaming
const chartOptions = shallowRef(markRaw({
  title: { text: 'BTC/USD Real-Time Trading' },
  data: [], // No initial data for streaming
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
      type: 'column',
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
}));

// Streaming configuration
const streamingConfig = {
  bufferSize: 5000,
  backpressureThreshold: 1000,
  synchronizationMode: 'timestamp' as const,
  errorHandlingStrategy: 'retry' as const,
  showMetrics: true,
};

// WebSocket streams
const {
  stream: tradingStream,
  connectionState: tradingState,
  connect: connectTrading,
  disconnect: disconnectTrading
} = useChartWebSocketStream<TradingData>('wss://api.exchange.com/streams/btcusd');

const {
  stream: indicatorStream,
  connect: connectIndicator,
  disconnect: disconnectIndicator
} = useChartSSEStream<IndicatorData>('https://api.indicators.com/stream/btcusd', 'indicator');

const startTrading = async () => {
  try {
    // Connect trading data stream
    await connectTrading();

    if (tradingChart.value && tradingStream.value) {
      await tradingChart.value.connectStream(tradingStream.value, 'candlestick-series');
      isStreaming.value = true;
    }
  } catch (error) {
    console.error('Failed to start trading stream:', error);
  }
};

const stopTrading = async () => {
  try {
    await disconnectTrading();
    await disconnectIndicator();
    isStreaming.value = false;
  } catch (error) {
    console.error('Failed to stop trading streams:', error);
  }
};

const addIndicatorStream = async () => {
  try {
    await connectIndicator();

    if (tradingChart.value && indicatorStream.value) {
      // Add RSI series to chart
      const currentOptions = chartOptions.value;
      chartOptions.value = markRaw({
        ...currentOptions,
        series: [
          ...currentOptions.series,
          {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'rsi',
            yAxis: 'rsi',
          },
        ],
        axes: [
          ...currentOptions.axes,
          { type: 'number', position: 'right', keys: ['rsi'], id: 'rsi', min: 0, max: 100 },
        ],
      });

      await tradingChart.value.connectStream(indicatorStream.value, 'rsi-series');
    }
  } catch (error) {
    console.error('Failed to add indicator stream:', error);
  }
};

const onStreamEvent = (event: any) => {
  console.log('Stream event:', event);
};

const onMetricsUpdate = (newMetrics: any) => {
  metrics.value = newMetrics;
};
</script>

<style scoped>
.financial-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-controls {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.metrics-panel {
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.metrics-panel h3 {
  margin-top: 0;
}

.status-indicator.connected {
  color: green;
}

.status-indicator.connecting {
  color: orange;
}

.status-indicator.error,
.status-indicator.closed {
  color: red;
}
</style>
```

### IoT Sensor Monitoring with Multi-Stream

```vue
<template>
  <div class="iot-monitoring">
    <AgChartsStreaming
      ref="sensorChart"
      :options="chartOptions"
      :streaming-config="streamingConfig"
      @stream-event="onStreamEvent"
      height="600px"
    />

    <div class="sensor-controls">
      <div v-for="sensor in sensors" :key="sensor.id" class="sensor-control">
        <h4>{{ sensor.name }}</h4>
        <div class="sensor-status">
          <span :class="['status', sensor.status]">{{ sensor.status }}</span>
          <span>{{ sensor.lastValue }}{{ sensor.unit }}</span>
        </div>
        <button @click="toggleSensor(sensor.id)" :disabled="!isInitialized">
          {{ sensor.active ? 'Disconnect' : 'Connect' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, reactive, onMounted } from 'vue';
import { AgChartsStreaming } from 'ag-charts-vue3';
import { useChartWebSocketStream } from './composables';

interface SensorData {
  sensorId: string;
  timestamp: number;
  value: number;
  unit: string;
}

interface Sensor {
  id: string;
  name: string;
  unit: string;
  status: 'connected' | 'disconnected' | 'error';
  active: boolean;
  lastValue: number;
  stream?: any;
  connection?: any;
}

const sensorChart = ref();
const isInitialized = ref(false);

const sensors = reactive<Sensor[]>([
  { id: 'temp001', name: 'Temperature Sensor', unit: '°C', status: 'disconnected', active: false, lastValue: 0 },
  { id: 'humid001', name: 'Humidity Sensor', unit: '%', status: 'disconnected', active: false, lastValue: 0 },
  { id: 'press001', name: 'Pressure Sensor', unit: 'hPa', status: 'disconnected', active: false, lastValue: 0 },
  { id: 'light001', name: 'Light Sensor', unit: 'lux', status: 'disconnected', active: false, lastValue: 0 },
]);

const chartOptions = shallowRef(markRaw({
  title: { text: 'IoT Sensor Monitoring Dashboard' },
  data: [],
  series: [
    { type: 'line', xKey: 'timestamp', yKey: 'temperature', name: 'Temperature (°C)' },
    { type: 'line', xKey: 'timestamp', yKey: 'humidity', name: 'Humidity (%)', yAxis: 'humidity' },
    { type: 'line', xKey: 'timestamp', yKey: 'pressure', name: 'Pressure (hPa)', yAxis: 'pressure' },
    { type: 'line', xKey: 'timestamp', yKey: 'light', name: 'Light (lux)', yAxis: 'light' },
  ],
  axes: [
    { type: 'time', position: 'bottom' },
    { type: 'number', position: 'left' },
    { type: 'number', position: 'right', keys: ['humidity'], id: 'humidity' },
    { type: 'number', position: 'right', keys: ['pressure'], id: 'pressure' },
    { type: 'number', position: 'right', keys: ['light'], id: 'light' },
  ],
}));

const streamingConfig = {
  bufferSize: 10000,
  backpressureThreshold: 2000,
  synchronizationMode: 'timestamp' as const,
  errorHandlingStrategy: 'circuit-breaker' as const,
};

const toggleSensor = async (sensorId: string) => {
  const sensor = sensors.find(s => s.id === sensorId);
  if (!sensor) return;

  if (sensor.active) {
    // Disconnect sensor
    if (sensor.stream) {
      await sensor.stream.disconnect();
    }
    sensor.status = 'disconnected';
    sensor.active = false;
  } else {
    // Connect sensor
    try {
      sensor.status = 'connecting';

      const { stream, connect, disconnect } = useChartWebSocketStream<SensorData>(
        `wss://iot.sensors.com/stream/${sensorId}`
      );

      await connect();

      if (sensorChart.value && stream.value) {
        const connection = await sensorChart.value.connectStream(
          stream.value.transform((data: SensorData) => ({
            timestamp: data.timestamp,
            [getSensorDataKey(sensorId)]: data.value,
          })),
          getSensorSeriesId(sensorId)
        );

        sensor.stream = { disconnect };
        sensor.connection = connection;
        sensor.status = 'connected';
        sensor.active = true;

        // Monitor sensor data
        stream.value.subscribe({
          next: (data: SensorData) => {
            sensor.lastValue = Math.round(data.value * 100) / 100;
          },
          error: (error: Error) => {
            console.error(`Sensor ${sensorId} error:`, error);
            sensor.status = 'error';
          },
        });
      }
    } catch (error) {
      console.error(`Failed to connect sensor ${sensorId}:`, error);
      sensor.status = 'error';
    }
  }
};

const getSensorDataKey = (sensorId: string): string => {
  if (sensorId.includes('temp')) return 'temperature';
  if (sensorId.includes('humid')) return 'humidity';
  if (sensorId.includes('press')) return 'pressure';
  if (sensorId.includes('light')) return 'light';
  return 'value';
};

const getSensorSeriesId = (sensorId: string): string => {
  return `${getSensorDataKey(sensorId)}-series`;
};

const onStreamEvent = (event: any) => {
  console.log('Sensor stream event:', event);
};

onMounted(() => {
  isInitialized.value = true;
});
</script>

<style scoped>
.iot-monitoring {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sensor-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.sensor-control {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}

.sensor-control h4 {
  margin: 0 0 10px 0;
}

.sensor-status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-family: monospace;
}

.status.connected {
  color: green;
  font-weight: bold;
}

.status.disconnected {
  color: #666;
}

.status.error {
  color: red;
  font-weight: bold;
}
</style>
```

### Stream Processing Pipeline

```vue
<template>
  <div class="stream-processing-demo">
    <AgChartsStreaming
      ref="processedChart"
      :options="chartOptions"
      :streaming-config="streamingConfig"
      height="400px"
    />

    <div class="pipeline-controls">
      <h3>Stream Processing Pipeline</h3>

      <div class="pipeline-stage">
        <h4>1. Raw Data Stream</h4>
        <button @click="toggleRawStream" :disabled="!isReady">
          {{ isRawStreamActive ? 'Stop' : 'Start' }} Raw Stream
        </button>
        <div class="stats">Rate: {{ rawMessageRate }}/s</div>
      </div>

      <div class="pipeline-stage">
        <h4>2. Filtering (Symbol = BTC)</h4>
        <label>
          <input v-model="filterEnabled" type="checkbox" />
          Enable Symbol Filter
        </label>
        <div class="stats">Passed: {{ filterStats.outputCount }}</div>
        <div class="stats">Dropped: {{ filterStats.filterDropped }}</div>
      </div>

      <div class="pipeline-stage">
        <h4>3. Moving Average Calculation</h4>
        <label>
          <input v-model="maEnabled" type="checkbox" />
          Add 20-period SMA
        </label>
        <div class="stats">Processing: {{ transformStats.processingLatency.toFixed(2) }}ms</div>
      </div>

      <div class="pipeline-stage">
        <h4>4. Final Output</h4>
        <div class="stats">Output Rate: {{ outputRate }}/s</div>
        <div class="stats">Total Processed: {{ transformStats.outputCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, shallowRef, markRaw } from 'vue';
import { AgChartsStreaming } from 'ag-charts-vue3';
import { useChartWebSocketStream, useStreamProcessor } from './composables';

interface RawMarketData {
  timestamp: number;
  symbol: string;
  price: number;
  volume: number;
}

interface ProcessedData {
  timestamp: number;
  price: number;
  volume: number;
  sma20?: number;
}

const processedChart = ref();
const isReady = ref(false);
const isRawStreamActive = ref(false);
const filterEnabled = ref(true);
const maEnabled = ref(true);
const rawMessageRate = ref(0);
const outputRate = ref(0);

// SMA calculation helper
const priceHistory: number[] = [];
const calculateSMA = (price: number, period: number = 20): number => {
  priceHistory.push(price);
  if (priceHistory.length > period) {
    priceHistory.shift();
  }

  if (priceHistory.length < period) {
    return 0;
  }

  return priceHistory.reduce((sum, p) => sum + p, 0) / priceHistory.length;
};

// Raw WebSocket stream
const {
  stream: rawStream,
  connectionState,
  messageCount,
  connect: connectRaw,
  disconnect: disconnectRaw
} = useChartWebSocketStream<RawMarketData>('wss://api.crypto.com/stream/market-data');

// Filter processor
const {
  processedStream: filteredStream,
  stats: filterStats
} = useStreamProcessor(rawStream, {
  filter: computed(() => filterEnabled.value
    ? (data: RawMarketData) => data.symbol === 'BTC'
    : undefined
  ).value,
});

// Transform processor (add moving average)
const {
  processedStream: finalStream,
  stats: transformStats
} = useStreamProcessor(filteredStream, {
  transform: computed(() => maEnabled.value
    ? (data: RawMarketData): ProcessedData => ({
        timestamp: data.timestamp,
        price: data.price,
        volume: data.volume,
        sma20: calculateSMA(data.price, 20),
      })
    : (data: RawMarketData): ProcessedData => ({
        timestamp: data.timestamp,
        price: data.price,
        volume: data.volume,
      })
  ).value,
});

// Chart configuration
const chartOptions = shallowRef(markRaw({
  title: { text: 'Stream Processing Pipeline Demo' },
  data: [],
  series: [
    { type: 'line', xKey: 'timestamp', yKey: 'price', name: 'Price' },
    { type: 'line', xKey: 'timestamp', yKey: 'sma20', name: 'SMA(20)', stroke: 'orange' },
    { type: 'column', xKey: 'timestamp', yKey: 'volume', name: 'Volume', yAxis: 'volume' },
  ],
  axes: [
    { type: 'time', position: 'bottom' },
    { type: 'number', position: 'left' },
    { type: 'number', position: 'right', keys: ['volume'], id: 'volume' },
  ],
}));

const streamingConfig = {
  bufferSize: 1000,
  backpressureThreshold: 500,
  synchronizationMode: 'sequence' as const,
};

// Connect final processed stream to chart
watchEffect(async () => {
  if (processedChart.value && finalStream.value && isRawStreamActive.value) {
    try {
      await processedChart.value.connectStream(finalStream.value, 'processed-series');
    } catch (error) {
      console.error('Failed to connect processed stream:', error);
    }
  }
});

const toggleRawStream = async () => {
  if (isRawStreamActive.value) {
    await disconnectRaw();
    isRawStreamActive.value = false;
  } else {
    await connectRaw();
    isRawStreamActive.value = true;
  }
};

// Calculate message rates
let lastMessageCount = 0;
let lastOutputCount = 0;
setInterval(() => {
  const currentMessages = messageCount.value;
  const currentOutput = transformStats.value.outputCount;

  rawMessageRate.value = currentMessages - lastMessageCount;
  outputRate.value = currentOutput - lastOutputCount;

  lastMessageCount = currentMessages;
  lastOutputCount = currentOutput;
}, 1000);

onMounted(() => {
  isReady.value = true;
});
</script>

<style scoped>
.stream-processing-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pipeline-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.pipeline-stage {
  padding: 15px;
  background: white;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.pipeline-stage h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.stats {
  font-family: monospace;
  font-size: 0.9em;
  color: #666;
  margin: 5px 0;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}
</style>
```

## Integration Patterns

### VueUse Integration

```typescript
// Integrate with VueUse utilities for enhanced functionality
import { useEventSource, useIntervalFn, useWebSocket } from '@vueuse/core';

export function useChartStreamWithVueUse<TDatum = any>(url: string, type: 'websocket' | 'sse' = 'websocket') {
    if (type === 'websocket') {
        const { status, data, send, open, close } = useWebSocket(url, {
            autoReconnect: {
                retries: 3,
                delay: 1000,
                onFailed() {
                    console.error('Failed to connect WebSocket after 3 retries');
                },
            },
        });

        // Convert VueUse WebSocket to AG Charts stream
        const agStream = computed(() => {
            if (status.value === 'OPEN' && data.value) {
                // Create AgDataStream from VueUse WebSocket
                return createAgStreamFromVueUseWS(data, send, close);
            }
            return null;
        });

        return {
            stream: agStream,
            status,
            connect: open,
            disconnect: close,
        };
    } else {
        const { status, data, eventSource, close } = useEventSource(url, [], {
            autoReconnect: {
                retries: 3,
                delay: 1000,
            },
        });

        const agStream = computed(() => {
            if (status.value === 'OPEN' && data.value) {
                return createAgStreamFromVueUseSSE(data, close);
            }
            return null;
        });

        return {
            stream: agStream,
            status,
            disconnect: close,
        };
    }
}

// Helper to pause/resume streams based on page visibility
export function useStreamVisibilityControl(streams: Ref<AgDataStream<any>[]>) {
    const { isSupported, visibility } = useDocumentVisibility();

    watchEffect(() => {
        if (!isSupported.value) return;

        streams.value.forEach((stream) => {
            if (visibility.value === 'visible') {
                stream.resume();
            } else {
                stream.pause();
            }
        });
    });
}
```

### Pinia State Management

```typescript
// Store for managing multiple chart streams
import { defineStore } from 'pinia';

export const useStreamingChartsStore = defineStore('streamingCharts', () => {
    const charts = ref<Map<string, any>>(new Map());
    const globalMetrics = ref({
        totalStreams: 0,
        totalMessages: 0,
        averageLatency: 0,
        errorRate: 0,
    });

    const registerChart = (chartId: string, chartInstance: any) => {
        charts.value.set(chartId, chartInstance);
    };

    const unregisterChart = (chartId: string) => {
        const chart = charts.value.get(chartId);
        if (chart) {
            // Cleanup all streams for this chart
            chart.getActiveStreams?.().forEach(async (streamId: string) => {
                await chart.disconnectStream(streamId);
            });
            charts.value.delete(chartId);
        }
    };

    const updateGlobalMetrics = () => {
        let totalStreams = 0;
        let totalMessages = 0;
        let totalLatency = 0;
        let totalErrors = 0;

        charts.value.forEach((chart) => {
            const metrics = chart.getMetrics?.();
            if (metrics) {
                totalStreams += metrics.activeConnections;
                totalMessages += metrics.messagesPerSecond;
                totalLatency += metrics.averageLatency;
                totalErrors += metrics.errorRate;
            }
        });

        globalMetrics.value = {
            totalStreams,
            totalMessages,
            averageLatency: totalLatency / charts.value.size || 0,
            errorRate: totalErrors / charts.value.size || 0,
        };
    };

    // Update metrics every second
    useIntervalFn(updateGlobalMetrics, 1000);

    const pauseAllStreams = () => {
        charts.value.forEach((chart) => {
            chart.getActiveStreams?.().forEach((streamId: string) => {
                const stream = chart.getStream?.(streamId);
                stream?.pause();
            });
        });
    };

    const resumeAllStreams = () => {
        charts.value.forEach((chart) => {
            chart.getActiveStreams?.().forEach((streamId: string) => {
                const stream = chart.getStream?.(streamId);
                stream?.resume();
            });
        });
    };

    return {
        charts: computed(() => charts.value),
        globalMetrics: computed(() => globalMetrics.value),
        registerChart,
        unregisterChart,
        pauseAllStreams,
        resumeAllStreams,
    };
});
```

## Performance Optimizations

### Vue 3 Specific Patterns

```typescript
// Use v-memo for expensive stream metric calculations
export const StreamMetricsDisplay = defineComponent({
    props: {
        metrics: { type: Object, required: true },
        updateFrequency: { type: Number, default: 1000 },
    },
    setup(props) {
        // Memoize expensive calculations
        const memoizedMetrics = computed(() => {
            return {
                throughputMbps: (props.metrics.messagesPerSecond * 1024) / 1000000,
                efficiencyPercent: (1 - props.metrics.errorRate) * 100,
                bufferHealthScore: Math.max(0, 100 - props.metrics.bufferUtilization * 100),
            };
        });

        // Use shallowRef for frequently updated values
        const displayMetrics = shallowRef({
            formattedThroughput: '0.00 MB/s',
            formattedLatency: '0ms',
            formattedEfficiency: '100%',
        });

        // Throttle updates to prevent excessive re-renders
        const { pause, resume } = useIntervalFn(() => {
            displayMetrics.value = {
                formattedThroughput: `${memoizedMetrics.value.throughputMbps.toFixed(2)} MB/s`,
                formattedLatency: `${Math.round(props.metrics.averageLatency)}ms`,
                formattedEfficiency: `${Math.round(memoizedMetrics.value.efficiencyPercent)}%`,
            };
        }, props.updateFrequency);

        onMounted(resume);
        onUnmounted(pause);

        return { displayMetrics, memoizedMetrics };
    },
    template: `
    <div class="stream-metrics" v-memo="[displayMetrics.formattedThroughput, displayMetrics.formattedLatency]">
      <div class="metric">
        <label>Throughput:</label>
        <span>{{ displayMetrics.formattedThroughput }}</span>
      </div>
      <div class="metric">
        <label>Latency:</label>
        <span>{{ displayMetrics.formattedLatency }}</span>
      </div>
      <div class="metric">
        <label>Efficiency:</label>
        <span>{{ displayMetrics.formattedEfficiency }}</span>
      </div>
    </div>
  `,
});

// Lazy loading for chart components
export const LazyStreamingChart = defineAsyncComponent({
    loader: () => import('./AgChartsStreaming.vue'),
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorComponent,
    delay: 200,
    timeout: 3000,
});

// Optimized stream data processing
export function useOptimizedStreamProcessing<TDatum>(
    stream: Ref<AgDataStream<TDatum> | null>,
    options: {
        batchSize?: number;
        processingDelay?: number;
        maxConcurrency?: number;
    } = {}
) {
    const batchSize = options.batchSize || 100;
    const processingDelay = options.processingDelay || 16; // ~60fps
    const maxConcurrency = options.maxConcurrency || 4;

    const processingQueue = shallowRef<TDatum[]>([]);
    const activeProcessors = ref(0);
    let processingTimer: number | null = null;

    const processBatch = async (batch: TDatum[]) => {
        if (activeProcessors.value >= maxConcurrency) {
            return; // Too many concurrent processors
        }

        activeProcessors.value++;

        try {
            // Process batch efficiently
            const startTime = performance.now();

            // Use requestIdleCallback if available for non-blocking processing
            if ('requestIdleCallback' in window) {
                await new Promise<void>((resolve) => {
                    requestIdleCallback(() => {
                        // Actual data processing logic here
                        resolve();
                    });
                });
            } else {
                // Fallback to setTimeout
                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        // Actual data processing logic here
                        resolve();
                    }, 0);
                });
            }

            const processingTime = performance.now() - startTime;
            console.debug(`Processed batch of ${batch.length} items in ${processingTime.toFixed(2)}ms`);
        } finally {
            activeProcessors.value--;
        }
    };

    const scheduleProcessing = () => {
        if (processingTimer) return;

        processingTimer = setTimeout(() => {
            const currentQueue = toRaw(processingQueue.value);
            if (currentQueue.length >= batchSize) {
                const batch = currentQueue.splice(0, batchSize);
                processBatch(batch);
            }

            processingTimer = null;

            // Schedule next processing if queue has items
            if (currentQueue.length > 0) {
                scheduleProcessing();
            }
        }, processingDelay);
    };

    watchEffect(() => {
        if (!stream.value) return;

        const subscription = stream.value.subscribe({
            next: (data) => {
                processingQueue.value.push(data);
                scheduleProcessing();
            },
            error: (error) => {
                console.error('Stream processing error:', error);
            },
        });

        return () => {
            subscription.unsubscribe();
            if (processingTimer) {
                clearTimeout(processingTimer);
                processingTimer = null;
            }
        };
    });

    onUnmounted(() => {
        if (processingTimer) {
            clearTimeout(processingTimer);
        }
    });

    return {
        queueSize: computed(() => processingQueue.value.length),
        activeProcessors: computed(() => activeProcessors.value),
    };
}
```

## Testing with Vitest

```typescript
// Test streaming composables
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useAgChartsStreaming, useChartWebSocketStream } from '../composables';

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation((url) => ({
    url,
    readyState: WebSocket.CONNECTING,
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
}));

describe('useAgChartsStreaming', () => {
    let chartContainer: HTMLDivElement;

    beforeEach(() => {
        chartContainer = document.createElement('div');
        document.body.appendChild(chartContainer);
    });

    afterEach(() => {
        document.body.removeChild(chartContainer);
    });

    it('should initialize chart and create data stream', async () => {
        const { chartInstance, createDataStream, initChart } = useAgChartsStreaming({
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        });

        // Initialize chart
        initChart(chartContainer);
        await nextTick();

        expect(chartInstance.value).toBeTruthy();

        // Create data stream
        const stream = createDataStream('test-series');
        expect(stream).toBeTruthy();
        expect(stream.write).toBeTypeOf('function');
    });

    it('should handle WebSocket stream connection', async () => {
        const mockWebSocket = {
            addEventListener: vi.fn(),
            send: vi.fn(),
            close: vi.fn(),
            readyState: WebSocket.OPEN,
        };

        vi.mocked(WebSocket).mockImplementation(() => mockWebSocket as any);

        const { stream, connectionState, connect } = useChartWebSocketStream('wss://test.example.com/stream');

        await connect();
        await nextTick();

        expect(connectionState.value).toBe('connecting');
        expect(WebSocket).toHaveBeenCalledWith('wss://test.example.com/stream');
    });

    it('should handle stream metrics updates', async () => {
        const onStreamEvent = vi.fn();
        const { metrics, initChart } = useAgChartsStreaming(
            { series: [{ type: 'line', xKey: 'x', yKey: 'y' }] },
            { onStreamEvent }
        );

        initChart(chartContainer);
        await nextTick();

        // Simulate metrics update
        await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for metrics timer

        expect(metrics.value).toEqual({
            messagesPerSecond: expect.any(Number),
            bufferUtilization: expect.any(Number),
            errorRate: expect.any(Number),
            averageLatency: expect.any(Number),
            activeConnections: expect.any(Number),
        });
    });

    it('should cleanup streams on unmount', async () => {
        const { chartInstance, connectStream, initChart } = useAgChartsStreaming({
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        });

        initChart(chartContainer);

        // Create mock stream
        const mockStream = {
            id: 'test-stream',
            state: 'idle',
            start: vi.fn(),
            stop: vi.fn(),
            subscribe: vi.fn(),
            onError: vi.fn(),
            onClose: vi.fn(),
        };

        await connectStream(mockStream as any);

        // Simulate component unmount
        const component = mount({
            setup() {
                return useAgChartsStreaming({ series: [] });
            },
            template: '<div></div>',
        });

        component.unmount();

        // Verify cleanup was called
        expect(mockStream.stop).toHaveBeenCalled();
    });
});

describe('AgChartsStreaming Component', () => {
    it('should render with streaming metrics', async () => {
        const wrapper = mount(AgChartsStreaming, {
            props: {
                options: {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                streamingConfig: {
                    showMetrics: true,
                },
            },
        });

        await nextTick();

        expect(wrapper.find('.ag-charts-streaming').exists()).toBe(true);
        expect(wrapper.find('.streaming-metrics').exists()).toBe(true);
    });

    it('should emit stream events', async () => {
        const wrapper = mount(AgChartsStreaming, {
            props: {
                options: { series: [] },
                streamingConfig: {
                    onStreamEvent: () => {},
                },
            },
        });

        // Simulate stream event
        await wrapper.vm.$emit('stream-event', {
            type: 'data',
            streamId: 'test',
            timestamp: Date.now(),
        });

        expect(wrapper.emitted('stream-event')).toBeTruthy();
    });
});

// Performance testing
describe('Stream Performance', () => {
    it('should handle high-frequency updates without memory leaks', async () => {
        const initialMemory = performance.memory?.usedJSHeapSize || 0;

        const { chartInstance, createDataStream, initChart } = useAgChartsStreaming({
            series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
        });

        initChart(chartContainer);
        const stream = createDataStream();

        // Simulate high-frequency updates
        for (let i = 0; i < 1000; i++) {
            await stream.write({
                timestamp: Date.now() + i,
                value: Math.random() * 100,
            });

            // Allow microtasks to process
            await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const finalMemory = performance.memory?.usedJSHeapSize || 0;
        const memoryIncrease = finalMemory - initialMemory;

        // Memory increase should be reasonable (less than 10MB for 1000 points)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should maintain target frame rate during streaming', async () => {
        const frameTimestamps: number[] = [];

        const recordFrame = () => {
            frameTimestamps.push(performance.now());
            if (frameTimestamps.length < 60) {
                // Record 60 frames
                requestAnimationFrame(recordFrame);
            }
        };

        const { chartInstance, createDataStream, initChart } = useAgChartsStreaming({
            series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
        });

        initChart(chartContainer);
        const stream = createDataStream();

        // Start frame recording
        requestAnimationFrame(recordFrame);

        // Generate data at 100 updates/second
        const updateInterval = setInterval(async () => {
            await stream.write({
                timestamp: Date.now(),
                value: Math.random() * 100,
            });
        }, 10);

        // Wait for frame recording to complete
        await new Promise((resolve) => setTimeout(resolve, 1100));
        clearInterval(updateInterval);

        // Calculate average FPS
        const frameDurations = frameTimestamps.slice(1).map((time, i) => time - frameTimestamps[i]);
        const averageFrameDuration = frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length;
        const averageFPS = 1000 / averageFrameDuration;

        // Should maintain at least 30 FPS during high-frequency updates
        expect(averageFPS).toBeGreaterThan(30);
    });
});
```

## Vue-Specific Risks & Mitigations

### Risk: Reactive Overhead on Stream Objects

**Mitigation**: Always use `shallowRef` and `markRaw` for stream instances

```typescript
// ✅ CORRECT: Prevent deep reactivity on stream objects
const stream = shallowRef(markRaw(streamInstance));
const streamData = shallowRef<StreamData[]>([]);

// ❌ WRONG: Vue will proxy the entire stream object
const stream = ref(streamInstance);
```

### Risk: Memory Leaks from Stream Subscriptions

**Mitigation**: Proper cleanup with composition API lifecycle

```typescript
watchEffect((onInvalidate) => {
    if (!stream.value) return;

    const subscription = stream.value.subscribe(handleData);

    onInvalidate(() => {
        subscription.unsubscribe();
    });
});

onUnmounted(async () => {
    await stream.value?.stop();
});
```

### Risk: Performance Degradation from Excessive Re-renders

**Mitigation**: Use `v-memo` and throttled updates

```vue
<template>
  <!-- Use v-memo to prevent unnecessary re-renders -->
  <div v-memo="[metrics.messagesPerSecond, metrics.averageLatency]">
    {{ formatMetrics(metrics) }}
  </div>
</template>
```

### Risk: Framework Reactivity Conflicts with Stream Backpressure

**Mitigation**: Use `toRaw` when interacting with stream APIs

```typescript
const handleBackpressure = async () => {
    const rawStream = toRaw(stream.value);
    if (rawStream && rawStream.backpressure.shouldApplyBackpressure()) {
        await rawStream.backpressure.waitForResume();
    }
};
```

## Best Practices

1. **Always use `shallowRef` + `markRaw`** for stream instances and large data structures
2. **Use `toRaw`** when calling stream methods to avoid Vue proxy overhead
3. **Implement proper cleanup** in `onUnmounted` and `watchEffect` invalidation
4. **Use `v-memo`** for expensive stream metric computations
5. **Throttle metrics updates** to prevent excessive reactivity
6. **Leverage `watchEffect`** for declarative stream subscription management
7. **Use computed properties** for derived stream state
8. **Implement error boundaries** for stream error isolation

## Performance Targets

-   **Stream Creation**: <10ms initialization time
-   **Connection Latency**: <50ms to establish stream connection
-   **Message Processing**: 100+ messages/second sustained
-   **Memory Usage**: <1MB per active stream
-   **Reactivity Overhead**: <5% of total CPU usage
-   **Frame Rate**: Maintain 60fps during active streaming

This Vue implementation leverages Vue 3's Composition API and reactivity system to provide a powerful, performance-focused streaming solution that integrates seamlessly with AG Charts' native streaming capabilities while maintaining optimal performance characteristics for high-frequency data scenarios.
