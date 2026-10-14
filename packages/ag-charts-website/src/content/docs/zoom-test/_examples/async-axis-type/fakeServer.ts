import { Database, Datum, dataEnd, dataStart, day, hour, week } from './data';
import { random } from './seededRandom';

/**
 * This fake server mimics how a real server api chart service may get and format data for charts. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const FakeServer = {
    get: async function (params: { windowStart?: Date | number | string; windowEnd?: Date | number | string }) {
        // Simulate a real server with a random 600-900ms delay
        await delay(600 + Math.floor(random() * 300));

        const { filtered, granularity } = formatData(
            Database.get(),
            toTimestamp(params.windowStart) ?? dataStart,
            toTimestamp(params.windowEnd) ?? dataEnd
        );

        return { data: filtered, granularity };
    },
};

function toTimestamp(value: Date | number | string | undefined): number | undefined {
    if (value === undefined) return undefined;
    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isNaN(timestamp) ? undefined : timestamp;
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatData(data: Datum[], windowStart: number, windowEnd: number) {
    const diff = windowEnd - windowStart;
    let granularity = week * 4;
    let granularityName = '4w';
    if (diff < week * 2) {
        granularity = hour;
        granularityName = 'hourly';
    } else if (diff < week * 13) {
        granularity = day;
        granularityName = 'daily';
    } else if (diff < week * 52) {
        granularity = week;
        granularityName = '1w';
    }
    const filtered = data.filter(({ time }) => {
        const isCoarse = (time - dataStart) % (week * 4) === 0;
        const isFineWithinWindow = (time - dataStart) % granularity === 0 && time >= windowStart && time <= windowEnd;
        return isCoarse || isFineWithinWindow;
    });
    return { filtered, granularity: granularityName };
}
