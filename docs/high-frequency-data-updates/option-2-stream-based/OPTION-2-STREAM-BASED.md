# Option 2: Stream-Based API for AG Charts High-Frequency Data Updates

## Executive Summary

This document outlines the design for a native stream-based API for AG Charts that provides high-frequency data update capabilities (100+ updates/second across 5 concurrent series) using modern JavaScript streaming primitives without external dependencies. The design leverages native `ReadableStream`, `WritableStream`, and `AsyncIterator` APIs to create a powerful, zero-dependency streaming solution that naturally handles backpressure, error recovery, and multi-stream composition.

Unlike competitors who require separate plugins (Chart.js with chartjs-plugin-streaming) or complex integrations, this design provides first-class streaming support built into AG Charts core, following patterns successful in TradingView and other real-time visualization platforms.

## Core Design Philosophy

### Zero External Dependencies

-   **Native Streams**: Built on browser-native `ReadableStream`/`WritableStream` APIs
-   **Custom Observable**: Lightweight implementation using `AsyncIterator` patterns
-   **Polyfill Strategy**: Graceful degradation for older browsers without adding dependencies
-   **Framework Agnostic**: Core streaming works with any framework

### Performance-First Architecture

-   **Data Processing Optimization**: Focus on efficient data transformation (68% of execution time)
-   **Incremental Processing**: Stream-based data processing reduces batch overhead
-   **Backpressure Handling**: Built-in flow control prevents data processing bottlenecks
-   **Efficient Buffering**: Ring buffer with configurable overflow policies
-   **Stream Composition**: Combine multiple data sources efficiently
-   **Cancellation Support**: Proper cleanup and resource management

## API Design

### Core Stream Interface

```typescript
/**
 * Base interface for data streams in AG Charts
 */
interface AgDataStream<TDatum = any> {
    /** Unique identifier for this stream */
    readonly id: string;

    /** Current stream state */
    readonly state: 'idle' | 'flowing' | 'paused' | 'error' | 'closed';

    /** Stream metadata */
    readonly metadata: {
        createdAt: number;
        totalMessages: number;
        lastMessageAt?: number;
        bufferSize: number;
        droppedMessages: number;
    };

    /** Start the stream */
    start(): Promise<void>;

    /** Pause the stream (buffering continues) */
    pause(): void;

    /** Resume a paused stream */
    resume(): void;

    /** Stop and cleanup the stream */
    stop(): Promise<void>;

    /** Transform stream data */
    transform<U>(transformer: StreamTransformer<TDatum, U>): AgDataStream<U>;

    /** Filter stream data */
    filter(predicate: (data: TDatum) => boolean): AgDataStream<TDatum>;

    /** Combine with another stream */
    merge(other: AgDataStream<TDatum>): AgDataStream<TDatum>;

    /** Error recovery */
    onError(handler: (error: Error) => void): AgDataStream<TDatum>;

    /** Cleanup callback */
    onClose(handler: () => void): AgDataStream<TDatum>;
}

/**
 * Transform function for stream data
 */
interface StreamTransformer<TInput, TOutput> {
    (data: TInput): TOutput | Promise<TOutput>;
}

/**
 * Stream configuration options
 */
interface AgStreamOptions<TDatum> {
    /** Buffer configuration */
    buffer?: {
        /** Maximum buffer size (default: 1000) */
        maxSize: number;

        /** Overflow handling strategy */
        overflowStrategy: 'drop-oldest' | 'drop-newest' | 'drop-all' | 'error';

        /** Buffer warning threshold (0-1, default: 0.8) */
        warningThreshold: number;
    };

    /** Backpressure configuration */
    backpressure?: {
        /** Enable automatic backpressure (default: true) */
        enabled: boolean;

        /** High water mark for data processing backpressure (default: 1000) */
        highWaterMark: number;

        /** Low water mark for resuming processing (default: 500) */
        lowWaterMark: number;

        /** Data processing batch size to optimize throughput */
        batchSize: number;
    };

    /** Error handling */
    errorHandling?: {
        /** Maximum retry attempts (default: 3) */
        maxRetries: number;

        /** Retry delay in ms (default: 1000) */
        retryDelay: number;

        /** Circuit breaker threshold (default: 5) */
        circuitBreakerThreshold: number;
    };

    /** Performance monitoring */
    monitoring?: {
        /** Enable performance metrics (default: false) */
        enabled: boolean;

        /** Metrics sampling rate (default: 0.1) */
        samplingRate: number;
    };
}
```

### Chart Stream Integration

```typescript
/**
 * Extended chart interface with streaming capabilities
 */
interface AgTypedChartInstance<TDatum, TContext, O> extends ExistingInterface {
    /**
     * Create a data stream for this chart
     *
     * @param seriesId - Target series ID (optional, defaults to first series)
     * @param options - Stream configuration options
     * @returns Writable stream for data updates
     */
    createDataStream(seriesId?: string, options?: AgStreamOptions<TDatum>): AgDataWritableStream<TDatum>;

    /**
     * Connect an external readable stream to the chart
     *
     * @param stream - External data stream
     * @param seriesId - Target series ID
     * @param options - Stream configuration options
     */
    connectStream(
        stream: ReadableStream<TDatum> | AgDataStream<TDatum>,
        seriesId?: string,
        options?: AgStreamOptions<TDatum>
    ): Promise<AgStreamConnection>;

    /**
     * Create a multi-series stream coordinator
     *
     * @param streamMappings - Map series IDs to their streams
     * @param options - Global stream options
     */
    createMultiStream(
        streamMappings: Record<string, AgDataStream<TDatum>>,
        options?: AgMultiStreamOptions
    ): AgMultiStreamController<TDatum>;

    /**
     * Get current stream connections
     */
    getStreamConnections(): Record<string, AgStreamConnection>;
}

/**
 * Writable stream specifically for chart data
 */
interface AgDataWritableStream<TDatum> extends WritableStream<TDatum>, AgDataStream<TDatum> {
    /** Write data to the stream */
    write(data: TDatum): Promise<void>;

    /** Write multiple data points */
    writeMany(data: TDatum[]): Promise<void>;

    /** Flush any buffered data */
    flush(): Promise<void>;

    /** Get current buffer status */
    getBufferStatus(): {
        size: number;
        capacity: number;
        utilizationPercent: number;
    };
}

/**
 * Stream connection handle
 */
interface AgStreamConnection {
    /** Connection identifier */
    readonly id: string;

    /** Target series ID */
    readonly seriesId: string;

    /** Connection state */
    readonly state: 'connecting' | 'connected' | 'error' | 'disconnected';

    /** Connection statistics */
    readonly stats: {
        messagesReceived: number;
        messagesProcessed: number;
        errors: number;
        averageLatency: number;
        lastActivity: number;
    };

    /** Disconnect and cleanup */
    disconnect(): Promise<void>;

    /** Reconnect with new options */
    reconnect(options?: AgStreamOptions): Promise<void>;
}
```

