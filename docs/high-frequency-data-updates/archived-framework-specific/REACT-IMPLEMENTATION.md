# Option 3: Batched Update Queue - React Implementation

## Overview

This document provides React-specific implementation details for Option 3 (Batched Update Queue) of the high-frequency data updates feature in AG Charts. For the overall design document, see [DESIGN_DOC.md](../DESIGN_DOC.md). For the Option 3 architecture details, see [OPTION-3-BATCHED-UPDATE-QUEUE.md](./OPTION-3-BATCHED-UPDATE-QUEUE.md).

## Current State Analysis

### Existing React Wrapper

-   **Location**: `packages/ag-charts-react/src/index.ts`
-   **Current Implementation**:
    -   Creates chart in `useLayoutEffect`, updates via `useEffect` on options identity change
    -   Consumers typically regenerate options objects on each render
    -   No distinction between data-only and configuration updates
    -   Full reconciliation on every prop change

### Performance Bottlenecks

-   Data processing overhead (393ms out of 580ms total for 1M points) requiring optimization
-   React reconciliation overhead on frequent updates
-   Options object identity changes triggering full chart updates
-   No leveraging of React 18+ concurrent features
-   Missing memoization and optimization patterns for data-heavy operations

## Implementation Strategy

### Core Streaming Hook with React 18+ Features

```typescript
import { startTransition, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

interface StreamConfig {
    updateStrategy?: 'append' | 'rolling' | 'replace';
    rollingWindowSize?: number;
    batchSize?: number;
    batchTimeout?: number;
    enablePerformanceMonitoring?: boolean;
    onPerformanceAlert?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
    updatesPerSecond: number;
    droppedUpdates: number;
    averageProcessingTime: number;
    fps: number;
    memoryUsageMB: number;
}

// Main streaming hook with React 18 optimizations
export function useAgChartsStream<T = any>(initialOptions: AgChartOptions, streamConfig?: StreamConfig) {
    const chartRef = useRef<AgChartInstance | null>(null);
    const batchRef = useRef<T[]>([]);
    const frameIdRef = useRef<number | null>(null);
    const metricsRef = useRef<PerformanceMetrics>({
        updatesPerSecond: 0,
        droppedUpdates: 0,
        averageProcessingTime: 0,
        fps: 60,
        memoryUsageMB: 0,
    });

    // Stable chart options with memoization
    const chartOptions = useMemo(
        () => ({
            ...initialOptions,
            animation: { enabled: false }, // Critical for high-frequency
        }),
        [initialOptions]
    );

    // Deferred value for non-urgent UI updates
    const deferredMetrics = useDeferredValue(metricsRef.current);

    // Batch processing with React 18's automatic batching - focus on data processing efficiency
    const processBatch = useCallback(() => {
        if (batchRef.current.length === 0) return;

        const startTime = performance.now();
        // Larger batches to amortize data processing overhead (68% of total time)
        const batchSize = streamConfig?.batchSize || 30;
        const batch = batchRef.current.splice(0, batchSize);

        // Use startTransition for non-urgent updates
        startTransition(() => {
            chartRef.current?.applyDataTransaction({
                operations: [
                    {
                        type: streamConfig?.updateStrategy || 'append',
                        rows: batch,
                    },
                ],
            });
        });

        // Update metrics with data processing focus
        const processingTime = performance.now() - startTime;
        const dataProcessingTime = processingTime * 0.68; // Primary bottleneck
        const renderingTime = processingTime * 0.05; // Minimal overhead

        metricsRef.current = {
            ...metricsRef.current,
            averageProcessingTime: processingTime,
            dataProcessingTime,
            renderingTime,
            fps: Math.round(1000 / (16 + processingTime)),
        };

        // Schedule next batch
        if (batchRef.current.length > 0) {
            frameIdRef.current = requestAnimationFrame(processBatch);
        } else {
            frameIdRef.current = null;
        }
    }, [streamConfig]);

    // Optimized data addition with batching
    const addData = useCallback(
        (data: T) => {
            batchRef.current.push(data);

            if (!frameIdRef.current) {
                frameIdRef.current = requestAnimationFrame(processBatch);
            }
        },
        [processBatch]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (frameIdRef.current) {
                cancelAnimationFrame(frameIdRef.current);
            }
        };
    }, []);

    return {
        chartRef,
        addData,
        chartOptions,
        metrics: deferredMetrics,
    };
}
```

