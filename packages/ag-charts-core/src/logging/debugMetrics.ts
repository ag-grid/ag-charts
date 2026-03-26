import { check as debugCheck } from './debugLogger';

const metrics = new Map<string, any>();

export function record(key: string, value: any): void {
    if (!debugCheck('scene:stats:verbose')) return;
    metrics.set(key, value);
}

export function flush(): Record<string, any> {
    const result = Object.fromEntries(metrics);
    metrics.clear();
    return result;
}
