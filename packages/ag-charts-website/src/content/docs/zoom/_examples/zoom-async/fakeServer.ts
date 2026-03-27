import { Database, Datum, dataEnd, dataStart, day, hour, week } from './data';

/**
 * This fake server mimics how a real server api chart service may get and format data for charts. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const FakeServer = {
    get: async function (params: { windowStart?: Date | number; windowEnd?: Date | number }) {
        // Simulate a real server with a random 2000-2500ms delay
        const delayTime = 2000 + Math.floor(Math.random() * 500);
        await delay(delayTime);

        // Fetch the data from the fake database
        const data = Database.get();

        // Get the start and end of the data
        const start = typeof params.windowStart == 'object' ? params.windowStart.getTime() : params.windowStart;
        const end = typeof params.windowEnd == 'object' ? params.windowEnd.getTime() : params.windowEnd;

        // Format the data ready for the chart
        const formattedData = formatData(data, start ?? dataStart, end ?? dataEnd);

        return formattedData;
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
    return data.filter(({ time }) => {
        const isCoarse = (time - dataStart) % (week * 4) === 0;
        const isFineWithinWindow = (time - dataStart) % granularity === 0 && time >= windowStart && time <= windowEnd;
        return isCoarse || isFineWithinWindow;
    });
}
