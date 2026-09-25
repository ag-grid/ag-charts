import { Component, input } from '@angular/core';

import type { FunnelStep, PageRow, PathLink, Session } from '../types';
import { DurationHistogramChart } from './duration-histogram-chart';
import { EmptyState } from './empty-state';
import { FunnelChart } from './funnel-chart';
import { PagePerformanceChart } from './page-performance-chart';
import { PageTreemapChart } from './page-treemap-chart';
import { PathFlowChart } from './path-flow-chart';

@Component({
    selector: 'div[waBehaviorView]',
    imports: [DurationHistogramChart, EmptyState, FunnelChart, PagePerformanceChart, PageTreemapChart, PathFlowChart],
    host: { class: 'wa-view' },
    template: `
        <section class="wa-card">
            <div class="wa-card-head">
                <div>
                    <h2 class="wa-card-title">User paths</h2>
                </div>
            </div>
            @if (hasData() && pathData().length > 0) {
                <div waPathFlowChart class="wa-chart-box-lg" [data]="pathData()"></div>
            } @else {
                <div class="wa-chart-box-lg"><div waEmptyState message="No path data in this range"></div></div>
            }
        </section>
        <div class="wa-grid-2-even">
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Conversion funnel</h2>
                    </div>
                </div>
                @if (hasData()) {
                    <div waFunnelChart class="wa-chart-box" [data]="funnelData()"></div>
                } @else {
                    <div class="wa-chart-box"><div waEmptyState message="No funnel data in this range"></div></div>
                }
            </section>
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Session duration distribution</h2>
                    </div>
                </div>
                @if (hasData()) {
                    <div waDurationHistogramChart class="wa-chart-box" [sessions]="sessions()"></div>
                } @else {
                    <div class="wa-chart-box"><div waEmptyState message="No session data in this range"></div></div>
                }
            </section>
        </div>
        <div class="wa-grid-2-even">
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Page views vs conversion rate</h2>
                    </div>
                </div>
                @if (hasData()) {
                    <div waPagePerformanceChart class="wa-chart-box" [data]="pageData()"></div>
                } @else {
                    <div class="wa-chart-box"><div waEmptyState message="No page data in this range"></div></div>
                }
            </section>
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Page view distribution</h2>
                    </div>
                </div>
                @if (hasData() && pageData().length > 0) {
                    <div waPageTreemapChart class="wa-chart-box" [data]="pageData()"></div>
                } @else {
                    <div class="wa-chart-box"><div waEmptyState message="No page data in this range"></div></div>
                }
            </section>
        </div>
    `,
})
export class BehaviorView {
    readonly funnelData = input.required<FunnelStep[]>();
    readonly pathData = input.required<PathLink[]>();
    readonly pageData = input.required<PageRow[]>();
    readonly sessions = input.required<Session[]>();
    readonly hasData = input.required<boolean>();
}