### Multi-Stream Coordination

```typescript
/**
 * Controller for coordinating multiple streams
 */
interface AgMultiStreamController<TDatum> {
    /** Add a new stream */
    addStream(seriesId: string, stream: AgDataStream<TDatum>): Promise<void>;

    /** Remove a stream */
    removeStream(seriesId: string): Promise<void>;

    /** Synchronize all streams */
    synchronize(): Promise<void>;

    /** Pause all streams */
    pauseAll(): void;

    /** Resume all streams */
    resumeAll(): void;

    /** Get combined stream statistics */
    getGlobalStats(): {
        totalStreams: number;
        activeStreams: number;
        totalMessages: number;
        combinedLatency: number;
        memoryUsage: number;
    };

    /** Configure cross-stream synchronization */
    setSynchronizationMode(mode: 'timestamp' | 'sequence' | 'none'): void;
}

/**
 * Multi-stream configuration
 */
interface AgMultiStreamOptions {
    /** Synchronization settings */
    synchronization?: {
        /** Sync mode for coordinating streams */
        mode: 'timestamp' | 'sequence' | 'none';

        /** Tolerance for timestamp synchronization (ms) */
        timestampTolerance: number;

        /** Maximum wait time for synchronization (ms) */
        maxWaitTime: number;
    };

    /** Global buffer settings */
    globalBuffer?: {
        /** Total memory limit across all streams */
        maxTotalMemory: number;

        /** Memory allocation strategy */
        allocationStrategy: 'equal' | 'weighted' | 'dynamic';
    };

    /** Error propagation */
    errorPropagation?: {
        /** Stop all streams if one fails */
        stopOnError: boolean;

        /** Isolate errors to individual streams */
        isolateErrors: boolean;
    };
}
```

## Native Stream Implementation

### Custom Observable Implementation

```typescript
/**
 * Lightweight Observable implementation using AsyncIterator
 * No external dependencies - uses native JavaScript features
 */
class AgObservable<T> implements AsyncIterable<T> {
    private observers: Set<ObserverFunction<T>> = new Set();
    private isCompleted = false;
    private error?: Error;

    constructor(private executor: ObservableExecutor<T>) {}

    /** Subscribe to observable */
    subscribe(observer: ObserverFunction<T>): Subscription {
        this.observers.add(observer);

        return {
            unsubscribe: () => {
                this.observers.delete(observer);
            },
        };
    }

    /** Convert to async iterator */
    async *[Symbol.asyncIterator](): AsyncIterator<T> {
        const queue: T[] = [];
        let resolve: ((value: IteratorResult<T>) => void) | null = null;
        let reject: ((error: Error) => void) | null = null;

        const observer: ObserverFunction<T> = {
            next: (value: T) => {
                if (resolve) {
                    resolve({ value, done: false });
                    resolve = null;
                    reject = null;
                } else {
                    queue.push(value);
                }
            },
            error: (err: Error) => {
                if (reject) {
                    reject(err);
                    resolve = null;
                    reject = null;
                } else {
                    this.error = err;
                }
            },
            complete: () => {
                if (resolve) {
                    resolve({ value: undefined, done: true });
                    resolve = null;
                    reject = null;
                }
                this.isCompleted = true;
            },
        };

        const subscription = this.subscribe(observer);

        try {
            while (!this.isCompleted && !this.error) {
                if (queue.length > 0) {
                    yield queue.shift()!;
                } else {
                    const promise = new Promise<IteratorResult<T>>((res, rej) => {
                        resolve = res;
                        reject = rej;
                    });

                    const result = await promise;
                    if (result.done) break;
                    yield result.value;
                }
            }

            if (this.error) {
                throw this.error;
            }
        } finally {
            subscription.unsubscribe();
        }
    }

    /** Transform stream */
    map<U>(mapper: (value: T) => U): AgObservable<U> {
        return new AgObservable<U>((observer) => {
            return this.subscribe({
                next: (value) => observer.next(mapper(value)),
                error: (err) => observer.error(err),
                complete: () => observer.complete(),
            });
        });
    }

    /** Filter stream */
    filter(predicate: (value: T) => boolean): AgObservable<T> {
        return new AgObservable<T>((observer) => {
            return this.subscribe({
                next: (value) => {
                    if (predicate(value)) {
                        observer.next(value);
                    }
                },
                error: (err) => observer.error(err),
                complete: () => observer.complete(),
            });
        });
    }

    /** Merge with another observable */
    merge(other: AgObservable<T>): AgObservable<T> {
        return new AgObservable<T>((observer) => {
            let completedCount = 0;
            const totalObservables = 2;

            const handleComplete = () => {
                completedCount++;
                if (completedCount === totalObservables) {
                    observer.complete();
                }
            };

            const sub1 = this.subscribe({
                next: (value) => observer.next(value),
                error: (err) => observer.error(err),
                complete: handleComplete,
            });

            const sub2 = other.subscribe({
                next: (value) => observer.next(value),
                error: (err) => observer.error(err),
                complete: handleComplete,
            });

            return {
                unsubscribe: () => {
                    sub1.unsubscribe();
                    sub2.unsubscribe();
                },
            };
        });
    }
}

interface ObserverFunction<T> {
    next: (value: T) => void;
    error: (error: Error) => void;
    complete: () => void;
}

interface ObservableExecutor<T> {
    (observer: ObserverFunction<T>): Subscription | void;
}

interface Subscription {
    unsubscribe(): void;
}
```

### Ring Buffer Implementation

```typescript
/**
 * High-performance ring buffer for stream data
 * Optimized for frequent writes and memory efficiency
 */
class RingBuffer<T> {
    private buffer: (T | undefined)[];
    private head = 0;
    private tail = 0;
    private count = 0;
    private readonly capacity: number;

    constructor(
        capacity: number,
        private overflowStrategy: 'drop-oldest' | 'drop-newest' | 'drop-all' | 'error' = 'drop-oldest'
    ) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
    }

    /** Add item to buffer */
    push(item: T): boolean {
        if (this.count === this.capacity) {
            return this.handleOverflow(item);
        }

        this.buffer[this.tail] = item;
        this.tail = (this.tail + 1) % this.capacity;
        this.count++;
        return true;
    }

    /** Remove and return oldest item */
    pop(): T | undefined {
        if (this.count === 0) {
            return undefined;
        }

        const item = this.buffer[this.head];
        this.buffer[this.head] = undefined; // Help GC
        this.head = (this.head + 1) % this.capacity;
        this.count--;
        return item;
    }

    /** Peek at oldest item without removing */
    peek(): T | undefined {
        return this.count > 0 ? this.buffer[this.head] : undefined;
    }

    /** Get current buffer size */
    size(): number {
        return this.count;
    }

    /** Check if buffer is full */
    isFull(): boolean {
        return this.count === this.capacity;
    }

    /** Check if buffer is empty */
    isEmpty(): boolean {
        return this.count === 0;
    }

    /** Get buffer utilization percentage */
    utilization(): number {
        return this.count / this.capacity;
    }

    /** Clear all items */
    clear(): void {
        while (!this.isEmpty()) {
            this.pop();
        }
    }

    /** Drain all items */
    drain(): T[] {
        const items: T[] = [];
        while (!this.isEmpty()) {
            const item = this.pop();
            if (item !== undefined) {
                items.push(item);
            }
        }
        return items;
    }

    private handleOverflow(item: T): boolean {
        switch (this.overflowStrategy) {
            case 'drop-oldest':
                this.pop(); // Remove oldest
                return this.push(item); // Retry

            case 'drop-newest':
                return false; // Don't add new item

            case 'drop-all':
                this.clear();
                return this.push(item);

            case 'error':
                throw new Error('Buffer overflow: maximum capacity exceeded');

            default:
                return false;
        }
    }
}
```

