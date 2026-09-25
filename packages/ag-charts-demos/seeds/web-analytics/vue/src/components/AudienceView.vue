<script setup lang="ts">
import type { ActivityCell, Browser, ChannelDatum, CountryDatum, DeviceDatum, VisitorDatum } from '../types';
import ActivityByDayChart from './ActivityByDayChart.vue';
import ActivityHeatmapChart from './ActivityHeatmapChart.vue';
import BrowserBreakdownChart from './BrowserBreakdownChart.vue';
import ChannelBreakdownChart from './ChannelBreakdownChart.vue';
import DeviceBreakdownChart from './DeviceBreakdownChart.vue';
import EmptyState from './EmptyState.vue';
import GeoMap from './GeoMap.vue';
import VisitorBreakdownChart from './VisitorBreakdownChart.vue';

defineProps<{
    countries: CountryDatum[];
    channels: ChannelDatum[];
    visitors: VisitorDatum[];
    devices: DeviceDatum[];
    browsers: { browser: Browser; sessions: number }[];
    activity: ActivityCell[];
    hasData: boolean;
}>();
</script>

<template>
    <div class="wa-view wa-view--fill">
        <div class="wa-grid-4">
            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">New vs returning</h2>
                </div>
                <div class="wa-chart-box-xsm">
                    <VisitorBreakdownChart v-if="hasData" :data="visitors" />
                    <EmptyState v-else message="No visitor data" />
                </div>
            </section>

            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by device</h2>
                </div>
                <div class="wa-chart-box-xsm">
                    <DeviceBreakdownChart v-if="hasData" :data="devices" />
                    <EmptyState v-else message="No device data" />
                </div>
            </section>

            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by browser</h2>
                </div>
                <div class="wa-chart-box-xsm">
                    <BrowserBreakdownChart v-if="hasData" :data="browsers" />
                    <EmptyState v-else message="No browser data" />
                </div>
            </section>
            <section class="wa-card">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by channel</h2>
                </div>
                <div class="wa-chart-box-xsm">
                    <ChannelBreakdownChart v-if="hasData" :data="channels" />
                    <EmptyState v-else message="No channel data" />
                </div>
            </section>
        </div>
        <div class="wa-grid-2">
            <section class="wa-card wa-card--fill">
                <div class="wa-card-head">
                    <h2 class="wa-card-title">Sessions by country</h2>
                </div>
                <div v-if="hasData" class="wa-fill">
                    <GeoMap :data="countries" />
                </div>
                <div v-else class="wa-fill">
                    <EmptyState message="No geographic data" />
                </div>
            </section>
            <section class="wa-card wa-card--fill">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Activity by time of day</h2>
                    </div>
                </div>
                <template v-if="hasData">
                    <div class="wa-chart-box-xxsm">
                        <ActivityByDayChart :data="activity" />
                    </div>
                    <div class="wa-fill">
                        <ActivityHeatmapChart :data="activity" />
                    </div>
                </template>
                <div v-else class="wa-fill">
                    <EmptyState message="No activity data" />
                </div>
            </section>
        </div>
    </div>
</template>
