import { describe, expect, it, vi } from 'vitest';

import { EventEmitter, Logger, ambientLogger } from 'ag-charts-core';

import type { EventsHubMap } from '../core/eventsHub';
import { LocaleManager } from './localeManager';

describe('LocaleManager', () => {
    it('routes the unsupported locale format-style warning through the injected logger', () => {
        const eventsHub = new EventEmitter<EventsHubMap>();
        const logger = new Logger();
        const instanceWarnOnce = vi.spyOn(logger, 'warnOnce').mockImplementation(() => {});
        const unrelatedWarnOnce = vi.spyOn(ambientLogger, 'warnOnce').mockImplementation(() => {});

        const localeManager = new LocaleManager(eventsHub, logger);
        localeManager.setLocaleText({ greeting: 'Hello ${name}[unsupportedFormat]' });

        const message = localeManager.t('greeting', { name: 'World' });

        const isUnsupportedFormatWarning = ([m]: unknown[]) => String(m).includes('is not supported');
        expect(message).toBe('Hello World');
        expect(instanceWarnOnce.mock.calls.some(isUnsupportedFormatWarning)).toBe(true);
        expect(unrelatedWarnOnce.mock.calls.some(isUnsupportedFormatWarning)).toBe(false);
    });
});