### Backpressure Management

```typescript
/**
 * Backpressure controller for managing stream flow
 */
class BackpressureController {
    private isPaused = false;
    private pausedPromise?: Promise<void>;
    private resumeResolver?: () => void;

    constructor(
        private highWaterMark: number,
        private lowWaterMark: number,
        private getCurrentBufferSize: () => number
    ) {}

    /** Check if backpressure should be applied */
    shouldApplyBackpressure(): boolean {
        const currentSize = this.getCurrentBufferSize();

        if (currentSize >= this.highWaterMark && !this.isPaused) {
            this.pause();
            return true;
        }

        if (currentSize <= this.lowWaterMark && this.isPaused) {
            this.resume();
            return false;
        }

        return this.isPaused;
    }

    /** Wait until backpressure is relieved */
    async waitForResume(): Promise<void> {
        if (!this.isPaused) {
            return;
        }

        if (!this.pausedPromise) {
            this.pausedPromise = new Promise((resolve) => {
                this.resumeResolver = resolve;
            });
        }

        return this.pausedPromise;
    }

    private pause(): void {
        if (this.isPaused) return;

        this.isPaused = true;
        this.pausedPromise = new Promise((resolve) => {
            this.resumeResolver = resolve;
        });
    }

    private resume(): void {
        if (!this.isPaused) return;

        this.isPaused = false;
        if (this.resumeResolver) {
            this.resumeResolver();
            this.resumeResolver = undefined;
            this.pausedPromise = undefined;
        }
    }

    /** Force resume (for manual control) */
    forceResume(): void {
        this.resume();
    }

    /** Get current backpressure state */
    getState(): {
        isPaused: boolean;
        bufferSize: number;
        utilizationPercent: number;
    } {
        const bufferSize = this.getCurrentBufferSize();
        return {
            isPaused: this.isPaused,
            bufferSize,
            utilizationPercent: (bufferSize / this.highWaterMark) * 100,
        };
    }
}
```

## Stream-Based Data Sources

### WebSocket Integration

```typescript
/**
 * WebSocket-based data stream
 */
class AgWebSocketStream<TDatum> extends AgObservable<TDatum> implements AgDataStream<TDatum> {
    public readonly id: string;
    public state: 'idle' | 'flowing' | 'paused' | 'error' | 'closed' = 'idle';

    private ws?: WebSocket;
    private buffer = new RingBuffer<TDatum>(1000);
    private backpressure: BackpressureController;
    private reconnectAttempts = 0;

    public readonly metadata = {
        createdAt: Date.now(),
        totalMessages: 0,
        lastMessageAt: undefined as number | undefined,
        bufferSize: 0,
        droppedMessages: 0,
    };

    constructor(
        private url: string,
        private options: AgStreamOptions<TDatum> = {}
    ) {
        super((observer) => {
            this.setupWebSocket(observer);
            return { unsubscribe: () => this.cleanup() };
        });

        this.id = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.backpressure = new BackpressureController(
            this.options.backpressure?.highWaterMark || 1000,
            this.options.backpressure?.lowWaterMark || 500,
            () => this.buffer.size()
        );
    }

    async start(): Promise<void> {
        this.state = 'flowing';
        // WebSocket will be created by observable executor
    }

    pause(): void {
        this.state = 'paused';
    }

    resume(): void {
        this.state = 'flowing';
        this.backpressure.forceResume();
    }

    async stop(): Promise<void> {
        this.state = 'closed';
        this.cleanup();
    }

    transform<U>(transformer: StreamTransformer<TDatum, U>): AgDataStream<U> {
        return new AgTransformedStream(this, transformer);
    }

    filter(predicate: (data: TDatum) => boolean): AgDataStream<TDatum> {
        return new AgFilteredStream(this, predicate);
    }

    merge(other: AgDataStream<TDatum>): AgDataStream<TDatum> {
        return new AgMergedStream([this, other]);
    }

    onError(handler: (error: Error) => void): AgDataStream<TDatum> {
        return this; // Error handling integrated into observable
    }

    onClose(handler: () => void): AgDataStream<TDatum> {
        return this; // Close handling integrated into observable
    }

    private setupWebSocket(observer: ObserverFunction<TDatum>): void {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log(`WebSocket connected: ${this.url}`);
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = async (event) => {
            if (this.state === 'paused') {
                await this.backpressure.waitForResume();
            }

            try {
                const data = JSON.parse(event.data) as TDatum;

                // Apply backpressure based on data processing capacity
                if (this.backpressure.shouldApplyBackpressure()) {
                    if (!this.buffer.push(data)) {
                        this.metadata.droppedMessages++;
                    }
                } else {
                    // Process buffered data in optimized batches
                    const bufferedData = this.buffer.drain();
                    if (bufferedData.length > 0) {
                        this.processBatch(bufferedData, observer);
                    }

                    // Process current data
                    observer.next(data);
                }

                this.metadata.totalMessages++;
                this.metadata.lastMessageAt = Date.now();
                this.metadata.bufferSize = this.buffer.size();
            } catch (error) {
                observer.error(new Error(`Failed to parse WebSocket message: ${error}`));
            }
        };

        this.ws.onerror = (error) => {
            observer.error(new Error(`WebSocket error: ${error}`));
            this.state = 'error';
        };

        this.ws.onclose = () => {
            this.state = 'closed';
            this.attemptReconnect(observer);
        };
    }

    private async attemptReconnect(observer: ObserverFunction<TDatum>): Promise<void> {
        const maxRetries = this.options.errorHandling?.maxRetries || 3;
        const retryDelay = this.options.errorHandling?.retryDelay || 1000;

        if (this.reconnectAttempts < maxRetries) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${maxRetries})...`);

            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            this.setupWebSocket(observer);
        } else {
            observer.error(new Error('Maximum reconnection attempts exceeded'));
        }
    }

    private cleanup(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
        this.buffer.clear();
    }
}
```

### Server-Sent Events Integration

```typescript
/**
 * Server-Sent Events (SSE) data stream
 */
