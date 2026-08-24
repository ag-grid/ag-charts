// Mock web-analytics data engine.
//
// Everything is synthetic: a seeded PRNG generates a pool of GA4-style sessions
// spanning a fixed history window, and pure aggregation functions derive the
// daily summaries, geo/device breakdowns, funnel, path flow and page table from
// that pool. Deriving every view from one session pool keeps the numbers
// internally consistent (segments sum, funnel narrows, page rows reconcile) the
// way a real dataset would.
import type {
    ActivityCell,
    Annotation,
    Browser,
    Channel,
    ChannelDatum,
    CountryDatum,
    DateRange,
    DeviceCategory,
    DeviceDatum,
    FunnelStep,
    PageRow,
    PathLink,
    Session,
    VisitorDatum,
} from './types';

// --- deterministic PRNG -------------------------------------------------------

function seededRandom(seed: number): () => number {
    let h = seed >>> 0;
    return () => {
        h += 0x6d2b79f5;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// A weighted pick from `[value, weight]` pairs using a 0–1 random draw.
function weightedPick<T>(rand: () => number, table: [T, number][]): T {
    const total = table.reduce((sum, [, w]) => sum + w, 0);
    let r = rand() * total;
    for (const [value, weight] of table) {
        r -= weight;
        if (r <= 0) return value;
    }
    return table[table.length - 1][0];
}

// --- reference dimensions -----------------------------------------------------

const CHANNELS: [Channel, number][] = [
    ['Organic', 34],
    ['Direct', 22],
    ['Paid', 18],
    ['Social', 14],
    ['Referral', 12],
];

const DEVICES: [DeviceCategory, number][] = [
    ['Desktop', 55],
    ['Mobile', 38],
    ['Tablet', 7],
];

const BROWSERS: [Browser, number][] = [
    ['Chrome', 60],
    ['Safari', 20],
    ['Edge', 9],
    ['Firefox', 7],
    ['Other', 4],
];

const OSES: [string, number][] = [
    ['Windows', 42],
    ['macOS', 24],
    ['iOS', 18],
    ['Android', 14],
    ['Linux', 2],
];

/** Country reference. `code` is ISO A3, `name` matches common world-topology naming. */
interface CountryRef {
    name: string;
    code: string;
    region: string;
    city: string;
    weight: number;
}

// A small "Unknown" bucket is included on purpose — real geo data is never fully resolved.
const COUNTRIES: CountryRef[] = [
    { name: 'United States', code: 'USA', region: 'California', city: 'San Francisco', weight: 30 },
    { name: 'United Kingdom', code: 'GBR', region: 'England', city: 'London', weight: 12 },
    { name: 'Germany', code: 'DEU', region: 'Bavaria', city: 'Munich', weight: 9 },
    { name: 'India', code: 'IND', region: 'Karnataka', city: 'Bengaluru', weight: 9 },
    { name: 'Canada', code: 'CAN', region: 'Ontario', city: 'Toronto', weight: 6 },
    { name: 'France', code: 'FRA', region: 'Île-de-France', city: 'Paris', weight: 5 },
    { name: 'Australia', code: 'AUS', region: 'New South Wales', city: 'Sydney', weight: 5 },
    { name: 'Brazil', code: 'BRA', region: 'São Paulo', city: 'São Paulo', weight: 5 },
    { name: 'Japan', code: 'JPN', region: 'Tokyo', city: 'Tokyo', weight: 4 },
    { name: 'Netherlands', code: 'NLD', region: 'North Holland', city: 'Amsterdam', weight: 3 },
    { name: 'Spain', code: 'ESP', region: 'Madrid', city: 'Madrid', weight: 3 },
    { name: 'Sweden', code: 'SWE', region: 'Stockholm', city: 'Stockholm', weight: 2 },
    { name: 'Unknown', code: 'XXX', region: 'Unknown', city: 'Unknown', weight: 3 },
];

const CAMPAIGNS: Partial<Record<Channel, string[]>> = {
    Paid: ['spring_launch', 'brand_search', 'retargeting_q3'],
    Social: ['creator_collab', 'launch_teaser', 'community_ama'],
    Referral: ['partner_blog', 'integration_dir'],
};

const SOURCE_BY_CHANNEL: Record<Channel, string> = {
    Organic: 'google',
    Paid: 'google_ads',
    Direct: '(direct)',
    Referral: 'partner.example.com',
    Social: 'linkedin',
};

const MEDIUM_BY_CHANNEL: Record<Channel, string> = {
    Organic: 'organic',
    Paid: 'cpc',
    Direct: '(none)',
    Referral: 'referral',
    Social: 'social',
};

/** The ordered funnel stages the Behavior view visualises. */
export const FUNNEL_STEPS = ['Landing', 'Product Engagement', 'Add to Cart', 'Checkout', 'Purchase'] as const;

// Page catalogue. `stage` ties a page to the earliest funnel step it represents so
// a session's page journey and its funnel progress stay consistent.
interface PageDef {
    path: string;
    title: string;
    stage: number;
}

const PAGES: PageDef[] = [
    { path: '/', title: 'Home', stage: 0 },
    { path: '/blog', title: 'Blog', stage: 0 },
    { path: '/pricing', title: 'Pricing', stage: 1 },
    { path: '/features', title: 'Features', stage: 1 },
    { path: '/product', title: 'Product Tour', stage: 1 },
    { path: '/docs', title: 'Documentation', stage: 1 },
    { path: '/cart', title: 'Cart', stage: 2 },
    { path: '/checkout', title: 'Checkout', stage: 3 },
    { path: '/thank-you', title: 'Purchase Complete', stage: 4 },
];

const PAGE_TITLE = new Map(PAGES.map((p) => [p.path, p.title]));
const PAGE_STAGE = new Map(PAGES.map((p) => [p.path, p.stage]));

const LANDING_WEIGHTS: [string, number][] = [
    ['/', 8],
    ['/blog', 4],
    ['/pricing', 3],
    ['/features', 2],
];
const STAGE_ORDER = ['/features', '/product', '/pricing', '/docs', '/cart', '/checkout', '/thank-you'];

/** Page titles in catalogue order — maps each page to a stable palette slot. */
export const PAGE_TITLES = PAGES.map((p) => p.title);

// --- session pool generation --------------------------------------------------

// A fixed history window ending on a stable "today", long enough for a full previous 90-day period.
export const HISTORY_DAYS = 210;
export const DATA_END = new Date('2026-07-23T00:00:00');

// Buckets are local midnight, so a fixed 24h step drifts in a DST zone and straddles two buckets.
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const DATA_START = addDays(DATA_END, -(HISTORY_DAYS - 1));

// Local midnight per day plus the exclusive end of the last, so day i is exactly one calendar day.
const DAY_BOUNDS = Array.from({ length: HISTORY_DAYS + 1 }, (_, i) => addDays(DATA_START, i).getTime());

// Average daily sessions before seasonality, trend and event spikes.
const BASE_DAILY = 95;

// Roughly a month of visitors, so the default range sees about 1.4 sessions per visitor.
const RETURNING_VISITOR_POOL = 1500;

// Days before DATA_END, so events stay anchored near "today" whatever the history length.
const fromEnd = (daysBeforeEnd: number) => HISTORY_DAYS - 1 - daysBeforeEnd;
const EVENT_OFFSET = {
    outage: fromEnd(59),
    springLaunch: fromEnd(27),
    creatorCollab: fromEnd(15),
    release: fromEnd(14),
};

// Aligned with the seeded annotations so a campaign launch visibly lifts traffic.
const SPIKES: Record<number, number> = {
    [EVENT_OFFSET.springLaunch]: 1.6,
    [EVENT_OFFSET.creatorCollab]: 1.35,
    [EVENT_OFFSET.outage]: 0.7, // outage / bad deploy dip
};

function dailyVolume(dayIndex: number, rand: () => number): number {
    const date = new Date(DAY_BOUNDS[dayIndex]);
    const weekday = date.getDay();
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.62 : 1;
    const trend = 1 + (dayIndex / HISTORY_DAYS) * 0.35;
    const noise = 0.85 + rand() * 0.3;
    const spike = SPIKES[dayIndex] ?? 1;
    return Math.round(BASE_DAILY * weekendFactor * trend * noise * spike);
}

// Must stay non-increasing, so every derived step-to-step conditional lands in 0..1.
const STEP_REACH = [1, 0.58, 0.24, 0.12, 0.055];

function funnelStepReached(rand: () => number, isNew: boolean, channel: Channel): number {
    // Returning visitors and organic/direct traffic convert a little better.
    const loyaltyBoost = isNew ? 1 : 1.35;
    const channelBoost = channel === 'Paid' || channel === 'Social' ? 0.85 : 1.05;
    const cohortBoost = loyaltyBoost * channelBoost;
    // Walk the scaled curve as conditionals; boosting each conditional instead would compound per step.
    const reachAtLeast = (step: number) => (step === 0 ? 1 : STEP_REACH[step] * cohortBoost);
    let reached = 0;
    for (let step = 1; step < STEP_REACH.length; step++) {
        if (rand() < reachAtLeast(step) / reachAtLeast(step - 1)) reached = step;
        else break;
    }
    return reached;
}

// Build a plausible ordered page journey for a session that reached `step`.
function buildJourney(rand: () => number, step: number): string[] {
    const landing = weightedPick(
        rand,
        LANDING_WEIGHTS.filter(([path]) => PAGE_STAGE.get(path)! <= step)
    );
    const journey = [landing];
    for (const path of STAGE_ORDER) {
        const pageStage = PAGE_STAGE.get(path)!;
        if (pageStage > step || path === landing) continue;
        // Some intermediate browsing is skipped so journeys vary.
        if (pageStage <= 1 && rand() < 0.5) continue;
        journey.push(path);
    }
    // A session credited with stage 1 must show a stage-1 page, or funnel and page aggregates disagree.
    if (step >= 1 && !journey.some((path) => PAGE_STAGE.get(path)! === 1)) {
        const stageOnePages = STAGE_ORDER.filter((path) => PAGE_STAGE.get(path) === 1);
        journey.splice(1, 0, stageOnePages[Math.floor(rand() * stageOnePages.length)]);
    }
    return journey;
}

function generateSessions(): Session[] {
    const rand = seededRandom(20260723);
    const sessions: Session[] = [];
    let seq = 0;
    // Sampling only recent visitors keeps unique visitors meaningfully below session count.
    let visitorSeq = 0;
    const knownVisitors: string[] = [];
    for (let day = 0; day < HISTORY_DAYS; day++) {
        const count = dailyVolume(day, rand);
        const dayStart = DAY_BOUNDS[day];
        const dayLength = DAY_BOUNDS[day + 1] - dayStart;
        for (let i = 0; i < count; i++) {
            const channel = weightedPick(rand, CHANNELS);
            const device = weightedPick(rand, DEVICES);
            const browser = weightedPick(rand, BROWSERS);
            const os = weightedPick(rand, OSES);
            const country = weightedPick(
                rand,
                COUNTRIES.map((c) => [c, c.weight] as [CountryRef, number])
            );
            const isNew = rand() < 0.58 || knownVisitors.length === 0;
            let visitorId: string;
            if (isNew) {
                visitorId = `v${++visitorSeq}`;
                knownVisitors.push(visitorId);
            } else {
                const recentFrom = Math.max(0, knownVisitors.length - RETURNING_VISITOR_POOL);
                visitorId = knownVisitors[recentFrom + Math.floor(rand() * (knownVisitors.length - recentFrom))];
            }
            const step = funnelStepReached(rand, isNew, channel);
            const journey = buildJourney(rand, step);
            const converted = step >= 4;
            const campaigns = CAMPAIGNS[channel];
            const campaignName = campaigns ? campaigns[Math.floor(rand() * campaigns.length)] : '';
            const timestamp = dayStart + Math.floor(rand() * dayLength);
            seq++;
            sessions.push({
                sessionId: `s${seq}`,
                visitorId,
                timestamp,
                channel,
                source: SOURCE_BY_CHANNEL[channel],
                medium: MEDIUM_BY_CHANNEL[channel],
                campaignName,
                deviceCategory: device,
                browser,
                os,
                country: country.name,
                region: country.region,
                city: country.city,
                isNewVisitor: isNew,
                landingPage: journey[0],
                exitPage: journey[journey.length - 1],
                sessionDuration: Math.round(20 + journey.length * (30 + rand() * 90)),
                pageviewsCount: journey.length,
                converted,
                conversionValue: converted ? Math.round(25 + rand() * 375) : 0,
                pagePath: journey,
                funnelStepReached: step,
            });
        }
    }
    return sessions;
}

/** The generated session pool, built once at module load. */
export const SESSIONS: Session[] = generateSessions();

// --- seeded annotations -------------------------------------------------------

const dayDate = (offset: number) => new Date(DAY_BOUNDS[offset]);

export const SEED_ANNOTATIONS: Annotation[] = [
    {
        annotationId: 'a1',
        date: dayDate(EVENT_OFFSET.outage),
        label: 'API outage',
        description: 'Checkout degraded for ~3h after a bad deploy.',
        type: 'deploy',
        createdBy: 'ops',
    },
    {
        annotationId: 'a2',
        date: dayDate(EVENT_OFFSET.springLaunch),
        label: 'Spring launch',
        description: 'Spring product launch campaign went live across paid + social.',
        type: 'campaign_launch',
        createdBy: 'growth',
    },
    {
        annotationId: 'a3',
        date: dayDate(EVENT_OFFSET.creatorCollab),
        label: 'Creator collab',
        description: 'Influencer collaboration drove a social traffic spike.',
        type: 'campaign_launch',
        createdBy: 'growth',
    },
    {
        annotationId: 'a4',
        date: dayDate(EVENT_OFFSET.release),
        label: 'v4.2 release',
        description: 'Shipped the redesigned onboarding flow.',
        type: 'deploy',
        createdBy: 'eng',
    },
];

// --- aggregation --------------------------------------------------------------

const inRange = (session: Session, range: DateRange) =>
    session.timestamp >= range.start.getTime() && session.timestamp <= range.end.getTime();

const startOfDay = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

// Calendar-day stepping stays aligned to local midnight across DST transitions.
const nextDayStart = (ms: number) => {
    const d = new Date(ms);
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

/** Sessions and conversions by resolved country. */
export function countryBreakdown(range: DateRange): CountryDatum[] {
    const byCountry = new Map<string, CountryDatum>();
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        const row = byCountry.get(s.country) ?? { country: s.country, sessions: 0, conversions: 0 };
        row.sessions++;
        if (s.converted) row.conversions++;
        byCountry.set(s.country, row);
    }
    return [...byCountry.values()].sort((a, b) => b.sessions - a.sessions);
}

/** Device × visitor-type counts for the grouped bar chart. */
export function deviceBreakdown(range: DateRange): DeviceDatum[] {
    const order: DeviceCategory[] = ['Desktop', 'Mobile', 'Tablet'];
    const rows = new Map<DeviceCategory, DeviceDatum>(
        order.map((device) => [device, { device, new: 0, returning: 0 }])
    );
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        const row = rows.get(s.deviceCategory)!;
        if (s.isNewVisitor) row.new++;
        else row.returning++;
    }
    return order.map((device) => rows.get(device)!);
}

/** Browser share for a range (used by the breakdown chart's browser mode). */
export function browserBreakdown(range: DateRange): { browser: Browser; sessions: number }[] {
    const counts = new Map<Browser, number>();
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        counts.set(s.browser, (counts.get(s.browser) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([browser, sessions]) => ({ browser, sessions }))
        .sort((a, b) => b.sessions - a.sessions);
}

/** Sessions by acquisition channel, largest first. */
export function channelBreakdown(range: DateRange): ChannelDatum[] {
    const counts = new Map<Channel, number>();
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        counts.set(s.channel, (counts.get(s.channel) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([channel, sessions]) => ({ channel, sessions }))
        .sort((a, b) => b.sessions - a.sessions);
}

/** New-vs-returning visitor split for a range. */
export function visitorBreakdown(range: DateRange): VisitorDatum[] {
    let newVisitors = 0;
    let returning = 0;
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        if (s.isNewVisitor) newVisitors++;
        else returning++;
    }
    return [
        { type: 'New', sessions: newVisitors },
        { type: 'Returning', sessions: returning },
    ];
}

// Monday-first weekday labels; sessions use JS getDay() (0 = Sunday).
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Session counts per hour-of-day × day-of-week, every cell seeded so none are missing. */
export function activityHeatmap(range: DateRange): ActivityCell[] {
    const cells = new Map<string, ActivityCell>();
    for (const day of WEEKDAYS) {
        for (let hour = 0; hour < 24; hour++) {
            cells.set(`${day}-${hour}`, { day, hour, sessions: 0 });
        }
    }
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        const date = new Date(s.timestamp);
        const day = WEEKDAYS[(date.getDay() + 6) % 7];
        cells.get(`${day}-${date.getHours()}`)!.sessions++;
    }
    return [...cells.values()];
}

/** Conversion funnel: sessions entering each stage, with drop-off. */
export function funnel(range: DateRange): FunnelStep[] {
    const entering = new Array(FUNNEL_STEPS.length).fill(0);
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        for (let step = 0; step <= s.funnelStepReached; step++) entering[step]++;
    }
    return FUNNEL_STEPS.map((stepName, i) => {
        const sessionsEntering = entering[i];
        const sessionsCompleting = i < FUNNEL_STEPS.length - 1 ? entering[i + 1] : entering[i];
        const dropOffCount = sessionsEntering - sessionsCompleting;
        return {
            stepOrder: i,
            stepName,
            sessionsEntering,
            sessionsCompleting,
            dropOffCount,
            // Share of this step's entrants, so the rate and the count describe the same transition.
            dropOffRate: sessionsEntering === 0 ? 0 : dropOffCount / sessionsEntering,
        };
    });
}

