# Simplified High-Frequency Data Update API

## Overview

Following AG Grid's proven approach, AG Charts implements high-frequency data updates through a simple JavaScript API that works consistently across all frameworks (React, Angular, Vue).

**Core Principle**: Rather than creating complex framework-specific implementations, we provide powerful JavaScript methods that developers call directly from their framework components.

## Performance Targets

-   **Update Rate**: 100+ updates/second
-   **Latency**: <50ms from data arrival to render
-   **Memory**: Stable over 24-hour continuous operation
-   **CPU**: <80% at maximum update rate

## Core API Methods

### applyDataTransaction(transaction)

For immediate, synchronous data updates. Best for infrequent updates (<5/second).

```typescript
interface DataTransaction {
    add?: any[]; // Rows to add
    update?: any[]; // Rows to update (matched by ID)
    remove?: any[]; // Rows to remove (matched by ID)
}

chart.applyDataTransaction({
    add: [{ time: Date.now(), value: 42 }],
    update: [{ id: 'row1', value: 43 }],
    remove: [{ id: 'row2' }],
});
```

### applyDataTransactionAsync(transaction, callback?)

For high-frequency batched updates. Transactions are queued and processed in batches for optimal performance.

```typescript
chart.applyDataTransactionAsync(
    {
        add: [{ time: Date.now(), value: 42 }],
    },
    (result) => {
        console.log(`Processed ${result.add.length} additions`);
    }
);
```

### Configuration Options

```typescript
const options = {
    // Disable animations for high-frequency updates
    animation: { enabled: false },

    // Async transaction settings
    asyncTransactionWaitMillis: 50, // Default: 50ms
    maxConcurrentTransactions: 10, // Default: 10

    // Data retention
    dataRetentionPolicy: {
        enabled: true,
        maxDataPoints: 10000, // Keep last N points
        maxTimeWindow: 3600000, // Keep last hour (ms)
    },
};
```

### flushAsyncTransactions()

Manually flush all pending async transactions immediately.

```typescript
// Add multiple updates
chart.applyDataTransactionAsync({ add: data1 });
chart.applyDataTransactionAsync({ add: data2 });

// Force immediate processing
chart.flushAsyncTransactions();
```

## Framework Integration Patterns

### React

```typescript
import { useRef, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';

function StreamingChart({ data }) {
    const chartRef = useRef(null);

    useEffect(() => {
        const chart = chartRef.current?.getInstance();
        if (chart && data) {
            chart.applyDataTransactionAsync({ add: data });
        }
    }, [data]);

    return <AgCharts ref={chartRef} options={options} />;
}
```

### Angular

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';

import { AgChartsAngular } from 'ag-charts-angular';

@Component({
    selector: 'streaming-chart',
    template: '<ag-charts-angular #chart [options]="options"></ag-charts-angular>',
})
export class StreamingChartComponent implements OnInit {
    @ViewChild('chart') chartComponent: AgChartsAngular;

    onNewData(data: any[]) {
        const chart = this.chartComponent?.getInstance();
        chart?.applyDataTransactionAsync({ add: data });
    }

    ngOnInit() {
        // Connect to WebSocket
        this.ws = new WebSocket('wss://data.example.com');
        this.ws.onmessage = (event) => {
            this.onNewData(JSON.parse(event.data));
        };
    }
}
```

### Vue 3

```vue
<template>
    <ag-charts-vue ref="chart" :options="options" />
</template>

<script setup>
import { ref, watch } from 'vue';
import { AgChartsVue } from 'ag-charts-vue3';

const chart = ref(null);
const props = defineProps(['data']);

watch(() => props.data, (newData) => {
    const instance = chart.value?.getInstance();
    instance?.applyDataTransactionAsync({ add: newData });
});
</script>
```

## Real-World Examples

### Financial Trading Dashboard

```javascript
class TradingChart {
    constructor(container) {
        this.chart = AgCharts.create({
            container,
            animation: { enabled: false },
            asyncTransactionWaitMillis: 20,
            series: [
                { type: 'line', xKey: 'time', yKey: 'price' },
                { type: 'column', xKey: 'time', yKey: 'volume', yAxis: 'volume' },
            ],
            axes: [
                { type: 'time', position: 'bottom' },
                { type: 'number', position: 'left' },
                { type: 'number', position: 'right', keys: ['volume'], id: 'volume' },
            ],
        });

        this.connectToFeed();
    }

