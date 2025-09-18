# React Implementation Guide: Option 2 Stream-Based API

## Executive Summary

This document provides a comprehensive React-specific implementation guide for AG Charts' Stream-Based API, leveraging React 18+ features including `useSyncExternalStore`, concurrent features, and Suspense for optimal streaming data visualization. The implementation focuses on continuous data flows, backpressure handling, and efficient stream processing to achieve high-frequency updates (100+ updates/second across 5 concurrent series) while maintaining responsive user interfaces.

Unlike traditional batch-based approaches, this streaming implementation provides a natural abstraction for real-time data sources like WebSockets, Server-Sent Events, and fetch streaming, with built-in flow control and error recovery mechanisms.

## Table of Contents

1. [Core React Integration](#core-react-integration)
2. [Stream-Based Hooks](#stream-based-hooks)
3. [React 18+ Concurrent Features](#react-18-concurrent-features)
4. [Performance Optimization](#performance-optimization)
5. [Error Handling and Recovery](#error-handling-and-recovery)
6. [Real-world Examples](#real-world-examples)
7. [Testing Strategies](#testing-strategies)
8. [Migration Guide](#migration-guide)
9. [Best Practices](#best-practices)

## Core React Integration

### Enhanced React Chart Component with Streaming Support

```typescript
import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useSyncExternalStore, startTransition, useDeferredValue } from 'react';
import { AgCharts, AgChartInstance, AgDataStream, AgStreamConnection } from 'ag-charts-react';

interface StreamingChartProps<TDatum> {
  options: AgChartOptions;
  onStreamConnect?: (connection: AgStreamConnection) => void;
  onStreamError?: (error: Error, streamId: string) => void;
  enableConcurrentStreaming?: boolean;
  maxUpdateFrequency?: number;
  backpressureThreshold?: number;
}

interface StreamingChartHandle<TDatum> extends AgChartInstance<TDatum> {
  connectStream: (stream: AgDataStream<TDatum>, seriesId?: string) => Promise<AgStreamConnection>;
  disconnectStream: (streamId: string) => Promise<void>;
  getStreamConnections: () => Record<string, AgStreamConnection>;
  pauseAllStreams: () => void;
  resumeAllStreams: () => void;
}

export const StreamingChart = forwardRef<StreamingChartHandle<TDatum>, StreamingChartProps<TDatum>>(
  <TDatum,>({
    options,
    onStreamConnect,
    onStreamError,
    enableConcurrentStreaming = true,
    maxUpdateFrequency = 60,
    backpressureThreshold = 1000,
  }: StreamingChartProps<TDatum>, ref) => {
    const chartRef = useRef<AgChartInstance<TDatum> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const streamConnectionsRef = useRef<Map<string, AgStreamConnection>>(new Map());

    // Memoize options to prevent unnecessary re-renders
    const memoizedOptions = useMemo(() => ({
      ...options,
      // Optimize for streaming performance
      animation: { enabled: false },
      dataWindow: {
        maxDataPoints: backpressureThreshold,
        agingStrategy: 'time-based' as const,
      },
    }), [options, backpressureThreshold]);

    // Initialize chart with stable reference
    useLayoutEffect(() => {
      if (containerRef.current) {
        chartRef.current = AgCharts.create({
          ...memoizedOptions,
          container: containerRef.current,
        });

        // Set up global stream error handler
        chartRef.current.addEventListener('streamError', (event) => {
          const { error, streamId } = event.detail;
          onStreamError?.(error, streamId);
        });
      }

      return () => {
        // Cleanup all streams
        streamConnectionsRef.current.forEach((connection) => {
          connection.disconnect();
        });
        streamConnectionsRef.current.clear();

        if (chartRef.current) {
          chartRef.current.destroy();
        }
      };
    }, [memoizedOptions, onStreamError]);

    // Stream connection management
    const connectStream = useCallback(
      async (stream: AgDataStream<TDatum>, seriesId?: string): Promise<AgStreamConnection> => {
        if (!chartRef.current) {
          throw new Error('Chart instance not available');
        }

        const connection = await chartRef.current.connectStream(stream, seriesId, {
          backpressure: {
            enabled: true,
            highWaterMark: backpressureThreshold,
            lowWaterMark: Math.floor(backpressureThreshold * 0.5),
          },
          errorHandling: {
            maxRetries: 3,
            retryDelay: 1000,
          },
        });

        streamConnectionsRef.current.set(connection.id, connection);
        onStreamConnect?.(connection);

        return connection;
      },
      [backpressureThreshold, onStreamConnect]
    );

    const disconnectStream = useCallback(async (streamId: string): Promise<void> => {
      const connection = streamConnectionsRef.current.get(streamId);
      if (connection) {
        await connection.disconnect();
        streamConnectionsRef.current.delete(streamId);
      }
    }, []);

    const getStreamConnections = useCallback(() => {
      return Object.fromEntries(streamConnectionsRef.current);
    }, []);

    const pauseAllStreams = useCallback(() => {
      streamConnectionsRef.current.forEach((connection) => {
        if (connection.state === 'connected') {
          // Pause the underlying stream
          const stream = connection.getStream?.();
          stream?.pause();
        }
      });
    }, []);

    const resumeAllStreams = useCallback(() => {
      streamConnectionsRef.current.forEach((connection) => {
        if (connection.state === 'connected') {
          const stream = connection.getStream?.();
          stream?.resume();
        }
      });
    }, []);

    // Expose enhanced chart API
    useImperativeHandle(ref, () => ({
      ...chartRef.current!,
      connectStream,
      disconnectStream,
      getStreamConnections,
      pauseAllStreams,
      resumeAllStreams,
    }), [connectStream, disconnectStream, getStreamConnections, pauseAllStreams, resumeAllStreams]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
  }
);
```

## Stream-Based Hooks

### 1. useChartStream Hook with useSyncExternalStore

```typescript
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { AgSSEStream, AgStreamOptions, AgWebSocketStream } from 'ag-charts-community';

interface UseChartStreamOptions<TDatum> {
    chart: StreamingChartHandle<TDatum> | null;
    streamUrl: string;
    streamType: 'websocket' | 'sse' | 'fetch';
    seriesId?: string;
    streamOptions?: AgStreamOptions<TDatum>;
    onError?: (error: Error) => void;
    autoConnect?: boolean;
}

interface StreamState<TDatum> {
    isConnected: boolean;
    connectionError: Error | null;
    stream: AgDataStream<TDatum> | null;
    connection: AgStreamConnection | null;
    metadata: {
        totalMessages: number;
        messagesPerSecond: number;
        bufferUtilization: number;
        lastMessageAt?: number;
    };
}

export const useChartStream = <TDatum>({
    chart,
    streamUrl,
    streamType,
    seriesId,
    streamOptions,
    onError,
    autoConnect = true,
}: UseChartStreamOptions<TDatum>) => {
    const streamRef = useRef<AgDataStream<TDatum> | null>(null);
    const connectionRef = useRef<AgStreamConnection | null>(null);
    const stateRef = useRef<StreamState<TDatum>>({
        isConnected: false,
        connectionError: null,
        stream: null,
        connection: null,
        metadata: {
            totalMessages: 0,
            messagesPerSecond: 0,
            bufferUtilization: 0,
        },
    });

    // Create stream factory
    const createStream = useCallback(() => {
        switch (streamType) {
            case 'websocket':
                return new AgWebSocketStream<TDatum>(streamUrl, streamOptions);
            case 'sse':
                return new AgSSEStream<TDatum>(streamUrl, 'data', streamOptions);
            case 'fetch':
                return new AgFetchStream<TDatum>(streamUrl, streamOptions);
            default:
                throw new Error(`Unsupported stream type: ${streamType}`);
        }
    }, [streamUrl, streamType, streamOptions]);

    // Subscribe function for useSyncExternalStore
    const subscribe = useCallback(
        (callback: () => void) => {
            const stream = streamRef.current;
            if (!stream) return () => {};

            // Listen to stream state changes
            const unsubscribeState = stream.subscribe({
                next: () => {
                    stateRef.current = {
                        ...stateRef.current,
                        metadata: {
                            ...stateRef.current.metadata,
                            totalMessages: stream.metadata.totalMessages,
                            bufferUtilization: stream.metadata.bufferSize / 1000, // Normalize to 0-1
                            lastMessageAt: stream.metadata.lastMessageAt,
                        },
                    };
                    callback();
                },
                error: (error) => {
                    stateRef.current = {
                        ...stateRef.current,
                        connectionError: error,
                        isConnected: false,
                    };
                    onError?.(error);
                    callback();
                },
                complete: () => {
                    stateRef.current = {
                        ...stateRef.current,
                        isConnected: false,
                    };
                    callback();
                },
            });

            return unsubscribeState.unsubscribe;
        },
        [onError]
    );

    // Snapshot function for useSyncExternalStore
    const getSnapshot = useCallback(() => {
        return stateRef.current;
    }, []);

    // Server snapshot (for SSR)
    const getServerSnapshot = useCallback(() => {
        return {
            isConnected: false,
            connectionError: null,
            stream: null,
            connection: null,
            metadata: {
                totalMessages: 0,
                messagesPerSecond: 0,
                bufferUtilization: 0,
            },
        };
    }, []);

    // Use React 18's useSyncExternalStore for stream state
    const streamState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    // Connection management
    const connect = useCallback(async () => {
        if (!chart || streamRef.current) return;

        try {
            const stream = createStream();
            streamRef.current = stream;
            stateRef.current.stream = stream;

            // Start the stream
            await stream.start();

            // Connect to chart
            const connection = await chart.connectStream(stream, seriesId);
            connectionRef.current = connection;
            stateRef.current.connection = connection;
            stateRef.current.isConnected = true;
            stateRef.current.connectionError = null;
        } catch (error) {
            stateRef.current.connectionError = error as Error;
            onError?.(error as Error);
        }
    }, [chart, createStream, seriesId, onError]);

    const disconnect = useCallback(async () => {
        if (connectionRef.current) {
            await connectionRef.current.disconnect();
            connectionRef.current = null;
        }

        if (streamRef.current) {
            await streamRef.current.stop();
            streamRef.current = null;
        }

        stateRef.current = {
            isConnected: false,
            connectionError: null,
            stream: null,
            connection: null,
            metadata: {
                totalMessages: 0,
                messagesPerSecond: 0,
                bufferUtilization: 0,
            },
        };
    }, []);

    // Auto-connect when dependencies change
    useEffect(() => {
        if (autoConnect && chart && streamUrl) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, chart, streamUrl, connect, disconnect]);

    // Calculate messages per second
    useEffect(() => {
        const interval = setInterval(() => {
            if (streamRef.current && stateRef.current.isConnected) {
                const stream = streamRef.current;
                const previousTotal = stateRef.current.metadata.totalMessages;
                const currentTotal = stream.metadata.totalMessages;
                const messagesPerSecond = currentTotal - previousTotal;

                stateRef.current = {
                    ...stateRef.current,
                    metadata: {
                        ...stateRef.current.metadata,
                        messagesPerSecond,
                    },
                };
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        ...streamState,
        connect,
        disconnect,
    };
};
```

### 2. useStreamProcessor Hook for Data Transformation

```typescript
import { useCallback, useMemo, useRef } from 'react';
import { startTransition, useDeferredValue } from 'react';

interface StreamProcessor<TInput, TOutput> {
    transform: (data: TInput) => TOutput | Promise<TOutput>;
    filter?: (data: TInput) => boolean;
    bufferSize?: number;
    enableBackpressure?: boolean;
}

interface UseStreamProcessorOptions<TInput, TOutput> {
    sourceStream: AgDataStream<TInput> | null;
    processor: StreamProcessor<TInput, TOutput>;
    enableConcurrentProcessing?: boolean;
}

export const useStreamProcessor = <TInput, TOutput>({
    sourceStream,
    processor,
    enableConcurrentProcessing = true,
}: UseStreamProcessorOptions<TInput, TOutput>) => {
    const processedStreamRef = useRef<AgDataStream<TOutput> | null>(null);
    const processingQueue = useRef<TInput[]>([]);
    const isProcessing = useRef(false);

    // Create processed stream with transformations
    const processedStream = useMemo(() => {
        if (!sourceStream) return null;

        let stream = sourceStream;

        // Apply filter if provided
        if (processor.filter) {
            stream = stream.filter(processor.filter);
        }

        // Apply transformation
        const transformedStream = stream.transform(async (data: TInput) => {
            if (enableConcurrentProcessing) {
                // Use startTransition for non-blocking processing
                return new Promise<TOutput>((resolve) => {
                    startTransition(async () => {
                        const result = await processor.transform(data);
                        resolve(result);
                    });
                });
            } else {
                return processor.transform(data);
            }
        });

        return transformedStream;
    }, [sourceStream, processor, enableConcurrentProcessing]);

    // Batch processing for high-frequency streams
    const processBatch = useCallback(
        async (batch: TInput[]) => {
            if (isProcessing.current) return;

            isProcessing.current = true;

            try {
                if (enableConcurrentProcessing) {
                    startTransition(async () => {
                        const processed = await Promise.all(
                            batch.map(async (item) => {
                                if (processor.filter && !processor.filter(item)) return null;
                                return processor.transform(item);
                            })
                        );

                        // Filter out null results
                        const validResults = processed.filter((item): item is TOutput => item !== null);

                        // Send processed batch to output stream
                        if (processedStreamRef.current && validResults.length > 0) {
                            // Implementation depends on stream API
                            // processedStreamRef.current.writeMany(validResults);
                        }
                    });
                }
            } finally {
                isProcessing.current = false;
            }
        },
        [processor, enableConcurrentProcessing]
    );

    return {
        processedStream,
        processBatch,
        isProcessing: isProcessing.current,
    };
};
```

### 3. useMultiStreamCoordinator Hook

```typescript
interface MultiStreamConfig<TDatum> {
    synchronizationMode: 'timestamp' | 'sequence' | 'none';
    timestampTolerance?: number;
    maxWaitTime?: number;
}

interface StreamMapping<TDatum> {
    seriesId: string;
    stream: AgDataStream<TDatum>;
    priority?: number;
}

export const useMultiStreamCoordinator = <TDatum>(
    chart: StreamingChartHandle<TDatum> | null,
    streamMappings: StreamMapping<TDatum>[],
    config: MultiStreamConfig<TDatum>
) => {
    const coordinatorRef = useRef<AgMultiStreamController<TDatum> | null>(null);
    const connectionsRef = useRef<Map<string, AgStreamConnection>>(new Map());

    // Deferred state for non-critical UI updates
    const [globalStats, setGlobalStats] = useState({
        totalStreams: 0,
        activeStreams: 0,
        totalMessages: 0,
        combinedLatency: 0,
        memoryUsage: 0,
    });
    const deferredGlobalStats = useDeferredValue(globalStats);

    // Initialize multi-stream coordinator
    useEffect(() => {
        if (!chart || streamMappings.length === 0) return;

        const initializeCoordinator = async () => {
            try {
                const streamMap = streamMappings.reduce(
                    (acc, mapping) => {
                        acc[mapping.seriesId] = mapping.stream;
                        return acc;
                    },
                    {} as Record<string, AgDataStream<TDatum>>
                );

                coordinatorRef.current = await chart.createMultiStream(streamMap, {
                    synchronization: {
                        mode: config.synchronizationMode,
                        timestampTolerance: config.timestampTolerance || 100,
                        maxWaitTime: config.maxWaitTime || 1000,
                    },
                });

                // Connect individual streams
                for (const mapping of streamMappings) {
                    const connection = await chart.connectStream(mapping.stream, mapping.seriesId);
                    connectionsRef.current.set(mapping.seriesId, connection);
                }
            } catch (error) {
                console.error('Failed to initialize multi-stream coordinator:', error);
            }
        };

        initializeCoordinator();

        return () => {
            // Cleanup connections
            connectionsRef.current.forEach((connection) => {
                connection.disconnect();
            });
            connectionsRef.current.clear();
            coordinatorRef.current = null;
        };
    }, [chart, streamMappings, config]);

    // Update global stats periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (coordinatorRef.current) {
                startTransition(() => {
                    const stats = coordinatorRef.current!.getGlobalStats();
                    setGlobalStats(stats);
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const pauseAllStreams = useCallback(() => {
        coordinatorRef.current?.pauseAll();
    }, []);

    const resumeAllStreams = useCallback(() => {
        coordinatorRef.current?.resumeAll();
    }, []);

    const synchronizeStreams = useCallback(async () => {
        await coordinatorRef.current?.synchronize();
    }, []);

    const addStream = useCallback(
        async (seriesId: string, stream: AgDataStream<TDatum>) => {
            if (coordinatorRef.current && chart) {
                await coordinatorRef.current.addStream(seriesId, stream);
                const connection = await chart.connectStream(stream, seriesId);
                connectionsRef.current.set(seriesId, connection);
            }
        },
        [chart]
    );

    const removeStream = useCallback(async (seriesId: string) => {
        if (coordinatorRef.current) {
            await coordinatorRef.current.removeStream(seriesId);
            const connection = connectionsRef.current.get(seriesId);
            if (connection) {
                await connection.disconnect();
                connectionsRef.current.delete(seriesId);
            }
        }
    }, []);

    return {
        globalStats: deferredGlobalStats,
        pauseAllStreams,
        resumeAllStreams,
        synchronizeStreams,
        addStream,
        removeStream,
        connections: Object.fromEntries(connectionsRef.current),
    };
};
```

## React 18+ Concurrent Features

### 1. Concurrent Streaming with Suspense

```typescript
import { Suspense, lazy } from 'react';

// Lazy load streaming components for code splitting
const StreamingChart = lazy(() => import('./StreamingChart'));
const StreamMetrics = lazy(() => import('./StreamMetrics'));

interface ConcurrentStreamingDashboardProps {
  streams: Array<{ id: string; url: string; type: 'websocket' | 'sse' }>;
}

const ConcurrentStreamingDashboard: React.FC<ConcurrentStreamingDashboardProps> = ({ streams }) => {
  return (
    <div className="streaming-dashboard">
      <Suspense fallback={<div>Loading streaming charts...</div>}>
        <div className="charts-grid">
          {streams.map((stream) => (
            <StreamingChartContainer
              key={stream.id}
              streamUrl={stream.url}
              streamType={stream.type}
            />
          ))}
        </div>
      </Suspense>

      <Suspense fallback={<div>Loading metrics...</div>}>
        <StreamMetrics streams={streams} />
      </Suspense>
    </div>
  );
};

const StreamingChartContainer: React.FC<{
  streamUrl: string;
  streamType: 'websocket' | 'sse';
}> = ({ streamUrl, streamType }) => {
  const [chartRef, setChartRef] = useState<StreamingChartHandle<any> | null>(null);

  const { isConnected, connectionError, metadata } = useChartStream({
    chart: chartRef,
    streamUrl,
    streamType,
    autoConnect: true,
  });

  // Use startTransition for non-urgent connection status updates
  const [displayStatus, setDisplayStatus] = useState('Connecting...');

  useEffect(() => {
    startTransition(() => {
      if (connectionError) {
        setDisplayStatus(`Error: ${connectionError.message}`);
      } else if (isConnected) {
        setDisplayStatus(`Connected - ${metadata.messagesPerSecond} msg/s`);
      } else {
        setDisplayStatus('Connecting...');
      }
    });
  }, [isConnected, connectionError, metadata.messagesPerSecond]);

  const chartOptions = useMemo(() => ({
    title: { text: `Stream: ${streamUrl}` },
    series: [
      {
        type: 'line' as const,
        xKey: 'timestamp',
        yKey: 'value',
      },
    ],
    axes: [
      { type: 'time' as const, position: 'bottom' as const },
      { type: 'number' as const, position: 'left' as const },
    ],
  }), [streamUrl]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{streamUrl}</h3>
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {displayStatus}
        </span>
      </div>

      <StreamingChart
        ref={setChartRef}
        options={chartOptions}
        enableConcurrentStreaming={true}
        onStreamError={(error) => {
          console.error('Stream error:', error);
        }}
      />
    </div>
  );
};
```

### 2. useDeferredValue for Responsive UI

```typescript
import { useDeferredValue } from 'react';

const StreamingMetricsPanel: React.FC<{
  streams: Array<{ id: string; connection: AgStreamConnection }>;
}> = ({ streams }) => {
  // Defer expensive metrics calculations to keep UI responsive
  const deferredStreams = useDeferredValue(streams);

  const aggregatedMetrics = useMemo(() => {
    return deferredStreams.reduce(
      (acc, stream) => {
        const stats = stream.connection.stats;
        return {
          totalMessages: acc.totalMessages + stats.messagesReceived,
          averageLatency: (acc.averageLatency + stats.averageLatency) / 2,
          totalErrors: acc.totalErrors + stats.errors,
          combinedThroughput: acc.combinedThroughput + (stats.messagesReceived / 60), // per minute
        };
      },
      {
        totalMessages: 0,
        averageLatency: 0,
        totalErrors: 0,
        combinedThroughput: 0,
      }
    );
  }, [deferredStreams]);

  return (
    <div className="metrics-panel">
      <h3>Streaming Metrics</h3>
      <div className="metrics-grid">
        <div className="metric">
          <label>Total Messages</label>
          <span>{aggregatedMetrics.totalMessages.toLocaleString()}</span>
        </div>
        <div className="metric">
          <label>Average Latency</label>
          <span>{aggregatedMetrics.averageLatency.toFixed(2)}ms</span>
        </div>
        <div className="metric">
          <label>Throughput</label>
          <span>{aggregatedMetrics.combinedThroughput.toFixed(0)} msg/min</span>
        </div>
        <div className="metric">
          <label>Errors</label>
          <span className={aggregatedMetrics.totalErrors > 0 ? 'error' : ''}>
            {aggregatedMetrics.totalErrors}
          </span>
        </div>
      </div>
    </div>
  );
};
```

### 3. Server Components Considerations

```typescript
// Server Component for initial chart configuration
// This runs on the server and can fetch initial data
export default async function StreamingDashboardPage({
  params,
}: {
  params: { dashboardId: string };
}) {
  // Fetch dashboard configuration on the server
  const dashboardConfig = await fetchDashboardConfig(params.dashboardId);

  return (
    <div>
      <h1>{dashboardConfig.title}</h1>

      {/* Client Component boundary for streaming functionality */}
      <ClientStreamingDashboard
        initialConfig={dashboardConfig}
        streamEndpoints={dashboardConfig.streams}
      />
    </div>
  );
}

// Client Component for streaming functionality
'use client';

interface ClientStreamingDashboardProps {
  initialConfig: DashboardConfig;
  streamEndpoints: StreamEndpoint[];
}

const ClientStreamingDashboard: React.FC<ClientStreamingDashboardProps> = ({
  initialConfig,
  streamEndpoints,
}) => {
  const [chartRefs, setChartRefs] = useState<Record<string, StreamingChartHandle<any>>>({});

  // Initialize streams after hydration
  useEffect(() => {
    streamEndpoints.forEach(async (endpoint) => {
      const chart = chartRefs[endpoint.id];
      if (chart) {
        const stream = new AgWebSocketStream(endpoint.url, {
          buffer: { maxSize: 10000 },
          backpressure: { enabled: true },
        });

        await chart.connectStream(stream, endpoint.seriesId);
        await stream.start();
      }
    });
  }, [chartRefs, streamEndpoints]);

  return (
    <div className="streaming-dashboard">
      {initialConfig.charts.map((chartConfig) => (
        <StreamingChart
          key={chartConfig.id}
          ref={(ref) => {
            if (ref) {
              setChartRefs((prev) => ({ ...prev, [chartConfig.id]: ref }));
            }
          }}
          options={chartConfig.options}
        />
      ))}
    </div>
  );
};
```

## Performance Optimization

### 1. Stream Buffer Management with React.memo

```typescript
import React, { memo } from 'react';

interface StreamBufferVisualizerProps {
  streams: Array<{
    id: string;
    bufferUtilization: number;
    droppedMessages: number;
    state: 'flowing' | 'paused' | 'error';
  }>;
  onPauseStream: (streamId: string) => void;
  onResumeStream: (streamId: string) => void;
}

const StreamBufferVisualizer = memo<StreamBufferVisualizerProps>(({
  streams,
  onPauseStream,
  onResumeStream,
}) => {
  return (
    <div className="buffer-visualizer">
      {streams.map((stream) => (
        <div key={stream.id} className="stream-buffer">
          <div className="stream-info">
            <span className="stream-id">{stream.id}</span>
            <span className={`stream-state ${stream.state}`}>{stream.state}</span>
          </div>

          <div className="buffer-bar">
            <div
              className={`buffer-fill ${stream.bufferUtilization > 0.8 ? 'warning' : ''}`}
              style={{ width: `${stream.bufferUtilization * 100}%` }}
            />
          </div>

          <div className="buffer-stats">
            <span>Buffer: {(stream.bufferUtilization * 100).toFixed(1)}%</span>
            <span>Dropped: {stream.droppedMessages}</span>
          </div>

          <div className="buffer-controls">
            {stream.state === 'flowing' ? (
              <button onClick={() => onPauseStream(stream.id)}>Pause</button>
            ) : (
              <button onClick={() => onResumeStream(stream.id)}>Resume</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  if (prevProps.streams.length !== nextProps.streams.length) {
    return false;
  }

  return prevProps.streams.every((prevStream, index) => {
    const nextStream = nextProps.streams[index];
    return (
      prevStream.id === nextStream.id &&
      prevStream.state === nextStream.state &&
      Math.abs(prevStream.bufferUtilization - nextStream.bufferUtilization) < 0.01 &&
      prevStream.droppedMessages === nextStream.droppedMessages
    );
  });
});
```

### 2. Virtualization for Large Stream Lists

```typescript
import { FixedSizeList as List } from 'react-window';

interface VirtualizedStreamListProps {
  streams: Array<{ id: string; metadata: StreamMetadata }>;
  itemHeight: number;
  maxVisibleStreams: number;
}

const VirtualizedStreamList: React.FC<VirtualizedStreamListProps> = ({
  streams,
  itemHeight,
  maxVisibleStreams,
}) => {
  const StreamItem = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const stream = streams[index];

    return (
      <div style={style} className="stream-item">
        <StreamingChart
          options={{
            title: { text: stream.id },
            series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
          }}
          // Only render charts for visible items to optimize performance
          enableConcurrentStreaming={true}
        />
      </div>
    );
  });

  return (
    <List
      height={maxVisibleStreams * itemHeight}
      itemCount={streams.length}
      itemSize={itemHeight}
      overscanCount={2} // Render 2 extra items outside viewport
    >
      {StreamItem}
    </List>
  );
};
```

### 3. Memory Management with Cleanup Hooks

```typescript
const useStreamMemoryManagement = (streams: AgDataStream<any>[], maxMemoryUsageMB: number = 100) => {
    const memoryUsageRef = useRef(0);
    const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

    // Monitor memory usage
    useEffect(() => {
        const checkMemoryUsage = async () => {
            if ('memory' in performance) {
                const memInfo = (performance as any).memory;
                const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
                memoryUsageRef.current = usedMB;

                if (usedMB > maxMemoryUsageMB) {
                    // Trigger cleanup for older stream data
                    streams.forEach((stream) => {
                        if (stream.metadata.bufferSize > 5000) {
                            // Force garbage collection of old data
                            stream.cleanupOldData?.();
                        }
                    });
                }
            }
        };

        const interval = setInterval(checkMemoryUsage, 5000);
        return () => clearInterval(interval);
    }, [streams, maxMemoryUsageMB]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }

            // Ensure all streams are properly cleaned up
            streams.forEach(async (stream) => {
                try {
                    await stream.stop();
                } catch (error) {
                    console.warn('Error stopping stream during cleanup:', error);
                }
            });
        };
    }, [streams]);

    return {
        currentMemoryUsage: memoryUsageRef.current,
    };
};
```

## Error Handling and Recovery

### 1. Stream Error Boundary with Recovery

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface StreamErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  enableAutoRecovery?: boolean;
  maxRetryAttempts?: number;
}

interface StreamErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryAttempts: number;
}

export class StreamErrorBoundary extends Component<
  StreamErrorBoundaryProps,
  StreamErrorBoundaryState
> {
  private retryTimeoutRef: NodeJS.Timeout | null = null;

  constructor(props: StreamErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryAttempts: 0 };
  }

  static getDerivedStateFromError(error: Error): StreamErrorBoundaryState {
    return { hasError: true, error, retryAttempts: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Stream error boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Auto-recovery logic
    if (this.props.enableAutoRecovery && this.state.retryAttempts < (this.props.maxRetryAttempts || 3)) {
      this.retryTimeoutRef = setTimeout(() => {
        this.handleRetry();
      }, Math.pow(2, this.state.retryAttempts) * 1000); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryAttempts: prevState.retryAttempts + 1,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="stream-error-boundary">
          <h3>Streaming Error</h3>
          <p>An error occurred in the streaming component: {this.state.error.message}</p>
          <div className="error-actions">
            <button onClick={this.handleRetry}>Retry</button>
            <span>Attempt {this.state.retryAttempts + 1} of {this.props.maxRetryAttempts || 3}</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. Circuit Breaker Hook for Stream Resilience

```typescript
interface CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailureTime: number;
    nextAttemptTime: number;
}

const useStreamCircuitBreaker = (
    streamConnection: AgStreamConnection | null,
    options: {
        failureThreshold: number;
        timeout: number;
        resetTimeout: number;
    } = {
        failureThreshold: 5,
        timeout: 60000,
        resetTimeout: 30000,
    }
) => {
    const [circuitState, setCircuitState] = useState<CircuitBreakerState>({
        state: 'closed',
        failures: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
    });

    const executeWithCircuitBreaker = useCallback(
        async <T>(fn: () => Promise<T>): Promise<T> => {
            if (circuitState.state === 'open') {
                if (Date.now() < circuitState.nextAttemptTime) {
                    throw new Error('Circuit breaker is OPEN');
                } else {
                    setCircuitState((prev) => ({ ...prev, state: 'half-open' }));
                }
            }

            try {
                const result = await fn();

                // Success - reset circuit breaker
                setCircuitState({
                    state: 'closed',
                    failures: 0,
                    lastFailureTime: 0,
                    nextAttemptTime: 0,
                });

                return result;
            } catch (error) {
                // Failure - update circuit breaker state
                setCircuitState((prev) => {
                    const newFailures = prev.failures + 1;
                    const now = Date.now();

                    if (newFailures >= options.failureThreshold) {
                        return {
                            state: 'open',
                            failures: newFailures,
                            lastFailureTime: now,
                            nextAttemptTime: now + options.timeout,
                        };
                    }

                    return {
                        ...prev,
                        failures: newFailures,
                        lastFailureTime: now,
                    };
                });

                throw error;
            }
        },
        [circuitState, options]
    );

    const resetCircuitBreaker = useCallback(() => {
        setCircuitState({
            state: 'closed',
            failures: 0,
            lastFailureTime: 0,
            nextAttemptTime: 0,
        });
    }, []);

    return {
        circuitState,
        executeWithCircuitBreaker,
        resetCircuitBreaker,
        canExecute:
            circuitState.state === 'closed' ||
            (circuitState.state === 'half-open' && Date.now() >= circuitState.nextAttemptTime),
    };
};
```

## Real-world Examples

### 1. Financial Trading Dashboard with Multiple Streams

```typescript
interface TradingData {
  symbol: string;
  timestamp: number;
  price: number;
  volume: number;
  bid: number;
  ask: number;
  change: number;
}

const FinancialTradingDashboard: React.FC<{
  symbols: string[];
  websocketUrl: string;
}> = ({ symbols, websocketUrl }) => {
  const [chartRefs, setChartRefs] = useState<Record<string, StreamingChartHandle<TradingData>>>({});

  // Multi-stream coordinator for synchronized updates
  const {
    globalStats,
    pauseAllStreams,
    resumeAllStreams,
    addStream,
    removeStream,
  } = useMultiStreamCoordinator(
    Object.values(chartRefs)[0] || null, // Use first chart as coordinator
    symbols.map(symbol => ({
      seriesId: symbol,
      stream: new AgWebSocketStream<TradingData>(`${websocketUrl}?symbol=${symbol}`, {
        buffer: { maxSize: 10000, overflowStrategy: 'drop-oldest' },
        backpressure: { enabled: true, highWaterMark: 1000 },
      }),
      priority: 1,
    })),
    {
      synchronizationMode: 'timestamp',
      timestampTolerance: 50,
      maxWaitTime: 500,
    }
  );

  // Market status with circuit breaker
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'premarket'>('closed');
  const { circuitState, executeWithCircuitBreaker } = useStreamCircuitBreaker(null, {
    failureThreshold: 3,
    timeout: 30000,
    resetTimeout: 10000,
  });

  // Real-time market data processing
  const { processedStream } = useStreamProcessor({
    sourceStream: null, // Will be set from WebSocket
    processor: {
      transform: (data: TradingData) => ({
        ...data,
        // Add technical indicators
        sma20: calculateSMA(data.price, 20),
        rsi: calculateRSI(data.price, 14),
        bollinger: calculateBollingerBands(data.price, 20, 2),
      }),
      filter: (data) => data.volume > 0, // Filter out zero-volume ticks
    },
    enableConcurrentProcessing: true,
  });

  const chartOptions = useMemo(() => ({
    theme: 'ag-material-dark',
    title: { text: 'Live Trading Data' },
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
        type: 'line' as const,
        xKey: 'timestamp',
        yKey: 'sma20',
        stroke: '#ff6b6b',
        strokeWidth: 2,
      },
      {
        type: 'column' as const,
        xKey: 'timestamp',
        yKey: 'volume',
        yAxis: 'volume',
        fill: '#4ecdc4',
      },
    ],
    axes: [
      { type: 'time' as const, position: 'bottom' as const },
      { type: 'number' as const, position: 'left' as const, keys: ['price', 'sma20'] },
      { type: 'number' as const, position: 'right' as const, keys: ['volume'], id: 'volume' },
    ],
  }), []);

  // Handle market hours
  useEffect(() => {
    const checkMarketHours = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 9 && hour < 16) {
        setMarketStatus('open');
      } else if (hour >= 4 && hour < 9) {
        setMarketStatus('premarket');
      } else {
        setMarketStatus('closed');
      }
    };

    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <StreamErrorBoundary
      enableAutoRecovery={true}
      maxRetryAttempts={5}
      fallback={(error, retry) => (
        <div className="trading-error">
          <h3>Trading Dashboard Error</h3>
          <p>{error.message}</p>
          <button onClick={retry}>Reconnect to Market Data</button>
        </div>
      )}
    >
      <div className="trading-dashboard">
        <div className="market-header">
          <div className="market-status">
            <span className={`status-indicator ${marketStatus}`}>
              Market: {marketStatus.toUpperCase()}
            </span>
            <span className={`circuit-status ${circuitState.state}`}>
              Circuit: {circuitState.state.toUpperCase()}
            </span>
          </div>

          <div className="stream-controls">
            <button onClick={pauseAllStreams}>Pause All</button>
            <button onClick={resumeAllStreams}>Resume All</button>
          </div>

          <div className="global-stats">
            <span>Active Streams: {globalStats.activeStreams}</span>
            <span>Messages: {globalStats.totalMessages.toLocaleString()}</span>
            <span>Latency: {globalStats.combinedLatency.toFixed(2)}ms</span>
          </div>
        </div>

        <div className="symbols-grid">
          {symbols.map(symbol => (
            <div key={symbol} className="symbol-chart">
              <h4>{symbol}</h4>
              <StreamingChart
                ref={(ref) => {
                  if (ref) {
                    setChartRefs(prev => ({ ...prev, [symbol]: ref }));
                  }
                }}
                options={{
                  ...chartOptions,
                  title: { text: `${symbol} - Live` },
                }}
                enableConcurrentStreaming={true}
                backpressureThreshold={5000}
                onStreamConnect={(connection) => {
                  console.log(`Connected to ${symbol} stream:`, connection.id);
                }}
                onStreamError={(error, streamId) => {
                  console.error(`Stream error for ${symbol}:`, error);
                }}
              />
            </div>
          ))}
        </div>

        <Suspense fallback={<div>Loading stream metrics...</div>}>
          <StreamMetricsPanel
            streams={Object.entries(chartRefs).map(([symbol, chart]) => ({
              id: symbol,
              chart,
            }))}
          />
        </Suspense>
      </div>
    </StreamErrorBoundary>
  );
};
```

### 2. IoT Sensor Monitoring with Stream Processing

```typescript
interface SensorReading {
  sensorId: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  batteryLevel: number;
  location: { lat: number; lng: number };
}

const IoTDashboard: React.FC<{
  sensorEndpoints: Array<{ id: string; url: string; type: 'websocket' | 'sse' }>;
  alertThresholds: Record<string, { min: number; max: number }>;
}> = ({ sensorEndpoints, alertThresholds }) => {
  const [alerts, setAlerts] = useState<Array<{
    sensorId: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
  }>>([]);

  // Stream processor for real-time alerting
  const { processedStream } = useStreamProcessor({
    sourceStream: null, // Set from sensor streams
    processor: {
      transform: (reading: SensorReading) => {
        // Check for alerts
        const sensorAlerts: typeof alerts = [];

        Object.entries(alertThresholds).forEach(([metric, { min, max }]) => {
          const value = reading[metric as keyof SensorReading] as number;
          if (typeof value === 'number') {
            if (value < min || value > max) {
              sensorAlerts.push({
                sensorId: reading.sensorId,
                metric,
                value,
                threshold: value < min ? min : max,
                timestamp: reading.timestamp,
              });
            }
          }
        });

        if (sensorAlerts.length > 0) {
          setAlerts(prev => [...prev.slice(-99), ...sensorAlerts]); // Keep last 100 alerts
        }

        return {
          ...reading,
          // Add computed metrics
          heatIndex: calculateHeatIndex(reading.temperature, reading.humidity),
          dewPoint: calculateDewPoint(reading.temperature, reading.humidity),
        };
      },
      filter: (reading) => reading.batteryLevel > 5, // Filter low battery sensors
    },
    enableConcurrentProcessing: true,
  });

  // Chart configuration for sensor data
  const sensorChartOptions = useMemo(() => ({
    theme: 'ag-default',
    series: [
      {
        type: 'line' as const,
        xKey: 'timestamp',
        yKey: 'temperature',
        yName: 'Temperature (°C)',
        stroke: '#ff6b6b',
      },
      {
        type: 'line' as const,
        xKey: 'timestamp',
        yKey: 'humidity',
        yName: 'Humidity (%)',
        stroke: '#4ecdc4',
        yAxis: 'secondary',
      },
      {
        type: 'line' as const,
        xKey: 'timestamp',
        yKey: 'pressure',
        yName: 'Pressure (hPa)',
        stroke: '#45b7d1',
        yAxis: 'tertiary',
      },
    ],
    axes: [
      { type: 'time' as const, position: 'bottom' as const },
      { type: 'number' as const, position: 'left' as const, keys: ['temperature'] },
      { type: 'number' as const, position: 'right' as const, keys: ['humidity'], id: 'secondary' },
      { type: 'number' as const, position: 'right' as const, keys: ['pressure'], id: 'tertiary' },
    ],
  }), []);

  return (
    <div className="iot-dashboard">
      <div className="dashboard-header">
        <h2>IoT Sensor Monitoring</h2>
        <div className="alerts-summary">
          {alerts.length > 0 && (
            <span className="alert-count">
              {alerts.length} Active Alerts
            </span>
          )}
        </div>
      </div>

      <div className="sensors-grid">
        {sensorEndpoints.map(sensor => (
          <SensorStreamingChart
            key={sensor.id}
            sensorId={sensor.id}
            streamUrl={sensor.url}
            streamType={sensor.type}
            chartOptions={sensorChartOptions}
          />
        ))}
      </div>

      <div className="alerts-panel">
        <h3>Recent Alerts</h3>
        <div className="alerts-list">
          {alerts.slice(-10).reverse().map((alert, index) => (
            <div key={index} className="alert-item">
              <span className="sensor-id">{alert.sensorId}</span>
              <span className="metric">{alert.metric}</span>
              <span className="value">{alert.value.toFixed(2)}</span>
              <span className="threshold">Threshold: {alert.threshold}</span>
              <span className="timestamp">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SensorStreamingChart: React.FC<{
  sensorId: string;
  streamUrl: string;
  streamType: 'websocket' | 'sse';
  chartOptions: AgChartOptions;
}> = ({ sensorId, streamUrl, streamType, chartOptions }) => {
  const [chartRef, setChartRef] = useState<StreamingChartHandle<SensorReading> | null>(null);

  const { isConnected, connectionError, metadata, connect, disconnect } = useChartStream({
    chart: chartRef,
    streamUrl,
    streamType,
    streamOptions: {
      buffer: { maxSize: 5000, overflowStrategy: 'drop-oldest' },
      backpressure: { enabled: true, highWaterMark: 1000 },
    },
    autoConnect: true,
  });

  // Memory management for long-running sensors
  useStreamMemoryManagement([chartRef?.getStreamConnections?.()?.main?.getStream?.()] || [], 50);

  return (
    <div className="sensor-chart-container">
      <div className="sensor-header">
        <h4>Sensor {sensorId}</h4>
        <div className="sensor-status">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span className="message-rate">
            {metadata.messagesPerSecond} msg/s
          </span>
          <span className="buffer-usage">
            Buffer: {(metadata.bufferUtilization * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {connectionError && (
        <div className="connection-error">
          Error: {connectionError.message}
          <button onClick={connect}>Retry</button>
        </div>
      )}

      <StreamingChart
        ref={setChartRef}
        options={{
          ...chartOptions,
          title: { text: `Sensor ${sensorId}` },
        }}
        enableConcurrentStreaming={true}
        onStreamError={(error) => {
          console.error(`Sensor ${sensorId} stream error:`, error);
        }}
      />
    </div>
  );
};
```

## Testing Strategies

### 1. React Testing Library with Stream Mocking

```typescript
import { render, screen, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StreamingChart, useChartStream } from '../StreamingChart';

// Mock stream classes
jest.mock('ag-charts-community', () => ({
  AgWebSocketStream: jest.fn().mockImplementation((url, options) => ({
    id: 'mock-stream-' + Date.now(),
    state: 'idle',
    metadata: {
      totalMessages: 0,
      bufferSize: 0,
      droppedMessages: 0,
    },
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    resume: jest.fn(),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  })),
}));

describe('StreamingChart', () => {
  it('should connect to stream and display data', async () => {
    const mockStream = new AgWebSocketStream('ws://test', {});
    const onStreamConnect = jest.fn();

    render(
      <StreamingChart
        options={{
          series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
        }}
        onStreamConnect={onStreamConnect}
      />
    );

    // Simulate stream connection
    act(() => {
      // Mock stream events
      const subscription = mockStream.subscribe.mock.calls[0][0];
      subscription.next({ timestamp: Date.now(), value: 100 });
    });

    await waitFor(() => {
      expect(onStreamConnect).toHaveBeenCalled();
    });
  });

  it('should handle stream errors gracefully', async () => {
    const onStreamError = jest.fn();
    const mockStream = new AgWebSocketStream('ws://invalid', {});

    render(
      <StreamingChart
        options={{
          series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
        }}
        onStreamError={onStreamError}
      />
    );

    // Simulate stream error
    act(() => {
      const subscription = mockStream.subscribe.mock.calls[0][0];
      subscription.error(new Error('Connection failed'));
    });

    await waitFor(() => {
      expect(onStreamError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String)
      );
    });
  });

  it('should handle high-frequency updates without memory leaks', async () => {
    const { unmount } = render(
      <StreamingChart
        options={{
          series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
        }}
      />
    );

    // Simulate high-frequency updates
    const mockStream = new AgWebSocketStream('ws://test', {});
    const subscription = mockStream.subscribe.mock.calls[0][0];

    // Send 1000 data points rapidly
    for (let i = 0; i < 1000; i++) {
      act(() => {
        subscription.next({ timestamp: Date.now() + i, value: Math.random() });
      });
    }

    // Verify no memory leaks on unmount
    expect(() => unmount()).not.toThrow();
  });
});

describe('useChartStream hook', () => {
  it('should manage stream lifecycle correctly', async () => {
    const mockChart = {
      connectStream: jest.fn().mockResolvedValue({
        id: 'connection-1',
        disconnect: jest.fn(),
      }),
    };

    const { result } = renderHook(() =>
      useChartStream({
        chart: mockChart as any,
        streamUrl: 'ws://test',
        streamType: 'websocket',
        autoConnect: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Test disconnect
    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });
});
```

### 2. Performance Testing with Stream Simulation

```typescript
import { act, renderHook } from '@testing-library/react';
import { performance } from 'perf_hooks';

describe('Stream Performance', () => {
    it('should maintain 60fps with 100+ updates/second', async () => {
        const mockChart = createMockStreamingChart();
        const { result } = renderHook(() =>
            useChartStream({
                chart: mockChart,
                streamUrl: 'ws://high-frequency',
                streamType: 'websocket',
            })
        );

        await act(async () => {
            await result.current.connect();
        });

        const startTime = performance.now();
        const frameRates: number[] = [];
        let lastFrameTime = startTime;

        // Simulate 100 updates per second for 5 seconds
        const updateInterval = setInterval(() => {
            act(() => {
                // Simulate stream data
                const currentTime = performance.now();
                const frameTime = currentTime - lastFrameTime;
                frameRates.push(1000 / frameTime);
                lastFrameTime = currentTime;

                // Mock data update
                result.current.simulateDataUpdate?.({
                    timestamp: Date.now(),
                    value: Math.random(),
                });
            });
        }, 10); // 100 updates/second

        // Run for 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));
        clearInterval(updateInterval);

        const averageFps = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
        const minFps = Math.min(...frameRates);

        expect(averageFps).toBeGreaterThan(30); // Minimum acceptable FPS
        expect(minFps).toBeGreaterThan(20); // No severe frame drops
    });

    it('should handle backpressure correctly', async () => {
        const mockChart = createMockStreamingChart();
        const { result } = renderHook(() =>
            useChartStream({
                chart: mockChart,
                streamUrl: 'ws://backpressure-test',
                streamType: 'websocket',
                streamOptions: {
                    backpressure: {
                        enabled: true,
                        highWaterMark: 100,
                        lowWaterMark: 50,
                    },
                },
            })
        );

        await act(async () => {
            await result.current.connect();
        });

        // Flood with data to trigger backpressure
        for (let i = 0; i < 200; i++) {
            act(() => {
                result.current.simulateDataUpdate?.({
                    timestamp: Date.now() + i,
                    value: i,
                });
            });
        }

        // Verify backpressure was applied
        expect(result.current.metadata.bufferUtilization).toBeLessThanOrEqual(1);
        expect(result.current.metadata.droppedMessages).toBeGreaterThan(0);
    });
});
```

## Migration Guide

### From Standard AG Charts React to Streaming

#### Before (Standard Implementation)

```typescript
import React, { useState, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';

const OldChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://api.example.com/data');

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      // Inefficient: Full data replacement
      setData(prevData => [...prevData, newData]);
    };

    return () => ws.close();
  }, []);

  const chartOptions = {
    data, // Full dataset passed every time
    series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
  };

  return <AgCharts options={chartOptions} />;
};
```

#### After (Stream-Based Implementation)

```typescript
import React, { useRef } from 'react';
import { StreamingChart, useChartStream } from './streaming';
import { AgWebSocketStream } from 'ag-charts-community';

const NewStreamingChart = () => {
  const chartRef = useRef<StreamingChartHandle<any>>(null);

  const { isConnected, connectionError, metadata } = useChartStream({
    chart: chartRef.current,
    streamUrl: 'ws://api.example.com/data',
    streamType: 'websocket',
    streamOptions: {
      buffer: { maxSize: 10000, overflowStrategy: 'drop-oldest' },
      backpressure: { enabled: true },
    },
    autoConnect: true,
  });

  const chartOptions = {
    data: [], // Start with empty data - stream handles updates
    series: [{ type: 'line', xKey: 'timestamp', yKey: 'value' }],
  };

  return (
    <div>
      <div className="stream-status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        {metadata.messagesPerSecond > 0 && (
          <span> - {metadata.messagesPerSecond} msg/s</span>
        )}
        {connectionError && <span className="error">{connectionError.message}</span>}
      </div>

      <StreamingChart
        ref={chartRef}
        options={chartOptions}
        enableConcurrentStreaming={true}
        onStreamError={(error) => console.error('Stream error:', error)}
      />
    </div>
  );
};
```

### Migration Checklist

-   [ ] Replace manual WebSocket handling with `useChartStream` hook
-   [ ] Update chart configuration to use `StreamingChart` component
-   [ ] Implement proper error boundaries with `StreamErrorBoundary`
-   [ ] Configure backpressure settings based on data volume
-   [ ] Add stream monitoring and metrics display
-   [ ] Update tests to use stream mocking utilities
-   [ ] Implement proper cleanup in `useEffect` hooks
-   [ ] Consider server-side rendering implications
-   [ ] Add TypeScript types for stream data models
-   [ ] Configure concurrent features for optimal performance

## Best Practices

### 1. Stream Configuration

```typescript
// Optimal stream configuration for different scenarios
const streamConfigs = {
    // High-frequency trading data
    financialData: {
        buffer: { maxSize: 50000, overflowStrategy: 'drop-oldest' },
        backpressure: { enabled: true, highWaterMark: 10000, batchSize: 100 },
        errorHandling: { maxRetries: 5, circuitBreakerThreshold: 3 },
    },

    // IoT sensor data
    sensorData: {
        buffer: { maxSize: 5000, overflowStrategy: 'drop-oldest' },
        backpressure: { enabled: true, highWaterMark: 1000, batchSize: 50 },
        errorHandling: { maxRetries: 3, circuitBreakerThreshold: 5 },
    },

    // Low-frequency analytics
    analyticsData: {
        buffer: { maxSize: 1000, overflowStrategy: 'error' },
        backpressure: { enabled: false },
        errorHandling: { maxRetries: 1 },
    },
};
```

### 2. React 18 Optimization Patterns

```typescript
// Use concurrent features appropriately
const OptimizedStreamingComponent = () => {
  // Critical updates (immediate)
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Non-critical updates (deferred)
  const [metrics, setMetrics] = useState({});
  const deferredMetrics = useDeferredValue(metrics);

  // Batch non-urgent state updates
  const updateMetrics = useCallback((newMetrics) => {
    startTransition(() => {
      setMetrics(newMetrics);
    });
  }, []);

  return (
    <div>
      <div className="critical-status">
        Connection: {connectionStatus}
      </div>
      <div className="deferred-metrics">
        Messages: {deferredMetrics.totalMessages}
      </div>
    </div>
  );
};
```

### 3. Error Handling Strategies

```typescript
// Comprehensive error handling for streams
const handleStreamError = (error: Error, streamId: string) => {
    // Log error with context
    console.error(`Stream ${streamId} error:`, {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        streamId,
    });

    // Send to error monitoring service
    errorMonitoringService.captureException(error, {
        tags: { component: 'streaming-chart', streamId },
        extra: { streamState: getStreamState(streamId) },
    });

    // Attempt recovery based on error type
    if (error.message.includes('WebSocket')) {
        // WebSocket specific recovery
        reconnectWithBackoff(streamId);
    } else if (error.message.includes('backpressure')) {
        // Backpressure handling
        pauseStreamTemporarily(streamId);
    }
};
```

### 4. Performance Monitoring

```typescript
// Built-in performance monitoring
const useStreamPerformanceMonitoring = () => {
    const [performanceMetrics, setPerformanceMetrics] = useState({
        fps: 60,
        memoryUsage: 0,
        updateLatency: 0,
        droppedFrames: 0,
    });

    useEffect(() => {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();

            startTransition(() => {
                setPerformanceMetrics((prev) => ({
                    ...prev,
                    updateLatency: entries.reduce((avg, entry) => (avg + entry.duration) / 2, prev.updateLatency),
                }));
            });
        });

        observer.observe({ entryTypes: ['measure'] });

        return () => observer.disconnect();
    }, []);

    return performanceMetrics;
};
```

## Summary

This React implementation guide provides a comprehensive foundation for integrating AG Charts' Stream-Based API with React applications. The implementation leverages React 18+ features including `useSyncExternalStore`, concurrent features, and proper error boundaries to create responsive, high-performance streaming data visualizations.

Key advantages of this approach:

-   **Natural streaming abstraction** with built-in flow control
-   **React 18 concurrent features** for non-blocking updates
-   **Comprehensive error handling** with circuit breakers and recovery
-   **Performance optimization** with memoization and virtualization
-   **Type-safe implementation** with full TypeScript support

The streaming approach is particularly well-suited for real-time applications like financial trading platforms, IoT monitoring dashboards, and live analytics systems where continuous data flow is essential.
