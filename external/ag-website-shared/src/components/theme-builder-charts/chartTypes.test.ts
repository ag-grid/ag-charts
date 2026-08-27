import { describe, expect, it } from 'vitest';

import { DEFAULT_CHART_TYPE_IDS, PREVIEW_CHART_TYPES, PREVIEW_PANES, SERIES_COUNT_OPTIONS } from './chartTypes';
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

    it('opens the two panes on two chart types that exist', () => {
        // An id no longer in the list falls back to the first type without
        // complaint, so a rename would silently open both panes on the same
        // chart - losing the comparison the second pane is there to make.
        const ids = PREVIEW_PANES.map((pane) => DEFAULT_CHART_TYPE_IDS[pane]);
        for (const id of ids) {
            expect(
                PREVIEW_CHART_TYPES.map((type) => type.id),
                id
            ).toContain(id);
        }
        expect(new Set(ids).size, ids.join(' and ')).toBe(ids.length);
    });
});
