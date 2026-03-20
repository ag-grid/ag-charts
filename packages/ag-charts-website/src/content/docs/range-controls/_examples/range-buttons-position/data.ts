const startPrice = 100;
const maxDailyPriceChange = 1;

function seedRandom(seed = 1337): () => number {
    return function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

export function getData(days: number) {
    let currentPrice = startPrice;
    const random = seedRandom();
    return Array.from({ length: days }, (_, i) => {
        const price = currentPrice;
        currentPrice += (random() * 2 - 1) * maxDailyPriceChange;

        const date = new Date(2026, 2, -i);

        return { date, price };
    }).reverse();
}
