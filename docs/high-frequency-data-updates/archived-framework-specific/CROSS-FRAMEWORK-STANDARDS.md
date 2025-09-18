# Cross-Framework Standards for High-Frequency Data Updates

> **Note**: This document describes standards for the original framework-specific implementations which have been archived. For the current approach, see [SIMPLIFIED-API.md](./SIMPLIFIED-API.md) and [FRAMEWORK-INTEGRATION-EXAMPLES.md](./FRAMEWORK-INTEGRATION-EXAMPLES.md).

## Purpose

This document defines unified standards for implementing high-frequency data updates across React, Angular, and Vue frameworks in AG Charts. These standards ensure consistency, maintainability, and optimal performance while respecting framework-specific idioms.

## Unified API Specification

### Core Interfaces

All frameworks must implement these interfaces, adapted to their specific patterns:

```typescript
// Common types to be shared across all frameworks
export interface HighFrequencyConfig {
    // Performance Configuration
    maxUpdatesPerSecond: number; // Default: 60
    bufferTimeMs: number; // Default: 16 (one frame)
    maxBufferSize: number; // Default: 1000

    // Memory Management
    maxDataPoints?: number; // Default: 100000
    enableCompression?: boolean; // Default: false
    cleanupThreshold?: number; // Default: 0.8 (80% of max)

    // Behavior Configuration
    dropOldUpdates?: boolean; // Default: false
    enableMetrics?: boolean; // Default: true
    autoStart?: boolean; // Default: true

    // Error Handling
    errorHandler?: (error: Error) => void;
    retryConfig?: RetryConfiguration;
}

export interface RetryConfiguration {
    maxRetries: number; // Default: 3
    retryDelayMs: number; // Default: 1000
    backoffMultiplier: number; // Default: 2
    maxRetryDelayMs: number; // Default: 30000
}

export interface PerformanceMetrics {
    updatesPerSecond: number;
    droppedUpdates: number;
    queueDepth: number;
    lastUpdateTime: number;
    averageUpdateTime: number;
    memoryUsageMB: number;
    fps: number;
    dataPoints: number;
}

export interface HighFrequencyAPI<T> {
    // Core Operations
    addData(data: T | T[]): void;
    updateConfig(config: Partial<HighFrequencyConfig>): void;

    // Stream Control
    pause(): void;
    resume(): void;
    clear(): void;
    destroy(): void;

    // State & Metrics
    readonly metrics: PerformanceMetrics;
    readonly isActive: boolean;
    readonly isPaused: boolean;

    // Event Handlers
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
    onError?: (error: Error) => void;
    onDataProcessed?: (count: number) => void;
}
```

### Framework-Specific Adaptations

#### React Implementation

```typescript
// React Hook Pattern
export function useHighFrequencyChart<T>(
    options: AgChartOptions,
    config?: HighFrequencyConfig
): HighFrequencyAPI<T> & {
    chartRef: RefObject<HTMLDivElement>;
};

// Usage
const { addData, metrics, chartRef } = useHighFrequencyChart(options, config);
```

#### Angular Implementation

```typescript
// Angular Service Pattern
@Injectable()
export class HighFrequencyChartService<T> implements HighFrequencyAPI<T> {
    constructor(private ngZone: NgZone) {}

    initialize(options: AgChartOptions, config?: HighFrequencyConfig): void;
    // ... implement HighFrequencyAPI
}

// Component Usage
constructor(private chartService: HighFrequencyChartService<DataPoint>) {}
```

#### Vue Implementation

```typescript
// Vue Composable Pattern
export function useHighFrequencyChart<T>(
    options: MaybeRef<AgChartOptions>,
    config?: MaybeRef<HighFrequencyConfig>
): HighFrequencyAPI<T> & {
    chartEl: Ref<HTMLElement | null>;
};

// Usage
const { addData, metrics, chartEl } = useHighFrequencyChart(options, config);
```

## Performance Standards

### Mandatory Performance Optimizations

All implementations MUST include these optimizations:

#### 1. Framework Overhead Bypass

```typescript
// React - Use startTransition for non-urgent updates
import { startTransition } from 'react';
// Vue - Bypass reactivity for large data
import { markRaw, toRaw } from 'vue';

startTransition(() => {
    updateChart(data);
});

// Angular - Run outside zone
this.ngZone.runOutsideAngular(() => {
    updateChart(data);
});

const rawData = toRaw(data);
updateChart(markRaw(rawData));
```

#### 2. Batch Processing Pattern

