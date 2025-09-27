# Incremental Updates Usage Guide

This guide provides comprehensive examples for using the incremental update system in AG Charts' DataModel.

## Overview

The incremental update system allows efficient data updates by mutating ProcessedData structures in-place rather than performing full reprocessing. This provides significant performance improvements for scenarios with frequent, small data changes.

## Basic Usage

### Simple Data Addition

```typescript
import { AgChart } from 'ag-charts-community';

// Create chart with initial data
const chart = AgChart.create({
    data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y',
        },
    ],
});

// Add new data points incrementally
chart.applyTransaction({
    append: [
        { x: 4, y: 40 },
        { x: 5, y: 50 },
    ],
});
```

### Data Removal

```typescript
// Remove specific data points
const dataToRemove = chart.data.filter((d) => d.x === 2);
chart.applyTransaction({
    remove: dataToRemove,
});
```

### Data Prepending

```typescript
// Add data at the beginning
chart.applyTransaction({
    prepend: [
        { x: 0, y: 5 },
        { x: -1, y: 2 },
    ],
});
```

### Combined Operations

```typescript
// Perform multiple operations in a single transaction
chart.applyTransaction({
    remove: [existingDataPoint],
    append: [{ x: 6, y: 60 }],
    prepend: [{ x: -2, y: 1 }],
});
```

## Advanced Usage

### Real-time Data Streaming

```typescript
class RealTimeChart {
    private chart: AgChart;
    private maxDataPoints = 100;

    constructor(container: HTMLElement) {
        this.chart = AgChart.create({
            container,
            data: [],
            series: [
                {
                    type: 'line',
                    xKey: 'timestamp',
                    yKey: 'value',
                },
            ],
        });
    }

    addDataPoint(value: number) {
        const timestamp = Date.now();
        const newPoint = { timestamp, value };

        // Prepare transaction
        const transaction: any = {
            append: [newPoint],
        };

        // Remove old data if we exceed max points
        if (this.chart.data.length >= this.maxDataPoints) {
            const pointsToRemove = this.chart.data.slice(0, 1);
            transaction.remove = pointsToRemove;
        }

        // Apply high-frequency update
        this.chart.applyTransaction(transaction);
    }

    startStreaming() {
        setInterval(() => {
            const value = Math.random() * 100;
            this.addDataPoint(value);
        }, 100); // 10 FPS updates
    }
}
```

### Live Trading Dashboard

```typescript
interface TradeData {
    symbol: string;
    price: number;
    volume: number;
    timestamp: number;
}

class TradingChart {
    private chart: AgChart;
    private priceHistory = new Map<string, TradeData[]>();

    constructor(container: HTMLElement) {
        this.chart = AgChart.create({
            container,
            data: [],
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
        });
    }

    updatePrice(trade: TradeData) {
        // Get existing data for symbol
        const history = this.priceHistory.get(trade.symbol) || [];
        history.push(trade);
        this.priceHistory.set(trade.symbol, history);

        // Update chart incrementally
        this.chart.applyTransaction({
            append: [this.aggregateToCandle(history.slice(-1))],
        });
    }

    private aggregateToCandle(trades: TradeData[]) {
        // Aggregate trades into OHLC candlestick data
        const prices = trades.map((t) => t.price);
        return {
            timestamp: trades[0].timestamp,
            open: prices[0],
            high: Math.max(...prices),
            low: Math.min(...prices),
            close: prices[prices.length - 1],
            volume: trades.reduce((sum, t) => sum + t.volume, 0),
        };
    }
}
```

### Gaming Leaderboard

```typescript
interface PlayerScore {
    playerId: string;
    playerName: string;
    score: number;
    level: number;
}

class LeaderboardChart {
    private chart: AgChart;

    constructor(container: HTMLElement) {
        this.chart = AgChart.create({
            container,
            data: [],
            series: [
                {
                    type: 'bar',
                    xKey: 'playerName',
                    yKey: 'score',
                },
            ],
        });
    }

    updatePlayerScore(playerId: string, newScore: number) {
        const currentData = this.chart.data as PlayerScore[];
        const existingPlayer = currentData.find((p) => p.playerId === playerId);

        if (existingPlayer && newScore > existingPlayer.score) {
            // Player improved their score - remove old entry and add new one
            const updatedPlayer = { ...existingPlayer, score: newScore };

            this.chart.applyTransaction({
                remove: [existingPlayer],
                append: [updatedPlayer],
            });

            // Re-sort data by score (this would trigger another update)
            this.resortLeaderboard();
        }
    }

    private resortLeaderboard() {
        // For real-time leaderboards, you might want to implement
        // position-based updates rather than full resort
        const sortedData = [...this.chart.data].sort((a, b) => b.score - a.score);
        this.chart.setData(sortedData);
    }
}
```

## Performance Optimization

### Batching Updates

```typescript
class BatchedUpdates {
    private pendingTransactions: any[] = [];
    private updateTimeout: NodeJS.Timeout | null = null;

    constructor(private chart: AgChart) {}

    queueUpdate(transaction: any) {
        this.pendingTransactions.push(transaction);

        // Debounce updates to avoid excessive processing
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.flushUpdates();
        }, 16); // ~60 FPS
    }

    private flushUpdates() {
        if (this.pendingTransactions.length === 0) return;

        // Combine all pending transactions
        const combinedTransaction = this.combineTransactions(this.pendingTransactions);

        // Apply as single transaction for better performance
        this.chart.applyTransaction(combinedTransaction);

        this.pendingTransactions = [];
        this.updateTimeout = null;
    }

    private combineTransactions(transactions: any[]) {
        const combined = {
            append: [],
            prepend: [],
            remove: [],
        };

        for (const tx of transactions) {
            if (tx.append) combined.append.push(...tx.append);
            if (tx.prepend) combined.prepend.push(...tx.prepend);
            if (tx.remove) combined.remove.push(...tx.remove);
        }

        return combined;
    }
}
```

