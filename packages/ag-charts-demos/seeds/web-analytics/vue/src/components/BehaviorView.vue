<script setup lang="ts">
import type { FunnelStep, PageRow, PathLink, Session } from '../types';
import DurationHistogramChart from './DurationHistogramChart.vue';
import EmptyState from './EmptyState.vue';
import FunnelChart from './FunnelChart.vue';
import PagePerformanceChart from './PagePerformanceChart.vue';
import PageTreemapChart from './PageTreemapChart.vue';
import PathFlowChart from './PathFlowChart.vue';

defineProps<{
    funnelData: FunnelStep[];
    pathData: PathLink[];
    pageData: PageRow[];
    sessions: Session[];
    hasData: boolean;
}>();
</script>

<template>
    <div class="wa-view">
        <section class="wa-card">
            <div class="wa-card-head">
                <div>
                    <h2 class="wa-card-title">User paths</h2>
                </div>
            </div>
            <div class="wa-chart-box-lg">
                <PathFlowChart v-if="hasData && pathData.length > 0" :data="pathData" />
                <EmptyState v-else message="No path data in this range" />
            </div>
        </section>
        <div class="wa-grid-2-even">
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Conversion funnel</h2>
                    </div>
                </div>
                <div class="wa-chart-box">
                    <FunnelChart v-if="hasData" :data="funnelData" />
                    <EmptyState v-else message="No funnel data in this range" />
                </div>
            </section>
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Session duration distribution</h2>
                    </div>
                </div>
                <div class="wa-chart-box">
                    <DurationHistogramChart v-if="hasData" :sessions="sessions" />
                    <EmptyState v-else message="No session data in this range" />
                </div>
            </section>
        </div>
        <div class="wa-grid-2-even">
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Page views vs conversion rate</h2>
                    </div>
                </div>
                <div class="wa-chart-box">
                    <PagePerformanceChart v-if="hasData" :data="pageData" />
                    <EmptyState v-else message="No page data in this range" />
                </div>
            </section>
            <section class="wa-card">
                <div class="wa-card-head">
                    <div>
                        <h2 class="wa-card-title">Page view distribution</h2>
                    </div>
                </div>
                <div class="wa-chart-box">
                    <PageTreemapChart v-if="hasData && pageData.length > 0" :data="pageData" />
                    <EmptyState v-else message="No page data in this range" />
                </div>
            </section>
        </div>
    </div>
</template>
