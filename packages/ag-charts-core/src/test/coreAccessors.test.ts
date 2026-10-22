import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '../logging/logger';
import { Bitfield } from '../structures/bitfield';
import { fake, getBitfieldBuffer, spyOnLoggerIssueEmit } from './coreAccessors';

describe('coreAccessors', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fake', () => {
        it('returns the members it was given, typed as the target', () => {
            const element = fake<HTMLElement>({ clientWidth: 12 });

            expect(element.clientWidth).toBe(12);
        });
    });

    describe('getBitfieldBuffer', () => {
        it('exposes the packed words: 32 bits to a word', () => {
            const bitfield = new Bitfield(70);
            expect(getBitfieldBuffer(bitfield)).toHaveLength(3);

            bitfield.setBit(0);
            bitfield.setBit(33);
            expect(Array.from(getBitfieldBuffer(bitfield))).toEqual([1, 2, 0]);
        });
    });

    describe('spyOnLoggerIssueEmit', () => {
        it('records the issues the logger emits to its subscribers', () => {
            vi.spyOn(console, 'warn').mockImplementation(() => void 0);
            const logger = new Logger();
            const listener = vi.fn();
            logger.onIssue(listener);
            const emit = spyOnLoggerIssueEmit(logger);

            logger.warn('seen');

            expect(emit).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });
});
