import { Component, computed, signal } from '@angular/core';

import { AudienceView } from './components/audience-view';
import { BehaviorView } from './components/behavior-view';
import { BrandMark } from './components/brand-mark';
import { startOfDay } from './components/dateFilter';
import { DemoNotice } from './components/demo-notice';
import { buildKpis } from './components/kpi-tiles';
import { type AnnotationAdd, OverviewView } from './components/overview-view';
import {
    DATA_END,
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
import type { Annotation, DateRange } from './types';
import { Select, TabContent, TabList, TabTrigger } from './ui';

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

/**
 * The app root: the React `Tabs.Root` is this host, which carries the `.wa-app` class along with the
 * `dir` and `data-orientation` attributes Radix puts on it.
 */
@Component({
    selector: 'div[waWebAnalyticsApp]',
    imports: [AudienceView, BehaviorView, BrandMark, DemoNotice, OverviewView, Select, TabContent, TabList, TabTrigger],
    host: { class: 'wa-app', dir: 'ltr', 'data-orientation': 'horizontal' },
    template: `
        <header class="wa-topbar">
            <span class="wa-brand"><svg waBrandMark></svg>Pulse Analytics</span>
            <div
                waTabList
                #tabs
                class="wa-tabs-list"
                aria-label="Analytics views"
                [value]="view()"
                (valueChange)="view.set($event)"
            >
                <button waTabTrigger class="wa-tab-trigger" value="overview">Overview</button>
                <button waTabTrigger class="wa-tab-trigger" value="audience">Audience</button>
                <button waTabTrigger class="wa-tab-trigger" value="behavior">Behavior</button>
            </div>
            <span class="wa-topbar-spacer"></span>
            <div class="wa-controls">
                <label
                    waSelect
                    label="Range"
                    ariaLabel="Date range"
                    [value]="rangeKey()"
                    (valueChange)="rangeKey.set($event)"
                    [options]="rangeOptions"
                ></label>
            </div>
            <span waDemoNotice></span>
        </header>

        <div class="wa-body">
            <div waTabContent [tabs]="tabs" value="overview" class="wa-tab-content" style="animation-duration: 0s;">
                @if (view() === 'overview') {
                    <div
                        waOverviewView
                        [daily]="daily()"
                        [dailyPrevious]="dailyPrev()"
                        [sessions]="sessions()"
                        [annotations]="visibleAnnotations()"
                        [kpis]="kpis()"
                        [metric]="metric()"
                        [hasData]="hasData()"
                        (metricSelect)="metric.set($event)"
                        (annotationAdd)="addAnnotation($event)"
                        (annotationRemove)="removeAnnotation($event)"
                    ></div>
                }
            </div>
            <div waTabContent [tabs]="tabs" value="audience" class="wa-tab-content" style="animation-duration: 0s;">
                @if (view() === 'audience') {
                    <div
                        waAudienceView
                        [countries]="countries()"
                        [channels]="channels()"
                        [visitors]="visitors()"
                        [devices]="devices()"
                        [browsers]="browsers()"
                        [activity]="activity()"
                        [hasData]="hasData()"
                    ></div>
                }
            </div>
            <div waTabContent [tabs]="tabs" value="behavior" class="wa-tab-content" style="animation-duration: 0s;">
                @if (view() === 'behavior') {
                    <div
                        waBehaviorView
                        [funnelData]="funnelData()"
                        [pathData]="pathData()"
                        [pageData]="pageData()"
                        [sessions]="sessions()"
                        [hasData]="hasData()"
                    ></div>
                }
            </div>
        </div>
    `,
})
export class WebAnalyticsApp {
    protected readonly rangeOptions = RANGE_OPTIONS;

    protected readonly view = signal('overview');
    protected readonly rangeKey = signal('30');
    // The KPI tile currently driving the traffic chart.
    protected readonly metric = signal<MetricKey>('sessions');
    // Seeded events plus any the user adds from the traffic chart.
    private readonly annotations = signal<Annotation[]>(SEED_ANNOTATIONS);

    private readonly days = computed(() => Number(this.rangeKey()));
    private readonly range = computed(() => buildRange(this.days()));
    // Always compare against the immediately preceding period of the same length.
    private readonly prevRange = computed(() => previousRange(this.range(), this.days()));

    protected readonly countries = computed(() => countryBreakdown(this.range()));
    protected readonly channels = computed(() => channelBreakdown(this.range()));
    protected readonly visitors = computed(() => visitorBreakdown(this.range()));
    protected readonly devices = computed(() => deviceBreakdown(this.range()));
    protected readonly browsers = computed(() => browserBreakdown(this.range()));
    protected readonly activity = computed(() => activityHeatmap(this.range()));
    protected readonly funnelData = computed(() => funnel(this.range()));
    protected readonly pathData = computed(() => pathLinks(this.range()));
    protected readonly pageData = computed(() => pageRows(this.range()));
    protected readonly sessions = computed(() => sessionsInRange(this.range()));

    private readonly currentSummary = computed(() => summary(this.range()));
    private readonly prevSummary = computed(() => summary(this.prevRange()));
    protected readonly daily = computed(() => dailySummary(this.range()));
    protected readonly dailyPrev = computed(() => dailySummary(this.prevRange()));
    protected readonly kpis = computed(() => buildKpis(this.currentSummary(), this.daily(), this.prevSummary()));

    // Annotations that fall within the range overlay the traffic chart.
    protected readonly visibleAnnotations = computed(() => {
        const range = this.range();
        return this.annotations().filter(
            (a) => a.date.getTime() >= range.start.getTime() && a.date.getTime() <= range.end.getTime()
        );
    });

    protected readonly hasData = computed(() => this.currentSummary().sessions > 0);

    protected addAnnotation({ date, label, type }: AnnotationAdd): void {
        this.annotations.update((prev) => [
            ...prev,
            {
                annotationId: `event-${nextEventId++}`,
                date,
                label,
                description: '',
                type,
                createdBy: 'you',
            },
        ]);
    }

    protected removeAnnotation(annotationId: string): void {
        this.annotations.update((prev) => prev.filter((a) => a.annotationId !== annotationId));
    }
}