### Enhanced Component with Error Boundaries

```typescript
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';

export const AgChartsStreaming = forwardRef<
  AgChartInstance,
  { options: AgChartOptions; streamConfig?: StreamConfig }
>(({ options, streamConfig }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<AgChartInstance | null>(null);

  // Stable refs for callbacks
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useImperativeHandle(ref, () => ({
    ...chartInstanceRef.current!,
    applyDataTransaction: (txn) => {
      startTransition(() => {
        chartInstanceRef.current?.applyDataTransaction(txn);
      });
    },
    getStreamingMetrics: () => metricsRef.current,
  }), []);

  // Use useLayoutEffect for synchronous chart creation
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Create chart outside React's reconciliation
    const chart = AgCharts.create({
      ...optionsRef.current,
      container: containerRef.current,
      animation: { enabled: false },
    });

    chartInstanceRef.current = chart;

    return () => {
      chart.destroy();
    };
  }, []); // Only run once

  // Optimized options update - only when actually changed
  useEffect(() => {
    const { data, ...configOnly } = options;

    // Skip if no real changes
    if (chartInstanceRef.current && configOnly !== optionsRef.current) {
      startTransition(() => {
        chartInstanceRef.current.update(configOnly);
      });
    }
  }, [options]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
});

// Error boundary for streaming components
export class StreamingErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div>Chart streaming error. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

## Usage Examples

### Real-Time Financial Trading Dashboard

```typescript
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
    batchSize: 25, // Larger batches for data processing efficiency
    batchTimeout: 16, // Optimize for data processing rather than frame rate
    enableDataProcessingOptimization: true,
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

### WebSocket Integration with Auto-Reconnect

```typescript
export function useWebSocketStream(url: string, options?: StreamConfig) {
    const { addData, ...rest } = useAgChartsStream(defaultOptions, options);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number>();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('WebSocket connected');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            addData(data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            reconnectTimeoutRef.current = window.setTimeout(connect, 1000);
        };

        wsRef.current = ws;
    }, [url, addData]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            wsRef.current?.close();
        };
    }, [connect]);

    return { ...rest, addData, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
}
```

## Performance Optimization Patterns

### 1. Memoization Strategies

```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
    return rawData.map(transformData);
}, [rawData]);

// Stable callbacks to prevent re-renders
const handleUpdate = useCallback((data) => {
    // Process update
}, []); // Empty deps for stable reference
```

### 2. React 18 Concurrent Features

```typescript
// Use startTransition for non-urgent updates
startTransition(() => {
    setLargeDataset(newData);
});

// Defer expensive computations
const deferredSearchResults = useDeferredValue(searchQuery);

// Time slicing with useDeferredValue
const expensiveTree = useDeferredValue(data);
```

### 3. Avoiding Common Pitfalls

```typescript
// ❌ Wrong: Creates new object every render
<AgCharts options={{ ...baseOptions, data }} />

// ✅ Correct: Stable reference
const options = useMemo(() => ({
  ...baseOptions,
  data
}), [data]);
<AgCharts options={options} />

// ❌ Wrong: Effect runs on every render
useEffect(() => {
  chart.update(options);
}, [options]); // options changes every render

// ✅ Correct: Deep comparison or stable reference
const optionsRef = useRef(options);
useEffect(() => {
  if (!deepEqual(optionsRef.current, options)) {
    chart.update(options);
    optionsRef.current = options;
  }
}, [options]);
```

## React-Specific Risks & Mitigations

### Risk: useEffect Dependencies Causing Infinite Loops

**Mitigation**: Use stable refs and memoized callbacks with proper dependency arrays

```typescript
// Use ref for values that shouldn't trigger re-renders
const stableCallback = useRef(callback);
stableCallback.current = callback;

useEffect(() => {
    // Use stableCallback.current
}, []); // No dependencies needed
```

