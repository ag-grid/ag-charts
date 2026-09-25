import { createChartSlot } from '../agChart';
import { type View, h } from '../dom';
import type { FunnelStep, PageRow, PathLink, Session } from '../types';
import { createDurationHistogramChart } from './DurationHistogramChart';
import { createEmptyState } from './EmptyState';
import { createFunnelChart } from './FunnelChart';
import { createPagePerformanceChart } from './PagePerformanceChart';
import { createPageTreemapChart } from './PageTreemapChart';
import { createPathFlowChart } from './PathFlowChart';

export interface BehaviorViewProps {
    funnelData: FunnelStep[];
    pathData: PathLink[];
    pageData: PageRow[];
    sessions: Session[];
    hasData: boolean;
}

export interface BehaviorView extends View {
    update(props: BehaviorViewProps): void;
}

const card = (title: string, boxClass: string, body: HTMLElement) =>
    h(
        'section',
        { class: 'wa-card' },
        h('div', { class: 'wa-card-head' }, h('div', {}, h('h2', { class: 'wa-card-title' }, title))),
        h('div', { class: boxClass }, body)
    );

export function createBehaviorView(initial: BehaviorViewProps): BehaviorView {
    let props = initial;
    const showPaths = (p: BehaviorViewProps) => p.hasData && p.pathData.length > 0;
    const showPages = (p: BehaviorViewProps) => p.hasData && p.pageData.length > 0;

    const paths = createChartSlot(showPaths(props), props.pathData, createPathFlowChart, () =>
        createEmptyState('No path data in this range')
    );
    const funnel = createChartSlot(props.hasData, props.funnelData, createFunnelChart, () =>
        createEmptyState('No funnel data in this range')
    );
    const durations = createChartSlot(props.hasData, props.sessions, createDurationHistogramChart, () =>
        createEmptyState('No session data in this range')
    );
    const performance = createChartSlot(props.hasData, props.pageData, createPagePerformanceChart, () =>
        createEmptyState('No page data in this range')
    );
    const treemap = createChartSlot(showPages(props), props.pageData, createPageTreemapChart, () =>
        createEmptyState('No page data in this range')
    );
    const slots = [paths, funnel, durations, performance, treemap];

    const el = h(
        'div',
        { class: 'wa-view' },
        card('User paths', 'wa-chart-box-lg', paths.el),
        h(
            'div',
            { class: 'wa-grid-2-even' },
            card('Conversion funnel', 'wa-chart-box', funnel.el),
            card('Session duration distribution', 'wa-chart-box', durations.el)
        ),
        h(
            'div',
            { class: 'wa-grid-2-even' },
            card('Page views vs conversion rate', 'wa-chart-box', performance.el),
            card('Page view distribution', 'wa-chart-box', treemap.el)
        )
    );

    return {
        el,
        mount() {
            for (const slot of slots) slot.mount();
        },
        update(next) {
            props = next;
            paths.update(showPaths(props), props.pathData);
            funnel.update(props.hasData, props.funnelData);
            durations.update(props.hasData, props.sessions);
            performance.update(props.hasData, props.pageData);
            treemap.update(showPages(props), props.pageData);
        },
        destroy() {
            for (const slot of slots) slot.destroy();
        },
    };
}