class AgSSEStream<TDatum> extends AgObservable<TDatum> implements AgDataStream<TDatum> {
    public readonly id: string;
    public state: 'idle' | 'flowing' | 'paused' | 'error' | 'closed' = 'idle';

    private eventSource?: EventSource;
    private buffer = new RingBuffer<TDatum>(1000);
    private backpressure: BackpressureController;

    public readonly metadata = {
        createdAt: Date.now(),
        totalMessages: 0,
        lastMessageAt: undefined as number | undefined,
        bufferSize: 0,
        droppedMessages: 0,
    };

    constructor(
        private url: string,
        private eventType: string = 'data',
        private options: AgStreamOptions<TDatum> = {}
    ) {
        super((observer) => {
            this.setupEventSource(observer);
            return { unsubscribe: () => this.cleanup() };
        });

        this.id = `sse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.backpressure = new BackpressureController(
            this.options.backpressure?.highWaterMark || 1000,
            this.options.backpressure?.lowWaterMark || 500,
            () => this.buffer.size()
        );
    }

    async start(): Promise<void> {
        this.state = 'flowing';
    }

    pause(): void {
        this.state = 'paused';
    }

    resume(): void {
        this.state = 'flowing';
        this.backpressure.forceResume();
    }

    async stop(): Promise<void> {
        this.state = 'closed';
        this.cleanup();
    }

    transform<U>(transformer: StreamTransformer<TDatum, U>): AgDataStream<U> {
        return new AgTransformedStream(this, transformer);
    }

    filter(predicate: (data: TDatum) => boolean): AgDataStream<TDatum> {
        return new AgFilteredStream(this, predicate);
    }

    merge(other: AgDataStream<TDatum>): AgDataStream<TDatum> {
        return new AgMergedStream([this, other]);
    }

    onError(handler: (error: Error) => void): AgDataStream<TDatum> {
        return this;
    }

    onClose(handler: () => void): AgDataStream<TDatum> {
        return this;
    }

    private setupEventSource(observer: ObserverFunction<TDatum>): void {
        this.eventSource = new EventSource(this.url);

        this.eventSource.addEventListener(this.eventType, async (event) => {
            if (this.state === 'paused') {
                await this.backpressure.waitForResume();
            }

            try {
                const data = JSON.parse(event.data) as TDatum;

                if (this.backpressure.shouldApplyBackpressure()) {
                    if (!this.buffer.push(data)) {
                        this.metadata.droppedMessages++;
                    }
                } else {
                    const bufferedData = this.buffer.drain();
                    bufferedData.forEach((item) => observer.next(item));
                    observer.next(data);
                }

                this.metadata.totalMessages++;
                this.metadata.lastMessageAt = Date.now();
                this.metadata.bufferSize = this.buffer.size();
            } catch (error) {
                observer.error(new Error(`Failed to parse SSE data: ${error}`));
            }
        });

        this.eventSource.onerror = (error) => {
            observer.error(new Error(`SSE error: ${error}`));
            this.state = 'error';
        };
    }

    private cleanup(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = undefined;
        }
        this.buffer.clear();
    }
}
```

### Fetch Streaming Integration

```typescript
/**
 * Fetch API streaming support for continuous data
 */
class AgFetchStream<TDatum> extends AgObservable<TDatum> implements AgDataStream<TDatum> {
    public readonly id: string;
    public state: 'idle' | 'flowing' | 'paused' | 'error' | 'closed' = 'idle';

    private abortController?: AbortController;
    private buffer = new RingBuffer<TDatum>(1000);
    private backpressure: BackpressureController;

    public readonly metadata = {
        createdAt: Date.now(),
        totalMessages: 0,
        lastMessageAt: undefined as number | undefined,
        bufferSize: 0,
        droppedMessages: 0,
    };

    constructor(
        private url: string,
        private options: AgStreamOptions<TDatum> = {}
    ) {
        super((observer) => {
            this.setupFetchStream(observer);
            return { unsubscribe: () => this.cleanup() };
        });

        this.id = `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.backpressure = new BackpressureController(
            this.options.backpressure?.highWaterMark || 1000,
            this.options.backpressure?.lowWaterMark || 500,
            () => this.buffer.size()
        );
    }

    async start(): Promise<void> {
        this.state = 'flowing';
    }

    pause(): void {
        this.state = 'paused';
    }

    resume(): void {
        this.state = 'flowing';
        this.backpressure.forceResume();
    }

    async stop(): Promise<void> {
        this.state = 'closed';
        this.cleanup();
    }

    transform<U>(transformer: StreamTransformer<TDatum, U>): AgDataStream<U> {
        return new AgTransformedStream(this, transformer);
    }

    filter(predicate: (data: TDatum) => boolean): AgDataStream<TDatum> {
        return new AgFilteredStream(this, predicate);
    }

    merge(other: AgDataStream<TDatum>): AgDataStream<TDatum> {
        return new AgMergedStream([this, other]);
    }

    onError(handler: (error: Error) => void): AgDataStream<TDatum> {
        return this;
    }

    onClose(handler: () => void): AgDataStream<TDatum> {
        return this;
    }

    private async setupFetchStream(observer: ObserverFunction<TDatum>): Promise<void> {
        this.abortController = new AbortController();

        try {
            const response = await fetch(this.url, {
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No readable stream available');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    observer.complete();
                    break;
                }

                if (this.state === 'paused') {
                    await this.backpressure.waitForResume();
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line) as TDatum;

                            if (this.backpressure.shouldApplyBackpressure()) {
                                if (!this.buffer.push(data)) {
                                    this.metadata.droppedMessages++;
                                }
                            } else {
                                const bufferedData = this.buffer.drain();
                                bufferedData.forEach((item) => observer.next(item));
                                observer.next(data);
                            }

                            this.metadata.totalMessages++;
                            this.metadata.lastMessageAt = Date.now();
                            this.metadata.bufferSize = this.buffer.size();
                        } catch (error) {
                            console.warn(`Failed to parse line: ${line}`, error);
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                observer.error(error);
            }
        }
    }

    private cleanup(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = undefined;
        }
        this.buffer.clear();
    }
}
```

## Error Handling and Recovery

### Circuit Breaker Pattern

```typescript
/**
 * Circuit breaker for stream error handling
 */
class StreamCircuitBreaker {
    private state: 'closed' | 'open' | 'half-open' = 'closed';
    private failures = 0;
    private lastFailureTime = 0;
    private nextAttemptTime = 0;

    constructor(
        private threshold: number = 5,
        private timeout: number = 60000, // 1 minute
        private resetTimeout: number = 30000 // 30 seconds
    ) {}