```typescript
// All frameworks must implement frame-aligned batching
class BatchProcessor {
    private batch: T[] = [];
    private rafId: number | null = null;

    add(data: T): void {
        this.batch.push(data);
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => this.flush());
        }
    }

    private flush(): void {
        if (this.batch.length > 0) {
            this.processBatch(this.batch);
            this.batch = [];
        }
        this.rafId = null;
    }
}
```

#### 3. Memory Management

```typescript
// Mandatory memory optimization patterns
interface MemoryManager {
    // Rolling window for data points
    applyRollingWindow<T>(data: T[], maxSize: number): T[];

    // Cleanup old references
    cleanup(): void;

    // Monitor memory usage
    getMemoryUsage(): number;
}

// Implementation required in all frameworks
class StandardMemoryManager implements MemoryManager {
    private readonly MAX_ARRAY_SIZE = 100000;

    applyRollingWindow<T>(data: T[], maxSize: number): T[] {
        if (data.length > maxSize) {
            return data.slice(data.length - maxSize);
        }
        return data;
    }

    cleanup(): void {
        if (global.gc) global.gc();
    }

    getMemoryUsage(): number {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / 1048576;
        }
        return 0;
    }
}
```

## Error Handling Standards

### Unified Error Handling

All frameworks must implement consistent error handling:

```typescript
export enum ErrorCode {
    INITIALIZATION_FAILED = 'INIT_001',
    UPDATE_FAILED = 'UPDATE_001',
    MEMORY_LIMIT = 'MEM_001',
    STREAM_ERROR = 'STREAM_001',
    VALIDATION_ERROR = 'VAL_001',
}

export class ChartError extends Error {
    constructor(
        public code: ErrorCode,
        message: string,
        public recoverable: boolean = true,
        public context?: any
    ) {
        super(message);
        this.name = 'ChartError';
    }
}

// Circuit Breaker Pattern (required)
export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    constructor(
        private threshold = 5,
        private timeout = 60000
    ) {}

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'half-open';
            } else {
                throw new ChartError(ErrorCode.STREAM_ERROR, 'Circuit breaker is open', false);
            }
        }

        try {
            const result = await fn();
            if (this.state === 'half-open') {
                this.state = 'closed';
                this.failures = 0;
            }
            return result;
        } catch (error) {
            this.failures++;
            this.lastFailureTime = Date.now();

            if (this.failures >= this.threshold) {
                this.state = 'open';
            }
            throw error;
        }
    }
}
```

### Framework-Specific Error Boundaries

#### React Error Boundary

```typescript
export class ChartErrorBoundary extends Component<Props, State> {
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Chart error:', error, errorInfo);
    }
}
```

#### Angular Error Handler

```typescript
@Injectable()
export class ChartErrorHandler implements ErrorHandler {
    handleError(error: Error): void {
        if (error instanceof ChartError) {
            // Handle chart-specific errors
        }
    }
}
```

#### Vue Error Handler

```typescript
export function useErrorHandler() {
    const error = ref<ChartError | null>(null);

    const handler = (err: Error) => {
        if (err instanceof ChartError) {
            error.value = err;
        }
    };

    onErrorCaptured(handler);

    return { error, reset: () => (error.value = null) };
}
```

## Testing Standards

### Required Test Coverage

All implementations must include:

```typescript
// Test categories and minimum coverage
export interface TestRequirements {
    unit: {
        coverage: 80; // minimum percentage
        categories: ['data-processing', 'error-handling', 'memory-management', 'configuration'];
    };
    integration: {
        coverage: 70;
        scenarios: ['chart-initialization', 'data-updates', 'error-recovery', 'memory-cleanup'];
    };
    performance: {
        benchmarks: ['updates-per-second', 'memory-usage', 'frame-rate', 'latency'];
    };
}
```

### Performance Benchmarks

```typescript
// Required performance test
export async function validatePerformance(implementation: HighFrequencyAPI<any>): Promise<boolean> {
    const results = {
        updateRate: 0,
        frameRate: 0,
        memoryStable: false,
        latency: 0,
    };

    // Test 100 updates/second for 60 seconds
    const startTime = Date.now();
    const interval = setInterval(() => {
        implementation.addData(generateTestData());
    }, 10); // 100 updates/second

    // Monitor metrics
    const metricsInterval = setInterval(() => {
        const metrics = implementation.metrics;
        results.updateRate = metrics.updatesPerSecond;
        results.frameRate = metrics.fps;
        results.latency = Date.now() - metrics.lastUpdateTime;
    }, 1000);

    // Run for 60 seconds
    await new Promise((resolve) => setTimeout(resolve, 60000));

    clearInterval(interval);
    clearInterval(metricsInterval);

    // Validate results
    return results.updateRate >= 100 && results.frameRate >= 50 && results.latency < 50;
}
```

