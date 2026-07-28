import * as RTabs from '@radix-ui/react-tabs';
import { useMemo, useState } from 'react';

import { AudienceView } from './components/AudienceView';
import { BehaviorView } from './components/BehaviorView';
import { buildKpis } from './components/KpiTiles';
import { OverviewView } from './components/OverviewView';
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
import type { MetricKey } from './metrics';
import type { DateRange } from './types';
import { Select } from './ui';

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

function previousRange(range: DateRange, days: number): DateRange {
    const end = new Date(range.start.getTime() - 1);
    const start = startOfDay(new Date(end.getTime() - (days - 1) * DAY_MS));
    return { start, end };
}

export function WebAnalyticsApp() {
    const [view, setView] = useState('overview');
    const [rangeKey, setRangeKey] = useState('30');
    // The KPI tile currently driving the traffic chart.
    const [metric, setMetric] = useState<MetricKey>('sessions');

    const days = Number(rangeKey);
    const range = useMemo(() => buildRange(days), [days]);
    // Always compare against the immediately preceding period of the same length.
    const prevRange = useMemo(() => previousRange(range, days), [range, days]);

    const countries = useMemo(() => countryBreakdown(range), [range]);
    const channels = useMemo(() => channelBreakdown(range), [range]);
    const visitors = useMemo(() => visitorBreakdown(range), [range]);
    const devices = useMemo(() => deviceBreakdown(range), [range]);
    const browsers = useMemo(() => browserBreakdown(range), [range]);
    const activity = useMemo(() => activityHeatmap(range), [range]);
    const funnelData = useMemo(() => funnel(range), [range]);
    const pathData = useMemo(() => pathLinks(range), [range]);
    const pageData = useMemo(() => pageRows(range), [range]);
    const sessions = useMemo(() => sessionsInRange(range), [range]);
    const prevSessions = useMemo(() => sessionsInRange(prevRange), [prevRange]);

    const currentSummary = useMemo(() => summary(range), [range]);
    const prevSummary = useMemo(() => summary(prevRange), [prevRange]);
    const daily = useMemo(() => dailySummary(range), [range]);
    const dailyPrev = useMemo(() => dailySummary(prevRange), [prevRange]);
    const kpis = useMemo(() => buildKpis(currentSummary, daily, prevSummary), [currentSummary, daily, prevSummary]);

    // Annotations that fall within the range overlay the traffic chart.
    const visibleAnnotations = useMemo(
        () =>
            SEED_ANNOTATIONS.filter(
                (a) => a.date.getTime() >= range.start.getTime() && a.date.getTime() <= range.end.getTime()
            ),
        [range]
    );

    const hasData = currentSummary.sessions > 0;

    return (
        <RTabs.Root className="wa-app" value={view} onValueChange={setView}>
            <header className="wa-topbar">
                <span className="wa-brand">
                    <span className="wa-brand-dot" aria-hidden="true" />
                    Pulse Analytics
                </span>
                <RTabs.List className="wa-tabs-list" aria-label="Analytics views">
                    <RTabs.Trigger className="wa-tab-trigger" value="overview">
                        Overview
                    </RTabs.Trigger>
                    <RTabs.Trigger className="wa-tab-trigger" value="audience">
                        Audience
                    </RTabs.Trigger>
                    <RTabs.Trigger className="wa-tab-trigger" value="behavior">
                        Behavior
                    </RTabs.Trigger>
                </RTabs.List>
                <span className="wa-topbar-spacer" />
                <div className="wa-controls">
                    <Select
                        label="Range"
                        ariaLabel="Date range"
                        value={rangeKey}
                        onValueChange={setRangeKey}
                        options={RANGE_OPTIONS}
                    />
                </div>
            </header>

            <div className="wa-body">
                <RTabs.Content className="wa-tab-content" value="overview">
                    <OverviewView
                        daily={daily}
                        dailyPrevious={dailyPrev}
                        sessions={sessions}
                        prevSessions={prevSessions}
                        annotations={visibleAnnotations}
                        kpis={kpis}
                        metric={metric}
                        hasData={hasData}
                        onMetricSelect={setMetric}
                    />
                </RTabs.Content>
                <RTabs.Content className="wa-tab-content" value="audience">
                    <AudienceView
                        countries={countries}
                        channels={channels}
                        visitors={visitors}
                        devices={devices}
                        browsers={browsers}
                        activity={activity}
                        hasData={hasData}
                    />
                </RTabs.Content>
                <RTabs.Content className="wa-tab-content" value="behavior">
                    <BehaviorView
                        funnelData={funnelData}
                        pathData={pathData}
                        pageData={pageData}
                        sessions={sessions}
                        hasData={hasData}
                    />
                </RTabs.Content>
            </div>
        </RTabs.Root>
    );
}
