import { describe, expect, it } from 'vitest';

import { DEFAULT_CHART_TYPE_IDS, PREVIEW_CHART_TYPES, PREVIEW_PANES, snapSeriesCount } from './chartTypes';
import {
    DEFAULT_SERIES_COUNT,
    MAX_SERIES_COUNT,
    MIN_SERIES_COUNT,
    PREVIEW_DATA,
    PREVIEW_SERIES,
    SERIES_COUNT_OPTIONS,
} from './previewData';

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

    it('offers an ascending scale the data can actually support', () => {
        expect(SERIES_COUNT_OPTIONS).toEqual([...SERIES_COUNT_OPTIONS].sort((a, b) => a - b));
        expect(new Set(SERIES_COUNT_OPTIONS).size).toBe(SERIES_COUNT_OPTIONS.length);
        expect(MIN_SERIES_COUNT).toBe(SERIES_COUNT_OPTIONS[0]);
        expect(MAX_SERIES_COUNT).toBe(SERIES_COUNT_OPTIONS.at(-1));
        // The top of the scale is a claim about the data behind it: a shorter
        // list would render fewer series than the count says.
        expect(PREVIEW_SERIES.length).toBeGreaterThanOrEqual(MAX_SERIES_COUNT);
        // Otherwise the tool opens on a count its own control cannot show.
        expect(SERIES_COUNT_OPTIONS).toContain(DEFAULT_SERIES_COUNT);
    });

    it('names every series distinctly', () => {
        // The tail of the list is built from country names, so a repeat would
        // collapse two series onto one key and silently drop one of them.
        expect(new Set(PREVIEW_SERIES.map(({ key }) => key)).size).toBe(PREVIEW_SERIES.length);
        expect(new Set(PREVIEW_SERIES.map(({ name }) => name)).size).toBe(PREVIEW_SERIES.length);
    });

    it('snaps a stored count onto the scale', () => {
        for (const option of SERIES_COUNT_OPTIONS) {
            expect(snapSeriesCount(option)).toBe(option);
        }
        // A value from an older scale, or an edited storage entry, must land on
        // something the control can display rather than sitting between options.
        expect(snapSeriesCount(7)).toBe(8);
        expect(snapSeriesCount(0)).toBe(MIN_SERIES_COUNT);
        expect(snapSeriesCount(9000)).toBe(MAX_SERIES_COUNT);
        expect(snapSeriesCount(Number.NaN)).toBe(DEFAULT_SERIES_COUNT);
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
