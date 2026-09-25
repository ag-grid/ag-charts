<script lang="ts">
import type { ColDef, ICellRendererParams, OverlayComponentUserParams } from 'ag-grid-community';
import { type PropType, defineComponent, h, shallowRef } from 'vue';

import { browserIconUrl } from '../browsers';
import { deviceIconUrl } from '../devices';
import { flagUrl } from '../flags';
import { fmtCurrency, fmtDateTime, fmtDuration } from '../format';
import type { Session } from '../types';

type IconCellParams = ICellRendererParams<Session, string>;

// The icon is decorative: the name beside it carries the meaning. Buckets with no
// icon ("Unknown" country, "Other" browser) render as text alone.
const iconCell = (iconUrl: (value: string) => string | undefined, imgClass = 'wa-cell-icon') =>
    defineComponent({
        props: { params: { type: Object as PropType<IconCellParams>, required: true } },
        setup(props, { expose }) {
            // The grid streams a changed cell in through `refresh` rather than new props, so the
            // rendered params are held here; returning true keeps this instance instead of
            // recreating it.
            const params = shallowRef(props.params);
            function refresh(next: IconCellParams): boolean {
                params.value = next;
                return true;
            }
            expose({ refresh });

            return () => {
                const { value } = params.value;
                if (!value) return null;
                const src = iconUrl(value);
                const icon = src && h('img', { class: imgClass, src, alt: '', 'aria-hidden': 'true', loading: 'lazy' });
                return h('span', { class: 'wa-icon-cell' }, icon ? [icon, value] : [value]);
            };
        },
    });

const CountryCell = iconCell(flagUrl, 'wa-flag');
const DeviceCell = iconCell(deviceIconUrl);
const BrowserCell = iconCell(browserIconUrl);

// No selection means no rows at all, so the grid shows `noRows`; `noMatchingRows`
// needs rows that the column filters then exclude.
const overlayComponentParams: OverlayComponentUserParams = {
    noRows: { overlayText: 'Click or drag across chart above to display matching sessions.' },
    noMatchingRows: { overlayText: 'No sessions match the current filters. Try adjusting your filters.' },
};

const columnDefs: ColDef<Session>[] = [
    {
        field: 'timestamp',
        headerName: 'When',
        minWidth: 140,
        // `initialSort`, not `sort`, so the user's own sorting is not overridden.
        initialSort: 'desc',
        filter: false,
        valueFormatter: ({ value }) => (value == null ? '' : fmtDateTime(new Date(value))),
    },
    { field: 'channel', headerName: 'Channel', minWidth: 100, filter: 'agSetColumnFilter' },
    {
        field: 'deviceCategory',
        headerName: 'Device',
        minWidth: 120,
        filter: 'agSetColumnFilter',
        cellRenderer: DeviceCell,
    },
    {
        field: 'browser',
        headerName: 'Browser',
        minWidth: 120,
        filter: 'agSetColumnFilter',
        cellRenderer: BrowserCell,
    },
    {
        field: 'country',
        headerName: 'Country',
        minWidth: 150,
        filter: 'agSetColumnFilter',
        cellRenderer: CountryCell,
    },
    {
        colId: 'visitor',
        headerName: 'Visitor',
        minWidth: 100,
        filter: 'agSetColumnFilter',
        // A string value, so the grid shows text instead of its default boolean checkmark rendering.
        valueGetter: ({ data }) => (data?.isNewVisitor ? 'New' : 'Returning'),
    },
    { field: 'landingPage', headerName: 'Landing', minWidth: 110, filter: 'agSetColumnFilter' },
    { field: 'exitPage', headerName: 'Exit', minWidth: 110, filter: 'agSetColumnFilter' },
    {
        field: 'pageviewsCount',
        headerName: 'Page views',
        type: 'rightAligned',
        minWidth: 100,
        filter: 'agNumberColumnFilter',
        filterParams: {
            filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
            inRangeInclusive: true,
        },
    },
    {
        field: 'sessionDuration',
        headerName: 'Duration',
        type: 'rightAligned',
        minWidth: 100,
        filter: 'agNumberColumnFilter',
        filterParams: {
            filterOptions: ['lessThan', 'greaterThan', 'inRange'],
            inRangeInclusive: true,
        },
        valueFormatter: ({ value }) => (value == null ? '' : fmtDuration(value)),
    },
    {
        colId: 'converted',
        headerName: 'Converted',
        minWidth: 100,
        filter: 'agSetColumnFilter',
        valueGetter: ({ data }) => (data?.converted ? 'Yes' : 'No'),
    },
    {
        field: 'conversionValue',
        headerName: 'Value',
        type: 'rightAligned',
        minWidth: 100,
        filter: 'agNumberColumnFilter',
        filterParams: {
            filterOptions: ['lessThan', 'greaterThan', 'inRange'],
            inRangeInclusive: true,
        },
        valueFormatter: ({ value }) => (value ? fmtCurrency(value) : '—'),
    },
];
</script>

<script setup lang="ts">
import type { GridApi, GridReadyEvent, ModelUpdatedEvent } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import { baseColDef, gridTheme } from './grid';

// The chart selection supplies row data, not a filter model, so the column filters
// narrow those rows and never feed back to the chart.
defineProps<{
    /**
     * The rows to show: the sessions on the days selected on the traffic chart, already
     * narrowed by the caller. Empty means nothing is selected, which is the grid's
     * starting state and puts the prompt above in place of the rows.
     */
    sessions: Session[];
}>();
const emit = defineEmits<{
    /**
     * Raised whenever the grid's model settles, with its column filter model (colId →
     * model) and the number of rows those filters leave displayed.
     */
    gridStateChange: [filterModel: Record<string, unknown>, displayedRowCount: number];
}>();

const defaultColDef = baseColDef<Session>();

// The grid hands its API over once ready, a tick after mount.
let api: GridApi<Session> | undefined;

const emitGridState = (readyApi: GridApi<Session>) =>
    emit('gridStateChange', readyApi.getFilterModel(), readyApi.getDisplayedRowCount());

const onGridReady = ({ api: readyApi }: GridReadyEvent<Session>) => {
    api = readyApi;
    emitGridState(readyApi);
};

// Fires for filter changes and new row data alike, so one handler covers both.
const onModelUpdated = ({ api: readyApi }: ModelUpdatedEvent<Session>) => emitGridState(readyApi);

/** Clears every column filter. The chart selection is not a filter and is left alone. */
// The resulting filter change emits the new state on its own.
const clearFilters = () => api?.setFilterModel(null);
defineExpose({ clearFilters });
</script>

<template>
    <div class="wa-grid-host">
        <AgGridVue
            :theme="gridTheme"
            :row-data="sessions"
            :column-defs="columnDefs"
            :default-col-def="defaultColDef"
            :overlay-component-params="overlayComponentParams"
            :row-height="36"
            :header-height="38"
            dom-layout="autoHeight"
            :pagination="true"
            :pagination-page-size="10"
            :pagination-page-size-selector="[10, 20, 50]"
            @grid-ready="onGridReady"
            @model-updated="onModelUpdated"
        />
    </div>
</template>