## Migration Standards

### Unified Migration Path

All frameworks must provide consistent migration utilities:

```typescript
// Migration helper interface
export interface MigrationHelper {
    // Detect legacy implementation
    isLegacyImplementation(component: any): boolean;

    // Auto-migrate configuration
    migrateConfig(legacyConfig: any): HighFrequencyConfig;

    // Provide migration warnings
    getMigrationWarnings(component: any): string[];

    // Generate migration code
    generateMigrationCode(component: any): string;
}

// Standard migration utility
export class StandardMigrationHelper implements MigrationHelper {
    isLegacyImplementation(component: any): boolean {
        // Check for old API patterns
        return !component.addData && component.setOptions;
    }

    migrateConfig(legacyConfig: any): HighFrequencyConfig {
        return {
            maxUpdatesPerSecond: legacyConfig.updateRate || 60,
            bufferTimeMs: legacyConfig.bufferTime || 16,
            maxBufferSize: legacyConfig.maxBuffer || 1000,
            // ... map other properties
        };
    }

    getMigrationWarnings(component: any): string[] {
        const warnings: string[] = [];

        if (component.setOptions) {
            warnings.push('setOptions() is deprecated. Use addData() for updates.');
        }

        if (!component.metrics) {
            warnings.push('Performance metrics are now available via .metrics property');
        }

        return warnings;
    }

    generateMigrationCode(component: any): string {
        // Generate framework-specific migration code
        return `// TODO: Implement framework-specific code generation`;
    }
}
```

## Documentation Standards

### Required Documentation

Each framework implementation must include:

1. **API Reference**: Complete JSDoc/TSDoc for all public APIs
2. **Getting Started Guide**: Basic usage in < 5 minutes
3. **Performance Guide**: Optimization techniques and best practices
4. **Migration Guide**: Step-by-step migration from legacy
5. **Examples**: At least 3 real-world scenarios

### Example Template

````typescript
/**
 * # High-Frequency Line Chart Example
 *
 * Demonstrates real-time financial data visualization with 100+ updates/second
 *
 * ## Features
 * - Real-time WebSocket data streaming
 * - Automatic memory management
 * - Performance monitoring
 *
 * ## Usage
 * ```typescript
 * const chart = useHighFrequencyChart(options, {
 *     maxUpdatesPerSecond: 100,
 *     maxDataPoints: 10000
 * });
 *
 * // Connect to data stream
 * websocket.on('data', data => chart.addData(data));
 * ```
 */
````

## Compliance Checklist

All framework implementations must pass this checklist:

-   [ ] Implements all methods in HighFrequencyAPI interface
-   [ ] Includes batch processing with requestAnimationFrame
-   [ ] Bypasses framework overhead for chart updates
-   [ ] Implements circuit breaker pattern
-   [ ] Provides memory management with rolling window
-   [ ] Includes comprehensive error handling
-   [ ] Has 80%+ unit test coverage
-   [ ] Passes performance benchmarks (100+ updates/sec)
-   [ ] Includes migration utilities
-   [ ] Has complete documentation
-   [ ] Follows framework-specific best practices
-   [ ] Maintains consistent API with other frameworks

## Version Compatibility

### Minimum Supported Versions

-   **React**: 18.0+ (for useSyncExternalStore, Suspense)
-   **Angular**: 16.0+ (for signals, standalone components)
-   **Vue**: 3.3+ (for improved reactivity, defineOptions)
-   **AG Charts**: Latest community/enterprise
-   **TypeScript**: 4.8+ (for improved type inference)

### Polyfills and Fallbacks

```typescript
// Required polyfills for older environments
if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (callback) => {
        return setTimeout(callback, 16);
    };
}

if (!globalThis.performance?.memory) {
    // Provide fallback memory monitoring
}
```

## Release Standards

### Quality Gates

Before release, all implementations must:

1. Pass all unit tests (80% coverage)
2. Pass all integration tests
3. Meet performance benchmarks
4. Have peer review from framework expert
5. Include updated documentation
6. Provide migration guide
7. Include at least 3 examples

### Versioning

Follow semantic versioning:

-   **Major**: Breaking API changes
-   **Minor**: New features, backwards compatible
-   **Patch**: Bug fixes, performance improvements

## Conclusion

These standards ensure that AG Charts delivers a consistent, high-performance experience across all major frameworks while respecting each framework's unique strengths and idioms. All implementations must adhere to these standards to maintain quality and compatibility.
