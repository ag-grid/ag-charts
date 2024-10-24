const startPrice = 100;
const maxDailyPriceChange = 5;
const days = 1000000;

// https://github.com/mikolalysenko/hash-int
const A = new Uint32Array(1);
function hashInt(x) {
    A[0] = x | 0;
    A[0] -= A[0] << 6;
    A[0] ^= A[0] >>> 17;
    A[0] -= A[0] << 9;
    A[0] ^= A[0] << 4;
    A[0] -= A[0] << 3;
    A[0] ^= A[0] << 10;
    A[0] ^= A[0] >>> 15;
    return A[0];
}

export function getData() {
    let currentPrice = startPrice;
    return Array.from({ length: days }, (_, i) => {
        const price = currentPrice;
        const random = hashInt(i) / 2 ** 32;
        currentPrice += (random * 2 - 1) * maxDailyPriceChange;

        const timestamp = new Date(2024, 0, 1, -i);

        return { timestamp, price };
    }).reverse();
}
