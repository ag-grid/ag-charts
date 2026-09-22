import { type AudienceViewProps, createAudienceView } from './components/AudienceView';
import { type BehaviorViewProps, createBehaviorView } from './components/BehaviorView';
import { createBrandMark } from './components/BrandMark';
import { createDemoNotice } from './components/DemoNotice';
import { buildKpis } from './components/KpiTiles';
import { type OverviewViewProps, createOverviewView } from './components/OverviewView';
import { startOfDay } from './components/dateFilter';
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
import { type View, h } from './dom';
import type { MetricKey } from './metrics';
import type { Annotation, AnnotationType, DateRange } from './types';
import { createSelect, createTabs } from './ui';

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

/** Everything derived from the date range (the `useMemo`s keyed on it), computed once per range. */
function deriveRange(days: number) {
    const range = buildRange(days);
    // Always compare against the immediately preceding period of the same length.
    const prevRange = previousRange(range, days);
    const currentSummary = summary(range);
    const prevSummary = summary(prevRange);
    const daily = dailySummary(range);
    return {
        range,
        countries: countryBreakdown(range),
        channels: channelBreakdown(range),
        visitors: visitorBreakdown(range),
        devices: deviceBreakdown(range),
        browsers: browserBreakdown(range),
        activity: activityHeatmap(range),
        funnelData: funnel(range),
        pathData: pathLinks(range),
        pageData: pageRows(range),
        sessions: sessionsInRange(range),
        currentSummary,
        daily,
        dailyPrev: dailySummary(prevRange),
        kpis: buildKpis(currentSummary, daily, prevSummary),
    };
}

type TabView = { update(props: never): void } & View;

export function createWebAnalyticsApp(): View {
    let view = 'overview';
    let rangeKey = '30';
    // The KPI tile currently driving the traffic chart.
    let metric: MetricKey = 'sessions';
    // Seeded events plus any the user adds from the traffic chart.
    let annotations: Annotation[] = SEED_ANNOTATIONS;

    const addAnnotation = (date: Date, label: string, type: AnnotationType) => {
        annotations = [
            ...annotations,
            {
                annotationId: `event-${nextEventId++}`,
                date,
                label,
                description: '',
                type,
                createdBy: 'you',
            },
        ];
        render();
    };

    const removeAnnotation = (annotationId: string) => {
        annotations = annotations.filter((a) => a.annotationId !== annotationId);
        render();
    };

    const setMetric = (key: MetricKey) => {
        metric = key;
        render();
    };

    let derived = deriveRange(Number(rangeKey));
    // Annotations that fall within the range overlay the traffic chart.
    let visibleAnnotationsInputs: [Annotation[], DateRange] | undefined;
    let visibleAnnotations: Annotation[] = [];
    function computeVisibleAnnotations() {
        const { range } = derived;
        if (visibleAnnotationsInputs?.[0] === annotations && visibleAnnotationsInputs[1] === range) return;
        visibleAnnotationsInputs = [annotations, range];
        visibleAnnotations = annotations.filter(
            (a) => a.date.getTime() >= range.start.getTime() && a.date.getTime() <= range.end.getTime()
        );
    }

    const overviewProps = (): OverviewViewProps => ({
        daily: derived.daily,
        dailyPrevious: derived.dailyPrev,
        sessions: derived.sessions,
        annotations: visibleAnnotations,
        kpis: derived.kpis,
        metric,
        hasData: derived.currentSummary.sessions > 0,
        onMetricSelect: setMetric,
        onAnnotationAdd: addAnnotation,
        onAnnotationRemove: removeAnnotation,
    });
    const audienceProps = (): AudienceViewProps => ({
        countries: derived.countries,
        channels: derived.channels,
        visitors: derived.visitors,
        devices: derived.devices,
        browsers: derived.browsers,
        activity: derived.activity,
        hasData: derived.currentSummary.sessions > 0,
    });
    const behaviorProps = (): BehaviorViewProps => ({
        funnelData: derived.funnelData,
        pathData: derived.pathData,
        pageData: derived.pageData,
        sessions: derived.sessions,
        hasData: derived.currentSummary.sessions > 0,
    });

    const VIEWS: Record<string, () => TabView> = {
        overview: () => createOverviewView(overviewProps()) as TabView,
        audience: () => createAudienceView(audienceProps()) as TabView,
        behavior: () => createBehaviorView(behaviorProps()) as TabView,
    };
    const PROPS: Record<string, () => object> = {
        overview: overviewProps,
        audience: audienceProps,
        behavior: behaviorProps,
    };

    const tabs = createTabs({
        value: view,
        onValueChange: (next) => {
            view = next;
            render();
        },
        tabs: [
            { value: 'overview', label: 'Overview' },
            { value: 'audience', label: 'Audience' },
            { value: 'behavior', label: 'Behavior' },
        ],
        listAriaLabel: 'Analytics views',
        rootClass: 'wa-app',
        listClass: 'wa-tabs-list',
        triggerClass: 'wa-tab-trigger',
        contentClass: 'wa-tab-content',
    });

    const select = createSelect({
        label: 'Range',
        ariaLabel: 'Date range',
        value: rangeKey,
        onValueChange: (next) => {
            rangeKey = next;
            render();
        },
        options: RANGE_OPTIONS,
    });

    const notice = createDemoNotice();

    tabs.root.append(
        h(
            'header',
            { class: 'wa-topbar' },
            h('span', { class: 'wa-brand' }, createBrandMark(), 'Pulse Analytics'),
            tabs.list,
            h('span', { class: 'wa-topbar-spacer' }),
            h('div', { class: 'wa-controls' }, select.el),
            notice.el
        ),
        h('div', { class: 'wa-body' }, tabs.contents.overview, tabs.contents.audience, tabs.contents.behavior)
    );

    // Radix unmounts an inactive tab's content, so only the active view exists.
    let active: { name: string; view: TabView } | undefined;
    let mounted = false;
    let renderedDays = Number(rangeKey);

    function render() {
        const days = Number(rangeKey);
        if (days !== renderedDays) {
            renderedDays = days;
            derived = deriveRange(days);
        }
        computeVisibleAnnotations();
        select.setValue(rangeKey);
        tabs.setValue(view);

        if (active?.name !== view) {
            active?.view.destroy();
            active?.view.el.remove();
            active = { name: view, view: VIEWS[view]() };
            tabs.contents[view].append(active.view.el);
            if (mounted) active.view.mount();
        } else {
            active.view.update(PROPS[view]() as never);
        }
    }
    render();

    return {
        el: tabs.root,
        mount() {
            mounted = true;
            active?.view.mount();
        },
        destroy() {
            mounted = false;
            active?.view.destroy();
            active = undefined;
            notice.destroy();
        },
    };
}
