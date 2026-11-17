import { describe, expect, it, vi } from 'vitest';

import { EventEmitter, Logger, ambientLogger } from 'ag-charts-core';
import { AG_CHARTS_LOCALE_EN_US } from 'ag-charts-locale';

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

    describe('with a partial localeText', () => {
        const createManager = (localeText?: Record<string, string>) => {
            const localeManager = new LocaleManager(new EventEmitter<EventsHubMap>(), new Logger());
            localeManager.setLocaleText(localeText);
            return localeManager;
        };

        it('falls back to English for an omitted key', () => {
            const localeManager = createManager({ contextMenuDownload: 'Save' });

            expect(localeManager.t('contextMenuZoomToCursor')).toBe('Zoom to here');
            expect(localeManager.t('ariaAnnounceStandaloneChart', { caption: 'Sales' })).toBe('chart, Sales');
        });

        it.each([
            ['a supplied value', 'Save'],
            ['an empty string', ''],
        ])('keeps %s instead of the English text', (_, value) => {
            const localeManager = createManager({ contextMenuDownload: value });

            expect(localeManager.t('contextMenuDownload')).toBe(value);
        });

        it.each([
            ['a partial localeText', { contextMenuDownload: 'Save' }],
            ['no localeText', undefined],
        ])('renders the key name for a key English lacks too, with %s', (_, localeText) => {
            expect(createManager(localeText).t('aKeyThatDoesNotExistAnywhere')).toBe('aKeyThatDoesNotExistAnywhere');
        });

        it('passes the English text to getLocaleText as the default value', () => {
            const localeManager = createManager({ contextMenuDownload: 'Save' });
            const getLocaleText = vi.fn(() => undefined);
            localeManager.setLocaleTextFormatter(getLocaleText);

            localeManager.t('contextMenuZoomToCursor');

            expect(getLocaleText).toHaveBeenCalledWith({
                key: 'contextMenuZoomToCursor',
                defaultValue: AG_CHARTS_LOCALE_EN_US.contextMenuZoomToCursor,
                variables: {},
            });
        });
    });
});
