import { Database, Datum, dataEnd, dataStart, day, hour, week } from './data';
import { random } from './randomHelpers';

/**
 * This fake server mimics how a real server api chart service may get and format data for charts. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const FakeServer = {
    get: async function (params: { windowStart?: Date | number | string; windowEnd?: Date | number | string }) {
        if (typeof params.windowStart !== 'object' || typeof params.windowEnd !== 'object') {
            const { filtered, granularity } = formatData(Database.get(), dataStart, dataEnd);
            return { data: filtered, granularity };
        }

        // Simulate a real server with a random 2000-2500ms delay
        const delayTime = 2000 + Math.floor(random() * 500);
        await delay(delayTime);

        // Fetch the data from the fake database
        const data = Database.get();

        // Format the data ready for the chart
        const { filtered, granularity } = formatData(
            data,
            params.windowStart?.getTime() ?? dataStart,
            params.windowEnd?.getTime() ?? dataEnd
        );

        return { data: filtered, granularity };
    },
};

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatData(data: Datum[], windowStart: number, windowEnd: number) {
    const diff = windowEnd - windowStart;
    let granularity = week * 4;
    if (diff < week * 2) {
        granularity = hour;
    } else if (diff < week * 13) {
        granularity = day;
    } else if (diff < week * 52) {
        granularity = week;
    }

    const filtered = data.filter(({ time }) => {
        const isCoarse = (time - dataStart) % (week * 4) === 0;
        const isFineWithinWindow = (time - dataStart) % granularity === 0 && time >= windowStart && time <= windowEnd;
        return isCoarse || isFineWithinWindow;
    });

    return { filtered, granularity };
}
