# Simplified High-Frequency Data Update API

## Overview

Following AG Grid's proven approach, AG Charts implements high-frequency data updates through a simple JavaScript API that works consistently across all frameworks (React, Angular, Vue).

**Core Principle**: Rather than creating complex framework-specific implementations, we provide powerful JavaScript methods that developers call directly from their framework components.

## Two Primary API Approaches

### Approach 1: Identifier-Based Delta Detection (Simplest)

Provide data with unique identifiers, and the system automatically detects what changed:

```typescript
// Just provide the new data state - system handles the delta
chart.update({
    data: newDataArray,
    dataId: 'id', // Specify which field is the unique identifier
});
```

### Approach 2: Explicit Transactions (Most Control)

Explicitly specify what operations to perform:

```typescript
// Tell the system exactly what changed
chart.applyDataTransaction({
    add: [...],
    update: [...],
    remove: [...]
});
```

## Performance Targets

-   **Update Rate**: 100+ updates/second
-   **Latency**: <50ms from data arrival to render
-   **Memory**: Stable over 24-hour continuous operation
-   **CPU**: <80% at maximum update rate

## Core API Methods

### update(options) - Identifier-Based Delta Detection

For automatic change detection using unique identifiers. Best when you have the full current state.

```typescript
interface UpdateOptions {
    data: any[];
    dataId?: string; // Field name for unique identifier (e.g., 'id', 'timestamp')
}

// System automatically detects adds, updates, and removes
chart.update({
    data: [
        { id: 1, time: 1000, value: 100 }, // Existing (maybe updated)
        { id: 3, time: 3000, value: 103 }, // New item
        // Item with id: 2 was removed
    ],
    dataId: 'id',
});
```

### applyDataTransaction(transaction)

For explicit control over data operations. Best for precise updates when you know exactly what changed.

```typescript
interface DataTransaction {
    add?: any[]; // Rows to add
    update?: any[]; // Rows to update (matched by ID)
    remove?: any[]; // Rows to remove (matched by ID)
}

chart.applyDataTransaction({
    add: [{ id: 3, time: Date.now(), value: 42 }],
    update: [{ id: 1, value: 43 }],
    remove: [{ id: 2 }],
});
```

### applyDataTransactionAsync(transaction, callback?) - Future Enhancement

**Note**: This batching optimization may be added in Phase 2 for additional performance gains.

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

    // For identifier-based updates
    dataId: 'id', // Field to use as unique identifier

    // Data retention
    dataRetentionPolicy: {
        enabled: true,
        maxDataPoints: 10000, // Keep last N points
        maxTimeWindow: 3600000, // Keep last hour (ms)
    },

    // Future: Async transaction settings (Phase 2)
    // asyncTransactionWaitMillis: 50, // Default: 50ms
    // maxConcurrentTransactions: 10, // Default: 10
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
            // Option 1: Identifier-based (simplest)
            chart.update({ data, dataId: 'id' });

            // Option 2: Explicit transactions (most control)
            // chart.applyDataTransaction({ add: newItems, update: changedItems });
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

    private allData: any[] = [];

    onNewData(newData: any[]) {
        const chart = this.chartComponent?.getInstance();

        // Option 1: Maintain full state and use identifier-based update
        this.allData = [...this.allData, ...newData];
        chart?.update({ data: this.allData, dataId: 'id' });

        // Option 2: Use transactions for incremental updates
        // chart?.applyDataTransaction({ add: newData });
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

    // Option 1: Full state with identifier-based update
    instance?.update({ data: newData, dataId: 'id' });

    // Option 2: Incremental updates with transactions
    // instance?.applyDataTransaction({ add: addedItems });
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
            dataId: 'tradeId', // Unique identifier field
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

        this.allTrades = [];
        this.connectToFeed();
    }

    connectToFeed() {
        const ws = new WebSocket('wss://trading.example.com/feed');

        ws.onmessage = (event) => {
            const trades = JSON.parse(event.data);

            // Method 1: Identifier-based - merge new trades with existing
            const tradeMap = new Map(this.allTrades.map((t) => [t.tradeId, t]));
            trades.forEach((t) => {
                tradeMap.set(t.tradeId, {
                    tradeId: t.tradeId,
                    time: new Date(t.timestamp),
                    price: t.price,
                    volume: t.volume,
                });
            });
            this.allTrades = Array.from(tradeMap.values());
            this.chart.update({ data: this.allTrades });

            // Method 2: Transaction-based - explicit operations
            // this.chart.applyDataTransaction({
            //     add: trades.map(t => ({
            //         tradeId: t.tradeId,
            //         time: new Date(t.timestamp),
            //         price: t.price,
            //         volume: t.volume,
            //     })),
            // });
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

### 2. Choose the Right API Method

For different update patterns:

```javascript
// For full state management (easiest)
chart.update({ data: allData, dataId: 'id' });

// For incremental updates (most efficient)
chart.applyDataTransaction({ add: newData });

// Future: For very high frequency (>50/second)
// chart.applyDataTransactionAsync({ add: data });
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

**Q: When should I use identifier-based vs transaction-based updates?**
A: Use identifier-based when you have the full current state (simpler). Use transactions when you only know what changed (more efficient).

**Q: Do I need unique IDs for all data?**
A: Only if using identifier-based updates. Transaction-based updates can work with positional data.

**Q: What happens if my data doesn't have unique IDs?**
A: You can either add IDs (e.g., using timestamp + counter), or use transaction-based updates with explicit add operations.

**Q: Can I mix identifier-based and transaction-based updates?**
A: Yes, but be consistent within a single data flow to avoid confusion.

**Q: How do I handle backpressure with high-frequency updates?**
A: Currently, implement your own throttling. Phase 2 will add automatic batching with `applyDataTransactionAsync`.

**Q: Is there a performance difference between frameworks?**
A: No. Since the API is JavaScript-based and frameworks just call it directly, performance is consistent across React, Angular, and Vue.