    /** Execute function with circuit breaker protection */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() < this.nextAttemptTime) {
                throw new Error('Circuit breaker is OPEN');
            } else {
                this.state = 'half-open';
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    /** Check if circuit breaker allows execution */
    canExecute(): boolean {
        return this.state === 'closed' || (this.state === 'half-open' && Date.now() >= this.nextAttemptTime);
    }

    /** Get current state */
    getState(): {
        state: string;
        failures: number;
        nextAttemptTime: number;
    } {
        return {
            state: this.state,
            failures: this.failures,
            nextAttemptTime: this.nextAttemptTime,
        };
    }

    private onSuccess(): void {
        this.failures = 0;
        this.state = 'closed';
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.threshold) {
            this.state = 'open';
            this.nextAttemptTime = Date.now() + this.timeout;
        }
    }

    /** Reset circuit breaker manually */
    reset(): void {
        this.failures = 0;
        this.state = 'closed';
        this.nextAttemptTime = 0;
    }
}
```

### Error Recovery Strategies

```typescript
/**
 * Error recovery manager for streams
 */
class StreamErrorRecovery<TDatum> {
    private retryAttempts = 0;
    private circuitBreaker: StreamCircuitBreaker;

    constructor(
        private maxRetries: number = 3,
        private retryDelay: number = 1000,
        private exponentialBackoff: boolean = true
    ) {
        this.circuitBreaker = new StreamCircuitBreaker();
    }

    /** Attempt recovery with retry logic */
    async attemptRecovery(
        createStream: () => Promise<AgDataStream<TDatum>>,
        onRecovered: (stream: AgDataStream<TDatum>) => void,
        onFinalFailure: (error: Error) => void
    ): Promise<void> {
        try {
            const stream = await this.circuitBreaker.execute(createStream);
            this.retryAttempts = 0;
            onRecovered(stream);
        } catch (error) {
            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                const delay = this.calculateDelay();

                console.log(`Stream recovery attempt ${this.retryAttempts}/${this.maxRetries} in ${delay}ms`);

                setTimeout(() => {
                    this.attemptRecovery(createStream, onRecovered, onFinalFailure);
                }, delay);
            } else {
                onFinalFailure(error);
            }
        }
    }

    private calculateDelay(): number {
        if (!this.exponentialBackoff) {
            return this.retryDelay;
        }

        return this.retryDelay * Math.pow(2, this.retryAttempts - 1);
    }

    /** Reset retry counter */
    reset(): void {
        this.retryAttempts = 0;
        this.circuitBreaker.reset();
    }
}
```

## Performance Monitoring

### Stream Performance Metrics

```typescript
/**
 * Performance monitoring for streams
 */
class StreamPerformanceMonitor {
    private metrics = new Map<string, StreamMetrics>();
    private samplingRate = 0.1; // 10% sampling

    /** Record a stream event */
    recordEvent(streamId: string, event: StreamEvent): void {
        if (Math.random() > this.samplingRate) {
            return; // Skip this sample
        }

        let metrics = this.metrics.get(streamId);
        if (!metrics) {
            metrics = {
                streamId,
                totalEvents: 0,
                totalBytes: 0,
                averageLatency: 0,
                maxLatency: 0,
                minLatency: Infinity,
                errorsCount: 0,
                lastEventTime: 0,
                throughput: 0,
                bufferUtilization: [],
            };
            this.metrics.set(streamId, metrics);
        }

        this.updateMetrics(metrics, event);
    }

    /** Get metrics for a specific stream */
    getStreamMetrics(streamId: string): StreamMetrics | undefined {
        return this.metrics.get(streamId);
    }

    /** Get aggregated metrics for all streams */
    getAggregatedMetrics(): AggregatedMetrics {
        const allMetrics = Array.from(this.metrics.values());

        return {
            totalStreams: allMetrics.length,
            totalEvents: allMetrics.reduce((sum, m) => sum + m.totalEvents, 0),
            totalBytes: allMetrics.reduce((sum, m) => sum + m.totalBytes, 0),
            averageLatency: allMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / allMetrics.length,
            totalErrors: allMetrics.reduce((sum, m) => sum + m.errorsCount, 0),
            combinedThroughput: allMetrics.reduce((sum, m) => sum + m.throughput, 0),
        };
    }

    /** Generate performance report */
    generateReport(): PerformanceReport {
        const aggregated = this.getAggregatedMetrics();
        const topStreams = this.getTopPerformingStreams(5);
        const bottlenecks = this.identifyBottlenecks();

        return {
            timestamp: Date.now(),
            aggregated,
            topStreams,
            bottlenecks,
            recommendations: this.generateRecommendations(aggregated, bottlenecks),
        };
    }

    private updateMetrics(metrics: StreamMetrics, event: StreamEvent): void {
        metrics.totalEvents++;
        metrics.totalBytes += event.dataSize || 0;
        metrics.lastEventTime = event.timestamp;

        if (event.type === 'error') {
            metrics.errorsCount++;
        }

        if (event.latency !== undefined) {
            // Update latency stats
            const total = metrics.averageLatency * (metrics.totalEvents - 1) + event.latency;
            metrics.averageLatency = total / metrics.totalEvents;
            metrics.maxLatency = Math.max(metrics.maxLatency, event.latency);
            metrics.minLatency = Math.min(metrics.minLatency, event.latency);
        }

        if (event.bufferUtilization !== undefined) {
            metrics.bufferUtilization.push(event.bufferUtilization);
            // Keep only last 100 samples
            if (metrics.bufferUtilization.length > 100) {
                metrics.bufferUtilization.shift();
            }
        }

        // Calculate throughput (events per second)
        const timeWindow = 1000; // 1 second
        const recentEvents = metrics.totalEvents; // Simplified
        metrics.throughput = recentEvents / (timeWindow / 1000);
    }

    private getTopPerformingStreams(count: number): StreamMetrics[] {
        return Array.from(this.metrics.values())
            .sort((a, b) => b.throughput - a.throughput)
            .slice(0, count);
    }

    private identifyBottlenecks(): Bottleneck[] {
        const bottlenecks: Bottleneck[] = [];

        for (const metrics of this.metrics.values()) {
            if (metrics.averageLatency > 100) {
                bottlenecks.push({
                    type: 'high-latency',
                    streamId: metrics.streamId,
                    severity: metrics.averageLatency > 200 ? 'high' : 'medium',
                    value: metrics.averageLatency,
                });
            }

            const avgBufferUtil =
                metrics.bufferUtilization.reduce((a, b) => a + b, 0) / metrics.bufferUtilization.length;
            if (avgBufferUtil > 0.8) {
                bottlenecks.push({
                    type: 'high-buffer-utilization',
                    streamId: metrics.streamId,
                    severity: avgBufferUtil > 0.9 ? 'high' : 'medium',
                    value: avgBufferUtil,
                });
            }

            if (metrics.errorsCount / metrics.totalEvents > 0.05) {
                bottlenecks.push({
                    type: 'high-error-rate',
                    streamId: metrics.streamId,
                    severity: 'high',
                    value: metrics.errorsCount / metrics.totalEvents,
                });
            }
        }

        return bottlenecks;
    }

