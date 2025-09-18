# Framework Integration Examples

This document provides practical examples of integrating AG Charts high-frequency data updates across React, Angular, and Vue frameworks using the simplified JavaScript API approach.

## Key Principle

Following AG Grid's pattern, we don't provide framework-specific APIs. Instead, developers:

1. Get a reference to the chart instance
2. Call JavaScript API methods directly
3. Use their preferred framework patterns for state management

## React Examples

### Basic Real-Time Chart

```tsx
import React, { useRef, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';
import { AgChartInstance } from 'ag-charts-community';

export function RealTimeChart() {
    const chartRef = useRef<AgChartInstance>(null);

    const options = {
        animation: { enabled: false },
        series: [
            { type: 'line', xKey: 'time', yKey: 'value' }
        ]
    };

    useEffect(() => {
        const ws = new WebSocket('wss://data.example.com');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const chart = chartRef.current?.getInstance();

            chart?.applyDataTransactionAsync({
                add: [data]
            });
        };

        return () => ws.close();
    }, []);

    return <AgCharts ref={chartRef} options={options} />;
}
```

### With Custom Hook for WebSocket

```tsx
function useWebSocketData(url: string) {
    const [isConnected, setIsConnected] = useState(false);
    const chartRef = useRef<AgChartInstance>(null);

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            chartRef.current?.applyDataTransactionAsync({ add: data });
        };

        return () => ws.close();
    }, [url]);

    return { chartRef, isConnected };
}

// Usage
export function TradingChart() {
    const { chartRef, isConnected } = useWebSocketData('wss://trades.example.com');

    return (
        <div>
            <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
            <AgCharts ref={chartRef} options={options} />
        </div>
    );
}
```

### With Performance Monitoring

```tsx
export function MonitoredChart() {
    const chartRef = useRef<AgChartInstance>(null);
    const [metrics, setMetrics] = useState({ fps: 60, updates: 0 });

    useEffect(() => {
        const chart = chartRef.current?.getInstance();
        if (!chart) return;

        chart.addEventListener('asyncTransactionsApplied', (event) => {
            setMetrics(prev => ({
                fps: Math.round(1000 / event.processingTime),
                updates: prev.updates + event.results.length
            }));
        });
    }, []);

    const addTestData = () => {
        const chart = chartRef.current?.getInstance();
        const testData = Array.from({ length: 100 }, (_, i) => ({
            time: Date.now() + i * 10,
            value: Math.random() * 100
        }));

        chart?.applyDataTransactionAsync({ add: testData });
    };

    return (
        <div>
            <div>FPS: {metrics.fps} | Updates: {metrics.updates}</div>
            <button onClick={addTestData}>Add Test Data</button>
            <AgCharts ref={chartRef} options={options} />
        </div>
    );
}
```

## Angular Examples

### Basic Real-Time Chart

```typescript
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { AgChartsAngular } from 'ag-charts-angular';
import { AgChartOptions } from 'ag-charts-community';

@Component({
    selector: 'app-realtime-chart',
    template: ` <ag-charts-angular #chart [options]="options" style="height: 400px"> </ag-charts-angular> `,
})
export class RealTimeChartComponent implements OnInit, OnDestroy {
    @ViewChild('chart') chartComponent!: AgChartsAngular;

    private ws?: WebSocket;

    options: AgChartOptions = {
        animation: { enabled: false },
        series: [{ type: 'line', xKey: 'time', yKey: 'value' }],
    };

    ngOnInit() {
        this.ws = new WebSocket('wss://data.example.com');

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const chart = this.chartComponent?.getInstance();

            chart?.applyDataTransactionAsync({
                add: [data],
            });
        };
    }

    ngOnDestroy() {
        this.ws?.close();
    }
}
```

### With RxJS Integration

```typescript
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { bufferTime, filter, takeUntil } from 'rxjs/operators';

import { AgChartsAngular } from 'ag-charts-angular';

@Component({
    selector: 'app-streaming-chart',
    template: `
        <ag-charts-angular #chart [options]="options"> </ag-charts-angular>
        <div>Buffer size: {{ bufferSize }}</div>
    `,
})
export class StreamingChartComponent implements OnInit, OnDestroy {
    @ViewChild('chart') chartComponent!: AgChartsAngular;

    private destroy$ = new Subject<void>();
    private dataStream$ = new Subject<any>();
    bufferSize = 0;

    ngOnInit() {
        // Buffer updates every 50ms
        this.dataStream$
            .pipe(
                bufferTime(50),
                filter((buffer) => buffer.length > 0),
                takeUntil(this.destroy$)
            )
            .subscribe((buffer) => {
                this.bufferSize = buffer.length;
                const chart = this.chartComponent?.getInstance();

                chart?.applyDataTransactionAsync({
                    add: buffer,
                });
            });

        // Simulate data stream
        this.simulateDataStream();
    }