// Strictly left-to-right layers, so the Sankey stays acyclic regardless of raw journeys.
// The most page positions (levels) the journey Sankey shows before an Exit node.
const MAX_JOURNEY_LEVELS = 5;

// Tagged with its 1-based position so the same page at different depths keeps its own column.
const journeyNode = (position: number, path: string) => `${position}. ${PAGE_TITLE.get(path) ?? path}`;

// Node names contain spaces, so links are keyed on a delimiter that never appears in a name.
const LINK_SEP = ' ~> ';

// Terminal nodes: a journey either genuinely ends, or runs past MAX_JOURNEY_LEVELS.
const EXIT_NODE = 'Exit';
const CONTINUES_NODE = 'Continues';
export const isTerminalNode = (name: string) => name.endsWith(EXIT_NODE) || name.endsWith(CONTINUES_NODE);

/** User-path flow: page-to-page journey links from entry page to exit, by position. */
export function pathLinks(range: DateRange): PathLink[] {
    const counts = new Map<string, number>();
    const add = (from: string, to: string) =>
        counts.set(`${from}${LINK_SEP}${to}`, (counts.get(`${from}${LINK_SEP}${to}`) ?? 0) + 1);
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        // Walk the session's real page sequence, linking each page to the next.
        const pages = s.pagePath.slice(0, MAX_JOURNEY_LEVELS);
        for (let i = 0; i < pages.length; i++) {
            const from = journeyNode(i + 1, pages[i]);
            if (i + 1 < pages.length) {
                add(from, journeyNode(i + 2, pages[i + 1]));
            } else if (i === s.pagePath.length - 1) {
                add(from, `${i + 2}. ${EXIT_NODE}`);
            } else {
                // Truncated journeys terminate in their own node so the flow is conserved.
                add(from, `${i + 2}. ${CONTINUES_NODE}`);
            }
        }
    }
    return [...counts.entries()]
        .map(([key, size]) => {
            const [from, to] = key.split(LINK_SEP);
            return { from, to, size };
        })
        .sort((a, b) => {
            // Emit terminal links last so, with node sort 'data', terminal nodes settle at the bottom of each column.
            const terminalDelta = Number(isTerminalNode(a.to)) - Number(isTerminalNode(b.to));
            return terminalDelta === 0 ? b.size - a.size : terminalDelta;
        });
}