### Memory-Efficient Streaming

```typescript
class MemoryEfficientStream {
    private chart: AgChart;
    private readonly maxPoints: number;
    private readonly chunkSize: number;

    constructor(container: HTMLElement, maxPoints = 1000, chunkSize = 100) {
        this.maxPoints = maxPoints;
        this.chunkSize = chunkSize;

        this.chart = AgChart.create({
            container,
            data: [],
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        });
    }

    addDataChunk(newData: any[]) {
        const currentData = this.chart.data;
        const transaction: any = { append: newData };

        // Remove old data in chunks to prevent memory buildup
        if (currentData.length + newData.length > this.maxPoints) {
            const excessPoints = currentData.length + newData.length - this.maxPoints;
            const pointsToRemove = currentData.slice(0, excessPoints);
            transaction.remove = pointsToRemove;
        }

        this.chart.applyTransaction(transaction);
    }

    startHighFrequencyStream() {
        setInterval(() => {
            const chunk = this.generateDataChunk();
            this.addDataChunk(chunk);
        }, 50); // 20 FPS
    }

    private generateDataChunk() {
        const chunk = [];
        for (let i = 0; i < this.chunkSize; i++) {
            chunk.push({
                x: Date.now() + i,
                y: Math.random() * 100,
            });
        }
        return chunk;
    }
}
```

## Error Handling and Fallbacks

### Graceful Degradation

```typescript
class RobustChart {
    private chart: AgChart;
    private fallbackMode = false;

    constructor(container: HTMLElement) {
        this.chart = AgChart.create({
            container,
            data: [],
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                },
            ],
        });
    }

    updateData(transaction: any) {
        try {
            if (this.fallbackMode) {
                this.fullUpdate(transaction);
            } else {
                this.incrementalUpdate(transaction);
            }
        } catch (error) {
            console.warn('Incremental update failed, falling back to full update:', error);
            this.fallbackMode = true;
            this.fullUpdate(transaction);
        }
    }

    private incrementalUpdate(transaction: any) {
        // Try incremental update
        this.chart.applyTransaction(transaction);
    }

    private fullUpdate(transaction: any) {
        // Fallback: rebuild complete dataset
        let newData = [...this.chart.data];

        if (transaction.remove) {
            newData = newData.filter((item) => !transaction.remove.includes(item));
        }

        if (transaction.prepend) {
            newData = [...transaction.prepend, ...newData];
        }

        if (transaction.append) {
            newData = [...newData, ...transaction.append];
        }

        this.chart.setData(newData);
    }
}
```

## Best Practices

### 1. Use Object Identity for Removals

```typescript
// ✅ Good: Keep references to objects for removal
const dataPoint = { x: 1, y: 10 };
chart.setData([dataPoint, { x: 2, y: 20 }]);

// Later remove using the same reference
chart.applyTransaction({
    remove: [dataPoint], // Uses object identity
});

// ❌ Bad: Creating new objects for removal
chart.applyTransaction({
    remove: [{ x: 1, y: 10 }], // Won't match - different object
});
```

### 2. Batch Related Operations

```typescript
// ✅ Good: Single transaction with multiple operations
chart.applyTransaction({
    remove: [oldPoint1, oldPoint2],
    append: [newPoint1, newPoint2, newPoint3],
});

// ❌ Bad: Multiple separate transactions
chart.applyTransaction({ remove: [oldPoint1] });
chart.applyTransaction({ remove: [oldPoint2] });
chart.applyTransaction({ append: [newPoint1] });
chart.applyTransaction({ append: [newPoint2] });
```

### 3. Consider Data Size and Frequency

```typescript
// For high-frequency, small changes: use incremental updates
if (changeSize < dataSize * 0.1 && updateFrequency > 10) {
    chart.applyTransaction(transaction);
} else {
    // For large changes or infrequent updates: use full replacement
    chart.setData(newCompleteDataset);
}
```

### 4. Monitor Performance

```typescript
class PerformanceMonitoredChart {
    private chart: AgChart;
    private updateTimes: number[] = [];

    updateData(transaction: any) {
        const startTime = performance.now();

        this.chart.applyTransaction(transaction);

        const endTime = performance.now();
        this.updateTimes.push(endTime - startTime);

        // Keep only recent measurements
        if (this.updateTimes.length > 100) {
            this.updateTimes.shift();
        }

        // Log performance metrics periodically
        if (this.updateTimes.length % 50 === 0) {
            const avgTime = this.updateTimes.reduce((a, b) => a + b) / this.updateTimes.length;
            console.log(`Average update time: ${avgTime.toFixed(2)}ms`);
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **"Incremental updates disabled: grouping not yet supported"**

    - Solution: Avoid using grouping features with incremental updates
    - Alternative: Use full data replacement for grouped data

2. **"Object not found for removal"**

    - Solution: Ensure you're using the exact same object reference
    - Check that the object hasn't been mutated since adding

3. **Performance degradation with large transactions**

    - Solution: Break large transactions into smaller chunks
    - Consider using full data replacement for bulk changes

4. **Memory leaks with streaming data**
    - Solution: Implement proper data retention limits
    - Remove old data points regularly using transaction.remove

### Debugging

```typescript
// Enable debug logging for transaction analysis
console.debug('Transaction:', transaction);
console.debug('Current data length:', chart.data.length);

// Monitor data growth
setInterval(() => {
    console.log('Current data points:', chart.data.length);
}, 5000);
```
