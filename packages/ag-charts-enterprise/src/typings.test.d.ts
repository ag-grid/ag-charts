import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';

declare module 'vitest' {
    interface Assertion<T = any> {
        toMatchImage(expected: ImageData, options?: { writeDiff: boolean }): T;
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): T;
    }
}