### Risk: React 18 Strict Mode Double-Mounting

**Mitigation**: Implement proper cleanup and idempotent initialization

```typescript
useEffect(() => {
    let cancelled = false;

    async function initialize() {
        if (cancelled) return;
        // Initialization logic
    }

    initialize();

    return () => {
        cancelled = true;
        // Cleanup logic
    };
}, []);
```

### Risk: Concurrent Features Causing Unexpected Timing

**Mitigation**: Use useLayoutEffect for synchronous updates

```typescript
// Chart creation needs to be synchronous
useLayoutEffect(() => {
    const chart = createChart(container);
    return () => chart.destroy();
}, []);

// Data updates can be concurrent
useEffect(() => {
    startTransition(() => {
        chart.updateData(data);
    });
}, [data]);
```

## Testing Strategies

### Unit Testing with React Testing Library

```typescript
import { act, renderHook } from '@testing-library/react';

import { useAgChartsStream } from './useAgChartsStream';

describe('useAgChartsStream', () => {
    it('should batch updates within frame', async () => {
        const { result } = renderHook(() => useAgChartsStream(defaultOptions, { batchSize: 10 }));

        act(() => {
            // Add 5 data points
            for (let i = 0; i < 5; i++) {
                result.current.addData({ value: i });
            }
        });

        // Wait for next frame
        await act(async () => {
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        expect(result.current.metrics.updatesPerSecond).toBeGreaterThan(0);
    });

    it('should handle rapid updates without memory leaks', async () => {
        const { result, unmount } = renderHook(() => useAgChartsStream(defaultOptions));

        // Simulate rapid updates
        const interval = setInterval(() => {
            act(() => {
                result.current.addData({ value: Math.random() });
            });
        }, 10);

        // Let it run for 100ms
        await new Promise((resolve) => setTimeout(resolve, 100));

        clearInterval(interval);
        unmount();

        // Check cleanup happened
        expect(result.current.chartRef.current).toBeNull();
    });
});
```

### Performance Testing

```typescript
import { measurePerformance } from '@test/utils';

it('should maintain 60fps with 100 updates/sec', async () => {
    const metrics = await measurePerformance(async () => {
        const { addData } = renderHook(() => useAgChartsStream(options));

        // Generate 100 updates per second
        for (let i = 0; i < 100; i++) {
            addData({ timestamp: Date.now(), value: Math.random() });
            await new Promise((r) => setTimeout(r, 10));
        }
    });

    expect(metrics.fps).toBeGreaterThan(30);
    expect(metrics.droppedFrames).toBeLessThan(5);
});
```

## Migration Guide

### From Existing AG Charts React

```typescript
// Before: Standard AG Charts React
import { AgCharts } from 'ag-charts-react';

function OldChart() {
  const [options, setOptions] = useState(initialOptions);

  const updateData = (newData) => {
    setOptions({ ...options, data: newData });
  };

  return <AgCharts options={options} />;
}

// After: High-frequency optimized
import { useAgChartsStream, AgChartsStreaming } from 'ag-charts-react';

function NewChart() {
  const { addData, chartOptions } = useAgChartsStream(initialOptions, {
    updateStrategy: 'rolling',
    rollingWindowSize: 1000
  });

  const updateData = (newData) => {
    newData.forEach(addData); // Automatically batched
  };

  return <AgChartsStreaming options={chartOptions} />;
}
```

## Best Practices

1. **Always disable animations** for high-frequency updates
2. **Use startTransition** for non-critical updates
3. **Implement proper cleanup** in useEffect returns
4. **Memoize chart options** to prevent unnecessary updates
5. **Use refs** for values that shouldn't trigger re-renders
6. **Batch updates** using requestAnimationFrame
7. **Monitor performance** using the built-in metrics
8. **Handle errors gracefully** with error boundaries

## Performance Targets

-   **Update Rate**: 100+ updates/second
-   **Frame Rate**: Maintain 60fps (50fps minimum)
-   **Latency**: <50ms from data arrival to render
-   **Memory**: Stable memory usage over 24-hour period
-   **CPU Usage**: <80% at maximum update rate
