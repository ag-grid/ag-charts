import { Component, input } from '@angular/core';

import type { ActivityCell, Browser, ChannelDatum, CountryDatum, DeviceDatum, VisitorDatum } from '../types';
import { ActivityByDayChart } from './activity-by-day-chart';
import { ActivityHeatmapChart } from './activity-heatmap-chart';
import { BrowserBreakdownChart } from './browser-breakdown-chart';
import { ChannelBreakdownChart } from './channel-breakdown-chart';
import { DeviceBreakdownChart } from './device-breakdown-chart';
import { EmptyState } from './empty-state';
import { GeoMap } from './geo-map';
import { VisitorBreakdownChart } from './visitor-breakdown-chart';

@Component({
    selector: 'div[waAudienceView]',
    imports: [
        ActivityByDayChart,
        ActivityHeatmapChart,
        BrowserBreakdownChart,
        ChannelBreakdownChart,
        DeviceBreakdownChart,
        EmptyState,
        GeoMap,
        VisitorBreakdownChart,
    ],
    host: { class: 'wa-view wa-view--fill' },
    template: `
        <div class="wa-grid-4">
            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">New vs returning</h2>
                </div>
                @if (hasData()) {
                    <div waVisitorBreakdownChart class="wa-chart-box-xsm" [data]="visitors()"></div>
                } @else {
                    <div class="wa-chart-box-xsm"><div waEmptyState message="No visitor data"></div></div>
                }
            </section>

            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by device</h2>
                </div>
                @if (hasData()) {
                    <div waDeviceBreakdownChart class="wa-chart-box-xsm" [data]="devices()"></div>
                } @else {
                    <div class="wa-chart-box-xsm"><div waEmptyState message="No device data"></div></div>
                }
            </section>

            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by browser</h2>
                </div>
                @if (hasData()) {
                    <div waBrowserBreakdownChart class="wa-chart-box-xsm" [data]="browsers()"></div>
                } @else {
                    <div class="wa-chart-box-xsm"><div waEmptyState message="No browser data"></div></div>
                }
            </section>
            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by channel</h2>
                </div>
                @if (hasData()) {
                    <div waChannelBreakdownChart class="wa-chart-box-xsm" [data]="channels()"></div>
                } @else {
                    <div class="wa-chart-box-xsm"><div waEmptyState message="No channel data"></div></div>
                }
            </section>
        </div>
        <div class="wa-grid-2">
            <section class="wa-card wa-card--fill">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by country</h2>
                </div>
                @if (hasData()) {
                    <div waGeoMap class="wa-fill" [data]="countries()"></div>
                } @else {
                    <div class="wa-fill">
                        <div waEmptyState message="No geographic data"></div>
                    </div>
                }
            </section>
            <section class="wa-card wa-card--fill">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Activity by time of day</h2>
                    </div>
                </div>
                @if (hasData()) {
                    <div waActivityByDayChart class="wa-chart-box-xxsm" [data]="activity()"></div>
                    <div waActivityHeatmapChart class="wa-fill" [data]="activity()"></div>
                } @else {
                    <div class="wa-fill">
                        <div waEmptyState message="No activity data"></div>
                    </div>
                }
            </section>
        </div>
    `,
})
export class AudienceView {
    readonly countries = input.required<CountryDatum[]>();
    readonly channels = input.required<ChannelDatum[]>();
    readonly visitors = input.required<VisitorDatum[]>();
    readonly devices = input.required<DeviceDatum[]>();
    readonly browsers = input.required<{ browser: Browser; sessions: number }[]>();
    readonly activity = input.required<ActivityCell[]>();
    readonly hasData = input.required<boolean>();
}