/** Per-page performance aggregated across the range. */
export function pageRows(range: DateRange): PageRow[] {
    interface Acc {
        pageviews: number;
        sessions: Set<string>;
        entrances: number;
        exits: number;
        bounces: number;
        durationTotal: number;
        converters: Set<string>;
    }
    const acc = new Map<string, Acc>();
    const get = (path: string) => {
        let a = acc.get(path);
        if (!a) {
            a = {
                pageviews: 0,
                sessions: new Set(),
                entrances: 0,
                exits: 0,
                bounces: 0,
                durationTotal: 0,
                converters: new Set(),
            };
            acc.set(path, a);
        }
        return a;
    };
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        const perPageTime = s.sessionDuration / s.pagePath.length;
        for (const path of s.pagePath) {
            const a = get(path);
            a.pageviews++;
            a.sessions.add(s.sessionId);
            a.durationTotal += perPageTime;
            if (s.converted) a.converters.add(s.sessionId);
        }
        get(s.landingPage).entrances++;
        const exit = get(s.exitPage);
        exit.exits++;
        if (s.pagePath.length === 1) exit.bounces++;
    }
    return [...acc.entries()]
        .map(([path, a]) => {
            const unique = a.sessions.size;
            return {
                pagePath: path,
                pageTitle: PAGE_TITLE.get(path) ?? path,
                pageviews: a.pageviews,
                uniquePageviews: unique,
                avgTimeOnPage: a.pageviews === 0 ? 0 : a.durationTotal / a.pageviews,
                entrances: a.entrances,
                exits: a.exits,
                bounceRate: a.entrances === 0 ? 0 : a.bounces / a.entrances,
                exitRate: a.pageviews === 0 ? 0 : a.exits / a.pageviews,
                conversionRate: unique === 0 ? 0 : a.converters.size / unique,
            };
        })
        .sort((a, b) => b.pageviews - a.pageviews);
}

