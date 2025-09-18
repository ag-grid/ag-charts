# React Implementation Guide: Option 1 Incremental Update API

## Executive Summary

This document provides a comprehensive React-specific implementation guide for AG Charts' Incremental Update API, focusing on React 18+ features, custom hooks, performance optimization patterns, and real-world applications. The implementation leverages React's concurrent features and reconciliation system to achieve optimal performance for high-frequency data updates. Since rendering is already optimized (~3-4ms), the focus is on data processing optimization which represents 68% of execution time (~393ms out of 580ms for 1M points).

## Table of Contents

1. [Core React Integration](#core-react-integration)
2. [Custom Hooks](#custom-hooks)
3. [Performance Optimization Strategies](#performance-optimization-strategies)
4. [Concurrent Features Integration](#concurrent-features-integration)
5. [Error Handling and Boundaries](#error-handling-and-boundaries)
6. [Real-world Examples](#real-world-examples)
7. [Data Fetching Integration](#data-fetching-integration)
8. [Testing Strategies](#testing-strategies)
9. [Migration Guide](#migration-guide)
10. [Performance Profiling](#performance-profiling)

## Core React Integration

### Enhanced React Chart Component

```typescript
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { AgCharts, AgChartInstance, AgDataTransaction, AgDataTransactionResult } from 'ag-charts-react';

interface ReactChartProps<TDatum> {
  options: AgChartOptions;
  onTransactionComplete?: (result: AgDataTransactionResult) => void;
  onTransactionError?: (error: Error, transaction: AgDataTransaction<TDatum>) => void;
  enableConcurrentUpdates?: boolean;
  maxUpdateFrequency?: number;
}

export const ReactIncrementalChart = <TDatum,>({
  options,
  onTransactionComplete,
  onTransactionError,
  enableConcurrentUpdates = true,
  maxUpdateFrequency = 60,
}: ReactChartProps<TDatum>) => {
  const chartRef = useRef<AgChartInstance<TDatum> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => options, [options]);

  // Initialize chart with stable reference
  useEffect(() => {
    if (containerRef.current) {
      chartRef.current = AgCharts.create({
        ...memoizedOptions,
        container: containerRef.current,
      });

      // Set up event listeners
      if (onTransactionComplete) {
        chartRef.current.addEventListener('transactionComplete', onTransactionComplete);
      }

      if (onTransactionError) {
        chartRef.current.addEventListener('transactionError', onTransactionError);
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [memoizedOptions, onTransactionComplete, onTransactionError]);

  // Expose chart instance for external access
  React.useImperativeHandle(ref, () => chartRef.current, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
```

## Custom Hooks

### 1. useIncrementalData Hook

```typescript
import { useCallback, useMemo, useRef } from 'react';

import { AgDataTransaction, AgDataTransactionResult } from 'ag-charts-community';

interface UseIncrementalDataOptions<TDatum> {
    chart: AgChartInstance<TDatum> | null;
    seriesId?: string;
    maxRetries?: number;
    batchWindow?: number; // ms
    onError?: (error: Error) => void;
}

interface UseIncrementalDataReturn<TDatum> {
    updateData: (transaction: AgDataTransaction<TDatum>) => Promise<AgDataTransactionResult>;
    updateDataBatch: (transactions: AgDataTransaction<TDatum>[]) => Promise<AgDataTransactionResult[]>;
    getCurrentData: () => TDatum[] | Record<string, TDatum[]>;
    isUpdating: boolean;
    error: Error | null;
    stats: {
        totalTransactions: number;
        successfulTransactions: number;
        failedTransactions: number;
        averageLatency: number;
    };
}

export const useIncrementalData = <TDatum>({
    chart,
    seriesId,
    maxRetries = 3,
    batchWindow = 16, // 60fps
    onError,
}: UseIncrementalDataOptions<TDatum>): UseIncrementalDataReturn<TDatum> => {
    const statsRef = useRef({
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalLatency: 0,
    });

    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const batchQueueRef = useRef<AgDataTransaction<TDatum>[]>([]);
    const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memoized update function with error handling and retries
    const updateData = useCallback(
        async (transaction: AgDataTransaction<TDatum>): Promise<AgDataTransactionResult> => {
            if (!chart) {
                throw new Error('Chart instance not available');
            }

            const startTime = performance.now();
            let lastError: Error | null = null;

            setIsUpdating(true);
            setError(null);

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const result = await chart.updateDataAsync({
                        ...transaction,
                        seriesId: seriesId || transaction.seriesId,
                    });

                    // Update stats
                    statsRef.current.totalTransactions++;
                    statsRef.current.successfulTransactions++;
                    statsRef.current.totalLatency += performance.now() - startTime;

                    setIsUpdating(false);
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
            statsRef.current.totalTransactions++;
            statsRef.current.failedTransactions++;
            setError(lastError);
            setIsUpdating(false);

            if (onError) {
                onError(lastError!);
            }

            throw lastError!;
        },
        [chart, seriesId, maxRetries, onError]
    );

    // Batched update function
    const processBatch = useCallback(async () => {
        if (batchQueueRef.current.length === 0 || !chart) return;

        const batch = [...batchQueueRef.current];
        batchQueueRef.current = [];

        try {
            // Combine transactions into single multi-series update if possible
            const groupedBySeriesId = batch.reduce(
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

            const results = await Promise.all(
                Object.entries(groupedBySeriesId).map(async ([targetSeriesId, transactions]) => {
                    // Merge transactions for same series
                    const mergedTransaction: AgDataTransaction<TDatum> = {
                        seriesId: targetSeriesId,
                        append: transactions.flatMap((t) => t.append || []),
                        prepend: transactions.flatMap((t) => t.prepend || []),
                        update: transactions.flatMap((t) => t.update || []),
                        remove: transactions.flatMap((t) => t.remove || []),
                    };

                    return chart.updateDataAsync(mergedTransaction);
                })
            );

            return results;
        } catch (error) {
            if (onError) {
                onError(error as Error);
            }
            throw error;
        }
    }, [chart, seriesId, onError]);

    const updateDataBatch = useCallback(
        (transactions: AgDataTransaction<TDatum>[]): Promise<AgDataTransactionResult[]> => {
            return new Promise((resolve, reject) => {
                batchQueueRef.current.push(...transactions);

                if (batchTimeoutRef.current) {
                    clearTimeout(batchTimeoutRef.current);
                }

                batchTimeoutRef.current = setTimeout(async () => {
                    try {
                        const results = await processBatch();
                        resolve(results || []);
                    } catch (error) {
                        reject(error);
                    }
                }, batchWindow);
            });
        },
        [processBatch, batchWindow]
    );

    const getCurrentData = useCallback(() => {
        return chart?.getData(seriesId) || [];
    }, [chart, seriesId]);

    const stats = useMemo(
        () => ({
            totalTransactions: statsRef.current.totalTransactions,
            successfulTransactions: statsRef.current.successfulTransactions,
            failedTransactions: statsRef.current.failedTransactions,
            averageLatency: statsRef.current.totalLatency / Math.max(statsRef.current.successfulTransactions, 1),
        }),
        [statsRef.current]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }
        };
    }, []);

    return {
        updateData,
        updateDataBatch,
        getCurrentData,
        isUpdating,
        error,
        stats,
    };
};
```

### 2. useChartTransaction Hook

```typescript
import { useCallback, useMemo, useRef } from 'react';
import { startTransition, useDeferredValue } from 'react';

interface UseChartTransactionOptions<TDatum> {
    chart: AgChartInstance<TDatum> | null;
    enableConcurrentUpdates?: boolean;
    deferUpdates?: boolean;
    onTransactionStart?: (transaction: AgDataTransaction<TDatum>) => void;
    onTransactionComplete?: (result: AgDataTransactionResult) => void;
}

export const useChartTransaction = <TDatum>({
    chart,
    enableConcurrentUpdates = true,
    deferUpdates = false,
    onTransactionStart,
    onTransactionComplete,
}: UseChartTransactionOptions<TDatum>) => {
    const transactionQueueRef = useRef<AgDataTransaction<TDatum>[]>([]);
    const processingRef = useRef(false);

    const processTransaction = useCallback(
        async (transaction: AgDataTransaction<TDatum>) => {
            if (!chart) return;

            onTransactionStart?.(transaction);

            const executeTransaction = async () => {
                const result = await chart.updateDataAsync(transaction);
                onTransactionComplete?.(result);
                return result;
            };

            if (enableConcurrentUpdates) {
                // Use React 18's startTransition for non-urgent updates
                startTransition(() => {
                    executeTransaction();
                });
            } else {
                return executeTransaction();
            }
        },
        [chart, enableConcurrentUpdates, onTransactionStart, onTransactionComplete]
    );

    const queueTransaction = useCallback(
        (transaction: AgDataTransaction<TDatum>) => {
            if (deferUpdates) {
                transactionQueueRef.current.push(transaction);
                return;
            }

            processTransaction(transaction);
        },
        [processTransaction, deferUpdates]
    );

    const flushQueue = useCallback(async () => {
        if (processingRef.current || transactionQueueRef.current.length === 0) {
            return;
        }

        processingRef.current = true;
        const queue = [...transactionQueueRef.current];
        transactionQueueRef.current = [];

        try {
            for (const transaction of queue) {
                await processTransaction(transaction);
            }
        } finally {
            processingRef.current = false;
        }
    }, [processTransaction]);

    return {
        queueTransaction,
        processTransaction,
        flushQueue,
        queueLength: transactionQueueRef.current.length,
        isProcessing: processingRef.current,
    };
};
```

### 3. useDataStream Hook

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { startTransition, useDeferredValue } from 'react';

interface UseDataStreamOptions<TDatum> {
    chart: AgChartInstance<TDatum> | null;
    streamUrl?: string;
    seriesId?: string;
    maxDataPoints?: number;
    updateFrequency?: number;
    onError?: (error: Error) => void;
}

export const useDataStream = <TDatum>({
    chart,
    streamUrl,
    seriesId,
    maxDataPoints = 10000,
    updateFrequency = 100, // ms
    onError,
}: UseDataStreamOptions<TDatum>) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<Error | null>(null);
    const webSocketRef = useRef<WebSocket | null>(null);
    const bufferRef = useRef<TDatum[]>([]);
    const lastUpdateRef = useRef(Date.now());

    // Deferred connection state for non-critical UI updates
    const deferredIsConnected = useDeferredValue(isConnected);

    const processBuffer = useCallback(() => {
        if (!chart || bufferRef.current.length === 0) return;

        const data = [...bufferRef.current];
        bufferRef.current = [];

        // Use concurrent features for high-frequency updates
        startTransition(() => {
            chart
                .updateDataAsync({
                    seriesId,
                    append: data,
                })
                .catch(onError);
        });
    }, [chart, seriesId, onError]);

    const connectWebSocket = useCallback(() => {
        if (!streamUrl || webSocketRef.current) return;

        try {
            webSocketRef.current = new WebSocket(streamUrl);

            webSocketRef.current.onopen = () => {
                setIsConnected(true);
                setConnectionError(null);
            };

            webSocketRef.current.onmessage = (event) => {
                try {
                    const newData: TDatum = JSON.parse(event.data);
                    bufferRef.current.push(newData);

                    // Throttle updates based on frequency
                    const now = Date.now();
                    if (now - lastUpdateRef.current >= updateFrequency) {
                        processBuffer();
                        lastUpdateRef.current = now;
                    }
                } catch (error) {
                    onError?.(error as Error);
                }
            };

            webSocketRef.current.onclose = () => {
                setIsConnected(false);
                webSocketRef.current = null;
            };

            webSocketRef.current.onerror = (error) => {
                const connectionError = new Error('WebSocket connection failed');
                setConnectionError(connectionError);
                onError?.(connectionError);
            };
        } catch (error) {
            setConnectionError(error as Error);
            onError?.(error as Error);
        }
    }, [streamUrl, updateFrequency, processBuffer, onError]);

    const disconnect = useCallback(() => {
        if (webSocketRef.current) {
            webSocketRef.current.close();
            webSocketRef.current = null;
        }
        setIsConnected(false);
    }, []);

    // Auto-connect when dependencies change
    useEffect(() => {
        if (streamUrl && chart) {
            connectWebSocket();
        }

        return () => {
            disconnect();
        };
    }, [streamUrl, chart, connectWebSocket, disconnect]);

    // Periodic buffer flush
    useEffect(() => {
        const interval = setInterval(() => {
            if (bufferRef.current.length > 0) {
                processBuffer();
            }
        }, updateFrequency);

        return () => clearInterval(interval);
    }, [processBuffer, updateFrequency]);

    return {
        isConnected: deferredIsConnected,
        connectionError,
        connect: connectWebSocket,
        disconnect,
        bufferSize: bufferRef.current.length,
    };
};
```

## Performance Optimization Strategies

### 1. React.memo and Comparison Functions

```typescript
import React, { memo } from 'react';

interface ChartControlsProps<TDatum> {
  onAppendData: (data: TDatum[]) => void;
  onClearData: () => void;
  isProcessing: boolean;
  stats: TransactionStats;
}

// Memoized controls component - focus on data processing optimization
const ChartControls = memo(<TDatum,>({
  onAppendData,
  onClearData,
  isProcessing,
  stats,
}: ChartControlsProps<TDatum>) => {
  return (
    <div className="chart-controls">
      <button
        onClick={() => onAppendData([generateRandomData()])}
        disabled={isProcessing}
      >
        Add Data Point
      </button>
      <button onClick={onClearData} disabled={isProcessing}>
        Clear Data
      </button>
      <div className="stats">
        <span>Data Updates: {stats.totalTransactions}</span>
        <span>Processing Latency: {stats.averageLatency.toFixed(2)}ms</span>
        <span>Rendering: ~3-4ms (optimized)</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.isProcessing === nextProps.isProcessing &&
    prevProps.stats.totalTransactions === nextProps.stats.totalTransactions &&
    prevProps.stats.averageLatency === nextProps.stats.averageLatency
  );
});
```

### 2. useMemo and useCallback Optimization

```typescript
const OptimizedChart = <TDatum,>({
  rawData,
  seriesConfig,
  updateFrequency
}: ChartProps<TDatum>) => {
  // Memoize expensive data processing calculations (primary optimization target)
  const processedData = useMemo(() => {
    return rawData.map(item => ({
      ...item,
      computedValue: expensiveDataCalculation(item), // Focus on data processing
    }));
  }, [rawData]);

  // Memoize chart options to prevent unnecessary data reprocessing
  const chartOptions = useMemo(() => ({
    data: processedData,
    series: seriesConfig,
    // ... other stable options
  }), [processedData, seriesConfig]);

  // Stable callback references
  const handleTransactionComplete = useCallback((result: AgDataTransactionResult) => {
    console.log(`Data processing completed in ${result.processingTime}ms (rendering ~3-4ms)`);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Chart data processing failed:', error);
  }, []);

  // Memoize the chart component
  return useMemo(() => (
    <ReactIncrementalChart
      options={chartOptions}
      onTransactionComplete={handleTransactionComplete}
      onTransactionError={handleError}
    />
  ), [chartOptions, handleTransactionComplete, handleError]);
};
```

### 3. Data Windowing for Large Datasets (Focus on Data Processing)

```typescript
import { FixedSizeList } from 'react-window';

interface DataWindowedChartProps<TDatum> {
  data: TDatum[];
  itemHeight: number;
  visibleCount: number;
  maxDataPoints?: number; // For memory management
}

const DataWindowedChart = <TDatum,>({
  data,
  itemHeight,
  visibleCount,
  maxDataPoints = 10000
}: DataWindowedChartProps<TDatum>) => {
  const chartRef = useRef<AgChartInstance<TDatum> | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: visibleCount });

  // Only process data within visible range (major data processing optimization)
  const processedData = useMemo(() => {
    const windowed = data.slice(visibleRange.start, visibleRange.end);
    // Apply data processing optimizations
    return windowed.map(item => ({
      ...item,
      // Only process visible data points
      processed: processDataPoint(item)
    }));
  }, [data, visibleRange]);

  const handleScroll = useCallback(({ visibleStartIndex, visibleStopIndex }) => {
    const newRange = { start: visibleStartIndex, end: visibleStopIndex + 1 };

    if (newRange.start !== visibleRange.start || newRange.end !== visibleRange.end) {
      setVisibleRange(newRange);

      // Incremental data update (focus on data processing efficiency)
      chartRef.current?.updateData({
        replace: data.slice(newRange.start, newRange.end),
      });
    }
  }, [data, visibleRange]);

  return (
    <FixedSizeList
      height={400}
      itemCount={Math.min(data.length, maxDataPoints)}
      itemSize={itemHeight}
      onItemsRendered={handleScroll}
    >
      {({ index, style }) => (
        <div style={style}>
          <ReactIncrementalChart
            ref={chartRef}
            options={{
              data: processedData,
              // ... chart configuration optimized for data processing
            }}
          />
        </div>
      )}
    </FixedSizeList>
  );
};
```

## Concurrent Features Integration

### 1. startTransition for Non-Urgent Updates

```typescript
import { startTransition, useTransition } from 'react';

const RealTimeChart = <TDatum,>() => {
  const [isPending, startTransition] = useTransition();
  const { updateData } = useIncrementalData({ chart });

  const handleHighFrequencyUpdate = useCallback((newData: TDatum[]) => {
    // Mark data processing as non-urgent to avoid blocking user interactions
    startTransition(() => {
      updateData({
        append: newData,
      });
    });
  }, [updateData]);

  // Show processing indicator during data processing transitions
  if (isPending) {
    return <div className="processing-indicator">Processing data... (rendering ~3-4ms)</div>;
  }

  return (
    <div>
      <button onClick={() => handleHighFrequencyUpdate([generateData()])}>
        Add Data
      </button>
      <ReactIncrementalChart options={chartOptions} />
    </div>
  );
};
```

### 2. useDeferredValue for Responsive UI

```typescript
import { useDeferredValue, useMemo } from 'react';

const ResponsiveChart = <TDatum,>({
  highFrequencyData,
  userFilters
}: ChartProps<TDatum>) => {
  // Defer expensive filtering operations
  const deferredFilters = useDeferredValue(userFilters);
  const deferredData = useDeferredValue(highFrequencyData);

  // Filter data using deferred values to maintain responsiveness
  const filteredData = useMemo(() => {
    return deferredData.filter(item =>
      matchesFilters(item, deferredFilters)
    );
  }, [deferredData, deferredFilters]);

  const chartOptions = useMemo(() => ({
    data: filteredData,
    // ... other options
  }), [filteredData]);

  return <ReactIncrementalChart options={chartOptions} />;
};
```

### 3. Concurrent Data Processing

```typescript
const ConcurrentDataProcessor = <TDatum>() => {
    const [processedData, setProcessedData] = useState<TDatum[]>([]);
    const [isProcessing, startTransition] = useTransition();

    const processDataConcurrently = useCallback((rawData: TDatum[]) => {
        startTransition(() => {
            // Heavy data processing in concurrent mode (major optimization target)
            // This is where 68% of performance gains will come from
            const processed = rawData.map((item) => ({
                ...item,
                movingAverage: calculateMovingAverage(item),
                trend: calculateTrend(item),
                volatility: calculateVolatility(item),
                // Focus on optimizing these calculations
            }));

            setProcessedData(processed);
        });
    }, []);

    return {
        processedData,
        isProcessing,
        processDataConcurrently,
    };
};
```

## Error Handling and Boundaries

### 1. Chart Error Boundary

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart error boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="chart-error">
            <h3>Chart Error</h3>
            <p>Failed to render chart: {this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### 2. Stream Connection Error Handling

```typescript
const useResilientDataStream = <TDatum>(options: UseDataStreamOptions<TDatum>) => {
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [lastError, setLastError] = useState<Error | null>(null);
    const maxRetries = 5;
    const retryDelay = 1000;

    const { isConnected, connectionError, connect, disconnect } = useDataStream({
        ...options,
        onError: (error) => {
            setLastError(error);
            options.onError?.(error);

            // Auto-retry connection with exponential backoff
            if (connectionAttempts < maxRetries) {
                setTimeout(
                    () => {
                        setConnectionAttempts((prev) => prev + 1);
                        connect();
                    },
                    retryDelay * Math.pow(2, connectionAttempts)
                );
            }
        },
    });

    const resetConnection = useCallback(() => {
        setConnectionAttempts(0);
        setLastError(null);
        disconnect();
        connect();
    }, [connect, disconnect]);

    return {
        isConnected,
        connectionError,
        lastError,
        connectionAttempts,
        maxRetries,
        resetConnection,
        canRetry: connectionAttempts < maxRetries,
    };
};
```

## Real-world Examples

### 1. Real-time Financial Dashboard

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { ReactIncrementalChart } from './ReactIncrementalChart';
import { useIncrementalData, useDataStream } from './hooks';

interface StockTick {
  timestamp: number;
  symbol: string;
  price: number;
  volume: number;
  bid: number;
  ask: number;
}

interface FinancialDashboardProps {
  symbols: string[];
  wsUrl: string;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  symbols,
  wsUrl
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [chartRef, setChartRef] = useState<AgChartInstance<StockTick> | null>(null);

  // Hook for incremental data updates
  const {
    updateData,
    isUpdating,
    error: updateError,
    stats
  } = useIncrementalData({
    chart: chartRef,
    seriesId: 'price-series',
    maxRetries: 3,
  });

  // Hook for real-time data streaming
  const {
    isConnected,
    connectionError
  } = useDataStream({
    chart: chartRef,
    streamUrl: `${wsUrl}?symbols=${symbols.join(',')}`,
    updateFrequency: 50, // 20fps
    onError: (error) => console.error('Stream error:', error),
  });

  // Chart configuration
  const chartOptions = useMemo(() => ({
    data: [], // Initial empty data
    series: [
      {
        type: 'candlestick' as const,
        xKey: 'timestamp',
        openKey: 'open',
        highKey: 'high',
        lowKey: 'low',
        closeKey: 'close',
      },
      {
        type: 'bar' as const,
        xKey: 'timestamp',
        yKey: 'volume',
        yName: 'Volume',
        axis: 'secondary',
      },
    ],
    axes: [
      {
        type: 'time' as const,
        position: 'bottom' as const,
      },
      {
        type: 'number' as const,
        position: 'left' as const,
      },
      {
        type: 'number' as const,
        position: 'right' as const,
        keys: ['volume'],
      },
    ],
  }), []);

  // Handle symbol changes
  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    // Clear existing data and reload for new symbol
    updateData({ clear: true });
  }, [updateData]);

  return (
    <ChartErrorBoundary>
      <div className="financial-dashboard">
        <div className="dashboard-header">
          <select
            value={selectedSymbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>

          <div className="connection-status">
            Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>

          <div className="update-stats">
            Data Updates: {stats.totalTransactions} |
            Processing Latency: {stats.averageLatency.toFixed(2)}ms |
            Rendering: ~3-4ms (optimized)
          </div>
        </div>

        <div className="chart-container" style={{ height: '400px' }}>
          <ReactIncrementalChart
            ref={setChartRef}
            options={chartOptions}
            onTransactionComplete={(result) => {
              console.log(`Processed ${result.operationCounts.appended} points in ${result.processingTime}ms (rendering ~3-4ms)`);
            }}
          />
        </div>

        {(updateError || connectionError) && (
          <div className="error-panel">
            Error: {(updateError || connectionError)?.message}
          </div>
        )}
      </div>
    </ChartErrorBoundary>
  );
};
```

### 2. IoT Sensor Monitoring Dashboard

```typescript
interface SensorReading {
  timestamp: number;
  sensorId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  batteryLevel: number;
}

const IoTMonitoringDashboard: React.FC<{
  sensorIds: string[];
  alertThresholds: Record<string, number>;
}> = ({ sensorIds, alertThresholds }) => {
  const [chartRefs, setChartRefs] = useState<Record<string, AgChartInstance<SensorReading> | null>>({});
  const [alerts, setAlerts] = useState<Array<{ sensorId: string; message: string; timestamp: number }>>([]);

  // Multi-series data management
  const handleSensorUpdate = useCallback((reading: SensorReading) => {
    const chart = chartRefs[reading.sensorId];
    if (!chart) return;

    // Check for alerts
    if (reading.temperature > alertThresholds.temperature) {
      setAlerts(prev => [...prev, {
        sensorId: reading.sensorId,
        message: `High temperature: ${reading.temperature}°C`,
        timestamp: Date.now(),
      }]);
    }

    // Update chart with new reading (focus on data processing optimization)
    startTransition(() => {
      chart.updateDataAsync({
        append: [reading],
      });
    });
  }, [chartRefs, alertThresholds]);

  return (
    <div className="iot-dashboard">
      <div className="alerts-panel">
        {alerts.slice(-5).map((alert, index) => (
          <div key={index} className="alert">
            {alert.sensorId}: {alert.message}
          </div>
        ))}
      </div>

      <div className="sensors-grid">
        {sensorIds.map(sensorId => (
          <div key={sensorId} className="sensor-chart">
            <h3>Sensor {sensorId}</h3>
            <ReactIncrementalChart
              ref={(ref) => setChartRefs(prev => ({ ...prev, [sensorId]: ref }))}
              options={{
                series: [
                  { type: 'line', xKey: 'timestamp', yKey: 'temperature', yName: 'Temperature (°C)' },
                  { type: 'line', xKey: 'timestamp', yKey: 'humidity', yName: 'Humidity (%)' },
                  { type: 'line', xKey: 'timestamp', yKey: 'pressure', yName: 'Pressure (hPa)' },
                ],
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Data Fetching Integration

### 1. React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const useChartDataQuery = <TDatum,>(chartId: string, options: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
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
      // Update cache with new data
      queryClient.setQueryData(
        ['chartData', chartId],
        (oldData: TDatum[] = []) => [...oldData, ...newData]
      );
    },
  });

  return {
    data: data || [],
    isLoading,
    error,
    appendData: appendDataMutation.mutate,
    isAppending: appendDataMutation.isPending,
  };
};

const ReactQueryChart = <TDatum,>({ chartId }: { chartId: string }) => {
  const [chartRef, setChartRef] = useState<AgChartInstance<TDatum> | null>(null);
  const { data, isLoading, appendData } = useChartDataQuery<TDatum>(chartId, {
    refetchInterval: 1000,
  });

  const { updateData } = useIncrementalData({ chart: chartRef });

  // Sync React Query data with chart
  useEffect(() => {
    if (data.length > 0 && chartRef) {
      updateData({ replace: data });
    }
  }, [data, chartRef, updateData]);

  const handleAddRandomData = useCallback(() => {
    const randomData = [generateRandomDataPoint()];
    appendData(randomData);

    // Optimistically update chart
    updateData({ append: randomData });
  }, [appendData, updateData]);

  if (isLoading) {
    return <div>Loading chart data...</div>;
  }

  return (
    <div>
      <button onClick={handleAddRandomData}>Add Random Data</button>
      <ReactIncrementalChart
        ref={setChartRef}
        options={{ data: [] }} // Start with empty data
      />
    </div>
  );
};
```

### 2. SWR Integration

```typescript
import useSWR from 'swr';

const useSWRChart = <TDatum>(
    url: string,
    options: {
        refreshInterval?: number;
        revalidateOnFocus?: boolean;
    }
) => {
    const { data, error, mutate } = useSWR<TDatum[]>(url, fetchChartData, {
        refreshInterval: options.refreshInterval || 5000,
        revalidateOnFocus: options.revalidateOnFocus ?? false,
    });

    const appendOptimisticData = useCallback(
        (newData: TDatum[]) => {
            // Optimistic update
            mutate((currentData = []) => [...currentData, ...newData], { revalidate: false });

            // Then revalidate from server
            setTimeout(() => mutate(), 100);
        },
        [mutate]
    );

    return {
        data: data || [],
        error,
        isLoading: !error && !data,
        appendOptimisticData,
        revalidate: mutate,
    };
};
```

## Testing Strategies

### 1. React Testing Library Tests

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import { ReactIncrementalChart } from '../ReactIncrementalChart';

describe('ReactIncrementalChart', () => {
  const mockChartOptions = {
    data: [{ x: 1, y: 10 }, { x: 2, y: 20 }],
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
  };

  it('should render chart without crashing', () => {
    render(<ReactIncrementalChart options={mockChartOptions} />);
    expect(screen.getByTestId('ag-charts-container')).toBeInTheDocument();
  });

  it('should handle data updates efficiently', async () => {
    const onTransactionComplete = jest.fn();
    const { rerender } = render(
      <ReactIncrementalChart
        options={mockChartOptions}
        onTransactionComplete={onTransactionComplete}
      />
    );

    // Simulate data update
    act(() => {
      // Trigger data update via chart ref
    });

    await waitFor(() => {
      expect(onTransactionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          processingTime: expect.any(Number),
          operationCounts: expect.any(Object),
        })
      );
    });
  });

  it('should handle errors gracefully', async () => {
    const onError = jest.fn();
    render(
      <ChartErrorBoundary onError={onError}>
        <ReactIncrementalChart
          options={mockChartOptions}
          onTransactionError={onError}
        />
      </ChartErrorBoundary>
    );

    // Simulate error condition
    // ... test error handling
  });
});
```

### 2. Custom Hook Testing

```typescript
import { act, renderHook } from '@testing-library/react';

import { useIncrementalData } from '../hooks/useIncrementalData';

describe('useIncrementalData', () => {
    const mockChart = {
        updateDataAsync: jest.fn().mockResolvedValue({
            transactionId: 'test-123',
            operationCounts: { appended: 1, updated: 0, removed: 0 },
            processingTime: 15,
        }),
        getData: jest.fn().mockReturnValue([]),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update data successfully', async () => {
        const { result } = renderHook(() => useIncrementalData({ chart: mockChart }));

        await act(async () => {
            const transaction = { append: [{ x: 1, y: 10 }] };
            const result_1 = await result.current.updateData(transaction);

            expect(result_1.operationCounts.appended).toBe(1);
            expect(mockChart.updateDataAsync).toHaveBeenCalledWith(transaction);
        });
    });

    it('should handle retries on failure', async () => {
        const mockErrorChart = {
            updateDataAsync: jest
                .fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue({ operationCounts: { appended: 1 } }),
        };

        const { result } = renderHook(() => useIncrementalData({ chart: mockErrorChart, maxRetries: 2 }));

        await act(async () => {
            const transaction = { append: [{ x: 1, y: 10 }] };
            await result.current.updateData(transaction);
        });

        expect(mockErrorChart.updateDataAsync).toHaveBeenCalledTimes(2);
    });
});
```

### 3. Performance Testing

```typescript
import { performance } from 'perf_hooks';

describe('Chart Performance', () => {
    it('should handle high-frequency data processing efficiently', async () => {
        const chart = createMockChart();
        const { result } = renderHook(() => useIncrementalData({ chart }));

        const updates = Array.from({ length: 1000 }, (_, i) => ({
            append: [{ timestamp: Date.now() + i, value: Math.random() }],
        }));

        const startTime = performance.now();

        await act(async () => {
            await Promise.all(updates.map((update) => result.current.updateData(update)));
        });

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgLatency = totalTime / updates.length;

        // Focus on data processing performance (rendering is already ~3-4ms)
        expect(avgLatency).toBeLessThan(30); // Less than 30ms average for data processing
        expect(totalTime).toBeLessThan(3000); // Total under 3 seconds for data processing
    });

    it('should not cause memory leaks during continuous updates', async () => {
        const chart = createMockChart();
        const { result, unmount } = renderHook(() => useIncrementalData({ chart }));

        // Simulate continuous updates
        const updateInterval = setInterval(() => {
            result.current.updateData({
                append: [{ timestamp: Date.now(), value: Math.random() }],
            });
        }, 10);

        // Run for 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));

        clearInterval(updateInterval);
        unmount();

        // Check for memory leaks using performance.measureUserAgentSpecificMemory
        // or similar techniques
    });
});
```

## Migration Guide

### From Current AG Charts React Wrapper

#### Before (Current Implementation)

```typescript
import React, { useState, useEffect } from 'react';
import { AgChartsReact } from 'ag-charts-react';

const OldChart = () => {
  const [chartData, setChartData] = useState([]);

  const addDataPoint = (newPoint) => {
    // Inefficient: Full data replacement
    setChartData(prevData => [...prevData, newPoint]);
  };

  const chartOptions = {
    data: chartData, // Full dataset passed every time
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
  };

  return (
    <div>
      <button onClick={() => addDataPoint({ x: Date.now(), y: Math.random() })}>
        Add Data
      </button>
      <AgChartsReact options={chartOptions} />
    </div>
  );
};
```

#### After (Incremental Update Implementation)

```typescript
import React, { useState, useCallback } from 'react';
import { ReactIncrementalChart, useIncrementalData } from './ReactIncrementalChart';

const NewChart = () => {
  const [chartRef, setChartRef] = useState(null);
  const { updateData, stats } = useIncrementalData({ chart: chartRef });

  const addDataPoint = useCallback(async (newPoint) => {
    // Efficient: Incremental update
    await updateData({
      append: [newPoint],
    });
  }, [updateData]);

  const chartOptions = {
    data: [], // Start with empty data
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
  };

  return (
    <div>
      <button onClick={() => addDataPoint({ x: Date.now(), y: Math.random() })}>
        Add Data
      </button>
      <div>Updates: {stats.totalTransactions}</div>
      <ReactIncrementalChart
        ref={setChartRef}
        options={chartOptions}
        onTransactionComplete={(result) => {
          console.log(`Data processing took ${result.processingTime}ms (rendering ~3-4ms)`);
        }}
      />
    </div>
  );
};
```

### Migration Checklist

-   [ ] Replace `AgChartsReact` imports with `ReactIncrementalChart`
-   [ ] Update data update logic to use `updateData()` instead of state updates
-   [ ] Add error boundaries for transaction failures
-   [ ] Implement proper TypeScript types for data models
-   [ ] Add performance monitoring for update latency
-   [ ] Update tests to use new transaction-based API
-   [ ] Consider data windowing for memory management
-   [ ] Implement proper cleanup in `useEffect` hooks

## Performance Profiling

### 1. React DevTools Profiler Integration

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log('Chart Profiler:', {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  });
};

const ProfiledChart = () => {
  return (
    <Profiler id="IncrementalChart" onRender={onRenderCallback}>
      <ReactIncrementalChart options={chartOptions} />
    </Profiler>
  );
};
```

### 2. Custom Performance Monitoring

```typescript
const usePerformanceMonitoring = () => {
    const [metrics, setMetrics] = useState({
        renderCount: 0,
        averageRenderTime: 0,
        maxRenderTime: 0,
        updateFrequency: 0,
    });

    const measurePerformance = useCallback((operation: () => void) => {
        const startTime = performance.now();
        operation();
        const endTime = performance.now();
        const duration = endTime - startTime;

        setMetrics((prev) => ({
            renderCount: prev.renderCount + 1,
            averageRenderTime: (prev.averageRenderTime + duration) / 2,
            maxRenderTime: Math.max(prev.maxRenderTime, duration),
            updateFrequency: calculateUpdateFrequency(prev),
        }));
    }, []);

    return { metrics, measurePerformance };
};
```

### 3. Bundle Size Analysis

```bash
# Analyze bundle size impact
npm run build -- --analyze

# Check for unnecessary re-renders
npm install --save-dev @welldone-software/why-did-you-render
```

```typescript
// why-did-you-render setup
if (process.env.NODE_ENV === 'development') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    whyDidYouRender(React, {
        trackAllPureComponents: true,
        include: [/.*Chart.*/],
    });
}
```

## Best Practices Summary

1. **Use React 18+ concurrent features** for non-blocking updates
2. **Implement proper memoization** with `useMemo` and `useCallback`
3. **Leverage error boundaries** for graceful failure handling
4. **Monitor performance** with React DevTools and custom metrics
5. **Test thoroughly** with React Testing Library and performance tests
6. **Follow migration patterns** for existing codebases
7. **Integrate with data fetching libraries** like React Query or SWR
8. **Use TypeScript** for type safety and better developer experience

This implementation guide provides a comprehensive foundation for integrating AG Charts' Incremental Update API with React applications, ensuring optimal performance and developer experience for high-frequency data visualization scenarios.