    connectToFeed() {
        const ws = new WebSocket('wss://trading.example.com/feed');

        ws.onmessage = (event) => {
            const trades = JSON.parse(event.data);

            // Batch updates for efficiency
            this.chart.applyDataTransactionAsync({
                add: trades.map((t) => ({
                    time: new Date(t.timestamp),
                    price: t.price,
                    volume: t.volume,
                })),
            });
        };
    }
}
```

### IoT Sensor Monitoring

```javascript
class SensorMonitor {
    constructor(container, sensorIds) {
        this.chart = AgCharts.create({
            container,
            animation: { enabled: false },
            dataRetentionPolicy: {
                enabled: true,
                maxDataPoints: 1000, // Rolling window
            },
            series: sensorIds.map((id) => ({
                type: 'line',
                xKey: 'timestamp',
                yKey: id,
                yName: `Sensor ${id}`,
            })),
        });

        this.startPolling();
    }

    async startPolling() {
        setInterval(async () => {
            const data = await fetch('/api/sensors/latest');
            const readings = await data.json();

            this.chart.applyDataTransactionAsync({
                add: readings,
            });
        }, 100); // 10 updates/second
    }
}
```

## Performance Optimization Tips

### 1. Disable Animations

Always disable animations for high-frequency updates:

```javascript
options.animation = { enabled: false };
```

### 2. Use Async Transactions

For updates >5/second, always use `applyDataTransactionAsync`:

```javascript
// ❌ Avoid for high frequency
chart.applyDataTransaction({ add: data });

// ✅ Preferred for high frequency
chart.applyDataTransactionAsync({ add: data });
```

### 3. Batch Updates

Group multiple updates together when possible:

```javascript
// ❌ Multiple calls
data.forEach((item) => {
    chart.applyDataTransactionAsync({ add: [item] });
});

// ✅ Single batched call
chart.applyDataTransactionAsync({ add: data });
```

### 4. Configure Buffer Timing

Adjust `asyncTransactionWaitMillis` based on your update frequency:

```javascript
// For very high frequency (>100/sec)
options.asyncTransactionWaitMillis = 20;

// For moderate frequency (10-50/sec)
options.asyncTransactionWaitMillis = 50;

// For low frequency (<10/sec)
options.asyncTransactionWaitMillis = 100;
```

### 5. Implement Data Retention

Prevent memory issues with retention policies:

```javascript
options.dataRetentionPolicy = {
    enabled: true,
    maxDataPoints: 5000, // Absolute limit
    maxTimeWindow: 300000, // 5 minutes
};
```

## Migration from Complex Framework Patterns

### Before (Complex Framework-Specific)

```javascript
// React with custom hooks
const { addData, metrics } = useAgChartsStream(options, {
    batchSize: 30,
    bufferTimeMs: 16,
});

// Angular with zone management
ngZone.runOutsideAngular(() => {
    this.chart.processBatch(updates);
});
```

### After (Simple Direct API)

```javascript
// Any framework - just call the API
chart.applyDataTransactionAsync({ add: newData });
```

## Event Monitoring

```javascript
// Monitor async transaction processing
chart.addEventListener('asyncTransactionsApplied', (event) => {
    console.log(`Applied ${event.results.length} transactions`);
});

// Monitor performance
chart.addEventListener('chartRenderComplete', (event) => {
    console.log(`Render time: ${event.renderTime}ms`);
});
```

## Testing

```javascript
describe('High-frequency updates', () => {
    it('handles 100 updates per second', async () => {
        const chart = createChart(options);

        for (let i = 0; i < 100; i++) {
            chart.applyDataTransactionAsync({
                add: [{ time: Date.now(), value: Math.random() }],
            });
            await sleep(10);
        }

        chart.flushAsyncTransactions();

        expect(chart.getData().length).toBe(100);
    });
});
```

## FAQ

**Q: When should I use sync vs async transactions?**
A: Use `applyDataTransaction` for infrequent updates (<5/second). Use `applyDataTransactionAsync` for high-frequency updates.

**Q: How do I handle backpressure?**
A: The async transaction queue automatically handles backpressure. Configure `maxConcurrentTransactions` to limit queue size.

**Q: Can I mix sync and async transactions?**
A: Yes, but sync transactions execute immediately and may interfere with async batch processing. Prefer one pattern consistently.

**Q: How do I optimize for my specific update rate?**
A: Adjust `asyncTransactionWaitMillis`: lower values (20-30ms) for very high frequency, higher values (50-100ms) for moderate frequency.

**Q: Is there a performance difference between frameworks?**
A: No. Since the API is JavaScript-based and frameworks just call it directly, performance is consistent across React, Angular, and Vue.