    private generateRecommendations(aggregated: AggregatedMetrics, bottlenecks: Bottleneck[]): string[] {
        const recommendations: string[] = [];

        if (aggregated.averageLatency > 50) {
            recommendations.push(
                'Consider optimizing data processing pipeline - this is the primary bottleneck (68% of execution time)'
            );
        }

        if (bottlenecks.some((b) => b.type === 'high-buffer-utilization')) {
            recommendations.push(
                'High buffer utilization detected - consider implementing backpressure or increasing capacity'
            );
        }

        if (bottlenecks.some((b) => b.type === 'high-error-rate')) {
            recommendations.push('High error rates detected - review error handling and connection stability');
        }

        if (aggregated.combinedThroughput < 50) {
            recommendations.push(
                'Low throughput detected - focus on data processing optimization rather than rendering (rendering only takes 3-4ms)'
            );
        }

        return recommendations;
    }
}

interface StreamEvent {
    timestamp: number;
    type: 'data' | 'error' | 'buffer-full' | 'backpressure';
    dataSize?: number;
    latency?: number;
    bufferUtilization?: number;
}

interface StreamMetrics {
    streamId: string;
    totalEvents: number;
    totalBytes: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    errorsCount: number;
    lastEventTime: number;
    throughput: number;
    bufferUtilization: number[];
}

interface AggregatedMetrics {
    totalStreams: number;
    totalEvents: number;
    totalBytes: number;
    averageLatency: number;
    totalErrors: number;
    combinedThroughput: number;
}

interface Bottleneck {
    type: 'high-latency' | 'high-buffer-utilization' | 'high-error-rate';
    streamId: string;
    severity: 'low' | 'medium' | 'high';
    value: number;
}

interface PerformanceReport {
    timestamp: number;
    aggregated: AggregatedMetrics;
    topStreams: StreamMetrics[];
    bottlenecks: Bottleneck[];
    recommendations: string[];
}
```

## Usage Examples

### Basic WebSocket Stream

```typescript
// Create a real-time stock price chart with WebSocket stream
const chart = AgCharts.create<StockTick>({
    container: document.getElementById('chart'),
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
        },
    ],
});

// Create WebSocket stream with optimized data processing settings
const priceStream = new AgWebSocketStream<StockTick>('wss://api.example.com/stocks/AAPL', {
    buffer: {
        maxSize: 10000, // Larger buffer for data processing optimization
        overflowStrategy: 'drop-oldest',
    },
    backpressure: {
        enabled: true,
        highWaterMark: 1000, // Higher watermarks for data processing
        lowWaterMark: 500,
        batchSize: 100, // Process in batches for efficiency
    },
});

// Connect stream to chart
const connection = await chart.connectStream(priceStream, 'price-series');

// Start streaming
await priceStream.start();

// Monitor connection
console.log('Stream stats:', connection.stats);
```

### Multi-Stream Coordination

```typescript
// Financial dashboard with multiple coordinated streams
const tradingChart = AgCharts.create({
    container: document.getElementById('trading-chart'),
    series: [
        { type: 'candlestick', xKey: 'timestamp', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        { type: 'column', xKey: 'timestamp', yKey: 'volume' },
    ],
});

// Create multiple data streams
const ohlcStream = new AgWebSocketStream<OHLCData>('wss://api.example.com/ohlc/AAPL');
const volumeStream = new AgWebSocketStream<VolumeData>('wss://api.example.com/volume/AAPL');
const indicatorStream = new AgWebSocketStream<IndicatorData>('wss://api.example.com/indicators/AAPL');

// Create multi-stream controller
const multiStream = await tradingChart.createMultiStream(
    {
        'ohlc-series': ohlcStream,
        'volume-series': volumeStream,
        'rsi-series': indicatorStream,
    },
    {
        synchronization: {
            mode: 'timestamp',
            timestampTolerance: 100, // 100ms tolerance
            maxWaitTime: 1000,
        },
    }
);

// Start all streams
await Promise.all([ohlcStream.start(), volumeStream.start(), indicatorStream.start()]);

// Monitor global performance
setInterval(() => {
    const stats = multiStream.getGlobalStats();
    console.log(`Processing ${stats.totalMessages} msgs/sec across ${stats.activeStreams} streams`);
}, 5000);
```

### Stream Transformation Pipeline

```typescript
// Create a data processing pipeline with transformations
const rawDataStream = new AgWebSocketStream<RawMarketData>('wss://api.example.com/raw-feed');

// Apply transformations
const processedStream = rawDataStream
    .filter((data) => data.symbol === 'AAPL') // Filter specific symbol
    .transform((data) => ({
        timestamp: data.timestamp,
        price: data.price,
        volume: data.volume,
        sma20: calculateSMA(data.price, 20), // Add moving average
    }))
    .filter((data) => data.sma20 > 0); // Remove invalid calculations

// Connect to chart
await chart.connectStream(processedStream, 'processed-series');
await processedStream.start();
```

### Error Handling and Recovery

```typescript
// Robust stream with comprehensive error handling
const resilientStream = new AgWebSocketStream<MarketData>('wss://api.example.com/feed', {
    errorHandling: {
        maxRetries: 5,
        retryDelay: 2000,
        circuitBreakerThreshold: 3,
    },
    monitoring: {
        enabled: true,
        samplingRate: 0.2,
    },
});

// Set up error handlers
resilientStream.onError((error) => {
    console.error('Stream error:', error);
    // Could send to error tracking service
});

// Monitor performance
const monitor = new StreamPerformanceMonitor();
monitor.recordEvent(resilientStream.id, {
    timestamp: Date.now(),
    type: 'data',
    dataSize: 1024,
    latency: 15,
});

// Generate performance reports
setInterval(() => {
    const report = monitor.generateReport();
    console.log('Performance Report:', report);
}, 30000);
```

### Server-Sent Events Integration

```typescript
// Use SSE for one-way data streaming
const sseStream = new AgSSEStream<PriceUpdate>('https://api.example.com/stream/prices', 'price-update');

// Connect to chart
await chart.connectStream(sseStream, 'price-series');

// Configure automatic data window management
chart.update({
    dataWindow: {
        maxDataPoints: 10000,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        agingStrategy: 'time-based',
    },
});

await sseStream.start();
```

### Fetch Streaming for Continuous Data

```typescript
// Use fetch streaming for NDJSON data
const fetchStream = new AgFetchStream<SensorData>('https://api.example.com/sensor-data/stream');

// Process IoT sensor data
const sensorChart = AgCharts.create<SensorData>({
    container: document.getElementById('sensor-chart'),
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'temperature',
        },
    ],
});

await sensorChart.connectStream(fetchStream, 'temperature-series');
await fetchStream.start();
```

## Browser Compatibility and Polyfills

### Feature Detection

```typescript
/**
 * Check browser support for streaming features
 */
