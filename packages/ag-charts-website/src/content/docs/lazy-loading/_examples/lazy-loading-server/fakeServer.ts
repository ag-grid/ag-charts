import { Database, Datum, day, hour, week } from './data';

/**
 * This fake server mimics how a real server api chart service may get and format data for charts. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const FakeServer = {
    get: async function (params: { min: number; max: number }) {
        // Simulate a real server with a random 250-500ms delay
        const delayTime = 250 + Math.floor(Math.random() * 250);
        await delay(delayTime);

        // Fetch the data from the fake database
        const data = Database.get();

        // Format the data ready for the chart
        const formattedData = formatData(data, params.min, params.max);

        return formattedData;
    },
};

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatData(data: Datum[], windowStart: number, windowEnd: number) {
    const diff = windowEnd - windowStart;
    let granularity = week;
    if (diff < day * 4) {
        granularity = hour;
    } else if (diff < week * 2) {
        granularity = hour * 6;
    } else if (diff < week * 6) {
        granularity = day;
    }
    return data.filter(({ time }) => {
        const isCoarse = time % week === 0;
        const isFineWithinWindow = time % granularity === 0 && time >= windowStart && time <= windowEnd;
        return isCoarse || isFineWithinWindow;
    });
}
