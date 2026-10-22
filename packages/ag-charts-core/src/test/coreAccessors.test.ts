import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpatialIndex } from '../geometry/spatialIndex';
import { Logger } from '../logging/logger';
import { Bitfield } from '../structures/bitfield';
import { fake, getBitfieldBuffer, getSpatialIndexCellCount, spyOnLoggerIssueEmit } from './coreAccessors';

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

    describe('getSpatialIndexCellCount', () => {
        it('is the grid size of the last reset', () => {
            const index = new SpatialIndex<string>();

            index.reset({ x: 0, y: 0, width: 100, height: 100 }, 50);
            expect(getSpatialIndexCellCount(index)).toBe(4);

            index.reset({ x: 0, y: 0, width: 100, height: 100 }, 25);
            expect(getSpatialIndexCellCount(index)).toBe(16);
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