class StreamingSupport {
    static checkReadableStream(): boolean {
        return typeof ReadableStream !== 'undefined' && typeof ReadableStream.prototype.getReader === 'function';
    }

    static checkAsyncIterators(): boolean {
        try {
            // Test async iterator support
            return typeof Symbol.asyncIterator !== 'undefined';
        } catch {
            return false;
        }
    }

    static checkWebSocket(): boolean {
        return typeof WebSocket !== 'undefined';
    }

    static checkEventSource(): boolean {
        return typeof EventSource !== 'undefined';
    }

    static checkFetchStreaming(): boolean {
        return typeof fetch !== 'undefined' && this.checkReadableStream();
    }

    static getCompatibilityReport(): CompatibilityReport {
        return {
            readableStream: this.checkReadableStream(),
            asyncIterators: this.checkAsyncIterators(),
            webSocket: this.checkWebSocket(),
            eventSource: this.checkEventSource(),
            fetchStreaming: this.checkFetchStreaming(),
            overallSupport: this.checkReadableStream() && this.checkAsyncIterators(),
        };
    }
}

interface CompatibilityReport {
    readableStream: boolean;
    asyncIterators: boolean;
    webSocket: boolean;
    eventSource: boolean;
    fetchStreaming: boolean;
    overallSupport: boolean;
}
```

### Graceful Degradation

```typescript
/**
 * Factory for creating streams with graceful degradation
 */
class AgStreamFactory {
    static createDataStream<TDatum>(
        type: 'websocket' | 'sse' | 'fetch' | 'fallback',
        url: string,
        options?: AgStreamOptions<TDatum>
    ): AgDataStream<TDatum> {
        const support = StreamingSupport.getCompatibilityReport();

        if (!support.overallSupport) {
            console.warn('Streaming not fully supported, using fallback polling');
            return new AgPollingStream<TDatum>(url, options);
        }

        switch (type) {
            case 'websocket':
                if (support.webSocket) {
                    return new AgWebSocketStream<TDatum>(url, options);
                }
                console.warn('WebSocket not supported, falling back to SSE');
            // fallthrough

            case 'sse':
                if (support.eventSource) {
                    return new AgSSEStream<TDatum>(url, 'data', options);
                }
                console.warn('SSE not supported, falling back to fetch streaming');
            // fallthrough

            case 'fetch':
                if (support.fetchStreaming) {
                    return new AgFetchStream<TDatum>(url, options);
                }
                console.warn('Fetch streaming not supported, using polling fallback');
            // fallthrough

            case 'fallback':
            default:
                return new AgPollingStream<TDatum>(url, options);
        }
    }
}

/**
 * Polling fallback for browsers without streaming support
 */
class AgPollingStream<TDatum> extends AgObservable<TDatum> implements AgDataStream<TDatum> {
    public readonly id: string;
    public state: 'idle' | 'flowing' | 'paused' | 'error' | 'closed' = 'idle';

    private pollInterval?: number;
    private lastPollTime = 0;
    private pollFrequency = 1000; // 1 second default

    public readonly metadata = {
        createdAt: Date.now(),
        totalMessages: 0,
        lastMessageAt: undefined as number | undefined,
        bufferSize: 0,
        droppedMessages: 0,
    };

