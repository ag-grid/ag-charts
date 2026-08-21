import { describe, expect, it } from 'vitest';

import { PREVIEW_CHART_TYPES, SERIES_COUNT_OPTIONS } from './chartTypes';
import { MAX_SERIES_COUNT, MIN_SERIES_COUNT, PREVIEW_DATA, PREVIEW_SERIES } from './previewData';

const seriesOf = (options: unknown) => (options as { series: unknown[] }).series;

describe('preview chart types', () => {
    it('builds the requested number of series at every offered count', () => {
        for (const type of PREVIEW_CHART_TYPES) {
            for (const count of SERIES_COUNT_OPTIONS) {
                const options = type.buildOptions(count);
                // A donut carries one series whose slices come from the data, so
                // the count lands on the data rather than the series list.
                const actual =
                    type.id === 'donut' ? (options as { data: unknown[] }).data.length : seriesOf(options).length;
                expect(actual, `${type.id} @ ${count}`).toBe(count);
            }
        }
    });

    it('offers every count the data can actually support', () => {
        expect(SERIES_COUNT_OPTIONS[0]).toBe(MIN_SERIES_COUNT);
        expect(SERIES_COUNT_OPTIONS.at(-1)).toBe(MAX_SERIES_COUNT);
        expect(MAX_SERIES_COUNT).toBe(PREVIEW_SERIES.length);
    });

    it('has a value for every series in every row', () => {
        // The count takes a prefix of PREVIEW_SERIES, so a key missing from one
        // quarter would show as a silent gap only at certain counts.
        for (const row of PREVIEW_DATA) {
            for (const { key } of PREVIEW_SERIES) {
                expect(typeof (row as Record<string, unknown>)[key], `${row.quarter}.${key}`).toBe('number');
            }
        }
    });

    it('keeps the thumbnails at a fixed eight, independent of the count', () => {
        // Deliberate: the cards separate themes from each other, and at a
        // user-chosen count of two the lookalike palettes would converge again.
        for (const type of PREVIEW_CHART_TYPES) {
            const thumbnail = type.thumbnailOptions as { series: unknown[]; data: unknown[] };
            const slots = type.id === 'donut' ? thumbnail.data.length : thumbnail.series.length;
            expect(slots, type.id).toBe(8);
        }
    });
});