/** One day of the KPI metrics — drives the per-tile sparklines. */
export interface DailyPoint {
    date: Date;
    sessions: number;
    visitors: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    avgDuration: number;
}

/**
 * Aggregate a session list into one DailyPoint per day in `dayStarts` (each a
 * start-of-day epoch ms), with empty days seeded to 0. Callers pass the day domain
 * so the series keeps a stable x-axis independent of which sessions are present.
 */
export function dailyFromSessions(sessions: Session[], dayStarts: number[]): DailyPoint[] {
    interface Acc {
        sessions: number;
        visitors: Set<string>;
        conversions: number;
        revenue: number;
        durationTotal: number;
    }
    const byDay = new Map<number, Acc>();
    for (const ms of dayStarts) {
        byDay.set(ms, { sessions: 0, visitors: new Set(), conversions: 0, revenue: 0, durationTotal: 0 });
    }
    for (const s of sessions) {
        const acc = byDay.get(startOfDay(s.timestamp));
        if (!acc) continue;
        acc.sessions++;
        acc.visitors.add(s.visitorId);
        acc.durationTotal += s.sessionDuration;
        if (s.converted) {
            acc.conversions++;
            acc.revenue += s.conversionValue;
        }
    }
    return [...byDay.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([ms, acc]) => ({
            date: new Date(ms),
            sessions: acc.sessions,
            visitors: acc.visitors.size,
            conversions: acc.conversions,
            conversionRate: acc.sessions === 0 ? 0 : acc.conversions / acc.sessions,
            revenue: acc.revenue,
            avgDuration: acc.sessions === 0 ? 0 : acc.durationTotal / acc.sessions,
        }));
}

