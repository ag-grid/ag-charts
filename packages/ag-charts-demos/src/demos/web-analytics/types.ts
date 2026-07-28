// Shared types for the web-analytics demo. Modelled on GA4-style web-analytics
// entities so the mock data (and any later real integration) feels realistic.

export type Channel = 'Organic' | 'Paid' | 'Direct' | 'Referral' | 'Social';
export type DeviceCategory = 'Desktop' | 'Mobile' | 'Tablet';
export type Browser = 'Chrome' | 'Safari' | 'Edge' | 'Firefox' | 'Other';
export type VisitorType = 'New' | 'Returning';
export type AnnotationType = 'deploy' | 'campaign_launch';

/** A single visit. The raw record every aggregate in the demo is derived from. */
export interface Session {
    sessionId: string;
    visitorId: string;
    timestamp: number;
    channel: Channel;
    source: string;
    medium: string;
    campaignName: string;
    deviceCategory: DeviceCategory;
    browser: Browser;
    os: string;
    /** 'Unknown' models the unresolved-geo bucket every real dataset carries. */
    country: string;
    region: string;
    city: string;
    isNewVisitor: boolean;
    landingPage: string;
    exitPage: string;
    /** Seconds. */
    sessionDuration: number;
    pageviewsCount: number;
    converted: boolean;
    conversionValue: number;
    /** Ordered page paths visited — drives the path/flow (Sankey) diagram. */
    pagePath: string[];
    /** The furthest funnel step this session reached (0-based index). */
    funnelStepReached: number;
}

/** Visitors resolved to a country, for the geographic map/table. */
export interface CountryDatum {
    country: string;
    sessions: number;
    conversions: number;
}

/** Device × visitor-type breakdown row for the grouped bar chart. */
export interface DeviceDatum {
    device: DeviceCategory;
    new: number;
    returning: number;
}

/** Sessions attributed to an acquisition channel. */
export interface ChannelDatum {
    channel: Channel;
    sessions: number;
}

/** New-vs-returning visitor split for the donut chart. */
export interface VisitorDatum {
    type: VisitorType;
    sessions: number;
}

/** One cell of the hour-of-day × day-of-week activity heatmap. */
export interface ActivityCell {
    /** Hour of day, 0–23. */
    hour: number;
    /** Short weekday label (Mon–Sun), Monday-first. */
    day: string;
    sessions: number;
}

/** One stage of the conversion funnel. */
export interface FunnelStep {
    stepOrder: number;
    stepName: string;
    sessionsEntering: number;
    sessionsCompleting: number;
    dropOffCount: number;
    dropOffRate: number;
}

/** One directed edge of the user-path flow diagram. */
export interface PathLink {
    from: string;
    to: string;
    size: number;
}

/** Aggregated page-level performance, one row per page path. */
export interface PageRow {
    pagePath: string;
    pageTitle: string;
    pageviews: number;
    uniquePageviews: number;
    avgTimeOnPage: number;
    entrances: number;
    exits: number;
    bounceRate: number;
    exitRate: number;
    conversionRate: number;
}

/** An analyst-authored event marker overlaid on the Audience time series. */
export interface Annotation {
    annotationId: string;
    date: Date;
    label: string;
    description: string;
    type: AnnotationType;
    createdBy: string;
}

/** An inclusive date range. */
export interface DateRange {
    start: Date;
    end: Date;
}