    private simulateDataStream() {
        interval(10)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.dataStream$.next({
                    time: Date.now(),
                    value: Math.random() * 100,
                });
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

### With Service for Data Management

```typescript
// data-stream.service.ts
@Injectable({ providedIn: 'root' })
export class DataStreamService {
    private charts = new Map<string, any>();

    registerChart(id: string, chart: any) {
        this.charts.set(id, chart);
    }

    updateChart(id: string, data: any[]) {
        const chart = this.charts.get(id);
        chart?.applyDataTransactionAsync({ add: data });
    }

    flushAll() {
        this.charts.forEach((chart) => {
            chart.flushAsyncTransactions();
        });
    }
}

// component using the service
@Component({
    selector: 'app-managed-chart',
    template: `
        <ag-charts-angular #chart [options]="options"></ag-charts-angular>
        <button (click)="flush()">Flush Updates</button>
    `,
})
export class ManagedChartComponent implements AfterViewInit {
    @ViewChild('chart') chartComponent!: AgChartsAngular;

    constructor(private dataService: DataStreamService) {}

    ngAfterViewInit() {
        const chart = this.chartComponent.getInstance();
        this.dataService.registerChart('main', chart);
    }

    flush() {
        this.dataService.flushAll();
    }
}
```

## Vue 3 Examples

### Basic Real-Time Chart

```vue
<template>
    <ag-charts-vue
        ref="chartRef"
        :options="options"
        style="height: 400px">
    </ag-charts-vue>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { AgChartsVue } from 'ag-charts-vue3';

const chartRef = ref(null);
let ws = null;

const options = {
    animation: { enabled: false },
    series: [
        { type: 'line', xKey: 'time', yKey: 'value' }
    ]
};

onMounted(() => {
    ws = new WebSocket('wss://data.example.com');

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const chart = chartRef.value?.getInstance();

        chart?.applyDataTransactionAsync({
            add: [data]
        });
    };
});

onUnmounted(() => {
    ws?.close();
});
</script>
```

### With Composition API and Reactive Data

```vue
<template>
    <div>
        <ag-charts-vue ref="chartRef" :options="options" />
        <div>Updates: {{ updateCount }}</div>
    </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { AgChartsVue } from 'ag-charts-vue3';

const chartRef = ref(null);
const updateCount = ref(0);

const dataBuffer = reactive({
    items: []
});

// Watch for data changes and batch update
watch(() => dataBuffer.items.length, (newLength) => {
    if (newLength > 0) {
        const chart = chartRef.value?.getInstance();

        chart?.applyDataTransactionAsync({
            add: [...dataBuffer.items]
        });

        updateCount.value += dataBuffer.items.length;
        dataBuffer.items = [];
    }
});

// Simulate adding data
function addData() {
    dataBuffer.items.push({
        time: Date.now(),
        value: Math.random() * 100
    });
}

// Add data every 100ms
setInterval(addData, 100);
</script>
```

### With Composable for Chart Management

```javascript
// useStreamingChart.js
import { onUnmounted, ref } from 'vue';

export function useStreamingChart(url) {
    const chartRef = ref(null);
    const isConnected = ref(false);
    const metrics = ref({ updates: 0, lastUpdate: null });
    let ws = null;

    function connect() {
        ws = new WebSocket(url);

        ws.onopen = () => {
            isConnected.value = true;
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const chart = chartRef.value?.getInstance();

            chart?.applyDataTransactionAsync({ add: data });

            metrics.value.updates += data.length;
            metrics.value.lastUpdate = new Date();
        };

        ws.onclose = () => {
            isConnected.value = false;
        };
    }

    function disconnect() {
        ws?.close();
    }

    function flush() {
        chartRef.value?.getInstance()?.flushAsyncTransactions();
    }

    onUnmounted(() => {
        disconnect();
    });

    return {
        chartRef,
        isConnected,
        metrics,
        connect,
        disconnect,
        flush,
    };
}
```

```vue
<!-- Using the composable -->
<template>
    <div>
        <div>
            Status: {{ isConnected ? 'Connected' : 'Disconnected' }}
            | Updates: {{ metrics.updates }}
        </div>
        <ag-charts-vue ref="chartRef" :options="options" />
        <button @click="connect">Connect</button>
        <button @click="disconnect">Disconnect</button>
        <button @click="flush">Flush</button>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { AgChartsVue } from 'ag-charts-vue3';
import { useStreamingChart } from './useStreamingChart';

const {
    chartRef,
    isConnected,
    metrics,
    connect,
    disconnect,
    flush
} = useStreamingChart('wss://data.example.com');

const options = {
    animation: { enabled: false },
    series: [{ type: 'line', xKey: 'time', yKey: 'value' }]
};

onMounted(() => {
    connect();
});
</script>
```

## Common Patterns Across Frameworks

### 1. Getting Chart Instance

```javascript
// React
const chart = chartRef.current?.getInstance();

// Angular
const chart = this.chartComponent?.getInstance();

// Vue
const chart = chartRef.value?.getInstance();
```

### 2. Applying Transactions

All frameworks use the same API:

```javascript
chart.applyDataTransactionAsync({
    add: newData,
    update: updatedData,
    remove: removedData,
});
```

### 3. Performance Configuration

Same options object across all frameworks:

```javascript
const options = {
    animation: { enabled: false },
    asyncTransactionWaitMillis: 50,
    dataRetentionPolicy: {
        enabled: true,
        maxDataPoints: 10000,
    },
};
```

### 4. Event Handling

```javascript
chart.addEventListener('asyncTransactionsApplied', (event) => {
    console.log(`Processed ${event.results.length} transactions`);
});
```

## Best Practices

1. **Always disable animations** for high-frequency updates
2. **Use async transactions** for updates >5/second
3. **Batch updates** when possible
4. **Clean up resources** (WebSockets, intervals) on component unmount
5. **Monitor performance** using chart events
6. **Let the framework handle state**, use chart API for data updates only

## Performance Tips

-   Keep framework state minimal - don't mirror chart data
-   Use framework optimization patterns (React.memo, Angular OnPush, Vue shallowRef)
-   Batch network updates before sending to chart
-   Configure `asyncTransactionWaitMillis` based on your update frequency
-   Implement data retention policies to prevent memory issues
