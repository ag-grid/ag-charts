import { type MockInstance, vi } from 'vitest';

import type { Logger } from '../logging/logger';
import type { Bitfield } from '../structures/bitfield';

// Core cannot import the community accessors; areas whose dependency rules keep them out of here have their own `test/`.

/**
 * A hand-built test double typed as `T`. Give it only the members the code under test reads; a member it does not read
 * is `undefined` at runtime. This is the one place a double is cast to `T`, so the cast is not repeated in each test.
 * (The scene tests have the same helper in `scene/test`, as the scene may not import from here.)
 */
export function fake<T>(members: object): T {
    return members as unknown as T;
}

// `Bitfield.buffer` is private and has no public view of the words it packs bits into.
interface BitfieldHost {
    buffer: Uint32Array;
}

/** The words a `Bitfield` stores its bits in, for tests that check the packing rather than single bits. */
export function getBitfieldBuffer(bitfield: Bitfield): Uint32Array {
    return (bitfield as unknown as BitfieldHost).buffer;
}

// `Logger.issues` is private; the emitter is observable only through its subscribers.
interface LoggerHost {
    issues: { emit(...args: unknown[]): unknown };
}

/** Spies on the emitter a `Logger` raises issues through, so a test can assert that nothing was emitted at all. */
export function spyOnLoggerIssueEmit(logger: Logger): MockInstance {
    return vi.spyOn((logger as unknown as LoggerHost).issues, 'emit');
}
