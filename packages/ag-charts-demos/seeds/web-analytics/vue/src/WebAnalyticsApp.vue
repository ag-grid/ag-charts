<script lang="ts">
import { startOfDay } from './components/dateFilter';
import { DATA_END } from './data';
import type { DateRange } from './types';

const RANGE_OPTIONS = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
];

// End of the fixed data window, inclusive to the last day's sessions.
const DAY_MS = 24 * 60 * 60 * 1000;

const rangeEnd = () => new Date(startOfDay(DATA_END).getTime() + DAY_MS - 1);

function buildRange(days: number): DateRange {
    const end = rangeEnd();
    const start = startOfDay(new Date(end.getTime() - (days - 1) * DAY_MS));
    return { start, end };
}

// Ids only need to be unique within a session; the seeded annotations carry their own.
let nextEventId = 1;

function previousRange(range: DateRange, days: number): DateRange {
    const end = new Date(range.start.getTime() - 1);
    const start = startOfDay(new Date(end.getTime() - (days - 1) * DAY_MS));
    return { start, end };
}
</script>

<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';
import { computed, ref, shallowRef } from 'vue';

import AudienceView from './components/AudienceView.vue';
import BehaviorView from './components/BehaviorView.vue';
import BrandMark from './components/BrandMark.vue';
import DemoNotice from './components/DemoNotice.vue';
import { buildKpis } from './components/KpiTiles.vue';
import OverviewView from './components/OverviewView.vue';
import {
    SEED_ANNOTATIONS,
    activityHeatmap,
    browserBreakdown,
    channelBreakdown,
    countryBreakdown,
    dailySummary,
    deviceBreakdown,
    funnel,
    pageRows,
    pathLinks,
    sessionsInRange,
    summary,
    visitorBreakdown,
} from './data';
import type { MetricKey } from './metrics';
import type { Annotation, AnnotationType } from './types';
import Select from './ui/Select.vue';

const view = ref('overview');
const rangeKey = ref('30');
// The KPI tile currently driving the traffic chart.
const metric = ref<MetricKey>('sessions');
// Seeded events plus any the user adds from the traffic chart.
const annotations = shallowRef<Annotation[]>(SEED_ANNOTATIONS);

const addAnnotation = (date: Date, label: string, type: AnnotationType) => {
    annotations.value = [
        ...annotations.value,
        {
            annotationId: `event-${nextEventId++}`,
            date,
            label,
            description: '',
            type,
            createdBy: 'you',
        },
    ];
};

const removeAnnotation = (annotationId: string) => {
    annotations.value = annotations.value.filter((a) => a.annotationId !== annotationId);
};

const days = computed(() => Number(rangeKey.value));
const range = computed(() => buildRange(days.value));
// Always compare against the immediately preceding period of the same length.
const prevRange = computed(() => previousRange(range.value, days.value));

const countries = computed(() => countryBreakdown(range.value));
const channels = computed(() => channelBreakdown(range.value));
const visitors = computed(() => visitorBreakdown(range.value));
const devices = computed(() => deviceBreakdown(range.value));
const browsers = computed(() => browserBreakdown(range.value));
const activity = computed(() => activityHeatmap(range.value));
const funnelData = computed(() => funnel(range.value));
const pathData = computed(() => pathLinks(range.value));
const pageData = computed(() => pageRows(range.value));
const sessions = computed(() => sessionsInRange(range.value));

const currentSummary = computed(() => summary(range.value));
const prevSummary = computed(() => summary(prevRange.value));
const daily = computed(() => dailySummary(range.value));
const dailyPrev = computed(() => dailySummary(prevRange.value));
const kpis = computed(() => buildKpis(currentSummary.value, daily.value, prevSummary.value));

// Annotations that fall within the range overlay the traffic chart.
const visibleAnnotations = computed(() =>
    annotations.value.filter(
        (a) => a.date.getTime() >= range.value.start.getTime() && a.date.getTime() <= range.value.end.getTime()
    )
);

const hasData = computed(() => currentSummary.value.sessions > 0);
</script>

<template>
    <TabsRoot v-model="view" class="wa-app">
        <header class="wa-topbar">
            <span class="wa-brand"><BrandMark />Pulse Analytics</span>
            <TabsList class="wa-tabs-list" aria-label="Analytics views">
                <TabsTrigger class="wa-tab-trigger" value="overview">Overview</TabsTrigger>
                <TabsTrigger class="wa-tab-trigger" value="audience">Audience</TabsTrigger>
                <TabsTrigger class="wa-tab-trigger" value="behavior">Behavior</TabsTrigger>
            </TabsList>
            <span class="wa-topbar-spacer" />
            <div class="wa-controls">
                <Select v-model="rangeKey" label="Range" ariaLabel="Date range" :options="RANGE_OPTIONS" />
            </div>
            <DemoNotice />
        </header>

        <div class="wa-body">
            <TabsContent class="wa-tab-content" value="overview">
                <OverviewView
                    :daily="daily"
                    :daily-previous="dailyPrev"
                    :sessions="sessions"
                    :annotations="visibleAnnotations"
                    :kpis="kpis"
                    :metric="metric"
                    :has-data="hasData"
                    @metric-select="metric = $event"
                    @annotation-add="addAnnotation"
                    @annotation-remove="removeAnnotation"
                />
            </TabsContent>
            <TabsContent class="wa-tab-content" value="audience">
                <AudienceView
                    :countries="countries"
                    :channels="channels"
                    :visitors="visitors"
                    :devices="devices"
                    :browsers="browsers"
                    :activity="activity"
                    :has-data="hasData"
                />
            </TabsContent>
            <TabsContent class="wa-tab-content" value="behavior">
                <BehaviorView
                    :funnel-data="funnelData"
                    :path-data="pathData"
                    :page-data="pageData"
                    :sessions="sessions"
                    :has-data="hasData"
                />
            </TabsContent>
        </div>
    </TabsRoot>
</template>
