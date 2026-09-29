import { type DataChart, createChartSlot } from '../agChart';
import { type View, h } from '../dom';
import type { ActivityCell, Browser, ChannelDatum, CountryDatum, DeviceDatum, VisitorDatum } from '../types';
import { createActivityByDayChart } from './ActivityByDayChart';
import { createActivityHeatmapChart } from './ActivityHeatmapChart';
import { createBrowserBreakdownChart } from './BrowserBreakdownChart';
import { createChannelBreakdownChart } from './ChannelBreakdownChart';
import { createDeviceBreakdownChart } from './DeviceBreakdownChart';
import { createEmptyState } from './EmptyState';
import { createGeoMap } from './GeoMap';
import { createVisitorBreakdownChart } from './VisitorBreakdownChart';

export interface AudienceViewProps {
    countries: CountryDatum[];
    channels: ChannelDatum[];
    visitors: VisitorDatum[];
    devices: DeviceDatum[];
    browsers: { browser: Browser; sessions: number }[];
    activity: ActivityCell[];
    hasData: boolean;
}

export interface AudienceView extends View {
    update(props: AudienceViewProps): void;
}

const card = (title: string, ...body: HTMLElement[]) =>
    h(
        'section',
        { class: 'wa-card' },
        h('div', { class: 'wa-card-head' }, h('h2', { class: 'wa-card-title' }, title)),
        ...body
    );

export function createAudienceView(initial: AudienceViewProps): AudienceView {
    let props = initial;

    const visitors = createChartSlot(props.hasData, props.visitors, createVisitorBreakdownChart, () =>
        createEmptyState('No visitor data')
    );
    const devices = createChartSlot(props.hasData, props.devices, createDeviceBreakdownChart, () =>
        createEmptyState('No device data')
    );
    const browsers = createChartSlot(props.hasData, props.browsers, createBrowserBreakdownChart, () =>
        createEmptyState('No browser data')
    );
    const channels = createChartSlot(props.hasData, props.channels, createChannelBreakdownChart, () =>
        createEmptyState('No channel data')
    );
    const geo = createChartSlot(props.hasData, props.countries, createGeoMap, () =>
        createEmptyState('No geographic data')
    );

    // The activity card's body is two chart boxes with data and one empty box without, so the
    // branch is swapped by hand rather than through a single-element slot.
    const activityHead = h(
        'div',
        { class: 'wa-card-head' },
        h('div', {}, h('h2', { class: 'wa-card-title' }, 'Activity by time of day'))
    );
    const activityCard = h('section', { class: 'wa-card wa-card--fill' }, activityHead);
    let activityCharts: DataChart<ActivityCell[]>[] = [];
    let activityHasData: boolean | undefined;
    let mounted = false;

    function renderActivity() {
        if (activityHasData === props.hasData) {
            for (const chart of activityCharts) chart.update(props.activity);
            return;
        }
        activityHasData = props.hasData;
        for (const chart of activityCharts) chart.destroy();
        while (activityHead.nextSibling) activityHead.nextSibling.remove();
        if (props.hasData) {
            activityCharts = [createActivityByDayChart(props.activity), createActivityHeatmapChart(props.activity)];
            activityCard.append(
                h('div', { class: 'wa-chart-box-xxsm' }, activityCharts[0].el),
                h('div', { class: 'wa-fill' }, activityCharts[1].el)
            );
        } else {
            activityCharts = [];
            activityCard.append(h('div', { class: 'wa-fill' }, createEmptyState('No activity data').el));
        }
        if (mounted) for (const chart of activityCharts) chart.mount();
    }
    renderActivity();

    const el = h(
        'div',
        { class: 'wa-view wa-view--fill' },
        h(
            'div',
            { class: 'wa-grid-4' },
            card('New vs returning', h('div', { class: 'wa-chart-box-xsm' }, visitors.el)),
            card('Sessions by device', h('div', { class: 'wa-chart-box-xsm' }, devices.el)),
            card('Sessions by browser', h('div', { class: 'wa-chart-box-xsm' }, browsers.el)),
            card('Sessions by channel', h('div', { class: 'wa-chart-box-xsm' }, channels.el))
        ),
        h(
            'div',
            { class: 'wa-grid-2' },
            h(
                'section',
                { class: 'wa-card wa-card--fill' },
                h('div', { class: 'wa-card-head' }, h('h2', { class: 'wa-card-title' }, 'Sessions by country')),
                h('div', { class: 'wa-fill' }, geo.el)
            ),
            activityCard
        )
    );

    const slots = [visitors, devices, browsers, channels, geo];

    return {
        el,
        mount() {
            mounted = true;
            for (const slot of slots) slot.mount();
            for (const chart of activityCharts) chart.mount();
        },
        update(next) {
            props = next;
            visitors.update(props.hasData, props.visitors);
            devices.update(props.hasData, props.devices);
            browsers.update(props.hasData, props.browsers);
            channels.update(props.hasData, props.channels);
            geo.update(props.hasData, props.countries);
            renderActivity();
        },
        destroy() {
            mounted = false;
            for (const slot of slots) slot.destroy();
            for (const chart of activityCharts) chart.destroy();
        },
    };
}
