import { DataPoint, POINT_INTERVAL } from './data';

export interface StreamStats {
    updateCount: number;
    fps: number;
    pointCount: number;
}

type StatsTarget = string | HTMLElement | null;

interface StreamCallbacks {
    onStatsUpdate?: (stats: StreamStats) => void;
    onRunningChange?: (isRunning: boolean) => void;
}

export interface StreamOptions extends StreamCallbacks {
    data: DataPoint[];
    onUpdate: (newPoints: DataPoint[]) => void;
    pointsPerUpdate?: number;
    statsTarget?: StatsTarget;
}

const DEFAULT_POINTS_PER_UPDATE = 10;

export interface StreamController {
    start(): void;
    stop(): void;
    toggle(): void;
    isRunning(): boolean;
}

export function createUpdateSource({
    data,
    onRunningChange,
    onStatsUpdate,
    onUpdate,
    pointsPerUpdate = DEFAULT_POINTS_PER_UPDATE,
    statsTarget = 'stats',
}: StreamOptions): StreamController {
    let running = false;
    let animationFrameId: number | undefined;
    let updateCount = 0;
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    let resolvedStatsTarget: HTMLElement | null | undefined;

    const resolveStatsTarget = () => {
        if (resolvedStatsTarget !== undefined) {
            return resolvedStatsTarget;
        }

        resolvedStatsTarget =
            typeof statsTarget === 'string'
                ? (document.getElementById(statsTarget) as HTMLElement | null)
                : statsTarget ?? null;

        return resolvedStatsTarget;
    };

    const notifyRunningChange = () => onRunningChange?.(running);

    const emitStats = () => {
        const stats: StreamStats = {
            updateCount,
            fps,
            pointCount: data.length,
        };

        onStatsUpdate?.(stats);

        const target = resolveStatsTarget();
        if (target) {
            target.textContent = `Updates: ${stats.updateCount} | FPS: ${stats.fps} | Points: ${stats.pointCount.toLocaleString()}`;
        }
    };

    const step = () => {
        if (!running) {
            return;
        }

        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - lastTime;

        if (elapsed >= 1000) {
            fps = Math.round((frameCount * 1000) / elapsed);
            frameCount = 0;
            lastTime = currentTime;
            emitStats();
        }

        const lastPoint = data[data.length - 1];
        const baseTime = lastPoint.time;
        const baseValue = lastPoint.value;

        const newPoints: DataPoint[] = [];
        for (let i = 0; i < pointsPerUpdate; i++) {
            newPoints.push({
                time: baseTime + (i + 1) * POINT_INTERVAL,
                value: baseValue + (Math.random() - 0.5) * 5,
            });
        }

        onUpdate(newPoints);

        updateCount++;

        animationFrameId = requestAnimationFrame(step);
    };

    const start = () => {
        if (running) {
            return;
        }

        running = true;
        notifyRunningChange();
        lastTime = performance.now();
        frameCount = 0;
        emitStats();
        animationFrameId = requestAnimationFrame(step);
    };

    const stop = () => {
        if (!running) {
            return;
        }

        running = false;
        notifyRunningChange();
        if (animationFrameId !== undefined) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = undefined;
        }
    };

    const controller: StreamController = {
        start,
        stop,
        toggle: () => {
            if (running) {
                stop();
            } else {
                start();
            }
        },
        isRunning: () => running,
    };

    emitStats();

    return controller;
}