/** Daily values for every KPI across a range, one point per day (gaps seeded to 0). */
export function dailySummary(range: DateRange): DailyPoint[] {
    const dayStarts: number[] = [];
    for (let ms = startOfDay(range.start.getTime()); ms <= range.end.getTime(); ms = nextDayStart(ms)) {
        dayStarts.push(ms);
    }
    return dailyFromSessions(
        SESSIONS.filter((s) => inRange(s, range)),
        dayStarts
    );
}

/** Total sessions/conversions/revenue for a range — feeds the KPI tiles. */
export function summary(range: DateRange) {
    let sessions = 0;
    let conversions = 0;
    let revenue = 0;
    let durationTotal = 0;
    const visitors = new Set<string>();
    for (const s of SESSIONS) {
        if (!inRange(s, range)) continue;
        sessions++;
        visitors.add(s.visitorId);
        durationTotal += s.sessionDuration;
        if (s.converted) {
            conversions++;
            revenue += s.conversionValue;
        }
    }
    return {
        sessions,
        visitors: visitors.size,
        conversions,
        revenue,
        conversionRate: sessions === 0 ? 0 : conversions / sessions,
        avgDuration: sessions === 0 ? 0 : durationTotal / sessions,
    };
}

/** Every session within a range, optionally narrowed to a single day (newest first). */
export function sessionsInRange(range: DateRange, day?: Date | null): Session[] {
    const dayKey = day ? startOfDay(day.getTime()) : undefined;
    return SESSIONS.filter((s) => {
        if (!inRange(s, range)) return false;
        if (dayKey != null && startOfDay(s.timestamp) !== dayKey) return false;
        return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
}