    constructor(
        private url: string,
        private options: AgStreamOptions<TDatum> = {}
    ) {
        super((observer) => {
            this.startPolling(observer);
            return { unsubscribe: () => this.stopPolling() };
        });

        this.id = `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async start(): Promise<void> {
        this.state = 'flowing';
    }

    pause(): void {
        this.state = 'paused';
    }

    resume(): void {
        this.state = 'flowing';
    }

    async stop(): Promise<void> {
        this.state = 'closed';
        this.stopPolling();
    }

    transform<U>(transformer: StreamTransformer<TDatum, U>): AgDataStream<U> {
        return new AgTransformedStream(this, transformer);
    }

    filter(predicate: (data: TDatum) => boolean): AgDataStream<TDatum> {
        return new AgFilteredStream(this, predicate);
    }

    merge(other: AgDataStream<TDatum>): AgDataStream<TDatum> {
        return new AgMergedStream([this, other]);
    }

    onError(handler: (error: Error) => void): AgDataStream<TDatum> {
        return this;
    }

    onClose(handler: () => void): AgDataStream<TDatum> {
        return this;
    }

    private startPolling(observer: ObserverFunction<TDatum>): void {
        this.pollInterval = window.setInterval(async () => {
            if (this.state !== 'flowing') {
                return;
            }

            try {
                const response = await fetch(`${this.url}?since=${this.lastPollTime}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = (await response.json()) as TDatum[];
                data.forEach((item) => observer.next(item));

                this.lastPollTime = Date.now();
                this.metadata.totalMessages += data.length;
                this.metadata.lastMessageAt = this.lastPollTime;
            } catch (error) {
                observer.error(error);
            }
        }, this.pollFrequency);
    }

    private stopPolling(): void {
        if (this.pollInterval) {
            window.clearInterval(this.pollInterval);
            this.pollInterval = undefined;
        }
    }
}
```

## Implementation Phases

### Phase 1: Core Streaming Infrastructure (6-8 weeks)

#### Week 1-2: Foundation

-   [ ] Core `AgDataStream` interface implementation
-   [ ] `AgObservable` class with AsyncIterator support
-   [ ] `RingBuffer` and `BackpressureController` classes
-   [ ] Basic unit tests and performance benchmarks

#### Week 3-4: Stream Sources

-   [ ] `AgWebSocketStream` implementation
-   [ ] `AgSSEStream` implementation
-   [ ] `AgFetchStream` implementation
-   [ ] Error handling and recovery mechanisms

#### Week 5-6: Chart Integration

-   [ ] `createDataStream()` method in chart instance
-   [ ] `connectStream()` method with connection management
-   [ ] Basic single-stream functionality
-   [ ] Integration tests with canvas rendering

#### Week 7-8: Performance Optimization

-   [ ] Buffer management optimization
-   [ ] Memory pool implementation
-   [ ] Performance monitoring infrastructure
-   [ ] Benchmark tests for 100+ updates/second

### Phase 2: Advanced Stream Features (4-6 weeks)

#### Week 9-10: Stream Composition

-   [ ] Stream transformation (`transform()`, `filter()`)
-   [ ] Stream merging capabilities
-   [ ] Error handling composition
-   [ ] Functional programming patterns

#### Week 11-12: Multi-Stream Coordination

-   [ ] `AgMultiStreamController` implementation
-   [ ] Stream synchronization by timestamp/sequence
-   [ ] Atomic multi-stream operations
-   [ ] Cross-stream error isolation

#### Week 13-14: Advanced Error Handling

-   [ ] Circuit breaker pattern implementation
-   [ ] Exponential backoff retry logic
-   [ ] Error recovery strategies
-   [ ] Graceful degradation patterns

### Phase 3: Browser Compatibility & Production Features (3-4 weeks)

#### Week 15-16: Compatibility Layer

-   [ ] Feature detection utilities
-   [ ] Polling fallback implementation
-   [ ] Progressive enhancement patterns
-   [ ] Cross-browser testing

#### Week 17-18: Production Readiness

-   [ ] Comprehensive error logging
-   [ ] Performance telemetry
-   [ ] Memory leak prevention
-   [ ] Documentation and examples

### Phase 4: Framework Integration & Optimization (3-4 weeks)

#### Week 19-20: Framework Wrappers

-   [ ] React streaming hooks
-   [ ] Angular streaming services
-   [ ] Vue composition functions
-   [ ] Framework-specific optimizations

#### Week 21-22: Final Optimization

-   [ ] Performance tuning based on benchmarks
-   [ ] Memory optimization
-   [ ] Bundle size optimization
-   [ ] Beta testing with enterprise customers

## Performance Characteristics

### Throughput Targets

| Configuration            | Target Updates/sec     | Memory Usage       | Data Processing | Total Latency | Rendering |
| ------------------------ | ---------------------- | ------------------ | --------------- | ------------- | --------- |
| **Single Stream**        | 200+ updates/sec       | <50MB growth/hour  | <30ms           | <35ms         | <5ms      |
| **5 Concurrent Streams** | 100+ updates/sec each  | <100MB growth/hour | <50ms           | <60ms         | <10ms     |
| **Burst Mode**           | 1000+ updates/sec (5s) | <200MB peak        | <100ms          | <110ms        | <10ms     |

### Memory Management

-   **Ring Buffer**: O(1) insertion/removal with configurable overflow policies
-   **Automatic GC**: Proactive cleanup of unused stream resources
-   **Memory Monitoring**: Built-in tracking with leak detection
-   **Data Windowing**: Automatic aging with configurable retention
-   **Processing Buffer**: Optimized buffering for data transformation pipeline

### Data Processing Optimization

-   **Batch Processing**: Process data in optimized batches to reduce per-point overhead
-   **Incremental Transformation**: Stream-based data transformation reduces processing latency
-   **Memory-Efficient Operations**: Minimize data copying and object allocation
-   **Processing Pipeline**: Efficient data flow from stream to chart state

Note: Rendering optimization is less critical as canvas rendering only takes 3-4ms vs 393ms for data processing.

## Comparison with Transaction-Based Approach (Option 1)

| Aspect                    | Stream-Based API (Option 2)   | Transaction-Based API (Option 1) |
| ------------------------- | ----------------------------- | -------------------------------- |
| **Mental Model**          | Continuous data flow          | Discrete operations              |
| **API Complexity**        | Higher learning curve         | Familiar CRUD operations         |
| **Real-time Fit**         | Natural for live data         | Requires manual coordination     |
| **Backpressure**          | Built-in automatic handling   | Manual buffer management         |
| **Error Recovery**        | Stream-level circuit breakers | Transaction-level retries        |
| **Multi-stream**          | Automatic synchronization     | Manual coordination required     |
| **Memory Usage**          | Automatic windowing           | Manual data aging                |
| **Framework Integration** | Custom hooks/services needed  | Direct method calls              |
| **Learning Curve**        | Steeper (reactive patterns)   | Gentle (imperative style)        |
| **Composability**         | High (stream operations)      | Medium (transaction batching)    |
| **Browser Support**       | Requires polyfills            | Universal compatibility          |

### When to Choose Stream-Based API

**Ideal for:**

-   Real-time financial data (trading platforms, market feeds)
-   IoT sensor streams with continuous data
-   Live monitoring dashboards
-   WebSocket/SSE-based applications
-   Teams familiar with reactive programming

**Less suitable for:**

-   Batch data processing scenarios
-   Infrequent updates (<10 updates/minute)
-   Teams preferring imperative programming styles
-   Legacy browser support requirements
-   Simple dashboard applications

## Risk Mitigation

### Technical Risks

1. **Browser Compatibility**

    - **Risk**: Limited streaming API support in older browsers
    - **Mitigation**: Comprehensive polyfill strategy with polling fallback
    - **Testing**: Automated compatibility testing across browser matrix

2. **Memory Leaks**

    - **Risk**: Continuous streams may accumulate memory
    - **Mitigation**: Automatic cleanup, memory monitoring, circuit breakers
    - **Testing**: Long-running stress tests with memory profiling

3. **Performance Degradation**
    - **Risk**: High-frequency updates overwhelm rendering pipeline
    - **Mitigation**: Backpressure handling, adaptive buffering, frame-rate limiting
    - **Testing**: Performance benchmarks under various load patterns

### Implementation Risks

1. **Complexity Overhead**

    - **Risk**: Stream abstractions add cognitive complexity
    - **Mitigation**: Comprehensive documentation, examples, gradual adoption path
    - **Testing**: Developer experience testing with various skill levels

2. **Framework Integration Challenges**
    - **Risk**: Reactive patterns may conflict with framework paradigms
    - **Mitigation**: Framework-specific adapters, best practice documentation
    - **Testing**: Integration testing with major framework versions

### Business Risks

1. **Customer Adoption**

    - **Risk**: Developers may find stream patterns unfamiliar
    - **Mitigation**: Excellent documentation, migration guides, professional services
    - **Testing**: Beta testing with key customers, feedback collection

2. **Maintenance Burden**
    - **Risk**: Streaming infrastructure requires ongoing maintenance
    - **Mitigation**: Comprehensive testing, monitoring, automated diagnostics
    - **Testing**: Long-term reliability testing, production monitoring

## Conclusion

The Stream-Based API represents a sophisticated approach to high-frequency data updates that naturally aligns with real-time application requirements. By leveraging native browser streaming APIs and implementing a zero-dependency reactive architecture, this solution provides powerful capabilities for modern data visualization needs.

### Key Advantages

1. **Natural Real-time Fit**: Streams are the natural abstraction for continuous data
2. **Built-in Flow Control**: Automatic backpressure and error recovery
3. **Composable Architecture**: Transform, filter, and merge streams easily
4. **Performance-First Design**: Optimized for high-frequency scenarios
5. **Zero Dependencies**: Maintains AG Charts' philosophy while providing advanced features

### Implementation Strategy

The phased approach ensures incremental delivery of value while managing implementation complexity. The comprehensive compatibility layer ensures broad browser support, while the performance-first architecture targets demanding real-time applications.

This design positions AG Charts as a leader in real-time data visualization, providing capabilities that match or exceed specialized streaming visualization libraries while maintaining the performance and reliability expected from AG Charts.

The stream-based approach, while more complex than transaction-based updates, provides the foundation for advanced real-time visualization scenarios that are increasingly important in modern web applications, particularly in financial services, IoT monitoring, and live analytics platforms.
