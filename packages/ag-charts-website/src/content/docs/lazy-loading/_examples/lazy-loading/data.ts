const endpoint = 'https://www.ag-grid.com/example-assets/olympic-winners.json';

export function getData() {
    const reducer = (collection: Record<string, Athlete>, datum: Athlete) => {
        collection[datum.athlete] ??= {
            athlete: datum.athlete,
            gold: 0,
            silver: 0,
            bronze: 0,
        };
        collection[datum.athlete].gold += datum.gold;
        collection[datum.athlete].silver += datum.silver;
        collection[datum.athlete].bronze += datum.bronze;
        return collection;
    };

    return delay(0)
        .then(() => fetch(endpoint))
        .then((response) => response.json())
        .then((json) => {
            if (!Array.isArray(json)) return [];
            const data = json.reduce(reducer, {});
            return Object.values(data).slice(0, 10);
        });
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Athlete {
    athlete: string;
    gold: number;
    silver: number;
    bronze: number;
}
